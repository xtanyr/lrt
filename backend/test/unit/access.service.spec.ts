import { AccessService } from '../../src/common/access.service';

describe('Object access boundaries', () => {
  const shop = { id: 8, cityId: 2, isActive: true };
  const prisma = { coffeeShop: { findUnique: async () => shop }, monthlyReport: { findUnique: async () => ({ id: 4, coffeeShopId: 8 }) } };
  const service = new AccessService(prisma as any);
  it('denies a leader assigned to another shop', async () => {
    await expect(service.requireShop({ id: 1, role: 'LEADER', coffeeShopAssignments: [{ coffeeShopId: 9 }] }, 8)).rejects.toThrow();
  });
  it('allows a leader of the containing city', async () => {
    await expect(service.requireShop({ id: 1, role: 'CITY_LEADER', cityAssignments: [{ cityId: 2 }] }, 8)).resolves.toEqual(shop);
  });
  it('denies missing identity even with global role', async () => {
    await expect(service.requireShop({ role: 'ADMIN' }, 8)).rejects.toThrow();
  });
  it('checks ownership through report id', async () => {
    await expect(service.requireReport({ id: 1, role: 'LEADER', coffeeShopAssignments: [] }, 4)).rejects.toThrow();
  });
});
