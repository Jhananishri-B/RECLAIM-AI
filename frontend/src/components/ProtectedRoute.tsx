import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from './LoadingState'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() { const { user, membership, loading } = useAuth(); const location = useLocation(); if (loading) return <div className="auth-loading"><LoadingState label="Restoring session" /></div>; if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />; if (user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />; return <Outlet /> }
export function PublicRoute() { const { user, membership, loading } = useAuth(); if (loading) return <div className="auth-loading"><LoadingState label="Loading" /></div>; if (!user) return <Outlet />; if (user.mustChangePassword) return <Navigate to="/change-password" replace />; return <Navigate to={membership?.role === 'MANAGER' ? '/manager/dashboard' : '/admin/dashboard'} replace /> }
export function RoleRoute({ roles }: { roles: Array<'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER'> }) { const { membership } = useAuth(); return membership && roles.includes(membership.role) ? <Outlet /> : <Navigate to="/" replace /> }
