ALTER TABLE "PaymentAllocation"
ADD CONSTRAINT "PaymentAllocation_status_confirmed_check"
CHECK ("status" = 'CONFIRMED');
