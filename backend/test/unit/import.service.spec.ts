import { BadRequestException, ConflictException } from '@nestjs/common';
import { ImportService } from '../../src/imports/import.service';

const activeMetrics = [
  { id: 1, code: 'ENPS', name: 'eNPS', unit: '%' },
  { id: 6, code: 'LABOR_COST', name: 'Доля ФОТ в выручке', unit: '%' },
];

const validPayload = {
  coffeeShopId: 7,
  sourceFile: 'synthetic-history.xlsx',
  overwriteExisting: false,
  periods: [{
    selected: true,
    year: 2025,
    month: 12,
    revenue: 500000,
    drinksCount: 13000,
    sourceRating: 21.5,
    sourceRatingCell: 'Метрики!B354',
    sourceMaxPoints: 21.5,
    sourceSheet: 'Метрики',
    issues: [],
    formData: { sourceSheet: 'декабрь 25', fields: [] },
    rows: [
      {
        metricId: 1,
        rawValue: '95',
        code: 'ENPS',
        metricName: 'eNPS',
        unit: '%',
        absoluteValue: 95,
        computedPercent: null,
        sourceValueCell: 'Метрики!B2',
        sourcePoints: 13,
        sourcePointsCell: 'Метрики!B345',
        sourceFormula: '=LEGACY_ENPS()',
        sourcePointsStrong: 13,
        sourcePointsMedium: 6.5,
        sourceThresholdStrong: 95,
        sourceThresholdMedium: 80,
      },
      {
        metricId: 6,
        rawValue: '11%',
        code: 'LABOR_COST',
        metricName: 'Доля ФОТ в выручке',
        unit: '%',
        absoluteValue: 55000,
        computedPercent: 11,
        sourceValueCell: 'Метрики!B7',
        sourcePoints: 8.5,
        sourcePointsCell: 'Метрики!B350',
        sourceFormula: '=LEGACY_LABOR()',
        sourcePointsStrong: 8.5,
        sourcePointsMedium: 4.25,
        sourceThresholdStrong: 11,
        sourceThresholdMedium: 16,
      },
    ],
  }],
};

function fakePrisma(existing: Array<{ id: number; year: number; month: number; isLocked: boolean }> = []) {
  const created: any[] = [];
  const updated: any[] = [];
  const tx = {
    configChangeLog: { create: jest.fn().mockResolvedValue({}) },
    monthlyReport: {
      findMany: async () => existing,
      create: async (args: any) => {
        created.push(args.data);
        return { id: 100 + created.length, ...args.data };
      },
      update: async (args: any) => {
        updated.push(args);
        return { id: args.where.id, ...args.data };
      },
    },
  };
  return {
    created,
    updated,
    metric: { findMany: async () => activeMetrics },
    $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx),
  };
}

describe('ImportService.confirmImport', () => {
  it('creates locked reports atomically with source rating/config/provenance intact', async () => {
    const prisma = fakePrisma();
    const service = new ImportService(prisma as any);

    const result = await service.confirmImport(validPayload, 42);

    expect(result).toEqual({ imported: [{ year: 2025, month: 12, reportId: 101 }] });
    expect(prisma.created).toHaveLength(1);
    expect(prisma.created[0]).toMatchObject({
      coffeeShopId: 7,
      year: 2025,
      month: 12,
      status: 'SUBMITTED',
      isLocked: true,
      submittedById: 42,
      ratingSnapshot: {
        rating: 21.5,
        totalPoints: 21.5,
        maxPoints: 21.5,
        source: {
          kind: 'legacy-xlsx',
          fileName: 'synthetic-history.xlsx',
          ratingCell: 'Метрики!B354',
        },
      },
    });
    expect(prisma.created[0].metricValues.create[1]).toMatchObject({
      metricId: 6,
      absoluteValue: expect.anything(),
      computedPercent: expect.anything(),
    });
  });

  it('refuses existing reports by default and always refuses locked reports', async () => {
    const unlocked = new ImportService(fakePrisma([{ id: 1, year: 2025, month: 12, isLocked: false }]) as any);
    await expect(unlocked.confirmImport(validPayload, 42)).rejects.toBeInstanceOf(ConflictException);

    const lockedPayload = { ...validPayload, overwriteExisting: true };
    const locked = new ImportService(fakePrisma([{ id: 1, year: 2025, month: 12, isLocked: true }]) as any);
    await expect(locked.confirmImport(lockedPayload, 42)).rejects.toBeInstanceOf(ConflictException);
  });

  it('validates every selected row before opening the transaction', async () => {
    const prisma = fakePrisma();
    const payload = JSON.parse(JSON.stringify(validPayload));
    payload.periods[0].rows[1].metricId = undefined;
    const service = new ImportService(prisma as any);

    await expect(service.confirmImport(payload, 42)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.created).toHaveLength(0);
  });
});
