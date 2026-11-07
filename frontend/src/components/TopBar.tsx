import { Bell, Menu, Search, Sparkles } from 'lucide-react'
import { useApiHealth } from '../hooks/useApiHealth'
import { useAuth } from '../context/AuthContext'

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const apiStatus = useApiHealth()
  const { user, business, logout } = useAuth()
  return <header className="topbar"><button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>{business?.name || 'Workspace'}</span><span className="crumb-separator">/</span><b>Operations</b></div><div className="top-actions"><button className="search-button"><Search size={16} /><span>Search</span><kbd>⌘ K</kbd></button><button className="icon-button" aria-label="Open assistant"><Sparkles size={17} /></button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><i /></button><button className="top-avatar" onClick={() => void logout()} title="Sign out" aria-label={`Sign out ${user?.name || 'user'}`}>{user?.name?.slice(0, 2).toUpperCase() || 'JD'}</button></div></header>
}
