import 'dotenv/config'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { env } from '../src/config/env.js'

const prisma = new PrismaClient()
const baseUrl = 'http://localhost:4000/api'
const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
const emailA = `phase3-a-${suffix}@example.test`
const emailB = `phase3-b-${suffix}@example.test`
const emailMember = `phase3-member-${suffix}@example.test`
let businessA = ''
let businessB = ''
let customerId = ''

async function call(path: string, options: RequestInit = {}) { return fetch(`${baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }) }
function jsonBody(body: unknown) { return { body: JSON.stringify(body) } }
function bearer(token: string) { return { Authorization: `Bearer ${token}` } }
function cookieFrom(response: Response) { const setCookie = response.headers.get('set-cookie'); assert.ok(setCookie, 'refresh cookie should be set'); return setCookie.split(';')[0] }
async function body(response: Response) { return await response.json() as { success: boolean; data?: any; error?: { code: string } } }

async function main() {
  const registeredA = await call('/auth/register', { method: 'POST', ...jsonBody({ name: 'Phase Three A', email: emailA, password: 'StrongPass!123', businessName: `Phase Three A ${suffix}` }) }); assert.equal(registeredA.status, 201); const a = await body(registeredA); businessA = a.data.business.id
  const duplicate = await call('/auth/register', { method: 'POST', ...jsonBody({ name: 'Duplicate', email: emailA, password: 'StrongPass!123', businessName: 'Duplicate Workspace' }) }); assert.equal(duplicate.status, 409)
  const invalidLogin = await call('/auth/login', { method: 'POST', ...jsonBody({ email: emailA, password: 'wrong-password' }) }); assert.equal(invalidLogin.status, 401)
  const loginA = await call('/auth/login', { method: 'POST', ...jsonBody({ email: emailA, password: 'StrongPass!123' }) }); assert.equal(loginA.status, 200); const loginAData = await body(loginA); const tokenA = loginAData.data.accessToken; const cookieA = cookieFrom(loginA)
  const me = await call('/auth/me', { headers: bearer(tokenA) }); assert.equal(me.status, 200); assert.equal((await body(me)).data.business.id, businessA)
  const registeredB = await call('/auth/register', { method: 'POST', ...jsonBody({ name: 'Phase Three B', email: emailB, password: 'StrongPass!123', businessName: `Phase Three B ${suffix}` }) }); assert.equal(registeredB.status, 201); const b = await body(registeredB); businessB = b.data.business.id
  customerId = `phase3-customer-${suffix}`
  await prisma.customer.create({ data: { id: customerId, businessId: businessA, name: 'Tenant A Customer' } })
  const ownRecord = await call(`/customers/${customerId}`, { headers: bearer(tokenA) }); assert.equal(ownRecord.status, 200)
  const tokenB = b.data.accessToken
  const crossTenant = await call(`/customers/${customerId}`, { headers: bearer(tokenB) }); assert.equal(crossTenant.status, 404)
  const ownerOnly = await call('/business/owner-check', { headers: bearer(tokenA) }); assert.equal(ownerOnly.status, 200)
  const passwordHash = await hash('StrongPass!123', 12)
  const member = await prisma.user.create({ data: { businessId: businessA, name: 'Phase Three Member', email: emailMember, passwordHash } })
  await prisma.businessMembership.create({ data: { userId: member.id, businessId: businessA, role: 'MEMBER' } })
  const memberLogin = await call('/auth/login', { method: 'POST', ...jsonBody({ email: emailMember, password: 'StrongPass!123' }) }); assert.equal(memberLogin.status, 200); const memberToken = (await body(memberLogin)).data.accessToken
  const memberOwnerAttempt = await call('/business/owner-check', { headers: bearer(memberToken) }); assert.equal(memberOwnerAttempt.status, 403)
  const rotated = await call('/auth/refresh', { method: 'POST', headers: { Cookie: cookieA } }); assert.equal(rotated.status, 200); const rotatedCookie = cookieFrom(rotated); const rotatedToken = (await body(rotated)).data.accessToken
  const replay = await call('/auth/refresh', { method: 'POST', headers: { Cookie: cookieA } }); assert.equal(replay.status, 401)
  const logout = await call('/auth/logout', { method: 'POST', headers: { Cookie: rotatedCookie } }); assert.equal(logout.status, 200)
  const afterLogout = await call('/auth/refresh', { method: 'POST', headers: { Cookie: rotatedCookie } }); assert.equal(afterLogout.status, 401)
  const expired = jwt.sign({ businessId: businessA, role: 'OWNER' }, env.jwtAccessSecret, { subject: 'expired-user', issuer: 'reclaim-ai-api', expiresIn: -1 })
  const expiredResponse = await call('/customers', { headers: bearer(expired) }); assert.equal(expiredResponse.status, 401)
  console.log(JSON.stringify({ passed: true, checks: ['registration', 'duplicate registration rejection', 'invalid password rejection', 'login', 'me', 'refresh rotation', 'replay rejection', 'logout revocation', 'access token expiration', 'tenant isolation', 'member role authorization'] }, null, 2))
}

main().catch(error => { console.error('[auth-smoke] failed:', error instanceof Error ? error.message : error); process.exitCode = 1 }).finally(async () => { if (businessA) await prisma.business.delete({ where: { id: businessA } }).catch(() => undefined); if (businessB) await prisma.business.delete({ where: { id: businessB } }).catch(() => undefined); await prisma.$disconnect() })
