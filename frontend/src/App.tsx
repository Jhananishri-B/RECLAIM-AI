import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { OverviewPage } from './pages/OverviewPage'
import { ActivityPage, AIOperationsPage, ReceivablesPage, SettingsPage } from './pages/ProductPages'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import './styles.css'
import './overrides.css'
import './layout-overrides.css'
import './auth.css'

export default function App() { return <BrowserRouter><AuthProvider><Routes><Route element={<PublicRoute />}><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /></Route><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route path="/" element={<OverviewPage />} /><Route path="/receivables" element={<ReceivablesPage />} /><Route path="/ai-operations" element={<AIOperationsPage />} /><Route path="/activity" element={<ActivityPage />} /><Route path="/settings" element={<SettingsPage />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter> }
