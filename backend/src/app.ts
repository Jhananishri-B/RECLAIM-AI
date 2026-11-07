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

export const app = express()
app.use(cors({ origin: env.frontendOrigin, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'))
app.get('/api', (_req, res) => res.json({ success: true, data: { service: 'reclaim-ai-api', message: 'API is running' } }))
app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/customers', customersRouter)
app.use('/api/business', businessRouter)
app.use((_req, res) => res.status(404).json({ success: false, error: { message: 'Route not found' } }))
app.use(errorHandler)
