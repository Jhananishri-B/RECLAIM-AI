import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { changePassword, login, loginSchema, logout, me, refresh, register, registerSchema, passwordChangeSchema } from '../controllers/auth.controller.js'
import { requireAuth, requireBusinessMembership } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validation.middleware.js'
import { requireAllowedOrigin } from '../middleware/origin.middleware.js'

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, error: { code: 'AUTH_RATE_LIMITED', message: 'Too many authentication attempts' } } })
export const authRouter = Router()
authRouter.use(authRateLimit)
authRouter.use(requireAllowedOrigin)
authRouter.post('/register', validateBody(registerSchema), register)
authRouter.post('/login', validateBody(loginSchema), login)
authRouter.post('/refresh', refresh)
authRouter.post('/logout', logout)
authRouter.get('/me', requireAuth, requireBusinessMembership, me)
authRouter.post('/change-password', requireAuth, validateBody(passwordChangeSchema), changePassword)
