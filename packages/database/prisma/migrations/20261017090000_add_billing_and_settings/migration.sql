ALTER TABLE "ShopConfiguration"
ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'SANDBOX',
ADD COLUMN "billingCycle" TEXT,
ADD COLUMN "billingSubscriptionId" TEXT,
ADD COLUMN "billingStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN "apiSecretHash" TEXT,
ADD COLUMN "apiSecretEncrypted" TEXT,
ADD COLUMN "zonesLastSyncedAt" TIMESTAMP(3),
ADD COLUMN "productsLastSyncedAt" TIMESTAMP(3),
ADD COLUMN "basicBlendLimits" JSONB,
ADD COLUMN "advancedBlendRules" JSONB;

CREATE UNIQUE INDEX "ShopConfiguration_apiSecretHash_key"
ON "ShopConfiguration"("apiSecretHash");
