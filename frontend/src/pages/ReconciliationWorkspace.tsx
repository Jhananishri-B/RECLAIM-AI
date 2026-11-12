import { useEffect, useState } from 'react'
import { CheckCircle2, LoaderCircle, RefreshCw } from 'lucide-react'
import { apiClient } from '../services/api'
import { StatusBadge } from '../components/StatusBadge'

type Candidate = {
  invoiceId: string
  invoiceNumber: string
  customerName: string
  invoiceDate: string
  dueDate: string
  currency: string
  invoiceStatus: string
  totalAmount: string
  outstandingAmount: string
  existingAllocationAmount: string
  recommendedAllocationAmount: string
  referenceMatch: boolean
  customerMatch: boolean
  amountMatch: boolean
  currencyMatch: boolean
  dateCompatible: boolean
  score: number
  confidence: string
  eligible: boolean
  ineligibleReason: string | null
  explanation: string
}
type ReconciliationCase = {
  paymentId: string
  transactionId: string | null
  customerName: string | null
  payerReference: string | null
  payerEmail: string | null
  paymentDate: string
  amount: string
  allocatedAmount: string
  remainingAmount: string
  currency: string
  status: string
  sourceSystem: string
  description: string | null
  invoiceReference: string | null
  candidates: Candidate[]
}

const formattedAmount = (currency: string, amount: string) => `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const formattedDate = (date: string) => new Date(date).toLocaleDateString()
const candidateKey = (paymentId: string, invoiceId: string) => `${paymentId}:${invoiceId}`

export function ReconciliationWorkspace() {
  const [cases, setCases] = useState<ReconciliationCase[]>([])
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadQueue = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<{ data: ReconciliationCase[] }>('/reconciliation/queue')
      setCases(response.data.data)
      setAmounts(current => {
        const next = { ...current }
        for (const item of response.data.data) {
          for (const candidate of item.candidates) {
            const key = candidateKey(item.paymentId, candidate.invoiceId)
            if (next[key] === undefined) next[key] = candidate.recommendedAllocationAmount
          }
        }
        return next
      })
      setError('')
    } catch {
      setError('Unable to load the reconciliation queue.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadQueue() }, [])

  const confirm = async (item: ReconciliationCase, candidate: Candidate) => {
    const key = candidateKey(item.paymentId, candidate.invoiceId)
    setBusyKey(key)
    setError('')
    setNotice('')
    try {
      await apiClient.post(`/reconciliation/payments/${encodeURIComponent(item.paymentId)}/allocations`, {
        invoiceId: candidate.invoiceId,
        amount: amounts[key] ?? candidate.recommendedAllocationAmount,
      })
      setNotice(`${item.paymentId} allocated to ${candidate.invoiceNumber}.`)
      await loadQueue()
    } catch (requestError) {
      const status = (requestError as { response?: { data?: { error?: { code?: string } } } }).response?.data?.error?.code
      setError(status === 'CURRENCY_MISMATCH'
        ? 'The payment and invoice currencies must match.'
        : status === 'CUSTOMER_MISMATCH'
          ? 'The payer does not match this invoice customer.'
          : 'Unable to confirm this allocation. Refresh the queue and review the remaining balance.')
    } finally {
      setBusyKey(null)
    }
  }

  if (loading && !cases.length) return <div className="reconciliation-state"><LoaderCircle size={17} className="spin" /> Loading reconciliation cases…</div>

  return <div className="reconciliation-workspace">
    <div className="reconciliation-toolbar">
      <div><h2>Payment reconciliation</h2><p>Review deterministic invoice suggestions. Every allocation requires your confirmation.</p></div>
      <button className="button secondary" onClick={() => void loadQueue()} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} />Refresh</button>
    </div>
    {error && <p className="auth-error reconciliation-message" role="alert">{error}</p>}
    {notice && <p className="reconciliation-success" role="status"><CheckCircle2 size={14} />{notice}</p>}
    {!cases.length && !loading && <div className="reconciliation-state">No completed payments are waiting for allocation.</div>}
    <div className="reconciliation-cases">
      {cases.map(item => <article className="reconciliation-case" key={item.paymentId}>
        <header className="reconciliation-payment">
          <div><div className="eyebrow">{item.paymentId} · {item.sourceSystem}</div><h3>{item.customerName || 'Payer not identified'}</h3><p>{formattedDate(item.paymentDate)}{item.transactionId ? ` · ${item.transactionId}` : ''}</p></div>
          <div className="payment-amounts"><span>Payment {formattedAmount(item.currency, item.amount)}</span><b>{formattedAmount(item.currency, item.remainingAmount)} remaining</b><small>{formattedAmount(item.currency, item.allocatedAmount)} allocated</small></div>
        </header>
        {(item.invoiceReference || item.payerReference || item.payerEmail || item.description) && <div className="payment-context">
          {item.invoiceReference && <span>Reference: <b>{item.invoiceReference}</b></span>}
          {item.payerReference && <span>Payer ID: <b>{item.payerReference}</b></span>}
          {item.payerEmail && <span>Payer email: <b>{item.payerEmail}</b></span>}
          {item.description && <span>Note: <b>{item.description}</b></span>}
        </div>}
        <div className="candidate-list">
          {item.candidates.map(candidate => {
            const key = candidateKey(item.paymentId, candidate.invoiceId)
            const tone = candidate.score >= 80 ? 'success' : candidate.score >= 55 ? 'info' : 'warning'
            return <div className="reconciliation-candidate" key={key}>
              <div className="candidate-summary">
                <div><strong>{candidate.invoiceNumber}</strong><span>{candidate.customerName} · due {formattedDate(candidate.dueDate)}</span></div>
                <StatusBadge label={`Rule score ${candidate.score}/100 · ${candidate.confidence}`} tone={tone} />
              </div>
              <div className="candidate-details">
                <span>Open balance <b>{formattedAmount(candidate.currency, candidate.outstandingAmount)}</b></span>
                <span>Signals <b>{[
                  candidate.referenceMatch && 'reference',
                  candidate.customerMatch && 'payer',
                  candidate.amountMatch && 'exact amount',
                  candidate.currencyMatch && 'currency',
                  candidate.dateCompatible && 'date',
                ].filter(Boolean).join(' · ') || 'none'}</b></span>
                <p>{candidate.explanation}</p>
              </div>
              {candidate.eligible ? <div className="candidate-action">
                <label>Target allocation from this payment<input aria-label={`Allocation target for ${candidate.invoiceNumber}`} type="number" min={candidate.existingAllocationAmount} max={candidate.recommendedAllocationAmount} step="0.01" value={amounts[key] ?? candidate.recommendedAllocationAmount} onChange={event => setAmounts(current => ({ ...current, [key]: event.target.value }))} /></label>
                <button className="button primary" disabled={busyKey === key || !amounts[key] || Number(amounts[key]) <= Number(candidate.existingAllocationAmount) || Number(amounts[key]) > Number(candidate.recommendedAllocationAmount)} onClick={() => void confirm(item, candidate)}>{busyKey === key ? 'Saving…' : 'Confirm allocation'}</button>
              </div> : <div className="candidate-blocked">{candidate.ineligibleReason || 'This suggestion needs a different invoice or currency.'}</div>}
            </div>
          })}
          {!item.candidates.length && <div className="no-candidates">No invoice suggestions are available. Check the payment details or load additional invoice records.</div>}
        </div>
      </article>)}
    </div>
  </div>
}
