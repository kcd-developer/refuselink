CREATE TYPE "CommunityRole" AS ENUM ('board_member', 'community_manager');
CREATE TYPE "TicketCategory" AS ENUM (
  'missed_pickup',
  'recycling_issue',
  'yard_waste_issue',
  'cart_issue',
  'illegal_dumping',
  'community_cleanliness',
  'service_delay',
  'billing_account',
  'other'
);

CREATE TABLE "CommunityMembership" (
  "id" TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "customerUserId" TEXT NOT NULL,
  "role" "CommunityRole" NOT NULL,
  "positionTitle" TEXT,
  "publicEmail" TEXT,
  "publicPhone" TEXT,
  "showEmail" BOOLEAN NOT NULL DEFAULT true,
  "showPhone" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "assignedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityMembership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityMembership_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityMembership_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CommunityMembership_communityId_customerUserId_role_key" ON "CommunityMembership"("communityId", "customerUserId", "role");
CREATE INDEX "CommunityMembership_customerUserId_idx" ON "CommunityMembership"("customerUserId");

ALTER TABLE "Ticket" ADD COLUMN "category" "TicketCategory" NOT NULL DEFAULT 'other';
