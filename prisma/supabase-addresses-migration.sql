-- ============================================================================
-- RefuseLink — Address Management Migration for Supabase
-- ============================================================================
-- Run this once in the Supabase SQL Editor after supabase-migration.sql.
-- It adds company-owned service addresses with optional community assignment.
-- ============================================================================

CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "address2" TEXT,
    "cityId" TEXT NOT NULL,
    "communityId" TEXT,
    "zipCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Address_companyId_idx" ON "Address"("companyId");
CREATE INDEX "Address_cityId_idx" ON "Address"("cityId");
CREATE INDEX "Address_communityId_idx" ON "Address"("communityId");

ALTER TABLE "Address" ADD CONSTRAINT "Address_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Address" ADD CONSTRAINT "Address_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "City"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Address" ADD CONSTRAINT "Address_communityId_fkey"
    FOREIGN KEY ("communityId") REFERENCES "Community"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
