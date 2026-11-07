-- CreateTable
CREATE TABLE "Business" (
    "id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "legalName" VARCHAR(200),
    "countryCode" CHAR(2),
    "defaultCurrency" CHAR(3) NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "displayName" VARCHAR(200),
    "role" VARCHAR(50) NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessIntegration" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DISCONNECTED',
    "externalAccountReference" VARCHAR(200),
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "legalName" VARCHAR(200),
    "email" VARCHAR(320),
    "country" VARCHAR(100),
    "countryCode" CHAR(2),
    "customerReference" VARCHAR(200),
    "paypalPayerReference" VARCHAR(200),
    "paymentTermsDays" INTEGER,
    "riskSegment" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceNumber" VARCHAR(100) NOT NULL,
    "purchaseOrderReference" VARCHAR(100),
    "externalInvoiceReference" VARCHAR(200),
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "sourceSystem" VARCHAR(100) NOT NULL,
    "paypalInvoiceId" VARCHAR(200),
    "description" TEXT,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outstandingAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "poNumber" VARCHAR(100) NOT NULL,
    "poDate" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "paypalTransactionId" TEXT,
    "payerReference" VARCHAR(200),
    "payerEmail" VARCHAR(320),
    "paymentDate" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "invoiceReference" VARCHAR(100),
    "description" TEXT,
    "sourceSystem" VARCHAR(100) NOT NULL,
    "scenario" VARCHAR(100),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" VARCHAR(100) NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    "matchingMethod" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingCase" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "investigationStatus" VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    "outcome" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchingCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingCandidate" (
    "id" VARCHAR(100) NOT NULL,
    "matchingCaseId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "signals" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "proposedAllocationAmount" DECIMAL(18,2),
    "currency" CHAR(3),
    "reviewStatus" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "expectedDecision" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchingCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportingDocument" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "type" VARCHAR(100) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "extractedTextStatus" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "type" VARCHAR(100) NOT NULL,
    "messageContent" TEXT NOT NULL,
    "communicationDate" DATE NOT NULL,
    "direction" VARCHAR(50),
    "channel" VARCHAR(50),
    "sourceSystem" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "paypalDisputeId" TEXT,
    "reason" VARCHAR(100) NOT NULL,
    "status" VARCHAR(100) NOT NULL,
    "openedDate" DATE NOT NULL,
    "responseDueDate" DATE,
    "evidenceStatus" VARCHAR(100),
    "requiredEvidence" TEXT,
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "relatedPaymentId" TEXT,
    "eventType" VARCHAR(150) NOT NULL,
    "resourceId" VARCHAR(200),
    "eventCreatedAt" TIMESTAMP(3),
    "signatureStatus" VARCHAR(50),
    "processingStatus" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" VARCHAR(100) NOT NULL,
    "eventId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "deliveryAttempt" INTEGER NOT NULL,
    "handlerResult" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionQueue" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "relatedType" VARCHAR(50) NOT NULL,
    "relatedId" VARCHAR(100) NOT NULL,
    "actionType" VARCHAR(100) NOT NULL,
    "priority" VARCHAR(30) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "recommendedOwner" VARCHAR(100),
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecution" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "agentName" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "triggeringEvent" VARCHAR(200),
    "inputMetadata" JSONB,
    "outputMetadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentToolCall" (
    "id" VARCHAR(100) NOT NULL,
    "executionId" TEXT NOT NULL,
    "toolName" VARCHAR(150) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "input" JSONB,
    "result" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRecommendation" (
    "id" VARCHAR(100) NOT NULL,
    "executionId" TEXT NOT NULL,
    "recommendationType" VARCHAR(100) NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRecord" (
    "id" VARCHAR(100) NOT NULL,
    "executionId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "reviewedById" TEXT,
    "decision" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" VARCHAR(100) NOT NULL,
    "businessId" TEXT NOT NULL,
    "eventName" VARCHAR(150) NOT NULL,
    "eventType" VARCHAR(75) NOT NULL,
    "relatedRecordType" VARCHAR(75),
    "relatedRecordId" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Business_name_idx" ON "Business"("name");

-- CreateIndex
CREATE INDEX "User_businessId_idx" ON "User"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "User_businessId_email_key" ON "User"("businessId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessIntegration_businessId_provider_key" ON "BusinessIntegration"("businessId", "provider");

-- CreateIndex
CREATE INDEX "Customer_businessId_name_idx" ON "Customer"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_customerReference_key" ON "Customer"("businessId", "customerReference");

-- CreateIndex
CREATE INDEX "Invoice_businessId_customerId_status_idx" ON "Invoice"("businessId", "customerId", "status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_businessId_invoiceNumber_key" ON "Invoice"("businessId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_invoiceId_key" ON "PurchaseOrder"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_businessId_poNumber_key" ON "PurchaseOrder"("businessId", "poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paypalTransactionId_key" ON "Payment"("paypalTransactionId");

-- CreateIndex
CREATE INDEX "Payment_businessId_customerId_paymentDate_idx" ON "Payment"("businessId", "customerId", "paymentDate");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceId_idx" ON "PaymentAllocation"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_invoiceId_key" ON "PaymentAllocation"("paymentId", "invoiceId");

-- CreateIndex
CREATE INDEX "MatchingCase_businessId_investigationStatus_idx" ON "MatchingCase"("businessId", "investigationStatus");

-- CreateIndex
CREATE INDEX "MatchingCandidate_reviewStatus_idx" ON "MatchingCandidate"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MatchingCandidate_matchingCaseId_invoiceId_key" ON "MatchingCandidate"("matchingCaseId", "invoiceId");

-- CreateIndex
CREATE INDEX "SupportingDocument_businessId_invoiceId_idx" ON "SupportingDocument"("businessId", "invoiceId");

-- CreateIndex
CREATE INDEX "Communication_businessId_communicationDate_idx" ON "Communication"("businessId", "communicationDate");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_paypalDisputeId_key" ON "Dispute"("paypalDisputeId");

-- CreateIndex
CREATE INDEX "Dispute_businessId_status_idx" ON "Dispute"("businessId", "status");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_eventId_deliveryAttempt_key" ON "WebhookDelivery"("eventId", "deliveryAttempt");

-- CreateIndex
CREATE INDEX "ActionQueue_businessId_status_priority_idx" ON "ActionQueue"("businessId", "status", "priority");

-- CreateIndex
CREATE INDEX "AgentExecution_businessId_agentName_status_idx" ON "AgentExecution"("businessId", "agentName", "status");

-- CreateIndex
CREATE INDEX "AgentToolCall_executionId_idx" ON "AgentToolCall"("executionId");

-- CreateIndex
CREATE INDEX "AgentRecommendation_executionId_status_idx" ON "AgentRecommendation"("executionId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRecord_executionId_decision_idx" ON "ApprovalRecord"("executionId", "decision");

-- CreateIndex
CREATE INDEX "ActivityLog_businessId_eventType_status_createdAt_idx" ON "ActivityLog"("businessId", "eventType", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessIntegration" ADD CONSTRAINT "BusinessIntegration_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingCase" ADD CONSTRAINT "MatchingCase_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingCase" ADD CONSTRAINT "MatchingCase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingCandidate" ADD CONSTRAINT "MatchingCandidate_matchingCaseId_fkey" FOREIGN KEY ("matchingCaseId") REFERENCES "MatchingCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingCandidate" ADD CONSTRAINT "MatchingCandidate_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportingDocument" ADD CONSTRAINT "SupportingDocument_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportingDocument" ADD CONSTRAINT "SupportingDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportingDocument" ADD CONSTRAINT "SupportingDocument_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_relatedPaymentId_fkey" FOREIGN KEY ("relatedPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WebhookEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionQueue" ADD CONSTRAINT "ActionQueue_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentExecution" ADD CONSTRAINT "AgentExecution_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentToolCall" ADD CONSTRAINT "AgentToolCall_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AgentRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Guard confirmed allocations at the database boundary. The sum of allocations
-- for a payment can never exceed the verified completed payment amount.
CREATE OR REPLACE FUNCTION reclaim_validate_payment_allocation()
RETURNS TRIGGER AS $$
DECLARE
  payment_amount NUMERIC(18,2);
  payment_status TEXT;
  allocated_total NUMERIC(18,2);
BEGIN
  SELECT "amount", "status" INTO payment_amount, payment_status
  FROM "Payment" WHERE "id" = NEW."paymentId" FOR UPDATE;

  IF payment_status IS DISTINCT FROM 'COMPLETED' THEN
    RAISE EXCEPTION 'Payment allocations require a COMPLETED payment';
  END IF;

  IF NEW."amount" <= 0 THEN
    RAISE EXCEPTION 'Payment allocation amount must be greater than zero';
  END IF;

  SELECT COALESCE(SUM("amount"), 0) INTO allocated_total
  FROM "PaymentAllocation"
  WHERE "paymentId" = NEW."paymentId" AND "id" <> NEW."id" AND "status" = 'CONFIRMED';

  IF allocated_total + NEW."amount" > payment_amount THEN
    RAISE EXCEPTION 'Confirmed allocations exceed the completed payment amount';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_allocation_amount_guard
BEFORE INSERT OR UPDATE OF "paymentId", "amount", "status" ON "PaymentAllocation"
FOR EACH ROW WHEN (NEW."status" = 'CONFIRMED')
EXECUTE FUNCTION reclaim_validate_payment_allocation();
