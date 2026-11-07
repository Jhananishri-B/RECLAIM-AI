import { NavLink } from 'react-router-dom'
import { Activity, Bot, ChevronDown, LayoutDashboard, Settings, WalletCards, X, Wallet } from 'lucide-react'
import type { NavItem } from '../types/navigation'

const primary: NavItem[] = [
  { label: 'Overview', path: '/', icon: LayoutDashboard }, { label: 'Receivables', path: '/receivables', icon: Wallet }, { label: 'AI Operations', path: '/ai-operations', icon: Bot }, { label: 'Activity', path: '/activity', icon: Activity },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const links = (items: NavItem[]) => items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} onClick={onClose} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Icon size={17} /><span>{label}</span></NavLink>)
  return <aside className={`sidebar ${open ? 'open' : ''}`}><div className="brand"><div className="brand-mark"><WalletCards size={18} /></div><span>reclaim<span className="brand-dot">.</span>ai</span><button className="icon-button mobile-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div><button className="workspace-switch"><span className="workspace-avatar">A</span><span className="workspace-copy"><b>Acme Exports</b><small>Operations workspace</small></span><ChevronDown size={15} /></button><nav><div className="nav-label">Workspace</div>{links(primary)}</nav><div className="sidebar-bottom"><NavLink to="/settings" onClick={onClose} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Settings size={17} /><span>Settings</span></NavLink><div className="user-card"><div className="user-avatar">JD</div><div><b>Jordan Davis</b><small>Admin</small></div><span className="online-dot" /></div></div></aside>
}
