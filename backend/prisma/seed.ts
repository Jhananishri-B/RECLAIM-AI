import 'dotenv/config'
import { parse } from 'csv-parse/sync'
import { Prisma, PrismaClient } from '@prisma/client'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const prisma = new PrismaClient()
const datasetRoot = resolve(process.cwd(), '..', 'data', 'reclaim_ai_dataset')
const businessId = 'dataset-business'
const userId = 'dataset-import-user'

type Row = Record<string, string>
const nullable = (value: string | undefined) => value === undefined || value.trim() === '' ? null : value.trim()
const dateOnly = (value: string | undefined) => { const parsed = nullable(value); return parsed ? new Date(`${parsed}T00:00:00.000Z`) : null }
const timestamp = (value: string | undefined) => { const parsed = nullable(value); return parsed ? new Date(parsed) : null }
const decimal = (value: string | undefined) => new Prisma.Decimal(value?.trim() || '0')
const bool = (value: string | undefined) => value?.trim().toUpperCase() === 'YES' || value?.trim() === '1'
const readCsv = (fileName: string) => {
  const filePath = resolve(datasetRoot, fileName)
  if (!existsSync(filePath)) throw new Error(`Dataset file not found: ${filePath}`)
  return parse(readFileSync(filePath, 'utf8'), { columns: true, skip_empty_lines: true, bom: true, relax_quotes: true }) as Row[]
}
const count = (counts: Record<string, number>, name: string) => { counts[name] = (counts[name] ?? 0) + 1 }

