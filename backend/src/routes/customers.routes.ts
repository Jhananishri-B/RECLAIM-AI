import { Router } from 'express'
import { getCustomer, listCustomers } from '../controllers/customers.controller.js'
import { requireAuth, requireBusinessMembership } from '../middleware/auth.middleware.js'

export const customersRouter = Router()
customersRouter.use(requireAuth, requireBusinessMembership)
customersRouter.get('/', listCustomers)
customersRouter.get('/:id', getCustomer)
