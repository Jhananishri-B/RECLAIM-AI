import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../services/database.service.js'
import { HttpError } from '../utils/http-error.js'

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.string().trim().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
}).strict()

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')
    const parsed = querySchema.safeParse(req.query)
    if (!parsed.success) throw new HttpError(400, 'Invalid invoice query', 'VALIDATION_ERROR')
    const { businessId, userId, role } = req.auth
    const { q, status, page, pageSize } = parsed.data
    const where: Prisma.InvoiceWhereInput = {
      businessId,
      ...(status ? { status } : {}),
      AND: [
        ...(q ? [{ OR: [
          { invoiceNumber: { contains: q, mode: 'insensitive' as const } },
          { customer: { is: { name: { contains: q, mode: 'insensitive' as const } } } },
        ] }] : []),
        ...(role === 'MANAGER' ? [{ OR: [
          { assignments: { some: { businessId, userId } } },
          { customer: { is: { assignments: { some: { businessId, userId } } } } },
        ] }] : []),
      ],
    }
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          allocations: { where: { status: 'CONFIRMED', payment: { status: 'COMPLETED' } }, select: { amount: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { invoiceNumber: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ])
    const items = invoices.map(invoice => {
      const paidAmount = invoice.allocations.reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0))
      const outstandingAmount = Prisma.Decimal.max(invoice.totalAmount.minus(paidAmount), 0)
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const dueDate = new Date(invoice.dueDate)
      dueDate.setUTCHours(0, 0, 0, 0)
      const status = outstandingAmount.lte(0)
        ? 'PAID'
        : invoice.status === 'DISPUTED'
          ? 'DISPUTED'
          : dueDate < today ? 'OVERDUE' : paidAmount.gt(0) ? 'PARTIALLY_PAID' : invoice.status
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer.name,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: invoice.totalAmount.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        outstandingAmount: outstandingAmount.toFixed(2),
        currency: invoice.currency,
        status,
      }
    })
    res.json({ success: true, data: { items, total, page, pageSize } })
  } catch (error) { next(error) }
}
