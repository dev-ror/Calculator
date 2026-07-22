-- CreateTable
CREATE TABLE "CustomizationSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "customizationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomizationSchedule_customizationId_shopId_fkey" FOREIGN KEY ("customizationId", "shopId") REFERENCES "Customization" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomizationSchedule_customizationId_position_key" ON "CustomizationSchedule"("customizationId", "position");

-- CreateIndex
CREATE INDEX "CustomizationSchedule_shopId_scheduledAt_idx" ON "CustomizationSchedule"("shopId", "scheduledAt");
