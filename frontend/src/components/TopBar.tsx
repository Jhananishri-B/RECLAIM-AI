import { Bell, Menu, Search, Sparkles } from 'lucide-react'
import { useApiHealth } from '../hooks/useApiHealth'

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const apiStatus = useApiHealth()
  return <header className="topbar"><button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><b>Operations</b></div><div className="top-actions"><button className="search-button"><Search size={16} /><span>Search</span><kbd>⌘ K</kbd></button><button className="icon-button" aria-label="Open assistant"><Sparkles size={17} /></button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><i /></button><div className="top-avatar">JD</div></div></header>
}
