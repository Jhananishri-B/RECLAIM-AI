ALTER TYPE "MembershipRole" ADD VALUE IF NOT EXISTS 'MANAGER';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountStatus" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "CustomerAssignment" (
  "id" VARCHAR(100) NOT NULL,
  "businessId" VARCHAR(100) NOT NULL,
  "customerId" VARCHAR(100) NOT NULL,
  "userId" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerAssignment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerAssignment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerAssignment_customerId_userId_key" ON "CustomerAssignment"("customerId", "userId");
CREATE INDEX IF NOT EXISTS "CustomerAssignment_businessId_userId_idx" ON "CustomerAssignment"("businessId", "userId");

CREATE TABLE IF NOT EXISTS "InvoiceAssignment" (
  "id" VARCHAR(100) NOT NULL,
  "businessId" VARCHAR(100) NOT NULL,
  "invoiceId" VARCHAR(100) NOT NULL,
  "userId" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceAssignment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InvoiceAssignment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InvoiceAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceAssignment_invoiceId_userId_key" ON "InvoiceAssignment"("invoiceId", "userId");
CREATE INDEX IF NOT EXISTS "InvoiceAssignment_businessId_userId_idx" ON "InvoiceAssignment"("businessId", "userId");
