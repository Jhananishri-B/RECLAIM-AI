export type AuthUser = { id: string; name: string; email: string; createdAt: string; accountStatus: string; mustChangePassword: boolean }
export type Business = { id: string; name: string; businessEmail: string; createdAt: string; updatedAt: string }
export type Membership = { role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' }
export type AuthData = { accessToken: string; user: AuthUser; business: Business; membership: Membership; businesses?: Array<Business & Membership> }
