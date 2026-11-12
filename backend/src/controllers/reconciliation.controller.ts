import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../services/database.service.js'
import { buildReconciliationQueue } from '../services/reconciliation.service.js'
import { HttpError } from '../utils/http-error.js'

const send = (res: Response, data: unknown) => res.json({ success: true, data })
const normalizeIdentity = (value: string | null | undefined) => (value ?? '').trim().toLowerCase()
const allocationSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/, 'Amount must have at most two decimal places'),
}).strict()

export async function reconciliationQueue(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')
    const queue = await buildReconciliationQueue(
      req.auth.businessId,
      req.auth.role === 'MANAGER' ? req.auth.userId : undefined,
    )
    send(res, queue)
  } catch (error) { next(error) }
}

export async function confirmAllocation(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')
    const parsed = allocationSchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Invalid allocation request', 'VALIDATION_ERROR')
    const { businessId, userId, role } = req.auth
    const paymentId = String(req.params.paymentId)
    const invoiceId = parsed.data.invoiceId
    const requestedTotal = new Prisma.Decimal(parsed.data.amount)
    if (!requestedTotal.gt(0)) throw new HttpError(400, 'Allocation amount must be greater than zero', 'INVALID_ALLOCATION')

    const result = await prisma.$transaction(async tx => {
      const lockedPayment = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Payment" WHERE "id" = ${paymentId} AND "businessId" = ${businessId} FOR UPDATE`
      if (!lockedPayment.length) throw new HttpError(404, 'Payment not found', 'NOT_FOUND')
      const lockedInvoice = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Invoice" WHERE "id" = ${invoiceId} AND "businessId" = ${businessId} FOR UPDATE`
      if (!lockedInvoice.length) throw new HttpError(404, 'Invoice not found', 'NOT_FOUND')

      const [payment, invoice] = await Promise.all([
        tx.payment.findFirst({
          where: { id: paymentId, businessId },
          include: { allocations: { where: { status: 'CONFIRMED' }, select: { id: true, invoiceId: true, amount: true } } },
        }),
        tx.invoice.findFirst({
          where: { id: invoiceId, businessId },
          include: { allocations: { where: { status: 'CONFIRMED', payment: { status: 'COMPLETED' } }, select: { paymentId: true, amount: true } } },
        }),
      ])
      if (!payment || !invoice) throw new HttpError(404, 'Payment or invoice not found', 'NOT_FOUND')
      if (payment.status !== 'COMPLETED') throw new HttpError(400, 'Only completed payments can be allocated', 'PAYMENT_NOT_COMPLETED')
      if (payment.currency !== invoice.currency) throw new HttpError(400, 'Payment and invoice currencies must match', 'CURRENCY_MISMATCH')

      if (role === 'MANAGER') {
        const assignedInvoice = await tx.invoice.findFirst({
          where: {
            id: invoiceId,
            businessId,
            OR: [
              { assignments: { some: { businessId, userId } } },
              { customer: { is: { assignments: { some: { businessId, userId } } } } },
            ],
          },
          select: { id: true },
        })
        if (!assignedInvoice) throw new HttpError(403, 'This invoice is not assigned to you', 'ASSIGNMENT_REQUIRED')
      }

      const identityCandidates = payment.customerId || payment.payerReference || payment.payerEmail
        ? await tx.customer.findMany({
            where: {
              businessId,
              OR: [
                ...(payment.customerId ? [{ id: payment.customerId }] : []),
                ...(payment.payerReference ? [{ paypalPayerReference: { equals: payment.payerReference, mode: 'insensitive' as const } }] : []),
                ...(payment.payerEmail ? [{ email: { equals: payment.payerEmail, mode: 'insensitive' as const } }] : []),
              ],
            },
            select: { id: true, paypalPayerReference: true, email: true },
          })
        : []
      const payerMatches = identityCandidates.filter(customer =>
        (payment.payerReference && customer.paypalPayerReference && normalizeIdentity(payment.payerReference) === normalizeIdentity(customer.paypalPayerReference)) ||
        (payment.payerEmail && customer.email && normalizeIdentity(payment.payerEmail) === normalizeIdentity(customer.email)),
      )
      const identityIds = new Set([payment.customerId, ...payerMatches.map(customer => customer.id)].filter((id): id is string => Boolean(id)))
      if (identityIds.size > 1) {
        throw new HttpError(400, 'The payment customer and payer details identify different customers', 'CUSTOMER_IDENTITY_CONFLICT')
      }
      if (identityIds.size && !identityIds.has(invoice.customerId)) {
        throw new HttpError(400, 'The payer identity does not match this invoice customer', 'CUSTOMER_MISMATCH')
      }

      const existing = payment.allocations.find(allocation => allocation.invoiceId === invoiceId)
      const existingAmount = existing?.amount ?? new Prisma.Decimal(0)
      if (requestedTotal.lt(existingAmount)) throw new HttpError(400, 'This action cannot reduce an existing allocation', 'ALLOCATION_REDUCTION_NOT_ALLOWED')
      if (requestedTotal.eq(existingAmount)) {
        return { allocationId: existing?.id, amount: existingAmount.toFixed(2), idempotent: true, remainingPayment: payment.amount.minus(payment.allocations.reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0))).toFixed(2) }
      }

      const paymentAllocated = payment.allocations.reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0))
      const paymentAvailable = payment.amount.minus(paymentAllocated)
      const invoicePaid = invoice.allocations.reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0))
      const invoiceAvailable = invoice.totalAmount.minus(invoicePaid)
      const requestedIncrease = requestedTotal.minus(existingAmount)
      if (invoiceAvailable.lte(0)) throw new HttpError(400, 'Invoice has no outstanding balance', 'INVOICE_SETTLED')
      if (requestedIncrease.gt(paymentAvailable)) throw new HttpError(400, 'Allocation exceeds the remaining payment amount', 'PAYMENT_OVERALLOCATED')
      if (requestedTotal.gt(existingAmount.add(invoiceAvailable))) throw new HttpError(400, 'Allocation exceeds the invoice balance', 'INVOICE_OVERALLOCATED')

      const allocation = await tx.paymentAllocation.upsert({
        where: { paymentId_invoiceId: { paymentId, invoiceId } },
        create: {
          id: `ALC-${randomUUID()}`,
          paymentId,
          invoiceId,
          reviewedById: userId,
          amount: requestedTotal,
          currency: payment.currency,
          status: 'CONFIRMED',
          matchingMethod: 'HUMAN_CONFIRMED_RECONCILIATION',
        },
        update: { reviewedById: userId, amount: requestedTotal, matchingMethod: 'HUMAN_CONFIRMED_RECONCILIATION' },
      })

      const [updatedInvoiceTotals, updatedPaymentTotals] = await Promise.all([
        tx.paymentAllocation.aggregate({
          where: { invoiceId, status: 'CONFIRMED', payment: { status: 'COMPLETED' } },
          _sum: { amount: true },
        }),
        tx.paymentAllocation.aggregate({
          where: { paymentId, status: 'CONFIRMED' },
          _sum: { amount: true },
        }),
      ])
      const newPaidAmount = updatedInvoiceTotals._sum.amount ?? new Prisma.Decimal(0)
      const newOutstanding = Prisma.Decimal.max(invoice.totalAmount.minus(newPaidAmount), 0)
      const newPaymentRemaining = payment.amount.minus(updatedPaymentTotals._sum.amount ?? new Prisma.Decimal(0))
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstanding,
          status: newOutstanding.lte(0) ? 'PAID' : newPaidAmount.gt(0) ? 'PARTIALLY_PAID' : invoice.status,
        },
      })
      await tx.activityLog.create({
        data: {
          businessId,
          eventName: 'PAYMENT_ALLOCATION_CONFIRMED',
          eventType: 'RECONCILIATION',
          relatedRecordType: 'PAYMENT',
          relatedRecordId: paymentId,
          status: 'SUCCESS',
          metadata: { invoiceId, reviewerId: userId, amount: requestedTotal.toFixed(2), currency: payment.currency },
        },
      })
      if (newPaymentRemaining.lte(0)) {
        await tx.actionQueue.updateMany({
          where: { businessId, relatedType: 'PAYMENT', relatedId: paymentId, status: { in: ['OPEN', 'PENDING', 'PENDING_REVIEW'] } },
          data: { status: 'COMPLETED' },
        })
      }
      return { allocationId: allocation.id, amount: allocation.amount.toFixed(2), idempotent: false, remainingPayment: newPaymentRemaining.toFixed(2) }
    })

    send(res, { ...result, paymentId, invoiceId })
  } catch (error) { next(error) }
}
