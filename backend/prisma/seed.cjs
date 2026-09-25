const { PrismaClient, UserRole, MetricDirection, ReportLinkType, AnalysisSection, TriggerCode } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { readUatSeedEnv } = require('./uat-seed-env.cjs');

const { password } = readUatSeedEnv();
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@skuratovcoffee.ru' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@skuratovcoffee.ru',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log('Created admin user:', admin.email);

  const coo = await prisma.user.upsert({
    where: { email: 'coo@skuratovcoffee.ru' },
    update: {},
    create: {
      name: 'COO User',
      email: 'coo@skuratovcoffee.ru',
      passwordHash,
      role: UserRole.COO,
    },
  });
  console.log('Created COO user:', coo.email);

  const cityLeader = await prisma.user.upsert({
    where: { email: 'cityleader@skuratovcoffee.ru' },
    update: {},
    create: {
      name: 'City Leader',
      email: 'cityleader@skuratovcoffee.ru',
      passwordHash,
      role: UserRole.CITY_LEADER,
    },
  });
  console.log('Created city leader user:', cityLeader.email);

  const leader = await prisma.user.upsert({
    where: { email: 'leader@skuratovcoffee.ru' },
    update: {},
    create: {
      name: 'Coffee Shop Leader',
      email: 'leader@skuratovcoffee.ru',
      passwordHash,
      role: UserRole.LEADER,
    },
  });
  console.log('Created leader user:', leader.email);

  const moscow = await prisma.city.upsert({
    where: { name: 'Москва' },
    update: {},
    create: { name: 'Москва' },
  });
  console.log('Created city:', moscow.name);

  const spb = await prisma.city.upsert({
    where: { name: 'Санкт-Петербург' },
    update: {},
    create: { name: 'Санкт-Петербург' },
  });
  console.log('Created city:', spb.name);

  const kazan = await prisma.city.upsert({
    where: { name: 'Казань' },
    update: {},
    create: { name: 'Казань' },
  });
  console.log('Created city:', kazan.name);

  const coffeeShop1 = await prisma.coffeeShop.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Coffee Shop 1', cityId: moscow.id },
  });
  console.log('Created coffee shop:', coffeeShop1.name);

  const coffeeShop2 = await prisma.coffeeShop.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Coffee Shop 2', cityId: moscow.id },
  });
  console.log('Created coffee shop:', coffeeShop2.name);

  const coffeeShop3 = await prisma.coffeeShop.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Coffee Shop 3', cityId: spb.id },
  });
  console.log('Created coffee shop:', coffeeShop3.name);

  await prisma.userCityAssignment.upsert({
    where: { userId_cityId: { userId: cityLeader.id, cityId: moscow.id } },
    update: {},
    create: { userId: cityLeader.id, cityId: moscow.id },
  });
  console.log('Assigned city leader to Moscow');

  console.log('Created leader role account without a coffee shop assignment');

  const metrics = [
    { name: 'eNPS', code: 'ENPS', unit: '%', direction: MetricDirection.HIGHER_IS_BETTER, thresholdStrong: 95, thresholdMedium: 80, pointsStrong: 11.5, pointsMedium: 5.75, displayOrder: 1, section: AnalysisSection.TEAM_GUESTS, source: 'City leader', targetValue: 95, midValue: 80, ptTarget: 11.5, ptMid: 5.75 },
    { name: 'Скорость разбора отзыва', code: 'REVIEW_SPEED', unit: 'суток', direction: MetricDirection.LOWER_IS_BETTER, thresholdStrong: 2, thresholdMedium: 3, pointsStrong: 11.5, pointsMedium: 5.75, displayOrder: 2, section: AnalysisSection.TEAM_GUESTS, source: 'RocketData', targetValue: 2, midValue: 3, ptTarget: 11.5, ptMid: 5.75 },
    { name: 'Индекс гостевого опыта', code: 'GUEST_EXP', unit: '%', direction: MetricDirection.HIGHER_IS_BETTER, thresholdStrong: 90, thresholdMedium: 75, pointsStrong: 11.5, pointsMedium: 5.75, displayOrder: 3, section: AnalysisSection.TEAM_GUESTS, source: 'City leader', targetValue: 90, midValue: 75, ptTarget: 11.5, ptMid: 5.75 },
    { name: 'Рейтинг стандартов', code: 'STANDARDS', unit: '%', direction: MetricDirection.HIGHER_IS_BETTER, thresholdStrong: 90, thresholdMedium: 75, pointsStrong: 11.5, pointsMedium: 5.75, displayOrder: 4, section: AnalysisSection.TEAM_GUESTS, source: 'City leader', targetValue: 90, midValue: 75, ptTarget: 11.5, ptMid: 5.75 },
    { name: 'Производительность', code: 'PERFORMANCE', unit: 'ед.', direction: MetricDirection.HIGHER_IS_BETTER, thresholdStrong: 11, thresholdMedium: 8.5, pointsStrong: 8.5, pointsMedium: 4.25, displayOrder: 5, section: AnalysisSection.LABOR_COST, source: 'Manual', targetValue: 11, midValue: 8.5, ptTarget: 8.5, ptMid: 4.25 },
    { name: 'Доля ФОТ в выручке', code: 'LABOR_COST', unit: '%', direction: MetricDirection.LOWER_IS_BETTER, thresholdStrong: 11, thresholdMedium: 16, pointsStrong: 8.5, pointsMedium: 4.25, displayOrder: 6, section: AnalysisSection.LABOR_COST, source: 'Finance', targetValue: 11, midValue: 16, ptTarget: 8.5, ptMid: 4.25 },
    { name: 'Доля списания десертов', code: 'DESSERT_WRITEOFF', unit: '%', direction: MetricDirection.LOWER_IS_BETTER, thresholdStrong: 0.8, thresholdMedium: 1, pointsStrong: 8.5, pointsMedium: 4.25, displayOrder: 7, section: AnalysisSection.COSTING, source: 'Finance', targetValue: 0.8, midValue: 1, ptTarget: 8.5, ptMid: 4.25 },
    { name: 'Доля списания продуктов', code: 'PRODUCT_WRITEOFF', unit: '%', direction: MetricDirection.LOWER_IS_BETTER, thresholdStrong: 0.6, thresholdMedium: 1, pointsStrong: 8.5, pointsMedium: 4.25, displayOrder: 8, section: AnalysisSection.COSTING, source: 'Finance', targetValue: 0.6, midValue: 1, ptTarget: 8.5, ptMid: 4.25 },
    { name: 'Доля депозита в выручке', code: 'FREE_ACCESS', unit: '%', direction: MetricDirection.LOWER_IS_BETTER, thresholdStrong: 1.3, thresholdMedium: 1.5, pointsStrong: 8.5, pointsMedium: 4.25, displayOrder: 9, section: AnalysisSection.COSTING, source: 'Finance', targetValue: 1.3, midValue: 1.5, ptTarget: 8.5, ptMid: 4.25 },
    { name: 'Рейтинг отзывов за месяц', code: 'REVIEW_RATING', unit: 'балл', direction: MetricDirection.HIGHER_IS_BETTER, thresholdStrong: 4.8, thresholdMedium: 4.6, pointsStrong: 11.5, pointsMedium: 5.75, displayOrder: 10, section: AnalysisSection.TEAM_GUESTS, source: 'RocketData', targetValue: 4.8, midValue: 4.6, ptTarget: 11.5, ptMid: 5.75 },
  ];

  for (const metricData of metrics) {
    await prisma.metric.upsert({
      where: { code: metricData.code },
      update: metricData,
      create: metricData,
    });
  }
  console.log(`Upserted ${metrics.length} metrics`);

  await prisma.ratingColorConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { greenThreshold: 80, redThreshold: 60 },
  });
  console.log('Created rating color config');

  const triggerConfigs = [
    { code: TriggerCode.T1, thresholdRating: 60, monthsCount: 3 },
    { code: TriggerCode.T2, thresholdRating: 80, monthsCount: 12 },
    { code: TriggerCode.T3, thresholdRating: 0, monthsCount: 3 },
  ];

  for (const config of triggerConfigs) {
    await prisma.triggerConfig.upsert({
      where: { code: config.code },
      update: {},
      create: config,
    });
  }
  console.log(`Created ${triggerConfigs.length} trigger configs`);

  const analysisQuestions = [
    { section: AnalysisSection.ENPS, questionKey: 'enps_problems', label: 'Проблемы', displayOrder: 1 },
    { section: AnalysisSection.ENPS, questionKey: 'enps_reasons', label: 'Причины', displayOrder: 2 },
    { section: AnalysisSection.ENPS, questionKey: 'enps_plan', label: 'План устранения', displayOrder: 3 },
    { section: AnalysisSection.REVIEWS, questionKey: 'reviews_root_causes', label: 'Корневые причины', displayOrder: 1 },
    { section: AnalysisSection.REVIEWS, questionKey: 'reviews_how_fixed', label: 'Как устранили', displayOrder: 2 },
    { section: AnalysisSection.REVIEWS, questionKey: 'reviews_prevention', label: 'План предотвращения', displayOrder: 3 },
    { section: AnalysisSection.REVIEWS, questionKey: 'reviews_speed', label: 'Скорость разбора', displayOrder: 4 },
    { section: AnalysisSection.GUEST_EXPERIENCE, questionKey: 'guest_exp_top_problems', label: 'Топ-3 проблемы', displayOrder: 1 },
    { section: AnalysisSection.GUEST_EXPERIENCE, questionKey: 'guest_exp_repeated_errors', label: 'Повторяющиеся ошибки', displayOrder: 2 },
    { section: AnalysisSection.GUEST_EXPERIENCE, questionKey: 'guest_exp_plan', label: 'План устранения', displayOrder: 3 },
    { section: AnalysisSection.STANDARDS, questionKey: 'standards_top_problems', label: 'Топ-3 проблемы', displayOrder: 1 },
    { section: AnalysisSection.STANDARDS, questionKey: 'standards_repeated_errors', label: 'Повторяющиеся ошибки', displayOrder: 2 },
    { section: AnalysisSection.STANDARDS, questionKey: 'standards_plan', label: 'План устранения', displayOrder: 3 },
    { section: AnalysisSection.GIFTS, questionKey: 'gifts_top_reasons', label: 'Топ-5 причин за месяц', displayOrder: 1 },
    { section: AnalysisSection.GIFTS, questionKey: 'gifts_actions', label: 'Действия по устранению', displayOrder: 2 },
    { section: AnalysisSection.GIFTS, questionKey: 'gifts_plan', label: 'План на месяц', displayOrder: 3 },
    { section: AnalysisSection.LABOR_COST, questionKey: 'labor_lfl_month', label: 'LFL месяц к месяцу по напиткам', displayOrder: 1 },
    { section: AnalysisSection.LABOR_COST, questionKey: 'labor_lfl_year', label: 'LFL год к году', displayOrder: 2 },
    { section: AnalysisSection.LABOR_COST, questionKey: 'labor_revenue_reasons', label: 'Причины роста/падения выручки', displayOrder: 3 },
    { section: AnalysisSection.LABOR_COST, questionKey: 'labor_hypothesis', label: 'Гипотеза на след. месяц', displayOrder: 4 },
    { section: AnalysisSection.LABOR_COST, questionKey: 'labor_performance', label: 'Разбор производительности + потребность в бариста/часах', displayOrder: 5 },
    { section: AnalysisSection.LABOR_COST, questionKey: 'labor_certification', label: 'Сертифицированность бариста, дефицит', displayOrder: 6 },
    { section: AnalysisSection.SUMMARY, questionKey: 'summary_problems', label: '3 главные проблемы месяца', displayOrder: 1 },
    { section: AnalysisSection.SUMMARY, questionKey: 'summary_reasons', label: '3 главные причины', displayOrder: 2 },
    { section: AnalysisSection.SUMMARY, questionKey: 'summary_actions', label: '3 действия на следующий месяц', displayOrder: 3 },
  ];

  for (const q of analysisQuestions) {
    await prisma.analysisQuestion.upsert({
      where: { questionKey: q.questionKey },
      update: {},
      create: q,
    });
  }
  console.log(`Created ${analysisQuestions.length} analysis questions`);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  await prisma.monthlyReport.upsert({
    where: { coffeeShopId_year_month: { coffeeShopId: coffeeShop1.id, year: currentYear, month: currentMonth } },
    update: {},
    create: {
      coffeeShopId: coffeeShop1.id,
      year: currentYear,
      month: currentMonth,
      revenue: 1000000,
      drinksCount: 12000,
      status: 'NOT_FILLED',
    },
  });
  console.log('Created sample report for Coffee Shop 1');

  await prisma.reportLink.upsert({
    where: { id: 1 },
    update: {},
    create: {
      coffeeShopId: coffeeShop1.id,
      linkType: ReportLinkType.GIFT_REASONS,
      url: 'https://example.com/gift-reasons',
    },
  });
  console.log('Created sample report link');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
