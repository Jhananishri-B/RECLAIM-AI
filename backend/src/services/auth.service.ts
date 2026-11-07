import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { MembershipRole, PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

type AccessClaims = { businessId: string; role: MembershipRole }
export type SafeUser = { id: string; name: string; email: string; createdAt: Date }

export function hashRefreshToken(token: string) { return createHash('sha256').update(token).digest('hex') }
export function createRefreshToken() { return randomBytes(48).toString('base64url') }
export function refreshExpiry() { return new Date(Date.now() + env.refreshTokenDays * 24 * 60 * 60 * 1000) }

export function createAccessToken(userId: string, businessId: string, role: MembershipRole) {
  return jwt.sign({ businessId, role } satisfies AccessClaims, env.jwtAccessSecret, { subject: userId, expiresIn: env.accessTokenTtl as jwt.SignOptions['expiresIn'], issuer: 'reclaim-ai-api' })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtAccessSecret, { issuer: 'reclaim-ai-api' }) as jwt.JwtPayload & AccessClaims
}

export function toSafeUser(user: { id: string; name: string; email: string; createdAt: Date }): SafeUser { return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } }

export async function createSession(prisma: PrismaClient, userId: string) {
  const rawToken = createRefreshToken()
  await prisma.refreshSession.create({ data: { userId, tokenHash: hashRefreshToken(rawToken), expiresAt: refreshExpiry() } })
  return rawToken
}
