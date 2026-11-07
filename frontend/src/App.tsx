import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { OverviewPage } from './pages/OverviewPage'
import { ActivityPage, AIOperationsPage, ReceivablesPage, SettingsPage } from './pages/ProductPages'
import './styles.css'
import './overrides.css'
import './layout-overrides.css'

export default function App() { return <BrowserRouter><Routes><Route element={<AppShell />}><Route path="/" element={<OverviewPage />} /><Route path="/receivables" element={<ReceivablesPage />} /><Route path="/ai-operations" element={<AIOperationsPage />} /><Route path="/activity" element={<ActivityPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></BrowserRouter> }
