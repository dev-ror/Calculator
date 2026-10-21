-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRestOfWorld" BOOLEAN NOT NULL DEFAULT false,
    "regions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Zone_shopId_idx" ON "Zone"("shopId");
