const assert = require('node:assert/strict');
const { PrismaClient, UserRole } = require('@prisma/client');

const year = Number(process.env.UAT_YEAR || new Date().getFullYear());
assert(Number.isInteger(year) && year >= 2000 && year <= 2100, 'UAT_YEAR must be a valid year');

const prisma = new PrismaClient();
const roleUsers = [
  ['admin@skuratovcoffee.ru', UserRole.ADMIN],
  ['coo@skuratovcoffee.ru', UserRole.COO],
  ['cityleader@skuratovcoffee.ru', UserRole.CITY_LEADER],
  ['leader@skuratovcoffee.ru', UserRole.LEADER],
];
const demoLeaders = [
  'anna.lebedeva.test@skuratovcoffee.ru',
  'maxim.orlov.test@skuratovcoffee.ru',
  'elena.volkova.test@skuratovcoffee.ru',
  'ilya.sokolov.test@skuratovcoffee.ru',
];

async function main() {
  for (const [email, role] of roleUsers) {
    const user = await prisma.user.findUnique({ where: { email } });
    assert(user && user.role === role, `Missing ${role} UAT account: ${email}`);
  }

  const shops = await prisma.coffeeShop.findMany({
    where: { name: { in: ['Coffee Shop 1', 'Coffee Shop 2', 'Coffee Shop 3', 'Coffee Shop 4'] } },
    select: { id: true, name: true },
  });
  assert.equal(shops.length, 4, 'Expected four yearly-demo coffee shops');

  for (let index = 0; index < demoLeaders.length; index += 1) {
    const leader = await prisma.user.findUnique({ where: { email: demoLeaders[index] } });
    assert(leader && leader.role === UserRole.LEADER, `Missing demo leader: ${demoLeaders[index]}`);
    const shop = shops.find((candidate) => candidate.name === `Coffee Shop ${index + 1}`);
    const reports = await prisma.monthlyReport.findMany({
      where: { coffeeShopId: shop.id, year, status: 'SUBMITTED' },
      select: { month: true, submittedById: true },
    });
    assert.equal(reports.length, 12, `${shop.name} should have 12 submitted reports for ${year}`);
    assert.deepEqual(reports.map((report) => report.month).sort((a, b) => a - b), Array.from({ length: 12 }, (_, i) => i + 1));
    assert(reports.every((report) => report.submittedById === leader.id), `${shop.name} reports should retain their leader as submitter`);
  }

  const duplicateAssignments = await prisma.userCoffeeShopAssignment.groupBy({
    by: ['coffeeShopId'],
    where: { assignedUntil: null },
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });
  assert.equal(duplicateAssignments.length, 0, 'A coffee shop has more than one active leader assignment');
  console.log(`UAT seed verified: four roles, four leaders, 48 submitted reports for ${year}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
