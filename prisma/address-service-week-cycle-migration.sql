DO $$ BEGIN
  CREATE TYPE "ServiceWeekCycle" AS ENUM ('a', 'b');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "AddressService"
ADD COLUMN IF NOT EXISTS "weekCycle" "ServiceWeekCycle";

-- Existing rows remain NULL, which means the service is collected every week.
