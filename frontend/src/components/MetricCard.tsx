import type { LucideIcon } from 'lucide-react'

export function MetricCard({ label, value, delta, icon: Icon, tone = 'violet' }: { label: string; value: string; delta: string; icon: LucideIcon; tone?: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><div className={`metric-icon ${tone}`}><Icon size={16} /></div></div><strong>{value}</strong><small>{delta}</small></article>
}
