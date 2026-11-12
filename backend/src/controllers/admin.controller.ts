import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { compare, hash } from 'bcryptjs'
import { prisma } from '../services/database.service.js'
import { HttpError } from '../utils/http-error.js'

const money = (value: Prisma.Decimal) => value.toFixed(2)
const send = (res: Response, data: unknown) => res.json({ success: true, data })
function auth(req: Request) { if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED'); return req.auth }
async function invoicesFor(businessId: string, userId?: string) {
  const assignment = userId ? { some: { userId, businessId } } : undefined
  return prisma.invoice.findMany({ where: { businessId, ...(assignment ? { assignments: assignment } : {}) }, include: { customer: { select: { id: true, name: true } }, allocations: { where: { status: 'CONFIRMED', payment: { status: 'COMPLETED' } }, include: { payment: { select: { currency: true, status: true } } } } }, orderBy: { dueDate: 'asc' } })
}
function invoiceBalance(invoice: Awaited<ReturnType<typeof invoicesFor>>[number]) {
  return invoice.totalAmount.minus(invoice.allocations.reduce((sum, a) => sum.add(a.amount), new Prisma.Decimal(0)))
}
const utcDay = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
function byCurrency(rows: Array<{ currency: string; amount: Prisma.Decimal }>) { return rows.reduce((map, row) => { map[row.currency] = (map[row.currency] ?? new Prisma.Decimal(0)).add(row.amount); return map }, {} as Record<string, Prisma.Decimal>) }

export async function dashboardSummary(req: Request, res: Response, next: NextFunction) { try {
  const { businessId } = auth(req); const invoices = await invoicesFor(businessId); const today = new Date(); today.setUTCHours(0, 0, 0, 0); const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const balances = invoices.map(invoice => ({ currency: invoice.currency, amount: invoiceBalance(invoice), invoice }));
  const overdue = balances.filter(x => x.amount.gt(0) && utcDay(x.invoice.dueDate) < utcDay(today)); const expected = balances.filter(x => x.amount.gt(0) && utcDay(x.invoice.dueDate) >= utcDay(today));
  const payments = await prisma.payment.findMany({ where: { businessId, status: 'COMPLETED', paymentDate: { gte: monthStart } }, select: { amount: true, currency: true } });
  const allocated = await prisma.paymentAllocation.findMany({ where: { payment: { businessId, status: 'COMPLETED' }, status: 'CONFIRMED' }, select: { paymentId: true, amount: true, currency: true } });
  const completedPayments = await prisma.payment.findMany({ where: { businessId, status: 'COMPLETED' }, select: { id: true, amount: true, currency: true } }); const allocatedByPayment = new Map<string, Prisma.Decimal>(); allocated.forEach(a => allocatedByPayment.set(a.paymentId, (allocatedByPayment.get(a.paymentId) ?? new Prisma.Decimal(0)).add(a.amount)));
  const unmatched = completedPayments.map(p => ({ currency: p.currency, amount: p.amount.minus(allocatedByPayment.get(p.id) ?? 0) })).filter(x => x.amount.gt(0));
  const countByCurrency = (items: typeof balances) => byCurrency(items.map(x => ({ currency: x.currency, amount: x.amount })));
  send(res, { totalOutstanding: countByCurrency(balances.filter(x => x.amount.gt(0))), totalOverdue: countByCurrency(overdue), collectedThisMonth: byCurrency(payments.map(p => ({ currency: p.currency, amount: p.amount }))), expectedReceipts: countByCurrency(expected), unmatchedPayments: byCurrency(unmatched), overdueInvoiceCount: overdue.length, currencies: [...new Set(invoices.map(i => i.currency))] });
 } catch (e) { next(e) } }

export async function dashboardHistory(req: Request, res: Response, next: NextFunction) { try { const { businessId } = auth(req); const months = Math.min(Math.max(Number(req.query.months ?? 12), 1), 12); const from = new Date(); from.setMonth(from.getMonth() - months + 1); const [payments, invoices] = await Promise.all([prisma.payment.findMany({ where: { businessId, status: 'COMPLETED', paymentDate: { gte: from } }, select: { paymentDate: true, amount: true, currency: true } }), prisma.invoice.findMany({ where: { businessId, invoiceDate: { gte: from } }, select: { invoiceDate: true, totalAmount: true, currency: true } })]); const key = (date: Date) => date.toISOString().slice(0, 7); const aggregate = (rows: Array<{ date: Date; amount: Prisma.Decimal; currency: string }>) => Object.values(rows.reduce((out, row) => { const k = `${key(row.date)}:${row.currency}`; out[k] = { month: key(row.date), currency: row.currency, amount: (out[k]?.amount ?? new Prisma.Decimal(0)).add(row.amount) }; return out }, {} as Record<string, { month: string; currency: string; amount: Prisma.Decimal }>)).map(x => ({ ...x, amount: money(x.amount) })); send(res, { payments: aggregate(payments.map(p => ({ date: p.paymentDate, amount: p.amount, currency: p.currency }))), invoices: aggregate(invoices.map(i => ({ date: i.invoiceDate, amount: i.totalAmount, currency: i.currency }))) }); } catch (e) { next(e) } }

export async function upcomingReceipts(req: Request, res: Response, next: NextFunction) { try { const { businessId } = auth(req); const days = Math.min(Math.max(Number(req.query.days ?? 60), 7), 60); const today = new Date(); today.setUTCHours(0, 0, 0, 0); const endDay = utcDay(today) + days * 86400000; const rows = (await invoicesFor(businessId)).filter(i => utcDay(i.dueDate) >= utcDay(today) && utcDay(i.dueDate) <= endDay && invoiceBalance(i).gt(0)).map(i => ({ customer: i.customer.name, invoiceNumber: i.invoiceNumber, dueDate: i.dueDate, originalAmount: money(i.totalAmount), paidAmount: money(i.totalAmount.minus(invoiceBalance(i))), remainingBalance: money(invoiceBalance(i)), currency: i.currency, status: i.status })); send(res, rows); } catch (e) { next(e) } }

export async function ageing(req: Request, res: Response, next: NextFunction) { try { const { businessId } = auth(req); const today = new Date(); today.setUTCHours(0, 0, 0, 0); const todayDay = utcDay(today); const buckets = [{ label: 'Not yet due', min: -Infinity, max: 0 }, { label: '1-30 days overdue', min: 1, max: 30 }, { label: '31-60 days overdue', min: 31, max: 60 }, { label: '61-90 days overdue', min: 61, max: 90 }, { label: 'Over 90 days overdue', min: 91, max: Infinity }]; const result = buckets.map(bucket => ({ ...bucket, count: 0, amounts: {} as Record<string, Prisma.Decimal> })); (await invoicesFor(businessId)).forEach(i => { const balance = invoiceBalance(i); if (balance.lte(0)) return; const days = Math.floor((todayDay - utcDay(i.dueDate)) / 86400000); const bucket = result.find(b => days >= b.min && days <= b.max)!; bucket.count++; bucket.amounts[i.currency] = (bucket.amounts[i.currency] ?? new Prisma.Decimal(0)).add(balance) }); send(res, result.map(({ min, max, ...bucket }) => ({ ...bucket, amounts: Object.fromEntries(Object.entries(bucket.amounts).map(([currency, amount]) => [currency, money(amount)])) }))); } catch (e) { next(e) } }

export async function customerPerformance(req: Request, res: Response, next: NextFunction) { try { const { businessId } = auth(req); const today = new Date(); today.setUTCHours(0, 0, 0, 0); const rows = new Map<string, { customer: string; outstanding: Record<string, Prisma.Decimal>; overdue: number; collected: Record<string, Prisma.Decimal> }>(); for (const i of await invoicesFor(businessId)) { const row = rows.get(i.customer.id) ?? { customer: i.customer.name, outstanding: {}, overdue: 0, collected: {} }; const balance = invoiceBalance(i); row.outstanding[i.currency] = (row.outstanding[i.currency] ?? new Prisma.Decimal(0)).add(balance); if (balance.gt(0) && utcDay(i.dueDate) < utcDay(today)) row.overdue++; row.collected[i.currency] = (row.collected[i.currency] ?? new Prisma.Decimal(0)).add(i.totalAmount.minus(balance)); rows.set(i.customer.id, row) } send(res, [...rows.values()].map(row => ({ ...row, outstanding: Object.fromEntries(Object.entries(row.outstanding).map(([k,v]) => [k, money(v)])), collected: Object.fromEntries(Object.entries(row.collected).map(([k,v]) => [k, money(v)])) }))); } catch (e) { next(e) } }

export async function listUsers(req: Request, res: Response, next: NextFunction) { try { const { businessId } = auth(req); const memberships = await prisma.businessMembership.findMany({ where: { businessId }, include: { user: { select: { id: true, name: true, email: true, accountStatus: true, createdAt: true } } }, orderBy: { createdAt: 'asc' } }); send(res, memberships.map(m => ({ ...m.user, role: m.role }))); } catch (e) { next(e) } }
const userSchema = z.object({ name: z.string().trim().min(2).max(200), email: z.string().trim().email(), password: z.string().min(8).max(128), role: z.enum(['ADMIN','MANAGER','MEMBER']).default('MANAGER') }).strict();
export async function createUser(req: Request, res: Response, next: NextFunction) { try { const { businessId, userId, role: actorRole } = auth(req); const input = userSchema.parse(req.body); if (actorRole === 'ADMIN' && input.role === 'ADMIN') throw new HttpError(403, 'Only an owner can create administrators', 'FORBIDDEN'); const result = await prisma.$transaction(async tx => { const user = await tx.user.create({ data: { businessId, name: input.name, email: input.email.toLowerCase(), passwordHash: await hash(input.password, 12), mustChangePassword: true, role: input.role } }); await tx.businessMembership.create({ data: { userId: user.id, businessId, role: input.role } }); await tx.activityLog.create({ data: { businessId, eventName: 'ADMIN_USER_CREATED', eventType: 'ADMIN', relatedRecordId: user.id, status: 'SUCCESS', metadata: { actorId: userId, role: input.role } } }); return user }); send(res, { id: result.id, name: result.name, email: result.email, role: input.role, mustChangePassword: true }); } catch (e) { next(e) } }
const roleUpdateSchema = z.object({ role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']) }).strict()
const statusUpdateSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) }).strict()
const assignmentSchema = z.object({
  userId: z.string().min(1),
  customerIds: z.array(z.string().min(1)).default([]),
  invoiceIds: z.array(z.string().min(1)).default([]),
}).strict().superRefine((input, context) => {
  if (new Set(input.customerIds).size !== input.customerIds.length) context.addIssue({ code: 'custom', path: ['customerIds'], message: 'Customer assignments must be unique' })
  if (new Set(input.invoiceIds).size !== input.invoiceIds.length) context.addIssue({ code: 'custom', path: ['invoiceIds'], message: 'Invoice assignments must be unique' })
})

