-- Allow community managers to create requests for a particular HOA address or
-- for an entire community without attaching the request to a resident account.
ALTER TABLE "Ticket" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "communityId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "addressId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "requestScope" TEXT NOT NULL DEFAULT 'address';
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "residentVisible" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Ticket" AS ticket
SET "communityId" = customer."communityId"
FROM "Customer" AS customer
WHERE ticket."customerId" = customer."id"
  AND ticket."communityId" IS NULL;

DO $$ BEGIN
  ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_communityId_fkey"
    FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_addressId_fkey"
    FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Ticket_communityId_updatedAt_idx" ON "Ticket"("communityId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Ticket_addressId_idx" ON "Ticket"("addressId");
