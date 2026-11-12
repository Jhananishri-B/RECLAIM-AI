import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { env } from '../config/env.js'
import { prisma } from '../services/database.service.js'
import { getPayPalAccessToken, isPayPalConfigured, paypalRequest, verifyPayPalWebhook, type PayPalCapture, type PayPalOrder } from '../services/paypal.service.js'
import { HttpError } from '../utils/http-error.js'

const send = (res: Response, data: unknown) => res.json({ success: true, data })
const orderSchema = z.object({ invoiceId: z.string().min(1) }).strict()
type PayPalWebhookEvent = {
  id?: string
  event_type?: string
  create_time?: string
  resource?: {
    id?: string
    amount?: { value?: string; currency_code?: string }
    create_time?: string
    update_time?: string
    supplementary_data?: { related_ids?: { order_id?: string } }
  }
}

async function ensureInvoiceScope(req: Request, invoiceId: string, requireOutstanding = true) {
  if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')
  const { businessId, userId, role } = req.auth
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: {
      customer: { select: { name: true } },
      allocations: { where: { status: 'CONFIRMED', payment: { status: 'COMPLETED' } }, select: { amount: true } },
    },
  })
  if (!invoice) throw new HttpError(404, 'Invoice not found', 'NOT_FOUND')
  if (role === 'MANAGER') {
    const assignment = await prisma.invoice.findFirst({
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
    if (!assignment) throw new HttpError(403, 'This invoice is not assigned to you', 'ASSIGNMENT_REQUIRED')
  }
  const paidAmount = invoice.allocations.reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0))
  const outstandingAmount = Prisma.Decimal.max(invoice.totalAmount.minus(paidAmount), 0)
  if (requireOutstanding && outstandingAmount.lte(0)) throw new HttpError(400, 'Invoice has no outstanding balance', 'INVOICE_SETTLED')
  return { ...invoice, outstandingAmount }
}

export async function paypalConnection(_req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPayPalConfigured()) return send(res, { configured: false, connected: false, webhookConfigured: Boolean(env.paypalWebhookId), mode: env.paypalMode })
    await getPayPalAccessToken()
    send(res, { configured: true, connected: true, webhookConfigured: Boolean(env.paypalWebhookId), mode: env.paypalMode })
  } catch (error) { next(error) }
}

export async function createPayPalOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = orderSchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Invalid PayPal order request', 'VALIDATION_ERROR')
    const invoice = await ensureInvoiceScope(req, parsed.data.invoiceId)
    const order = await paypalRequest<PayPalOrder>('/v2/checkout/orders', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: invoice.id,
          custom_id: invoice.id,
          invoice_id: invoice.invoiceNumber,
          description: `Invoice ${invoice.invoiceNumber} for ${invoice.customer.name}`.slice(0, 127),
          amount: { currency_code: invoice.currency, value: invoice.outstandingAmount.toFixed(2) },
        }],
        application_context: {
          brand_name: 'RECLAIM AI',
          user_action: 'PAY_NOW',
          return_url: `${env.frontendOrigin}/receivables?paypal=approved`,
          cancel_url: `${env.frontendOrigin}/receivables?paypal=cancelled`,
        },
      }),
    })
    const approvalUrl = (order as PayPalOrder & { links?: Array<{ rel?: string; href?: string }> }).links?.find(link => link.rel === 'approve')?.href
    if (!order.id || !approvalUrl) throw new HttpError(502, 'PayPal returned an incomplete order', 'PAYPAL_INVALID_ORDER_RESPONSE')
    send(res, { orderId: order.id, approvalUrl, amount: invoice.outstandingAmount.toFixed(2), currency: invoice.currency })
  } catch (error) { next(error) }
}

function captureForOrder(order: PayPalOrder): PayPalCapture | undefined {
  return order.purchase_units?.[0]?.payments?.captures?.find(capture => capture.status === 'COMPLETED')
}

async function recordCapture(db: Pick<Prisma.TransactionClient, 'invoice' | 'payment'>, businessId: string, invoiceId: string, order: PayPalOrder, capture: PayPalCapture) {
  if (!capture.id || !capture.amount?.value || !capture.amount.currency_code) {
    throw new HttpError(502, 'PayPal returned incomplete capture details', 'PAYPAL_INVALID_CAPTURE_RESPONSE')
  }
  const amount = new Prisma.Decimal(capture.amount.value)
  if (!amount.gt(0) || !/^[A-Z]{3}$/.test(capture.amount.currency_code)) {
    throw new HttpError(502, 'PayPal returned an invalid capture amount', 'PAYPAL_INVALID_CAPTURE_RESPONSE')
  }
  const invoice = await db.invoice.findFirst({ where: { id: invoiceId, businessId } })
  if (!invoice) throw new HttpError(404, 'Invoice for this PayPal order was not found', 'PAYPAL_INVOICE_NOT_FOUND')
  if (invoice.currency !== capture.amount.currency_code) throw new HttpError(400, 'Captured currency does not match the invoice currency', 'PAYPAL_CURRENCY_MISMATCH')
  const paymentDate = new Date(capture.update_time ?? capture.create_time ?? new Date().toISOString())
  if (Number.isNaN(paymentDate.getTime())) throw new HttpError(502, 'PayPal returned an invalid capture date', 'PAYPAL_INVALID_CAPTURE_RESPONSE')
  const dateOnly = new Date(Date.UTC(paymentDate.getUTCFullYear(), paymentDate.getUTCMonth(), paymentDate.getUTCDate()))
  const payerReference = order.payer?.payer_id ?? null
  const payerEmail = order.payer?.email_address ?? null
  const payment = await db.payment.upsert({
    where: { paypalTransactionId: capture.id },
    create: {
      id: `PAYPAL-${randomUUID()}`,
      businessId,
      customerId: null,
      paypalTransactionId: capture.id,
      payerReference,
      payerEmail,
      paymentDate: dateOnly,
      amount,
      currency: capture.amount.currency_code,
      status: 'COMPLETED',
      invoiceReference: invoice.invoiceNumber,
      description: `PayPal Checkout order ${order.id ?? ''}`.trim(),
      sourceSystem: 'PAYPAL',
    },
    update: {},
  })
  return payment
}