export async function updateUserRole(req: Request, res: Response, next: NextFunction) { try {
  const { businessId, userId: actor, role: actorRole } = auth(req)
  const parsed = roleUpdateSchema.safeParse(req.body)
  if (!parsed.success) throw new HttpError(400, 'Invalid role update', 'VALIDATION_ERROR')
  const id = String(req.params.id)
  const membership = await prisma.businessMembership.findUnique({ where: { userId_businessId: { userId: id, businessId } } })
  if (!membership) throw new HttpError(404, 'User not found', 'NOT_FOUND')
  if (id === actor || membership.role === 'OWNER') throw new HttpError(400, 'Owner and self role changes are protected', 'OWNER_PROTECTED')
  if (actorRole === 'ADMIN' && (membership.role === 'ADMIN' || parsed.data.role === 'ADMIN')) throw new HttpError(403, 'Only an owner can change administrator access', 'FORBIDDEN')
  await prisma.$transaction(async tx => {
    const updated = await tx.businessMembership.update({ where: { userId_businessId: { userId: id, businessId } }, data: { role: parsed.data.role } })
    await tx.activityLog.create({ data: { businessId, eventName: 'ADMIN_USER_ROLE_CHANGED', eventType: 'ADMIN', relatedRecordId: id, status: 'SUCCESS', metadata: { actor, value: parsed.data.role } } })
    return updated
  })
  send(res, { id, role: parsed.data.role })
} catch (e) { next(e) } }

