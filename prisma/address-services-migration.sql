CREATE TYPE "ServiceType" AS ENUM ('trash', 'recycling', 'yard_waste');

CREATE TABLE "AddressService" (
  "id" TEXT NOT NULL,
  "addressId" TEXT NOT NULL,
  "service" "ServiceType" NOT NULL,
  "route" TEXT,
  "dayOfWeek" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AddressService_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AddressService_dayOfWeek_check" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  CONSTRAINT "AddressService_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AddressService_addressId_service_key" ON "AddressService"("addressId", "service");
CREATE INDEX "AddressService_addressId_idx" ON "AddressService"("addressId");
