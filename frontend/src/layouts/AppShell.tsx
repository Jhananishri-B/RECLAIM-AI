import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'

export function AppShell() { const [open, setOpen] = useState(false); return <div className="app-shell"><Sidebar open={open} onClose={() => setOpen(false)} /><div className="app-main"><TopBar onMenu={() => setOpen(true)} /><main className="page-content"><Outlet /></main></div>{open && <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}</div> }