export async function updateUserStatus(req: Request, res: Response, next: NextFunction) { try {
  const { businessId, userId: actor, role: actorRole } = auth(req)
  const parsed = statusUpdateSchema.safeParse(req.body)
  if (!parsed.success) throw new HttpError(400, 'Invalid account status update', 'VALIDATION_ERROR')
  const id = String(req.params.id)
  const membership = await prisma.businessMembership.findUnique({ where: { userId_businessId: { userId: id, businessId } } })
  if (!membership) throw new HttpError(404, 'User not found', 'NOT_FOUND')
  if (parsed.data.status === 'INACTIVE' && (membership.role === 'OWNER' || id === actor)) throw new HttpError(400, 'Owner and self deactivation are protected', 'OWNER_PROTECTED')
  if (actorRole === 'ADMIN' && membership.role === 'ADMIN') throw new HttpError(403, 'Only an owner can change administrator access', 'FORBIDDEN')
  await prisma.$transaction(async tx => {
    const user = await tx.user.update({ where: { id }, data: { accountStatus: parsed.data.status }, select: { id: true, name: true, email: true, accountStatus: true } })
    if (parsed.data.status === 'INACTIVE') await tx.refreshSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
    await tx.activityLog.create({ data: { businessId, eventName: 'ADMIN_USER_STATUS_CHANGED', eventType: 'ADMIN', relatedRecordId: id, status: 'SUCCESS', metadata: { actor, value: parsed.data.status } } })
    return user
  })
  send(res, { id, accountStatus: parsed.data.status })
} catch (e) { next(e) } }

