import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function connectDatabase() { await prisma.$connect() }
export async function disconnectDatabase() { await prisma.$disconnect() }

export async function checkDatabaseHealth() {
  const startedAt = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'operational' as const, latencyMs: Date.now() - startedAt }
  } catch (error) {
    console.error('[database] health check failed', error instanceof Error ? error.message : error)
    return { status: 'unavailable' as const, latencyMs: Date.now() - startedAt }
  }
}
