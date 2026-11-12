import express, { Router } from 'express'
import { capturePayPalOrder, createPayPalOrder, paypalConnection, paypalWebhook } from '../controllers/paypal.controller.js'
import { requireAuth, requireBusinessMembership, requireRole } from '../middleware/auth.middleware.js'

export const paypalWebhookRouter = Router()
paypalWebhookRouter.post('/', express.raw({ type: 'application/json', limit: '1mb' }), paypalWebhook)

export const paypalRouter = Router()
paypalRouter.use(requireAuth, requireBusinessMembership)
paypalRouter.get('/connection', paypalConnection)
paypalRouter.post('/orders', requireRole('OWNER', 'ADMIN', 'MANAGER'), createPayPalOrder)
paypalRouter.post('/orders/:orderId/capture', requireRole('OWNER', 'ADMIN', 'MANAGER'), capturePayPalOrder)