export async function updateAssignments(req: Request, res: Response, next: NextFunction) { try {
  const { businessId, userId: actor } = auth(req)
  const parsed = assignmentSchema.safeParse(req.body)
  if (!parsed.success) throw new HttpError(400, 'Invalid assignment request', 'VALIDATION_ERROR')
  const input = parsed.data
  const member = await prisma.businessMembership.findUnique({ where: { userId_businessId: { userId: input.userId, businessId } } })
  if (!member || member.role !== 'MANAGER') throw new HttpError(400, 'Assignments require a manager in this business', 'INVALID_ASSIGNMENT')
  await prisma.$transaction(async tx => {
    const [customers, invoices] = await Promise.all([
      input.customerIds.length ? tx.customer.count({ where: { id: { in: input.customerIds }, businessId } }) : 0,
      input.invoiceIds.length ? tx.invoice.count({ where: { id: { in: input.invoiceIds }, businessId } }) : 0,
    ])
    if (customers !== input.customerIds.length || invoices !== input.invoiceIds.length) throw new HttpError(400, 'Assignments must reference records in this business', 'INVALID_ASSIGNMENT')
    await tx.customerAssignment.deleteMany({ where: { businessId, userId: input.userId } })
    await tx.invoiceAssignment.deleteMany({ where: { businessId, userId: input.userId } })
    if (input.customerIds.length) await tx.customerAssignment.createMany({ data: input.customerIds.map(customerId => ({ businessId, userId: input.userId, customerId })) })
    if (input.invoiceIds.length) await tx.invoiceAssignment.createMany({ data: input.invoiceIds.map(invoiceId => ({ businessId, userId: input.userId, invoiceId })) })
    await tx.activityLog.create({ data: { businessId, eventName: 'ADMIN_ASSIGNMENTS_CHANGED', eventType: 'ADMIN', status: 'SUCCESS', metadata: { actor, userId: input.userId, customerCount: input.customerIds.length, invoiceCount: input.invoiceIds.length } } })
  })
  send(res, { updated: true })
} catch (e) { next(e) } }

export async function getAssignments(req: Request, res: Response, next: NextFunction) { try {
  const { businessId } = auth(req)
  const userId = String(req.params.userId)
  const member = await prisma.businessMembership.findUnique({ where: { userId_businessId: { userId, businessId } } })
  if (!member || member.role !== 'MANAGER') throw new HttpError(404, 'Manager not found', 'NOT_FOUND')
  const [customers, invoices, customerAssignments, invoiceAssignments] = await Promise.all([
    prisma.customer.findMany({ where: { businessId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.invoice.findMany({ where: { businessId }, select: { id: true, invoiceNumber: true, customer: { select: { name: true } } }, orderBy: { dueDate: 'asc' } }),
    prisma.customerAssignment.findMany({ where: { businessId, userId }, select: { customerId: true } }),
    prisma.invoiceAssignment.findMany({ where: { businessId, userId }, select: { invoiceId: true } }),
  ])
  send(res, {
    customers,
    invoices: invoices.map(invoice => ({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, customer: invoice.customer.name })),
    customerIds: customerAssignments.map(assignment => assignment.customerId),
    invoiceIds: invoiceAssignments.map(assignment => assignment.invoiceId),
  })
} catch (e) { next(e) } }
