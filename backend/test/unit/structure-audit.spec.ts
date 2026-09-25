import { CitiesService } from '../../src/cities/cities.service';
import { CoffeeShopsService } from '../../src/coffee-shops/coffee-shops.service';

describe('Structure directory and audit', () => {
  it('can include inactive coffee shops for the administrative directory', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new CitiesService({ city: { findMany } } as never);

    await service.findAll(undefined, true);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({ coffeeShops: { orderBy: { name: 'asc' } } }),
    }));
  });

  it('writes an audit record when a coffee shop is reactivated', async () => {
    const audit: any[] = [];
    const prisma = {
      $transaction: async (work: (tx: any) => Promise<unknown>) => work({
        coffeeShop: {
          findUnique: async () => ({ id: 9, name: 'Закрытая', isActive: false }),
          update: async ({ data }: any) => ({ id: 9, name: 'Закрытая', isActive: data.isActive }),
        },
        configChangeLog: {
          create: async ({ data }: any) => { audit.push(data); return data; },
        },
      }),
    };
    const service = new CoffeeShopsService(prisma as never);

    const result = await service.update(9, { isActive: true }, 3);

    expect(result).toMatchObject({ id: 9, isActive: true });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ changedById: 3, fieldChanged: 'structure:coffee-shop:9:update' });
    expect(JSON.parse(audit[0].oldValue)).toMatchObject({ isActive: false });
    expect(JSON.parse(audit[0].newValue)).toMatchObject({ isActive: true });
  });
});
