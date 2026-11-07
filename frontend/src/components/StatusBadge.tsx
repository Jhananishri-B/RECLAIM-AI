export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'success' | 'warning' | 'info' | 'neutral' }) {
  return <span className={`status-badge status-${tone}`}><span className="status-dot" />{label}</span>
}
