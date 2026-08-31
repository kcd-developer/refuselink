-- Existing communities and tickets retain the current KC Disposal workflow.
ALTER TABLE "Community"
ADD COLUMN IF NOT EXISTS "serviceIssueRouting" TEXT NOT NULL DEFAULT 'company';

ALTER TABLE "Ticket"
ADD COLUMN IF NOT EXISTS "serviceRecipient" TEXT NOT NULL DEFAULT 'company',
ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Ticket_companyId_serviceRecipient_idx"
ON "Ticket"("companyId", "serviceRecipient");
