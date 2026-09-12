-- HOA-requested service suspension and restoration workflow.
-- RefuseLink accesses these tables server-side through Prisma; RLS without
-- public policies blocks direct access through the Supabase data API.

CREATE TYPE "AddressServiceStatus" AS ENUM (
  'active',
  'suspension_pending',
  'suspended',
  'restoration_pending'
);

CREATE TYPE "ServiceHoldAction" AS ENUM ('suspend', 'restore');
CREATE TYPE "ServiceHoldRequestStatus" AS ENUM ('pending', 'completed', 'rejected', 'cancelled');

ALTER TABLE "Address"
  ADD COLUMN "serviceStatus" "AddressServiceStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "serviceStatusUpdatedAt" TIMESTAMP(3);

CREATE TABLE "ServiceHoldRequest" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "addressId" TEXT NOT NULL,
  "action" "ServiceHoldAction" NOT NULL,
  "status" "ServiceHoldRequestStatus" NOT NULL DEFAULT 'pending',
  "priority" "TicketPriority" NOT NULL DEFAULT 'urgent',
  "requestedById" TEXT,
  "requestNote" TEXT,
  "processedById" TEXT,
  "processedByName" TEXT,
  "internalNote" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceHoldRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceHoldRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ServiceHoldRequest_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ServiceHoldRequest_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ServiceHoldRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "CustomerUser"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ServiceHoldRequest_companyId_status_createdAt_idx" ON "ServiceHoldRequest"("companyId", "status", "createdAt");
CREATE INDEX "ServiceHoldRequest_communityId_status_idx" ON "ServiceHoldRequest"("communityId", "status");
CREATE INDEX "ServiceHoldRequest_addressId_createdAt_idx" ON "ServiceHoldRequest"("addressId", "createdAt");
CREATE INDEX "ServiceHoldRequest_requestedById_idx" ON "ServiceHoldRequest"("requestedById");

ALTER TABLE "ServiceHoldRequest" ENABLE ROW LEVEL SECURITY;
