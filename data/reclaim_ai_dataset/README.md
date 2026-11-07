# RECLAIM AI synthetic dataset

All records in this package are fictional and generated for a hackathon prototype.
No real people, businesses, PayPal accounts, transactions, invoices or disputes are represented.

## Snapshot
- Synthetic as-of date: 2026-11-06
- Customers: 12
- Invoices: 36
- Payments: 30
- Confirmed payment allocations: 25
- Candidate matching rows: 30+
- Customer communications: 20
- Disputes: 6
- Supporting document metadata: 15
- Purchase orders: 36
- Webhook event records: 5
- Webhook delivery attempts: 6

## Files
- customers.csv: customer master records.
- invoices.csv: invoice records, due dates, status, paid and outstanding amounts.
- payments.csv: payment transactions, payer references, currency, payment state and scenario labels.
- payment_allocations.csv: only confirmed allocations. Ambiguous/unmatched/mismatched/pending cases are intentionally not allocated.
- matching_cases.csv: candidate invoice matches, transparent feature flags, illustrative scores and expected decisions.
- purchase_orders.csv: purchase orders linked to invoice records.
- communications.csv: synthetic customer/exporter email history.
- disputes.csv: synthetic dispute cases and required evidence.
- supporting_documents.csv: metadata for supporting documents.
- documents/: small synthetic text artifacts for document ingestion tests.
- webhook_events.csv: synthetic webhook event records.
- webhook_deliveries.csv: individual delivery attempts; event WH-EVT-002 is delivered twice to test idempotency.
- action_queue.csv: expected human-review and automation tasks.
- schema.sql: PostgreSQL starter schema and constraints.

## Relationship map
- customers.customer_id -> invoices.customer_id
- customers.customer_id -> payments.customer_id (nullable for unidentified payments)
- invoices.invoice_number -> payment_allocations.invoice_number
- payments.payment_id -> payment_allocations.payment_id
- invoices.invoice_number -> purchase_orders.invoice_number
- customers.customer_id -> communications.customer_id
- invoices.invoice_number -> communications.invoice_number
- payments.payment_id -> disputes.payment_id
- invoices.invoice_number -> disputes.invoice_number
- invoices.invoice_number -> supporting_documents.invoice_number
- webhook_events.event_id -> webhook_deliveries.event_id
- action_queue.related_id -> the related payment, invoice or dispute depending on related_type

## Important reconciliation cases
1. PAY-001: exact reference; auto-match INV-2026-001.
2. PAY-002: partial payment; 300 USD allocated to INV-2026-002; 200 USD remains.
3. PAY-003: ambiguous; CUS-002 has two open invoices (INV-2026-003 and INV-2026-004), both 500 USD. No allocation is recorded.
4. PAY-004: payer identifies CUS-003; one 500 USD invoice is a candidate. Human-confirmed allocation to INV-2026-005.
5. PAY-005: 550 USD against 500 USD invoice INV-2026-007; only 500 USD allocated; 50 USD is held for review.
6. PAY-006: unidentified 400 USD payment; no allocation.
7. PAY-007: exact reference; duplicate webhook delivery is represented in webhook_deliveries.csv. Only one allocation exists.
8. PAY-008 and PAY-009: two payments of 200 and 300 USD settle INV-2026-009.
9. PAY-010: 800 USD payment split across INV-2026-012 (500 USD) and INV-2026-013 (300 USD), supported by remittance advice.
10. PAY-011: payment matched to INV-2026-011, but a separate dispute remains open.
11. PAY-012: USD payment against EUR invoice INV-2026-015; no allocation due to currency mismatch.
12. PAY-023 and PAY-028: pending payment states; do not mark invoices paid.
13. PAY-026: failed payment; do not allocate.
14. INV-2026-010 and INV-2026-031: overdue invoices with no confirmed payment.

## Matching scores
The illustrative score in matching_cases.csv is a demo feature score, not a calibrated probability.
Do not automatically settle an invoice from a score alone.
A production-grade workflow should require exact reference matching or policy-defined thresholds plus deterministic checks, and human review for ambiguous cases.

## Currency and payment notes
- USD is used for most international payment examples; one EUR invoice and a USD payment intentionally demonstrate a currency mismatch.
- Amounts are synthetic and should not be treated as current FX values.
- No automatic FX conversion is implied.
- PayPal Sandbox transaction identifiers in this dataset are illustrative labels, not actual IDs from a PayPal account.
- Some records use MOCK data, while a small subset is labeled PAYPAL_SANDBOX to demonstrate source separation.

## Recommended use
1. Import CSV files into PostgreSQL using schema.sql or your own migrations.
2. Run reconciliation rules against payments and invoices.
3. Compare your engine's output with matching_cases.csv and payment_allocations.csv.
4. Build agent tools that read candidate data and submit proposals.
5. Keep financial allocations and status changes deterministic and transactional.
