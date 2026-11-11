import { Router } from 'express'
import { requireAuth, requireBusinessMembership, requireRole } from '../middleware/auth.middleware.js'
import { managerInvoices, managerPayments, managerSummary, managerTasks } from '../controllers/manager.controller.js'
export const managerRouter = Router()
managerRouter.use(requireAuth, requireBusinessMembership, requireRole('MANAGER'))
managerRouter.get('/dashboard/summary', managerSummary)
managerRouter.get('/dashboard/invoices', managerInvoices)
managerRouter.get('/dashboard/payments', managerPayments)
managerRouter.get('/dashboard/tasks', managerTasks)
