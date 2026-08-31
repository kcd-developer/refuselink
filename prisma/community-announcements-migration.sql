-- Community-authored announcements displayed alongside company announcements.
-- Run once after community-access-migration.sql.

CREATE TABLE IF NOT EXISTS "CommunityAnnouncement" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "priority" "AnnouncementPriority" NOT NULL DEFAULT 'normal',
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP(3),
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdByRole" "CommunityRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityAnnouncement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityAnnouncement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityAnnouncement_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityAnnouncement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CommunityAnnouncement_companyId_isPublished_idx"
ON "CommunityAnnouncement"("companyId", "isPublished");

CREATE INDEX IF NOT EXISTS "CommunityAnnouncement_communityId_isPublished_idx"
ON "CommunityAnnouncement"("communityId", "isPublished");

CREATE INDEX IF NOT EXISTS "CommunityAnnouncement_createdById_idx"
ON "CommunityAnnouncement"("createdById");
