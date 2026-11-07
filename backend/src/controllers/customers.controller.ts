import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../services/database.service.js'
import { HttpError } from '../utils/http-error.js'

export async function listCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')
    const customers = await prisma.customer.findMany({ where: { businessId: req.auth.businessId }, orderBy: { name: 'asc' }, select: { id: true, name: true, legalName: true, email: true, country: true, riskSegment: true, createdAt: true } })
    res.json({ success: true, data: customers })
  } catch (error) { next(error) }
}

export async function getCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')
    const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const customer = await prisma.customer.findFirst({ where: { id: customerId, businessId: req.auth.businessId }, select: { id: true, name: true, legalName: true, email: true, country: true, riskSegment: true, createdAt: true } })
    if (!customer) throw new HttpError(404, 'Customer not found', 'NOT_FOUND')
    res.json({ success: true, data: customer })
  } catch (error) { next(error) }
}
