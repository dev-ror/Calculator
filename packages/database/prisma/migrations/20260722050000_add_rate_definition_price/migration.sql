ALTER TABLE "RateDefinition" ADD COLUMN "calculation" TEXT NOT NULL DEFAULT 'Fixed rate';
ALTER TABLE "RateDefinition" ADD COLUMN "price" DOUBLE PRECISION;
