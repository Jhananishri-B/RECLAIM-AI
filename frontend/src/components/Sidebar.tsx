import { NavLink } from 'react-router-dom'
import { Activity, Bot, ChevronDown, LayoutDashboard, Settings, WalletCards, X, Wallet } from 'lucide-react'
import type { NavItem } from '../types/navigation'
import { useAuth } from '../context/AuthContext'

const primary: NavItem[] = [
  { label: 'Overview', path: '/', icon: LayoutDashboard }, { label: 'Receivables', path: '/receivables', icon: Wallet }, { label: 'AI Operations', path: '/ai-operations', icon: Bot }, { label: 'Activity', path: '/activity', icon: Activity },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, membership, business } = useAuth()
  const admin = membership?.role === 'OWNER' || membership?.role === 'ADMIN'
  const manager = membership?.role === 'MANAGER'
  const links = (items: NavItem[]) => items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} onClick={onClose} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Icon size={17} /><span>{label}</span></NavLink>)
  return <aside className={`sidebar ${open ? 'open' : ''}`}><div className="brand"><div className="brand-mark"><WalletCards size={18} /></div><span>reclaim<span className="brand-dot">.</span>ai</span><button className="icon-button mobile-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div><button className="workspace-switch"><span className="workspace-avatar">{business?.name?.slice(0,1) || 'A'}</span><span className="workspace-copy"><b>{business?.name || 'Workspace'}</b><small>{manager ? 'Manager workspace' : 'Business workspace'}</small></span><ChevronDown size={15} /></button><nav><div className="nav-label">Workspace</div>{admin && <NavLink to="/admin/dashboard" onClick={onClose} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={17} /><span>Admin dashboard</span></NavLink>}{manager && <NavLink to="/manager/dashboard" onClick={onClose} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={17} /><span>My dashboard</span></NavLink>}{links(primary.filter(item => !manager || ['/receivables','/ai-operations'].includes(item.path)))}</nav><div className="sidebar-bottom"><NavLink to="/settings" onClick={onClose} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Settings size={17} /><span>Settings</span></NavLink><div className="user-card"><div className="user-avatar">{user?.name?.slice(0,2).toUpperCase() || 'JD'}</div><div><b>{user?.name || 'User'}</b><small>{membership?.role || 'Member'}</small></div><span className="online-dot" /></div></div></aside>
}
