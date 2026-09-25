-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEADER', 'CITY_LEADER', 'COO', 'ADMIN');

-- CreateEnum
CREATE TYPE "MetricDirection" AS ENUM ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('NOT_FILLED', 'OVERDUE', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "MetricZone" AS ENUM ('TARGET', 'BELOW_TARGET', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportLinkType" AS ENUM ('GIFT_REASONS', 'EQUIPMENT_PLAN');

-- CreateEnum
CREATE TYPE "AnalysisSection" AS ENUM ('ENPS', 'REVIEWS', 'GUEST_EXPERIENCE', 'STANDARDS', 'GIFTS', 'LABOR_COST', 'PERSONNEL_COSTS', 'FREE_ACCESS', 'DESSERT_WRITEOFF', 'PRODUCT_WRITEOFF', 'ADMIN_COSTS', 'RENT', 'EQUIPMENT', 'SUMMARY');

-- CreateEnum
CREATE TYPE "TriggerCode" AS ENUM ('T1', 'T2', 'T3');

-- CreateEnum
CREATE TYPE "IPVStatusType" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coffee_shop_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coffee_shop_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coffee_shops" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cityId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coffee_shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255),
    "googleOauthId" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'LEADER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_coffee_shop_assignments" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "coffeeShopId" INTEGER NOT NULL,
    "assignedFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_coffee_shop_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_city_assignments" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "assignedFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_city_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "direction" "MetricDirection" NOT NULL DEFAULT 'HIGHER_IS_BETTER',
    "thresholdStrong" DECIMAL(5,2) NOT NULL,
    "thresholdMedium" DECIMAL(5,2) NOT NULL,
    "pointsStrong" DECIMAL(5,2) NOT NULL,
    "pointsMedium" DECIMAL(5,2) NOT NULL,
    "pointsCritical" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "valueScale" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_threshold_overrides" (
    "id" SERIAL NOT NULL,
    "metricId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "thresholdStrong" DECIMAL(5,2) NOT NULL,
    "thresholdMedium" DECIMAL(5,2) NOT NULL,
    "pointsStrong" DECIMAL(5,2) NOT NULL,
    "pointsMedium" DECIMAL(5,2) NOT NULL,
    "pointsCritical" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_threshold_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_color_configs" (
    "id" SERIAL NOT NULL,
    "greenThreshold" DECIMAL(5,2) NOT NULL DEFAULT 80,
    "redThreshold" DECIMAL(5,2) NOT NULL DEFAULT 60,
    "updatedById" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_color_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" SERIAL NOT NULL,
    "coffeeShopId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL,
    "drinksCount" INTEGER,
    "status" "ReportStatus" NOT NULL DEFAULT 'NOT_FILLED',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "submittedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_values" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "metricId" INTEGER NOT NULL,
    "absoluteValue" DECIMAL(12,2),
    "computedPercent" DECIMAL(5,2),
    "zone" "MetricZone",
    "pointsAwarded" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_analyses" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "questionKey" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_questions" (
    "id" SERIAL NOT NULL,
    "section" "AnalysisSection" NOT NULL,
    "questionKey" VARCHAR(255) NOT NULL,
    "label" VARCHAR(500) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_links" (
    "id" SERIAL NOT NULL,
    "coffeeShopId" INTEGER NOT NULL,
    "linkType" "ReportLinkType" NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_edit_logs" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "editedById" INTEGER NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fieldChanged" VARCHAR(255) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,

    CONSTRAINT "report_edit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_change_logs" (
    "id" SERIAL NOT NULL,
    "changedById" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fieldChanged" VARCHAR(255) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,

    CONSTRAINT "config_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trigger_configs" (
    "id" SERIAL NOT NULL,
    "code" "TriggerCode" NOT NULL,
    "thresholdRating" DECIMAL(5,2) NOT NULL,
    "monthsCount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trigger_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipv_statuses" (
    "id" SERIAL NOT NULL,
    "coffeeShopId" INTEGER NOT NULL,
    "triggerCode" "TriggerCode" NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "IPVStatusType" NOT NULL DEFAULT 'NOT_STARTED',
    "statusChangedBy" INTEGER,
    "statusChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipv_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trigger_exemptions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "setById" INTEGER NOT NULL,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedById" INTEGER,
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "trigger_exemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "coffeeShopId" INTEGER NOT NULL,
    "reportId" INTEGER,
    "authorId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "coffee_shop_categories_name_key" ON "coffee_shop_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleOauthId_key" ON "users"("googleOauthId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_coffee_shop_assignments_userId_coffeeShopId_key" ON "user_coffee_shop_assignments"("userId", "coffeeShopId");

-- CreateIndex
CREATE UNIQUE INDEX "user_city_assignments_userId_cityId_key" ON "user_city_assignments"("userId", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "metric_threshold_overrides_metricId_categoryId_key" ON "metric_threshold_overrides"("metricId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_coffeeShopId_year_month_key" ON "monthly_reports"("coffeeShopId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "metric_values_reportId_metricId_key" ON "metric_values"("reportId", "metricId");

-- CreateIndex
CREATE UNIQUE INDEX "report_analyses_reportId_questionKey_key" ON "report_analyses"("reportId", "questionKey");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_questions_questionKey_key" ON "analysis_questions"("questionKey");

-- CreateIndex
CREATE UNIQUE INDEX "trigger_configs_code_key" ON "trigger_configs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ipv_statuses_coffeeShopId_triggerCode_key" ON "ipv_statuses"("coffeeShopId", "triggerCode");

-- AddForeignKey
ALTER TABLE "coffee_shops" ADD CONSTRAINT "coffee_shops_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coffee_shops" ADD CONSTRAINT "coffee_shops_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "coffee_shop_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coffee_shop_assignments" ADD CONSTRAINT "user_coffee_shop_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coffee_shop_assignments" ADD CONSTRAINT "user_coffee_shop_assignments_coffeeShopId_fkey" FOREIGN KEY ("coffeeShopId") REFERENCES "coffee_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_city_assignments" ADD CONSTRAINT "user_city_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_city_assignments" ADD CONSTRAINT "user_city_assignments_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_threshold_overrides" ADD CONSTRAINT "metric_threshold_overrides_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_threshold_overrides" ADD CONSTRAINT "metric_threshold_overrides_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "coffee_shop_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_coffeeShopId_fkey" FOREIGN KEY ("coffeeShopId") REFERENCES "coffee_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_values" ADD CONSTRAINT "metric_values_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "monthly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_values" ADD CONSTRAINT "metric_values_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_analyses" ADD CONSTRAINT "report_analyses_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "monthly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_coffeeShopId_fkey" FOREIGN KEY ("coffeeShopId") REFERENCES "coffee_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_edit_logs" ADD CONSTRAINT "report_edit_logs_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "monthly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_edit_logs" ADD CONSTRAINT "report_edit_logs_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_change_logs" ADD CONSTRAINT "config_change_logs_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipv_statuses" ADD CONSTRAINT "ipv_statuses_coffeeShopId_fkey" FOREIGN KEY ("coffeeShopId") REFERENCES "coffee_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trigger_exemptions" ADD CONSTRAINT "trigger_exemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_coffeeShopId_fkey" FOREIGN KEY ("coffeeShopId") REFERENCES "coffee_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
