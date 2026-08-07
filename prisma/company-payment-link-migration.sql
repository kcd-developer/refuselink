ALTER TABLE "CompanyBranding"
  ADD COLUMN IF NOT EXISTS "paymentUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentLabel" TEXT;
