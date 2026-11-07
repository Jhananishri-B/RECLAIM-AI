import { Activity, Bot, CircleDollarSign, FileText, GitCompare, Settings, ShieldCheck, TriangleAlert } from 'lucide-react'
import { PlaceholderPage } from './PlaceholderPage'
export const Invoices = () => <PlaceholderPage title="Invoices" description="Track invoice status, due dates, and collection progress." icon={FileText} />
export const Payments = () => <PlaceholderPage title="Payments" description="Monitor incoming payments across your customer portfolio." icon={CircleDollarSign} />
export const Reconciliation = () => <PlaceholderPage title="Reconciliation" description="Keep payment records and receivables aligned in one place." icon={GitCompare} />
export const AIWorkspace = () => <PlaceholderPage title="AI Workspace" description="A focused space for intelligent receivables operations." icon={Bot} />
export const Approvals = () => <PlaceholderPage title="Approvals" description="Review decisions and actions that require your sign-off." icon={ShieldCheck} />
export const Disputes = () => <PlaceholderPage title="Disputes" description="Organize open customer disputes and resolution progress." icon={TriangleAlert} />
export const ActivityHistory = () => <PlaceholderPage title="Activity History" description="A clear audit trail of activity across your workspace." icon={Activity} />
export const SettingsPage = () => <PlaceholderPage title="Settings" description="Configure your workspace and operational preferences." icon={Settings} />
