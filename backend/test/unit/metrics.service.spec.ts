import { MetricsService } from '../../src/metrics/metrics.service';
import { BadRequestException } from '@nestjs/common';

describe('MetricsService configuration writes', () => {
  it('stores canonical fields, synchronized legacy aliases, and an audit record', async () => {
    const audit: any[] = [];
    const prisma = {
      $transaction: async (work: (tx: any) => Promise<unknown>) => work({
        metric: {
          create: async ({ data }: any) => ({ id: 12, isActive: true, ...data }),
        },
        configChangeLog: {
          create: async ({ data }: any) => {
            audit.push(data);
            return data;
          },
        },
      }),
    };
    const service = new MetricsService(prisma as never);

    const created = await service.create({
      name: 'Новая метрика',
      code: 'NEW_METRIC',
      unit: '%',
      direction: 'HIGHER_IS_BETTER',
      targetValue: 90,
      midValue: 75,
      ptTarget: 11.5,
      ptMid: 5.75,
    } as any, 7);

    expect(created).toMatchObject({
      thresholdStrong: 90,
      thresholdMedium: 75,
      pointsStrong: 11.5,
      pointsMedium: 5.75,
      targetValue: 90,
      midValue: 75,
      ptTarget: 11.5,
      ptMid: 5.75,
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ changedById: 7, fieldChanged: 'metric:12:create' });
    expect(JSON.parse(audit[0].newValue)).toMatchObject({ code: 'NEW_METRIC', thresholdStrong: 90 });
  });

  it('rejects a null legacy field that would desynchronize configuration', async () => {
    const prisma = {
      metric: {
        findUnique: jest.fn().mockResolvedValue({
          id: 12,
          direction: 'HIGHER_IS_BETTER',
          thresholdStrong: 90,
          thresholdMedium: 75,
          pointsStrong: 11.5,
          pointsMedium: 5.75,
          pointsCritical: 0,
          targetValue: 90,
        }),
      },
      $transaction: jest.fn(),
    };
    const service = new MetricsService(prisma as never);

    await expect(service.update(12, { targetValue: null }, 7)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
