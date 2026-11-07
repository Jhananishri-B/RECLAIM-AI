import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from './LoadingState'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <div className="auth-loading"><LoadingState label="Restoring session" /></div>; return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} /> }
export function PublicRoute() { const { user, loading } = useAuth(); if (loading) return <div className="auth-loading"><LoadingState label="Loading" /></div>; return user ? <Navigate to="/" replace /> : <Outlet /> }