async function main() {
  if (!existsSync(datasetRoot)) throw new Error(`Dataset directory not found: ${datasetRoot}`)
  const counts: Record<string, number> = {}
  await prisma.business.upsert({ where: { id: businessId }, update: {}, create: { id: businessId, name: 'RECLAIM AI Dataset Workspace', businessEmail: 'dataset-import@reclaim.local', defaultCurrency: 'USD' } })
  await prisma.user.upsert({ where: { id: userId }, update: { name: 'Dataset Import' }, create: { id: userId, businessId, name: 'Dataset Import', email: 'dataset-import@reclaim.local', passwordHash: '$2b$12$00000000000000000000000000000000000000000000000000000', displayName: 'Dataset Import', role: 'SYSTEM' } })
  await prisma.businessMembership.upsert({ where: { userId_businessId: { userId, businessId } }, update: { role: 'OWNER' }, create: { userId, businessId, role: 'OWNER' } })

  for (const row of readCsv('customers.csv')) {
    await prisma.customer.upsert({ where: { id: row.customer_id }, update: { name: row.customer_name, legalName: nullable(row.legal_name), email: nullable(row.email), country: nullable(row.country), countryCode: nullable(row.country_code), customerReference: nullable(row.customer_reference), paypalPayerReference: nullable(row.paypal_payer_reference), paymentTermsDays: nullable(row.payment_terms_days) ? Number(row.payment_terms_days) : null, riskSegment: nullable(row.risk_segment) }, create: { id: row.customer_id, businessId, name: row.customer_name, legalName: nullable(row.legal_name), email: nullable(row.email), country: nullable(row.country), countryCode: nullable(row.country_code), customerReference: nullable(row.customer_reference), paypalPayerReference: nullable(row.paypal_payer_reference), paymentTermsDays: nullable(row.payment_terms_days) ? Number(row.payment_terms_days) : null, riskSegment: nullable(row.risk_segment) } })
    count(counts, 'customers')
  }

  for (const row of readCsv('invoices.csv')) {
    await prisma.invoice.upsert({ where: { id: row.invoice_id }, update: { customerId: row.customer_id, invoiceNumber: row.invoice_number, purchaseOrderReference: nullable(row.purchase_order_id), externalInvoiceReference: nullable(row.external_invoice_reference), invoiceDate: dateOnly(row.invoice_date)!, dueDate: dateOnly(row.due_date)!, totalAmount: decimal(row.total_amount), currency: row.currency, status: row.invoice_status, sourceSystem: row.source_system, paypalInvoiceId: nullable(row.paypal_invoice_id), description: nullable(row.description), paidAmount: decimal(row.paid_amount), outstandingAmount: decimal(row.outstanding_amount) }, create: { id: row.invoice_id, businessId, customerId: row.customer_id, invoiceNumber: row.invoice_number, purchaseOrderReference: nullable(row.purchase_order_id), externalInvoiceReference: nullable(row.external_invoice_reference), invoiceDate: dateOnly(row.invoice_date)!, dueDate: dateOnly(row.due_date)!, totalAmount: decimal(row.total_amount), currency: row.currency, status: row.invoice_status, sourceSystem: row.source_system, paypalInvoiceId: nullable(row.paypal_invoice_id), description: nullable(row.description), paidAmount: decimal(row.paid_amount), outstandingAmount: decimal(row.outstanding_amount) } })
    count(counts, 'invoices')
  }

  for (const row of readCsv('purchase_orders.csv')) {
    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { businessId_invoiceNumber: { businessId, invoiceNumber: row.invoice_number } } })
    await prisma.purchaseOrder.upsert({ where: { id: row.purchase_order_id }, update: { customerId: row.customer_id, invoiceId: invoice.id, poNumber: row.po_number, poDate: dateOnly(row.po_date)!, amount: decimal(row.po_amount), currency: row.currency, status: row.po_status }, create: { id: row.purchase_order_id, businessId, customerId: row.customer_id, invoiceId: invoice.id, poNumber: row.po_number, poDate: dateOnly(row.po_date)!, amount: decimal(row.po_amount), currency: row.currency, status: row.po_status } })
    count(counts, 'purchaseOrders')
  }

  for (const row of readCsv('payments.csv')) {
    await prisma.payment.upsert({ where: { id: row.payment_id }, update: { customerId: nullable(row.customer_id), paypalTransactionId: nullable(row.paypal_transaction_id), payerReference: nullable(row.payer_reference), payerEmail: nullable(row.payer_email), paymentDate: dateOnly(row.payment_date)!, amount: decimal(row.amount), currency: row.currency, status: row.payment_status, invoiceReference: nullable(row.invoice_reference), description: nullable(row.payment_description), sourceSystem: row.source_system, scenario: nullable(row.scenario) }, create: { id: row.payment_id, businessId, customerId: nullable(row.customer_id), paypalTransactionId: nullable(row.paypal_transaction_id), payerReference: nullable(row.payer_reference), payerEmail: nullable(row.payer_email), paymentDate: dateOnly(row.payment_date)!, amount: decimal(row.amount), currency: row.currency, status: row.payment_status, invoiceReference: nullable(row.invoice_reference), description: nullable(row.payment_description), sourceSystem: row.source_system, scenario: nullable(row.scenario) } })
    count(counts, 'payments')
  }

  for (const row of readCsv('matching_cases.csv')) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: row.payment_id } })
    const invoice = nullable(row.candidate_invoice_number) ? await prisma.invoice.findUnique({ where: { businessId_invoiceNumber: { businessId, invoiceNumber: row.candidate_invoice_number } } }) : null
    await prisma.matchingCase.upsert({ where: { id: row.case_id }, update: { paymentId: payment.id, investigationStatus: 'OPEN', outcome: row.expected_decision }, create: { id: row.case_id, businessId, paymentId: payment.id, investigationStatus: 'OPEN', outcome: row.expected_decision } })
    await prisma.matchingCandidate.upsert({ where: { id: `${row.case_id}-candidate` }, update: { invoiceId: invoice?.id ?? null, signals: { customerMatch: row.customer_match === '1', referenceMatch: row.reference_match === '1', amountMatch: row.amount_match === '1', currencyMatch: row.currency_match === '1', dateCompatible: row.date_compatible === '1' }, score: Number(row.illustrative_score), explanation: row.reason, reviewStatus: row.expected_decision.includes('MATCH') ? 'CONFIRMED' : 'PENDING', expectedDecision: row.expected_decision }, create: { id: `${row.case_id}-candidate`, matchingCaseId: row.case_id, invoiceId: invoice?.id ?? null, signals: { customerMatch: row.customer_match === '1', referenceMatch: row.reference_match === '1', amountMatch: row.amount_match === '1', currencyMatch: row.currency_match === '1', dateCompatible: row.date_compatible === '1' }, score: Number(row.illustrative_score), explanation: row.reason, reviewStatus: row.expected_decision.includes('MATCH') ? 'CONFIRMED' : 'PENDING', expectedDecision: row.expected_decision } })
    count(counts, 'matchingCases')
  }

  const allocationTotals = new Map<string, Prisma.Decimal>()
  for (const row of readCsv('payment_allocations.csv')) {
    if (row.allocation_status.toUpperCase() !== 'CONFIRMED') continue
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: row.payment_id } })
    if (payment.status.toUpperCase() !== 'COMPLETED') throw new Error(`Allocation ${row.allocation_id} references non-completed payment ${row.payment_id}`)
    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { businessId_invoiceNumber: { businessId, invoiceNumber: row.invoice_number } } })
    const next = (allocationTotals.get(row.payment_id) ?? new Prisma.Decimal(0)).add(decimal(row.allocated_amount))
    if (next.gt(payment.amount)) throw new Error(`Allocations exceed payment amount for ${row.payment_id}`)
    allocationTotals.set(row.payment_id, next)
    await prisma.paymentAllocation.upsert({ where: { id: row.allocation_id }, update: { paymentId: payment.id, invoiceId: invoice.id, reviewedById: row.reviewed_by?.toUpperCase() === 'SYSTEM' ? userId : null, amount: decimal(row.allocated_amount), currency: row.currency, status: 'CONFIRMED', matchingMethod: nullable(row.matching_method) }, create: { id: row.allocation_id, paymentId: payment.id, invoiceId: invoice.id, reviewedById: row.reviewed_by?.toUpperCase() === 'SYSTEM' ? userId : null, amount: decimal(row.allocated_amount), currency: row.currency, status: 'CONFIRMED', matchingMethod: nullable(row.matching_method) } })
    count(counts, 'confirmedAllocations')
  }

  for (const row of readCsv('communications.csv')) { const invoice = nullable(row.invoice_number) ? await prisma.invoice.findUnique({ where: { businessId_invoiceNumber: { businessId, invoiceNumber: row.invoice_number } } }) : null; await prisma.communication.upsert({ where: { id: row.communication_id }, update: { customerId: row.customer_id, invoiceId: invoice?.id ?? null, type: row.communication_type, messageContent: row.message_content, communicationDate: dateOnly(row.communication_date)!, direction: nullable(row.direction), channel: nullable(row.channel), sourceSystem: nullable(row.source_system) }, create: { id: row.communication_id, businessId, customerId: row.customer_id, invoiceId: invoice?.id ?? null, type: row.communication_type, messageContent: row.message_content, communicationDate: dateOnly(row.communication_date)!, direction: nullable(row.direction), channel: nullable(row.channel), sourceSystem: nullable(row.source_system) } }); count(counts, 'communications') }
  for (const row of readCsv('disputes.csv')) { const invoice = nullable(row.invoice_number) ? await prisma.invoice.findUnique({ where: { businessId_invoiceNumber: { businessId, invoiceNumber: row.invoice_number } } }) : null; await prisma.dispute.upsert({ where: { id: row.dispute_id }, update: { paymentId: row.payment_id, invoiceId: invoice?.id ?? null, customerId: row.customer_id, paypalDisputeId: nullable(row.paypal_dispute_id), reason: row.dispute_reason, status: row.dispute_status, openedDate: dateOnly(row.opened_date)!, responseDueDate: dateOnly(row.response_due_date), evidenceStatus: nullable(row.evidence_status), requiredEvidence: nullable(row.required_evidence), humanReviewRequired: bool(row.human_review_required) }, create: { id: row.dispute_id, businessId, paymentId: row.payment_id, invoiceId: invoice?.id ?? null, customerId: row.customer_id, paypalDisputeId: nullable(row.paypal_dispute_id), reason: row.dispute_reason, status: row.dispute_status, openedDate: dateOnly(row.opened_date)!, responseDueDate: dateOnly(row.response_due_date), evidenceStatus: nullable(row.evidence_status), requiredEvidence: nullable(row.required_evidence), humanReviewRequired: bool(row.human_review_required) } }); count(counts, 'disputes') }
  for (const row of readCsv('supporting_documents.csv')) { const invoice = nullable(row.invoice_number) ? await prisma.invoice.findUnique({ where: { businessId_invoiceNumber: { businessId, invoiceNumber: row.invoice_number } } }) : null; await prisma.supportingDocument.upsert({ where: { id: row.document_id }, update: { customerId: row.customer_id, invoiceId: invoice?.id ?? null, type: row.document_type, fileName: row.file_name, storagePath: row.storage_path, status: row.document_status, uploadedAt: timestamp(row.uploaded_at), extractedTextStatus: nullable(row.extracted_text_status) }, create: { id: row.document_id, businessId, customerId: row.customer_id, invoiceId: invoice?.id ?? null, type: row.document_type, fileName: row.file_name, storagePath: row.storage_path, status: row.document_status, uploadedAt: timestamp(row.uploaded_at), extractedTextStatus: nullable(row.extracted_text_status) } }); count(counts, 'supportingDocuments') }
  for (const row of readCsv('webhook_events.csv')) { await prisma.webhookEvent.upsert({ where: { id: row.event_id }, update: { relatedPaymentId: nullable(row.related_payment_id), eventType: row.event_type, resourceId: nullable(row.resource_id), eventCreatedAt: timestamp(row.event_created_at), signatureStatus: nullable(row.signature_status), processingStatus: row.processing_status }, create: { id: row.event_id, businessId, relatedPaymentId: nullable(row.related_payment_id), eventType: row.event_type, resourceId: nullable(row.resource_id), eventCreatedAt: timestamp(row.event_created_at), signatureStatus: nullable(row.signature_status), processingStatus: row.processing_status } }); count(counts, 'webhookEvents') }
  for (const row of readCsv('webhook_deliveries.csv')) { await prisma.webhookDelivery.upsert({ where: { id: row.delivery_id }, update: { eventId: row.event_id, receivedAt: timestamp(row.received_at)!, deliveryAttempt: Number(row.delivery_attempt), handlerResult: nullable(row.handler_result) }, create: { id: row.delivery_id, eventId: row.event_id, receivedAt: timestamp(row.received_at)!, deliveryAttempt: Number(row.delivery_attempt), handlerResult: nullable(row.handler_result) } }); count(counts, 'webhookDeliveries') }
  for (const row of readCsv('action_queue.csv')) { await prisma.actionQueue.upsert({ where: { id: row.action_id }, update: { relatedType: row.related_type, relatedId: row.related_id, actionType: row.action_type, priority: row.priority, status: row.status, recommendedOwner: nullable(row.recommended_owner), reason: row.reason }, create: { id: row.action_id, businessId, relatedType: row.related_type, relatedId: row.related_id, actionType: row.action_type, priority: row.priority, status: row.status, recommendedOwner: nullable(row.recommended_owner), reason: row.reason } }); count(counts, 'actionQueue') }

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || (process.env.NODE_ENV === 'production' ? '' : 'admin@gmail.com')
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : '12345678')
  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail.toLowerCase() } })
    if (!existing) {
      const passwordHash = await (await import('bcryptjs')).hash(adminPassword, 12)
      const admin = await prisma.user.create({ data: { businessId, name: 'Business Admin', email: adminEmail.toLowerCase(), passwordHash, displayName: 'Business Admin', role: 'OWNER', mustChangePassword: true } })
      await prisma.businessMembership.create({ data: { userId: admin.id, businessId, role: 'OWNER' } })
      count(counts, 'bootstrapAdmin')
    }
  } else if (process.env.NODE_ENV === 'production') throw new Error('BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required in production')

  console.log(JSON.stringify({ datasetRoot, counts }, null, 2))
}

main().catch(error => { console.error('[seed] failed:', error instanceof Error ? error.message : error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
