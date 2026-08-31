CREATE TABLE IF NOT EXISTS "CustomerAnnouncementRead" (
  "id" TEXT NOT NULL,
  "announcementId" TEXT NOT NULL,
  "customerUserId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerAnnouncementRead_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerAnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerAnnouncementRead_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerAnnouncementRead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerAnnouncementRead_announcementId_customerUserId_key"
ON "CustomerAnnouncementRead"("announcementId", "customerUserId");
CREATE INDEX IF NOT EXISTS "CustomerAnnouncementRead_customerUserId_companyId_idx"
ON "CustomerAnnouncementRead"("customerUserId", "companyId");

CREATE TABLE IF NOT EXISTS "CustomerCommunityAnnouncementRead" (
  "id" TEXT NOT NULL,
  "communityAnnouncementId" TEXT NOT NULL,
  "customerUserId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerCommunityAnnouncementRead_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerCommunityAnnouncementRead_announcementId_fkey" FOREIGN KEY ("communityAnnouncementId") REFERENCES "CommunityAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerCommunityAnnouncementRead_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerCommunityAnnouncementRead_communityAnnouncementId_customerUserId_key"
ON "CustomerCommunityAnnouncementRead"("communityAnnouncementId", "customerUserId");
CREATE INDEX IF NOT EXISTS "CustomerCommunityAnnouncementRead_customerUserId_idx"
ON "CustomerCommunityAnnouncementRead"("customerUserId");
