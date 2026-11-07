export type AuthUser = { id: string; name: string; email: string; createdAt: string }
export type Business = { id: string; name: string; businessEmail: string; createdAt: string; updatedAt: string }
export type Membership = { role: 'OWNER' | 'ADMIN' | 'MEMBER' }
export type AuthData = { accessToken: string; user: AuthUser; business: Business; membership: Membership; businesses?: Array<Business & Membership> }
