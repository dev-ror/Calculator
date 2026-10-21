-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ShopConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "shippingRatesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customizationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoProductSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "blendMode" TEXT NOT NULL DEFAULT 'add',
    "contactEmail" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShopConfiguration_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "parameterSet" INTEGER NOT NULL,
    "conditionMatch" TEXT NOT NULL DEFAULT 'ALL',
    "shipmentScope" TEXT NOT NULL DEFAULT 'ALL',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Customization_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomizationCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "customizationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT,
    "key" TEXT,
    "value" TEXT,
    "productMatch" TEXT,
    "matchValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "CustomizationMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "customizationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "RateRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "conditionMatch" TEXT NOT NULL DEFAULT 'ALL',
    "exclusivity" TEXT NOT NULL DEFAULT 'INCLUSIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateRule_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "rateRuleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "subfield" TEXT,
    "key" TEXT,
    "operator" TEXT NOT NULL,
    "value" TEXT,
    "quantityCheck" TEXT,
    "quantityValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "RateDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "rateRuleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "zoneKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minimumDays" INTEGER,
    "maximumDays" INTEGER,
    "currencyCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "ShopConfiguration_shopId_key" ON "ShopConfiguration"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "Customization_id_shopId_key" ON "Customization"("id", "shopId");

-- CreateIndex
CREATE INDEX "Customization_shopId_status_idx" ON "Customization"("shopId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomizationCondition_customizationId_position_key" ON "CustomizationCondition"("customizationId", "position");

-- CreateIndex
CREATE INDEX "CustomizationCondition_shopId_idx" ON "CustomizationCondition"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomizationMethod_customizationId_position_key" ON "CustomizationMethod"("customizationId", "position");

-- CreateIndex
CREATE INDEX "CustomizationMethod_shopId_idx" ON "CustomizationMethod"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "RateRule_id_shopId_key" ON "RateRule"("id", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "RateRule_shopId_priority_key" ON "RateRule"("shopId", "priority");

-- CreateIndex
CREATE INDEX "RateRule_shopId_status_idx" ON "RateRule"("shopId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RateCondition_rateRuleId_position_key" ON "RateCondition"("rateRuleId", "position");

-- CreateIndex
CREATE INDEX "RateCondition_shopId_idx" ON "RateCondition"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "RateDefinition_rateRuleId_position_key" ON "RateDefinition"("rateRuleId", "position");

-- CreateIndex
CREATE INDEX "RateDefinition_shopId_zoneKey_idx" ON "RateDefinition"("shopId", "zoneKey");

ALTER TABLE "CustomizationCondition" ADD CONSTRAINT "CustomizationCondition_customizationId_shopId_fkey" FOREIGN KEY ("customizationId", "shopId") REFERENCES "Customization"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomizationMethod" ADD CONSTRAINT "CustomizationMethod_customizationId_shopId_fkey" FOREIGN KEY ("customizationId", "shopId") REFERENCES "Customization"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RateCondition" ADD CONSTRAINT "RateCondition_rateRuleId_shopId_fkey" FOREIGN KEY ("rateRuleId", "shopId") REFERENCES "RateRule"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RateDefinition" ADD CONSTRAINT "RateDefinition_rateRuleId_shopId_fkey" FOREIGN KEY ("rateRuleId", "shopId") REFERENCES "RateRule"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;
