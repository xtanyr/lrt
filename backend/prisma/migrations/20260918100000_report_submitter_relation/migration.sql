ALTER TABLE "monthly_reports"
ADD CONSTRAINT "monthly_reports_submittedById_fkey"
FOREIGN KEY ("submittedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "monthly_reports_submittedById_idx"
ON "monthly_reports"("submittedById");