export async function capturePayPalOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')
    const orderId = String(req.params.orderId)
    if (!/^[A-Za-z0-9_-]{5,100}$/.test(orderId)) throw new HttpError(400, 'Invalid PayPal order ID', 'VALIDATION_ERROR')
    const existingOrder = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`)
    const unit = existingOrder.purchase_units?.[0]
    const invoiceId = unit?.custom_id ?? unit?.reference_id
    if (!invoiceId || existingOrder.purchase_units?.length !== 1) throw new HttpError(400, 'PayPal order is not linked to a supported invoice', 'PAYPAL_ORDER_NOT_LINKED')
    await ensureInvoiceScope(req, invoiceId, existingOrder.status !== 'COMPLETED')
    const order = existingOrder.status === 'COMPLETED'
      ? existingOrder
      : await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: '{}',
        })
    const capture = captureForOrder(order)
    if (!capture) throw new HttpError(400, 'PayPal has not completed this payment', 'PAYPAL_CAPTURE_INCOMPLETE')
    const payment = await recordCapture(prisma, req.auth.businessId, invoiceId, order, capture)
    send(res, { paymentId: payment.id, transactionId: payment.paypalTransactionId, status: payment.status, amount: payment.amount.toFixed(2), currency: payment.currency })
  } catch (error) { next(error) }
}

export async function paypalWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    if (!Buffer.isBuffer(req.body)) throw new HttpError(400, 'Expected a raw JSON PayPal webhook body', 'PAYPAL_INVALID_WEBHOOK_BODY')
    let event: PayPalWebhookEvent
    try { event = JSON.parse(req.body.toString('utf8')) as PayPalWebhookEvent }
    catch { throw new HttpError(400, 'Invalid PayPal webhook JSON', 'PAYPAL_INVALID_WEBHOOK_BODY') }
    const verified = await verifyPayPalWebhook({
      authAlgo: req.header('paypal-auth-algo'),
      certUrl: req.header('paypal-cert-url'),
      transmissionId: req.header('paypal-transmission-id'),
      transmissionSignature: req.header('paypal-transmission-sig'),
      transmissionTime: req.header('paypal-transmission-time'),
    }, event)
    if (!verified) throw new HttpError(401, 'PayPal webhook signature verification failed', 'PAYPAL_SIGNATURE_INVALID')
    if (!event.id || !event.event_type) throw new HttpError(400, 'PayPal webhook event is missing identifiers', 'PAYPAL_INVALID_WEBHOOK_EVENT')

    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') return send(res, { received: true, processed: false })
    const captureId = event.resource?.id
    const orderId = event.resource?.supplementary_data?.related_ids?.order_id
    if (!captureId || !orderId) return send(res, { received: true, processed: false })
    const order = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`)
    const unit = order.purchase_units?.[0]
    const invoiceId = unit?.custom_id ?? unit?.reference_id
    const capture = captureForOrder(order)
    if (!invoiceId || !capture || capture.id !== captureId) return send(res, { received: true, processed: false })
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId }, select: { id: true, businessId: true } })
    if (!invoice) return send(res, { received: true, processed: false })

    await prisma.$transaction(async tx => {
      const priorEvent = await tx.webhookEvent.findUnique({ where: { id: event.id! } })
      if (priorEvent?.processingStatus === 'PROCESSED') return
      const payment = await recordCapture(tx, invoice.businessId, invoice.id, order, capture)
      await tx.webhookEvent.upsert({
        where: { id: event.id! },
        create: {
          id: event.id!, businessId: invoice.businessId, relatedPaymentId: payment.id,
          eventType: event.event_type!, resourceId: captureId,
          eventCreatedAt: event.create_time ? new Date(event.create_time) : null,
          signatureStatus: 'VERIFIED', processingStatus: 'PROCESSED',
        },
        update: { relatedPaymentId: payment.id, signatureStatus: 'VERIFIED', processingStatus: 'PROCESSED' },
      })
      await tx.webhookDelivery.create({ data: { id: `WHDEL-${randomUUID()}`, eventId: event.id!, receivedAt: new Date(), deliveryAttempt: 1, handlerResult: 'PAYMENT_RECORDED' } })
      await tx.activityLog.create({
        data: {
          businessId: invoice.businessId, eventName: 'PAYPAL_PAYMENT_CAPTURED', eventType: 'PAYMENT',
          relatedRecordType: 'PAYMENT', relatedRecordId: payment.id, status: 'SUCCESS',
          metadata: { invoiceId: invoice.id, transactionId: captureId, amount: capture.amount?.value ?? null, currency: capture.amount?.currency_code ?? null },
        },
      })
    })
    send(res, { received: true, processed: true })
  } catch (error) { next(error) }
}
