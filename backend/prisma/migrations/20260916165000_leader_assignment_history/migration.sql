ALTER TABLE "user_coffee_shop_assignments" ADD COLUMN "assignedUntil" TIMESTAMP(3);
-- The original uniqueness rule was created as an index, rather than a table
-- constraint.  Remove that index so a leader can return after an assignment ends.
DROP INDEX "user_coffee_shop_assignments_userId_coffeeShopId_key";
CREATE UNIQUE INDEX "user_coffee_shop_assignments_userId_coffeeShopId_assignedFrom_key" ON "user_coffee_shop_assignments"("userId", "coffeeShopId", "assignedFrom");
CREATE INDEX "user_coffee_shop_assignments_coffeeShopId_assignedFrom_assignedUntil_idx" ON "user_coffee_shop_assignments"("coffeeShopId", "assignedFrom", "assignedUntil");
