-- Apply before deploying the board contact privacy feature.
-- Existing staff-controlled visibility flags do not establish member consent.
ALTER TABLE "CommunityMembership"
  ADD COLUMN IF NOT EXISTS "shareEmailWithCommunity" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sharePhoneWithCommunity" BOOLEAN NOT NULL DEFAULT false;
