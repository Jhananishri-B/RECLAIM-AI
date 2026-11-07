import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiClient, setAccessToken } from '../services/api'
import type { AuthData, AuthUser, Business, Membership } from '../types/auth'

type AuthContextValue = { user: AuthUser | null; business: Business | null; membership: Membership | null; loading: boolean; login: (email: string, password: string) => Promise<void>; register: (input: { name: string; email: string; password: string; businessName: string; businessEmail?: string }) => Promise<void>; logout: () => Promise<void> }
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)
  const applyAuth = (data: AuthData) => { if (data.accessToken) setAccessToken(data.accessToken); setUser(data.user); setBusiness(data.business); setMembership(data.membership) }
  useEffect(() => { apiClient.get<{ data: Omit<AuthData, 'accessToken'> }>('/auth/me').then(response => applyAuth(response.data.data as AuthData)).catch(() => setAccessToken(null)).finally(() => setLoading(false)) }, [])
  const value = useMemo<AuthContextValue>(() => ({ user, business, membership, loading, login: async (email, password) => { const response = await apiClient.post<{ data: AuthData }>('/auth/login', { email, password }); applyAuth(response.data.data) }, register: async input => { const response = await apiClient.post<{ data: AuthData }>('/auth/register', input); applyAuth(response.data.data) }, logout: async () => { try { await apiClient.post('/auth/logout') } finally { setAccessToken(null); setUser(null); setBusiness(null); setMembership(null) } } }), [user, business, membership, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context }
