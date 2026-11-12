import { useEffect, useState } from 'react'
import { AlertTriangle, CircleDollarSign, FileText, ListTodo, Users, Wallet, type LucideIcon } from 'lucide-react'
import { apiClient } from '../services/api'
import { PageHeading } from './OverviewPage'

type Summary = { assignedInvoices: number; assignedCustomers: number; outstanding: Record<string, string>; overdueInvoices: number }
type Invoice = { invoiceNumber: string; customer: string; outstanding: string; currency: string; status: string }
type Payment = { id: string; paymentDate: string; amount: string; currency: string; customer: { name: string } | null }
type Task = { id: string; relatedType: string; relatedId: string; actionType: string; priority: string; status: string; reason: string }
const amount = (values: Record<string, string>) => Object.entries(values).map(([currency, value]) => `${currency} ${Number(value).toLocaleString()}`).join(' · ') || '0'

export function ManagerDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get<{ data: Summary }>('/manager/dashboard/summary'),
      apiClient.get<{ data: Invoice[] }>('/manager/dashboard/invoices'),
      apiClient.get<{ data: Payment[] }>('/manager/dashboard/payments'),
      apiClient.get<{ data: Task[] }>('/manager/dashboard/tasks'),
    ]).then(([summaryResponse, invoiceResponse, paymentResponse, taskResponse]) => {
      setSummary(summaryResponse.data.data)
      setInvoices(invoiceResponse.data.data)
      setPayments(paymentResponse.data.data)
      setTasks(taskResponse.data.data)
    }).catch(() => setError('Unable to load your assigned work. Please try again.')).finally(() => setLoading(false))
  }, [])

  return <div className="dashboard">
    <PageHeading eyebrow="Manager workspace" title="Assigned operations" description="Customers, invoices, payments, and tasks assigned to you." />
    {error && <div className="panel error-state" role="alert">{error}</div>}
    <div className="metrics-grid">
      <Metric label="Assigned invoices" value={summary?.assignedInvoices ?? (loading ? '…' : '0')} icon={FileText} />
      <Metric label="Assigned customers" value={summary?.assignedCustomers ?? (loading ? '…' : '0')} icon={Users} />
      <Metric label="Assigned balance" value={summary ? amount(summary.outstanding) : (loading ? 'Loading…' : '0')} icon={Wallet} />
      <Metric label="Overdue invoices" value={summary?.overdueInvoices ?? (loading ? '…' : '0')} icon={AlertTriangle} />
    </div>
    <section className="panel manager-panel">
      <div className="panel-header"><div><h2>Assigned invoices</h2><p>Open balances for your customer coverage</p></div></div>
      <div className="admin-list">
        {invoices.map(invoice => <div className="admin-row" key={invoice.invoiceNumber}><span>{invoice.customer} · {invoice.invoiceNumber}</span><b>{invoice.status}</b><strong>{invoice.currency} {Number(invoice.outstanding).toLocaleString()}</strong></div>)}
        {!loading && !invoices.length && <p className="admin-note">No invoices are assigned to you yet.</p>}
      </div>
    </section>
    <div className="dashboard-grid manager-details-grid">
      <section className="panel">
        <div className="panel-header"><div><h2>Payments on your invoices</h2><p>Amounts allocated to your assigned invoices</p></div><CircleDollarSign size={17} /></div>
        <div className="admin-list">
          {payments.map(payment => <div className="admin-row manager-item-row" key={payment.id}><span>{payment.customer?.name || 'Unknown customer'}<br /><small>{new Date(payment.paymentDate).toLocaleDateString()}</small></span><strong>{payment.currency} {Number(payment.amount).toLocaleString()}</strong></div>)}
          {!loading && !payments.length && <p className="admin-note">No completed payments are allocated to your invoices.</p>}
        </div>
      </section>
      <section className="panel">
        <div className="panel-header"><div><h2>Assigned tasks</h2><p>Follow-ups linked to your work</p></div><ListTodo size={17} /></div>
        <div className="admin-list">
          {tasks.map(task => <article className="manager-task" key={task.id}><div><b>{task.actionType.replace(/_/g, ' ')}</b><span className="task-meta">{task.priority} · {task.status} · {task.relatedType} {task.relatedId}</span></div><p>{task.reason}</p></article>)}
          {!loading && !tasks.length && <p className="admin-note">No tasks are waiting for you.</p>}
        </div>
      </section>
    </div>
  </div>
}

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={15} /></span></div><strong>{value}</strong></div>
}
