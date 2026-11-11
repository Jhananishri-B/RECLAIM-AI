import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../services/database.service.js'
import { verifyAccessToken } from '../services/auth.service.js'
import { HttpError } from '../utils/http-error.js'
import type { MembershipRole } from '@prisma/client'

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization')
  if (!header?.startsWith('Bearer ')) return next(new HttpError(401, 'Authentication required', 'AUTH_REQUIRED'))
  try {
    const claims = verifyAccessToken(header.slice(7))
    if (!claims.sub || !claims.businessId || !claims.role) throw new Error('Invalid token claims')
    req.auth = { userId: claims.sub, businessId: claims.businessId, role: claims.role }
    next()
  } catch { next(new HttpError(401, 'Authentication required', 'AUTH_REQUIRED')) }
}

export async function requireBusinessMembership(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(new HttpError(401, 'Authentication required', 'AUTH_REQUIRED'))
  try {
    const membership = await prisma.businessMembership.findUnique({
      where: { userId_businessId: { userId: req.auth.userId, businessId: req.auth.businessId } },
      include: { user: { select: { accountStatus: true, mustChangePassword: true } } },
    })
    if (!membership) return next(new HttpError(403, 'Business access denied', 'BUSINESS_ACCESS_DENIED'))
    if (membership.user.accountStatus !== 'ACTIVE') return next(new HttpError(401, 'Authentication required', 'AUTH_REQUIRED'))
    const isSessionRestore = req.baseUrl.endsWith('/auth') && req.path === '/me'
    if (membership.user.mustChangePassword && !isSessionRestore) return next(new HttpError(403, 'Password change required', 'PASSWORD_CHANGE_REQUIRED'))
    req.auth.role = membership.role
    next()
  } catch (error) { next(error) }
}

export function requireRole(...roles: MembershipRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) return next(new HttpError(403, 'Insufficient permissions', 'FORBIDDEN'))
    next()
  }
}
