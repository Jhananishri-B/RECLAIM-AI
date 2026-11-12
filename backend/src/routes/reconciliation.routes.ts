import { Router } from 'express'
import { requireAuth, requireBusinessMembership } from '../middleware/auth.middleware.js'
import { confirmAllocation, reconciliationQueue } from '../controllers/reconciliation.controller.js'

export const reconciliationRouter = Router()
reconciliationRouter.use(requireAuth, requireBusinessMembership)
reconciliationRouter.get('/queue', reconciliationQueue)
reconciliationRouter.post('/payments/:paymentId/allocations', confirmAllocation)
