ALTER TABLE "users" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "monthly_reports" ADD COLUMN "formData" JSONB, ADD COLUMN "ratingSnapshot" JSONB;
ALTER TABLE "trigger_configs" ADD COLUMN "minMonthsOnPosition" INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN "minMonthsSinceApproval" INTEGER NOT NULL DEFAULT 6;
ALTER TABLE "ipv_statuses" ADD COLUMN "metricId" INTEGER;
ALTER TABLE "notifications" ADD COLUMN "ipvStatusId" INTEGER;
CREATE TABLE "system_settings" (
  "key" VARCHAR(100) NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
