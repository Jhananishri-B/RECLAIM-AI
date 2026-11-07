import { Router } from 'express'
import { ownerCheck } from '../controllers/business.controller.js'
import { requireAuth, requireBusinessMembership, requireRole } from '../middleware/auth.middleware.js'

export const businessRouter = Router()
businessRouter.use(requireAuth, requireBusinessMembership, requireRole('OWNER'))
businessRouter.get('/owner-check', ownerCheck)
