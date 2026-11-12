import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { healthRouter } from './routes/health.routes.js'
import { authRouter } from './routes/auth.routes.js'
import { customersRouter } from './routes/customers.routes.js'
import { businessRouter } from './routes/business.routes.js'
import { adminRouter } from './routes/admin.routes.js'
import { managerRouter } from './routes/manager.routes.js'
import { reconciliationRouter } from './routes/reconciliation.routes.js'
import { paypalRouter, paypalWebhookRouter } from './routes/paypal.routes.js'

export const app = express()
app.use(cors({ origin: env.frontendOrigin, credentials: true }))
app.use('/api/paypal/webhook', paypalWebhookRouter)
app.use(express.json())
app.use(cookieParser())
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'))
app.get('/api', (_req, res) => res.json({ success: true, data: { service: 'reclaim-ai-api', message: 'API is running' } }))
app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/customers', customersRouter)
app.use('/api/business', businessRouter)
app.use('/api/admin', adminRouter)
app.use('/api/manager', managerRouter)
app.use('/api/reconciliation', reconciliationRouter)
app.use('/api/paypal', paypalRouter)
app.use((_req, res) => res.status(404).json({ success: false, error: { message: 'Route not found' } }))
app.use(errorHandler)
