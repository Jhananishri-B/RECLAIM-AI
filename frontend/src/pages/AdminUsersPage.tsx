import { useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronDown, LoaderCircle, UserPlus, X } from 'lucide-react'
import { apiClient } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { PageHeading } from './OverviewPage'

type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER'
type AccountStatus = 'ACTIVE' | 'INACTIVE'
type AdminUser = { id: string; name: string; email: string; role: Role; accountStatus: AccountStatus }
type AssignmentData = {
  customers: Array<{ id: string; name: string }>
  invoices: Array<{ id: string; invoiceNumber: string; customer: string }>
  customerIds: string[]
  invoiceIds: string[]
}
type NewUser = { name: string; email: string; password: string; role: Exclude<Role, 'OWNER'> }
const emptyUser: NewUser = { name: '', email: '', password: '', role: 'MANAGER' }

export function AdminUsersPage() {
  const { user: currentUser, membership } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState<NewUser>(emptyUser)
  const [creating, setCreating] = useState(false)
  const [busyUser, setBusyUser] = useState<string | null>(null)
  const [assignmentUser, setAssignmentUser] = useState<AdminUser | null>(null)
  const [assignments, setAssignments] = useState<AssignmentData | null>(null)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [savingAssignments, setSavingAssignments] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<{ data: AdminUser[] }>('/admin/users')
      setUsers(response.data.data)
      setError('')
    } catch {
      setError('Unable to load business users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadUsers() }, [])

  const createUser = async (event: FormEvent) => {
    event.preventDefault()
    setCreating(true)
    setError('')
    try {
      await apiClient.post('/admin/users', newUser)
      setNewUser(emptyUser)
      setShowCreate(false)
      setNotice('User created. They will be asked to change their password at first sign-in.')
      await loadUsers()
    } catch {
      setError('Unable to create the user. Check the details and make sure the email is not already in use.')
    } finally {
      setCreating(false)
    }
  }

  const updateRole = async (id: string, role: Exclude<Role, 'OWNER'>) => {
    setBusyUser(id)
    setError('')
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role })
      setNotice('User role updated.')
      await loadUsers()
    } catch {
      setError('Unable to update this role.')
    } finally {
      setBusyUser(null)
    }
  }

  const updateStatus = async (person: AdminUser) => {
    const status: AccountStatus = person.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setBusyUser(person.id)
    setError('')
    try {
      await apiClient.patch(`/admin/users/${person.id}/status`, { status })
      setNotice(status === 'ACTIVE' ? 'Account reactivated.' : 'Account deactivated and active sessions revoked.')
      await loadUsers()
    } catch {
      setError('Unable to update this account status.')
    } finally {
      setBusyUser(null)
    }
  }

  const openAssignments = async (person: AdminUser) => {
    setAssignmentUser(person)
    setAssignments(null)
    setLoadingAssignments(true)
    setError('')
    try {
      const response = await apiClient.get<{ data: AssignmentData }>(`/admin/assignments/${person.id}`)
      setAssignments(response.data.data)
    } catch {
      setError('Unable to load manager assignments.')
      setAssignmentUser(null)
    } finally {
      setLoadingAssignments(false)
    }
  }

  const saveAssignments = async () => {
    if (!assignmentUser || !assignments) return
    setSavingAssignments(true)
    setError('')
    try {
      await apiClient.patch('/admin/assignments', {
        userId: assignmentUser.id,
        customerIds: assignments.customerIds,
        invoiceIds: assignments.invoiceIds,
      })
      setNotice(`Coverage updated for ${assignmentUser.name}.`)
      setAssignmentUser(null)
      setAssignments(null)
    } catch {
      setError('Unable to save manager assignments.')
    } finally {
      setSavingAssignments(false)
    }
  }

  const toggleAssignment = (kind: 'customerIds' | 'invoiceIds', id: string) => {
    setAssignments(current => {
      if (!current) return current
      const values = current[kind]
      return { ...current, [kind]: values.includes(id) ? values.filter(value => value !== id) : [...values, id] }
    })
  }

  const owner = membership?.role === 'OWNER'

  return <div className="dashboard">
    <PageHeading eyebrow="Settings" title="User management" description="Create business users, manage access, and assign manager coverage." />
    <section className="panel">
      <div className="panel-header">
        <div><h2>Business users</h2><p>Role and account changes are recorded in the activity log.</p></div>
        <button className="button primary" onClick={() => { setShowCreate(value => !value); setNotice('') }}><UserPlus size={15} />{showCreate ? 'Close form' : 'Add user'}</button>
      </div>
      {error && <p className="auth-error admin-message" role="alert">{error}</p>}
      {notice && <p className="admin-success" role="status">{notice}</p>}

      {showCreate && <form className="admin-form" onSubmit={createUser}>
        <label><span>Name</span><input required minLength={2} maxLength={200} value={newUser.name} onChange={event => setNewUser({ ...newUser, name: event.target.value })} /></label>
        <label><span>Email</span><input required type="email" value={newUser.email} onChange={event => setNewUser({ ...newUser, email: event.target.value })} /></label>
        <label><span>Temporary password</span><input required type="password" minLength={8} maxLength={128} value={newUser.password} onChange={event => setNewUser({ ...newUser, password: event.target.value })} /></label>
        <label><span>Role</span><select value={newUser.role} onChange={event => setNewUser({ ...newUser, role: event.target.value as NewUser['role'] })}><option value="MANAGER">Manager</option><option value="MEMBER">Member</option>{owner && <option value="ADMIN">Admin</option>}</select></label>
        <div className="admin-form-actions"><button type="button" className="button secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="button primary" disabled={creating}>{creating ? 'Creating…' : 'Create user'}</button></div>
      </form>}

      {loading ? <div className="admin-loading"><LoaderCircle size={16} className="spin" /> Loading users…</div> : <div className="admin-list">
        {users.map(person => {
          const canEditAdmin = owner || person.role !== 'ADMIN'
          const canChangeStatus = person.role !== 'OWNER' && person.id !== currentUser?.id && canEditAdmin
          return <div className="admin-user-item" key={person.id}>
            <div className="admin-row">
              <span><b>{person.name}</b><br /><small>{person.email}</small></span>
              <select aria-label={`Role for ${person.name}`} value={person.role} disabled={person.role === 'OWNER' || person.id === currentUser?.id || !canEditAdmin || busyUser === person.id} onChange={event => void updateRole(person.id, event.target.value as Exclude<Role, 'OWNER'>)}>
                {person.role === 'OWNER' && <option value="OWNER">Owner</option>}
                {(owner || person.role === 'ADMIN') && <option value="ADMIN">Admin</option>}
                <option value="MANAGER">Manager</option><option value="MEMBER">Member</option>
              </select>
              <strong className={person.accountStatus === 'ACTIVE' ? 'account-active' : 'account-inactive'}>{person.accountStatus}</strong>
              <div className="admin-user-actions">
                {person.role === 'MANAGER' && <button className="button secondary compact-button" onClick={() => void openAssignments(person)}><ChevronDown size={13} /> Coverage</button>}
                {canChangeStatus && <button className="button secondary compact-button" disabled={busyUser === person.id} onClick={() => void updateStatus(person)}>{person.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</button>}
              </div>
            </div>
            {assignmentUser?.id === person.id && <div className="assignment-panel">
              <div className="assignment-heading"><div><h3>Coverage for {person.name}</h3><p>Customer assignments include all of that customer’s invoices. You can add individual invoices too.</p></div><button className="icon-button" aria-label="Close coverage editor" onClick={() => { setAssignmentUser(null); setAssignments(null) }}><X size={16} /></button></div>
              {loadingAssignments || !assignments ? <div className="admin-loading"><LoaderCircle size={16} className="spin" /> Loading coverage…</div> : <>
                <div className="assignment-groups">
                  <fieldset><legend>Customers</legend>{assignments.customers.map(customer => <label className="assignment-option" key={customer.id}><input type="checkbox" checked={assignments.customerIds.includes(customer.id)} onChange={() => toggleAssignment('customerIds', customer.id)} /><span>{customer.name}</span></label>)}</fieldset>
                  <fieldset><legend>Individual invoices</legend>{assignments.invoices.map(invoice => <label className="assignment-option" key={invoice.id}><input type="checkbox" checked={assignments.invoiceIds.includes(invoice.id)} onChange={() => toggleAssignment('invoiceIds', invoice.id)} /><span>{invoice.customer} · {invoice.invoiceNumber}</span></label>)}</fieldset>
                </div>
                <div className="admin-form-actions"><button className="button secondary" onClick={() => { setAssignmentUser(null); setAssignments(null) }}>Cancel</button><button className="button primary" disabled={savingAssignments} onClick={() => void saveAssignments()}><Check size={14} />{savingAssignments ? 'Saving…' : 'Save coverage'}</button></div>
              </>}
            </div>}
          </div>
        })}
        {!users.length && <p className="admin-note">No business users found.</p>}
      </div>}
    </section>
  </div>
}
