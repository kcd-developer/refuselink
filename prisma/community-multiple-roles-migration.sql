-- Allow one customer login to hold both board-member and community-manager
-- roles for the same community. Run once after community-access-migration.sql.

DROP INDEX IF EXISTS "CommunityMembership_communityId_customerUserId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "CommunityMembership_communityId_customerUserId_role_key"
ON "CommunityMembership"("communityId", "customerUserId", "role");
