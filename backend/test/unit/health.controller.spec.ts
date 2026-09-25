import { HealthController } from '../../src/health/health.controller';

describe('HealthController', () => {
  it('reports readiness only after a database query succeeds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) };

    await expect(new HealthController(prisma as any).getHealth()).resolves.toEqual({
      status: 'ok',
      database: 'ok',
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('does not turn database failures into a false healthy response', async () => {
    const failure = new Error('database unavailable');
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(failure) };

    await expect(new HealthController(prisma as any).getHealth()).rejects.toBe(failure);
  });
});
