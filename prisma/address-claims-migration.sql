ALTER TABLE "Address" ADD COLUMN "claimedAt" TIMESTAMP(3);

UPDATE "Address" AS address
SET "claimedAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM "Customer" AS customer
  INNER JOIN "CustomerUserAccess" AS access ON access."customerId" = customer."id"
  WHERE customer."companyId" = address."companyId"
    AND LOWER(TRIM(customer."address")) = LOWER(TRIM(address."address"))
    AND LOWER(TRIM(COALESCE(customer."address2", ''))) = LOWER(TRIM(COALESCE(address."address2", '')))
);

CREATE INDEX "Address_companyId_claimedAt_idx" ON "Address"("companyId", "claimedAt");
