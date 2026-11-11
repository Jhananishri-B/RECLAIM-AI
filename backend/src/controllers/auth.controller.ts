import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import type { MembershipRole } from '@prisma/client'
import { prisma } from '../services/database.service.js'
import { compare, hash } from 'bcryptjs'
import { createAccessToken, createRefreshToken, createSession, hashRefreshToken, refreshExpiry, toSafeUser } from '../services/auth.service.js'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

export const registerSchema = z.object({ name: z.string().trim().min(2).max(200), email: z.string().trim().email().transform(value => value.toLowerCase()), password: z.string().min(8).max(128), businessName: z.string().trim().min(2).max(200), businessEmail: z.string().trim().email().transform(value => value.toLowerCase()).optional() })
export const loginSchema = z.object({ email: z.string().trim().email().transform(value => value.toLowerCase()), password: z.string().min(1).max(128) })
export const passwordChangeSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) })
type RegisterInput = z.infer<typeof registerSchema>
type LoginInput = z.infer<typeof loginSchema>

const refreshCookieOptions = () => ({ httpOnly: true, secure: env.nodeEnv === 'production', sameSite: 'lax' as const, maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000, path: '/api/auth' })
const setRefreshCookie = (res: Response, token: string) => res.cookie(env.refreshCookieName, token, refreshCookieOptions())
const clearRefreshCookie = (res: Response) => res.clearCookie(env.refreshCookieName, refreshCookieOptions())
const genericLoginError = () => new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')

async function authResponse(userId: string, businessId: string, role: MembershipRole) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { id: true, name: true, businessEmail: true, createdAt: true, updatedAt: true } })
  return { accessToken: createAccessToken(user.id, business.id, role), user: toSafeUser(user), business, membership: { role } }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as RegisterInput
    const passwordHash = await hash(input.password, 12)
    const result = await prisma.$transaction(async tx => {
      const existing = await tx.user.findUnique({ where: { email: input.email } })
      if (existing) throw new HttpError(409, 'Registration could not be completed', 'REGISTRATION_CONFLICT')
      const business = await tx.business.create({ data: { name: input.businessName, businessEmail: input.businessEmail ?? input.email } })
      const user = await tx.user.create({ data: { businessId: business.id, name: input.name, email: input.email, passwordHash } })
      await tx.businessMembership.create({ data: { userId: user.id, businessId: business.id, role: 'OWNER' } })
      return { userId: user.id, businessId: business.id }
    })
    const refreshToken = await createSession(prisma, result.userId)
    setRefreshCookie(res, refreshToken)
    res.status(201).json({ success: true, data: await authResponse(result.userId, result.businessId, 'OWNER') })
  } catch (error) { next(error) }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as LoginInput
    const user = await prisma.user.findUnique({ where: { email: input.email }, include: { memberships: { orderBy: { createdAt: 'asc' } } } })
    if (!user || user.accountStatus !== 'ACTIVE' || !(await compare(input.password, user.passwordHash))) throw genericLoginError()
    const membership = user.memberships[0]
    if (!membership) throw genericLoginError()
    const refreshToken = await createSession(prisma, user.id)
    setRefreshCookie(res, refreshToken)
    res.status(200).json({ success: true, data: await authResponse(user.id, membership.businessId, membership.role) })
  } catch (error) { next(error) }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies?.[env.refreshCookieName] as string | undefined
    if (!rawToken) throw new HttpError(401, 'Refresh session is invalid', 'REFRESH_INVALID')
    const oldHash = hashRefreshToken(rawToken)
    const now = new Date()
    const session = await prisma.refreshSession.findUnique({ where: { tokenHash: oldHash }, include: { user: { include: { memberships: { orderBy: { createdAt: 'asc' } } } } } })
    if (!session || session.revokedAt || session.expiresAt <= now || session.user.memberships.length === 0) throw new HttpError(401, 'Refresh session is invalid', 'REFRESH_INVALID')
    const membership = session.user.memberships[0]
    const newToken = createRefreshToken()
    await prisma.$transaction([prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: now } }), prisma.refreshSession.create({ data: { userId: session.userId, tokenHash: hashRefreshToken(newToken), expiresAt: refreshExpiry() } })])
    setRefreshCookie(res, newToken)
    res.status(200).json({ success: true, data: await authResponse(session.userId, membership.businessId, membership.role) })
  } catch (error) { next(error) }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try { const rawToken = req.cookies?.[env.refreshCookieName] as string | undefined; if (rawToken) await prisma.refreshSession.updateMany({ where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null }, data: { revokedAt: new Date() } }); clearRefreshCookie(res); res.status(200).json({ success: true, data: { loggedOut: true } }) } catch (error) { next(error) }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) { try { if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED'); const input = passwordChangeSchema.parse(req.body); const user = await prisma.user.findUnique({ where: { id: req.auth.userId } }); if (!user || !(await compare(input.currentPassword, user.passwordHash))) throw new HttpError(400, 'Current password is incorrect', 'PASSWORD_INVALID'); await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hash(input.newPassword, 12), mustChangePassword: false } }); res.json({ success: true, data: { changed: true } }); } catch (error) { next(error) } }

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')
    const result = await prisma.user.findUnique({ where: { id: req.auth.userId }, include: { memberships: { include: { business: { select: { id: true, name: true, businessEmail: true, createdAt: true, updatedAt: true } } }, orderBy: { createdAt: 'asc' } } } })
    const active = result?.memberships.find(membership => membership.businessId === req.auth?.businessId)
    if (!result || !active) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')
    res.status(200).json({ success: true, data: { user: toSafeUser(result), business: active.business, membership: { role: active.role }, businesses: result.memberships.map(item => ({ ...item.business, role: item.role })) } })
  } catch (error) { next(error) }
}
