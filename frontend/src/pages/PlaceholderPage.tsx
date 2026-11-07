import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Clock3 } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'

export function PlaceholderPage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return <div className="placeholder-page"><div className="page-heading"><div><div className="eyebrow"><Icon size={13} /> Module</div><h1>{title}</h1><p>{description}</p></div><button className="button secondary"><Clock3 size={15} /> Phase 1 foundation</button></div><section className="placeholder-panel panel"><div className="panel-header"><div><h2>Workspace ready</h2><p>This module is wired into navigation and ready for its next phase.</p></div><span className="panel-status"> <span className="status-dot" /> Operational</span></div><EmptyState title={`No ${title.toLowerCase()} yet`} description="Connect your data sources in a later phase to start seeing activity here." /><div className="panel-footer"><span>Module status</span><button className="text-button">View roadmap <ArrowUpRight size={14} /></button></div></section></div>
}
