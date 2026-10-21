CREATE TABLE "RateSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "rateRuleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateSchedule_rateRuleId_shopId_fkey" FOREIGN KEY ("rateRuleId", "shopId") REFERENCES "RateRule" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RateSchedule_rateRuleId_position_key" ON "RateSchedule"("rateRuleId", "position");

CREATE INDEX "RateSchedule_shopId_scheduledAt_idx" ON "RateSchedule"("shopId", "scheduledAt");
