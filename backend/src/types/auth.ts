import type { MembershipRole } from '@prisma/client'

export type AuthContext = { userId: string; businessId: string; role: MembershipRole }

declare global {
  namespace Express {
    interface Request { auth?: AuthContext }
  }
}

export {}
