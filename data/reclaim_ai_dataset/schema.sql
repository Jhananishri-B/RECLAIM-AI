-- RECLAIM AI synthetic dataset starter schema
-- PostgreSQL 14+
CREATE TABLE customers (
  customer_id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  legal_name TEXT,
  email TEXT,
  country TEXT,
  country_code CHAR(2),
  customer_reference TEXT,
  paypal_payer_reference TEXT,
  payment_terms_days INTEGER,
  risk_segment TEXT
);

CREATE TABLE invoices (
  invoice_id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  purchase_order_id TEXT,
  external_invoice_reference TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL CHECK (total_amount >= 0),
  currency CHAR(3) NOT NULL,
  invoice_status TEXT NOT NULL,
  source_system TEXT NOT NULL,
  paypal_invoice_id TEXT,
  description TEXT,
  paid_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  outstanding_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (outstanding_amount >= 0)
);

CREATE TABLE payments (
  payment_id TEXT PRIMARY KEY,
  paypal_transaction_id TEXT UNIQUE,
  customer_id TEXT REFERENCES customers(customer_id),
  payer_reference TEXT,
  payer_email TEXT,
  payment_date DATE NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL,
  payment_status TEXT NOT NULL,
  invoice_reference TEXT,
  payment_description TEXT,
  source_system TEXT NOT NULL,
  scenario TEXT
);

CREATE TABLE payment_allocations (
  allocation_id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(payment_id),
  invoice_number TEXT NOT NULL REFERENCES invoices(invoice_number),
  allocated_amount NUMERIC(18,2) NOT NULL CHECK (allocated_amount > 0),
  currency CHAR(3) NOT NULL,
  allocation_status TEXT NOT NULL,
  matching_method TEXT,
  reviewed_by TEXT,
  UNIQUE(payment_id, invoice_number)
);

CREATE TABLE purchase_orders (
  purchase_order_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  invoice_number TEXT NOT NULL REFERENCES invoices(invoice_number),
  po_number TEXT NOT NULL,
  po_date DATE NOT NULL,
  po_amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  po_status TEXT NOT NULL
);

CREATE TABLE communications (
  communication_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  invoice_number TEXT REFERENCES invoices(invoice_number),
  communication_type TEXT NOT NULL,
  message_content TEXT NOT NULL,
  communication_date DATE NOT NULL,
  direction TEXT,
  channel TEXT,
  source_system TEXT
);

CREATE TABLE disputes (
  dispute_id TEXT PRIMARY KEY,
  paypal_dispute_id TEXT UNIQUE,
  payment_id TEXT NOT NULL REFERENCES payments(payment_id),
  invoice_number TEXT REFERENCES invoices(invoice_number),
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  dispute_reason TEXT NOT NULL,
  dispute_status TEXT NOT NULL,
  opened_date DATE NOT NULL,
  response_due_date DATE,
  evidence_status TEXT,
  required_evidence TEXT,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE supporting_documents (
  document_id TEXT PRIMARY KEY,
  invoice_number TEXT REFERENCES invoices(invoice_number),
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  document_status TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ,
  extracted_text_status TEXT
);

CREATE TABLE webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  resource_id TEXT,
  related_payment_id TEXT REFERENCES payments(payment_id),
  event_created_at TIMESTAMPTZ,
  signature_status TEXT,
  processing_status TEXT
);

CREATE TABLE webhook_deliveries (
  delivery_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES webhook_events(event_id),
  received_at TIMESTAMPTZ NOT NULL,
  delivery_attempt INTEGER NOT NULL,
  handler_result TEXT
);

CREATE TABLE matching_cases (
  case_id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(payment_id),
  candidate_invoice_number TEXT REFERENCES invoices(invoice_number),
  customer_match INTEGER NOT NULL CHECK (customer_match IN (0,1)),
  reference_match INTEGER NOT NULL CHECK (reference_match IN (0,1)),
  amount_match INTEGER NOT NULL CHECK (amount_match IN (0,1)),
  currency_match INTEGER NOT NULL CHECK (currency_match IN (0,1)),
  date_compatible INTEGER NOT NULL CHECK (date_compatible IN (0,1)),
  illustrative_score INTEGER NOT NULL CHECK (illustrative_score BETWEEN 0 AND 100),
  expected_decision TEXT NOT NULL,
  reason TEXT NOT NULL
);

CREATE TABLE action_queue (
  action_id TEXT PRIMARY KEY,
  related_type TEXT NOT NULL,
  related_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  recommended_owner TEXT,
  reason TEXT NOT NULL
);

CREATE INDEX idx_invoices_customer_status ON invoices(customer_id, invoice_status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_payments_customer_date ON payments(customer_id, payment_date);
CREATE INDEX idx_allocations_invoice ON payment_allocations(invoice_number);
CREATE INDEX idx_disputes_status ON disputes(dispute_status);
CREATE INDEX idx_webhook_event_type ON webhook_events(event_type);
