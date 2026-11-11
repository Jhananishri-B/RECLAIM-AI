import { Router } from 'express'
import { requireAuth, requireBusinessMembership, requireRole } from '../middleware/auth.middleware.js'
import { ageing, createUser, customerPerformance, dashboardHistory, dashboardSummary, listUsers, updateAssignments, updateUser, upcomingReceipts } from '../controllers/admin.controller.js'
export const adminRouter = Router()
adminRouter.use(requireAuth, requireBusinessMembership, requireRole('OWNER', 'ADMIN'))
adminRouter.get('/dashboard/summary', dashboardSummary)
adminRouter.get('/dashboard/history', dashboardHistory)
adminRouter.get('/dashboard/upcoming-receipts', upcomingReceipts)
adminRouter.get('/dashboard/ageing', ageing)
adminRouter.get('/dashboard/customer-performance', customerPerformance)
adminRouter.get('/users', listUsers)
adminRouter.post('/users', createUser)
adminRouter.patch('/users/:id/role', updateUser)
adminRouter.patch('/users/:id/status', updateUser)
adminRouter.patch('/assignments', updateAssignments)
