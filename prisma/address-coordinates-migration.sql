ALTER TABLE "Address"
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "Address"
  ADD CONSTRAINT "Address_latitude_check" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "Address_longitude_check" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);
