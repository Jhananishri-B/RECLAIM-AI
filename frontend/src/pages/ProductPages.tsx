import { Bot, Check, ChevronRight, Clock3, FileSearch, Filter, MoreHorizontal, Search, ShieldCheck, Sparkles, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { PageHeading, PanelHeader } from './OverviewPage'
import { ReconciliationWorkspace } from './ReconciliationWorkspace'
import { apiClient } from '../services/api'

const receivableTabs = ['Invoices', 'Payments', 'Reconciliation', 'Disputes']
const aiTabs = ['Agent Activity', 'Approvals', 'Investigations']
const invoiceRows = [['INV-2048', 'Globex Ltd.', '$12,840.00', 'Mar 12, 2026', 'Overdue 14d', 'warning'], ['INV-2047', 'Northstar Trading', '$4,280.00', 'Mar 18, 2026', 'Due soon', 'info'], ['INV-2046', 'Acme Textiles', '$8,420.00', 'Apr 02, 2026', 'Current', 'success'], ['INV-2045', 'Vertex Components', '$22,100.00', 'Feb 28, 2026', 'Disputed', 'warning']]

export function ReceivablesPage() { const [tab, setTab] = useState('Invoices'); return <div><PageHeading eyebrow="Receivables" title="Receivables workspace" description="Review invoices, payments, reconciliation, and disputes in one place." action="Add invoice" /><PayPalReturnHandler /><div className="tab-bar">{receivableTabs.map(item => <button key={item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item}</button>)}</div><section className="panel workspace-panel">{tab !== 'Reconciliation' && <div className="toolbar"><div className="search-field"><Search size={15} /><input aria-label="Search receivables" placeholder={`Search ${tab.toLowerCase()}...`} /></div><button className="button secondary"><Filter size={14} /> Filters</button><button className="icon-button" aria-label="More actions"><MoreHorizontal size={17} /></button></div>}{tab === 'Invoices' ? <DataTable /> : <WorkspaceTab tab={tab} />}</section></div> }

function PayPalReturnHandler() {
  const [searchParams, setSearchParams] = useSearchParams()
  const started = useRef(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const approved = searchParams.get('paypal') === 'approved'
  const orderId = searchParams.get('token')

  useEffect(() => {
    if (!approved || !orderId || started.current) return
    started.current = true
    void apiClient.post(`/paypal/orders/${encodeURIComponent(orderId)}/capture`)
      .then(() => { setMessage('PayPal payment captured and added to reconciliation for review.') })
      .catch(() => { setFailed(true); setMessage('PayPal returned to the app, but capture could not be confirmed. Check the order and try again.') })
      .finally(() => {
        const next = new URLSearchParams(searchParams)
        next.delete('paypal')
        next.delete('token')
        setSearchParams(next, { replace: true })
      })
  }, [approved, orderId, searchParams, setSearchParams])

  if (!message) return null
  return <p className={failed ? 'auth-error paypal-return-message' : 'paypal-return-success'} role="status">{message}</p>
}

function DataTable() { return <div className="data-table"><div className="table-row table-head"><span>Invoice</span><span>Customer</span><span>Amount</span><span>Due date</span><span>Status</span><span /></div>{invoiceRows.map(row => <div className="table-row" key={row[0]}><span className="item-name"><span className="table-icon info"><FileSearch size={12} /></span>{row[0]}</span><span>{row[1]}</span><strong>{row[2]}</strong><span>{row[3]}</span><StatusBadge label={row[4]} tone={row[5] as 'warning' | 'info' | 'success'} /><button className="icon-button" aria-label={`Open ${row[0]}`}><ChevronRight size={15} /></button></div>)}</div> }
function WorkspaceTab({ tab }: { tab: string }) { return tab === 'Reconciliation' ? <ReconciliationWorkspace /> : <div className="tab-empty"><EmptyState title={`${tab} workspace ready`} description={`Search, filter, and review ${tab.toLowerCase()} records here when data sources are connected.`} /></div> }

export function AIOperationsPage() { const [tab, setTab] = useState('Agent Activity'); return <div><PageHeading eyebrow="AI Operations" title="AI operations" description="Supervise agent activity, approvals, and investigations with clear human control." action="Run analysis" /><div className="agent-grid"><AgentCard icon={Bot} title="Receivables Intelligence" description="Identifies exposure, due-date risk, and collection patterns." status="Operational" tone="success" /><AgentCard icon={Sparkles} title="Collection Strategy" description="Prepares customer-specific next actions for review." status="Ready for approval" tone="info" /><AgentCard icon={TriangleAlert} title="Dispute Evidence" description="Organizes records and evidence for dispute review." status="Idle" tone="neutral" /></div><div className="tab-bar">{aiTabs.map(item => <button key={item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item}</button>)}</div><section className="panel workspace-panel">{tab === 'Investigations' ? <Investigation /> : <AgentTab tab={tab} />}</section></div> }
function AgentCard({ icon: Icon, title, description, status, tone }: { icon: typeof Bot; title: string; description: string; status: string; tone: 'success' | 'info' | 'neutral' }) { return <article className="agent-card"><div className="agent-card-top"><div className="agent-icon"><Icon size={17} /></div><StatusBadge label={status} tone={tone} /></div><h3>{title}</h3><p>{description}</p><button className="text-button">Open agent <ChevronRight size={14} /></button></article> }
function AgentTab({ tab }: { tab: string }) { return <div className="tab-empty"><EmptyState title={`${tab} is clear`} description="No additional agent records require review. Activity and approvals will appear here as the workspace is connected." /></div> }
function Investigation() { return <div className="investigation"><div className="investigation-header"><div><div className="eyebrow"><FileSearch size={13} /> Investigation INV-2048</div><h2>Overdue receivable review</h2><p>Triggered by an invoice crossing its collection threshold.</p></div><StatusBadge label="Pending approval" tone="warning" /></div><div className="investigation-grid"><InfoBlock title="Triggering event" value="Invoice became overdue by 14 days" /><InfoBlock title="Retrieved records" value="Invoice, payment history, customer profile" /><InfoBlock title="Tool execution summary" value="3 read-only lookups completed" /><InfoBlock title="Findings" value="Customer has paid on time in 8 of 9 cycles" /><InfoBlock title="Recommended action" value="Send a gentle reminder with payment link" /><InfoBlock title="Approval status" value="Awaiting Jordan Davis" /></div><div className="approval-actions"><button className="button secondary"><X size={14} /> Dismiss</button><button className="button primary"><Check size={14} /> Approve action</button></div></div> }
function InfoBlock({ title, value }: { title: string; value: string }) { return <div className="info-block"><span>{title}</span><b>{value}</b></div> }

export function ActivityPage() { return <div><PageHeading eyebrow="Activity" title="Activity history" description="A unified audit trail across workspace, receivables, and AI operations." /><section className="panel workspace-panel"><div className="toolbar"><div className="search-field"><Search size={15} /><input aria-label="Search activity" placeholder="Search events..." /></div><button className="button secondary"><Clock3 size={14} /> Date range</button><button className="button secondary"><Filter size={14} /> Event type</button><button className="button secondary">All statuses <span>⌄</span></button></div><div className="data-table"><div className="table-row table-head"><span>Event name</span><span>Type</span><span>Related record</span><span>Timestamp</span><span>Status</span></div>{[['Invoice analyzed', 'Agent', 'INV-2048', 'Today, 10:42 AM', 'Completed', 'success'], ['Payment received', 'Payment', 'PAY-9281', 'Today, 09:18 AM', 'Completed', 'success'], ['Dispute opened', 'Dispute', 'DSP-108', 'Yesterday, 04:32 PM', 'Pending', 'warning'], ['Reminder sequence completed', 'Automation', 'INV-2041', 'Yesterday, 02:10 PM', 'Completed', 'success']].map(row => <div className="table-row" key={row[0]}><span className="item-name">{row[0]}</span><span className="mono-label">{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><StatusBadge label={row[4]} tone={row[5] as 'success' | 'warning'} /></div>)}</div></section></div> }

export function SettingsPage() { const sections = [['Business profile', 'Company identity, address, and default currency.'], ['PayPal connection', 'Connect payment data when integrations are enabled.'], ['Notifications', 'Choose which operational events reach your team.'], ['Agent approval policies', 'Set which AI actions require human approval.'], ['Account management', 'Workspace members, roles, and account controls.']]; return <div><PageHeading eyebrow="Settings" title="Workspace settings" description="Manage your operating preferences and controls." /><div className="settings-list">{sections.map(([title, description], index) => title === 'Account management' ? <Link className="settings-row panel" key={title} to="/settings/users"><div className="settings-number">0{index + 1}</div><div><h2>{title}</h2><p>{description}</p></div><ChevronRight size={17} /></Link> : title === 'PayPal connection' ? <PayPalSettingsRow key={title} index={index + 1} /> : <button className="settings-row panel" key={title}><div className="settings-number">0{index + 1}</div><div><h2>{title}</h2><p>{description}</p></div><ChevronRight size={17} /></button>)}</div></div> }

function PayPalSettingsRow({ index }: { index: number }) {
  const [connection, setConnection] = useState<{ configured: boolean; connected: boolean; webhookConfigured: boolean; mode: string } | null>(null)
  useEffect(() => {
    apiClient.get<{ data: typeof connection }>('/paypal/connection')
      .then(response => setConnection(response.data.data))
      .catch(() => setConnection(null))
  }, [])
  const status = connection?.connected ? 'Connected' : connection?.configured === false ? 'Not configured' : 'Checking connection'
  const details = connection?.connected
    ? `PayPal ${connection.mode} is connected. Webhook ${connection.webhookConfigured ? 'is configured' : 'setup is still required'}.`
    : connection?.configured === false
      ? 'Add the PayPal app credentials and webhook ID to the backend environment.'
      : 'Checking server-side PayPal credentials.'
  return <div className="settings-row panel paypal-settings-row"><div className="settings-number">0{index}</div><div><h2>PayPal connection</h2><p>{details}</p></div><StatusBadge label={status} tone={connection?.connected ? 'success' : connection?.configured === false ? 'warning' : 'neutral'} /></div>
}
