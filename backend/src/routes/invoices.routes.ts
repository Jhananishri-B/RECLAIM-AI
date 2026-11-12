import { Router } from 'express'
import { listInvoices } from '../controllers/invoices.controller.js'
import { requireAuth, requireBusinessMembership } from '../middleware/auth.middleware.js'

export const invoicesRouter = Router()
invoicesRouter.use(requireAuth, requireBusinessMembership)
invoicesRouter.get('/', listInvoices)
