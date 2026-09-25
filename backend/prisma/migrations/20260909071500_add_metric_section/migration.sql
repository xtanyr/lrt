-- Add columns to metrics table
ALTER TABLE "metrics" ADD COLUMN IF NOT EXISTS "code" VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE "metrics" ADD COLUMN IF NOT EXISTS "section" "AnalysisSection";

-- Backfill code from name for existing rows
UPDATE "metrics" SET "code" = "name" WHERE "code" = '';

-- Make code unique
CREATE UNIQUE INDEX IF NOT EXISTS "metrics_code_key" ON "metrics"("code");
