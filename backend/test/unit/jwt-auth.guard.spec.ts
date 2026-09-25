import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  function context(request: any) {
    return { switchToHttp: () => ({ getRequest: () => request }) } as any;
  }

  it('loads the current database user and exposes canonical id plus compatibility sub', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 42, role: 'ADMIN' }) };
    const config = { get: jest.fn().mockReturnValue('secret') };
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({
      id: 42,
      name: 'Current Name',
      email: 'current@example.com',
      role: 'LEADER',
      coffeeShopAssignments: [{ coffeeShopId: 3 }],
      cityAssignments: [],
    }) } };
    const guard = new (JwtAuthGuard as any)(jwt, config, prisma) as JwtAuthGuard;
    const request: any = { headers: { authorization: 'Bearer valid-token' }, cookies: {} };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 42,
      sub: 42,
      name: 'Current Name',
      email: 'current@example.com',
      role: 'LEADER',
      coffeeShopAssignments: [{ coffeeShopId: 3 }],
      cityAssignments: [],
    });
  });

  it('rejects a valid token when its user no longer exists', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 42 }) };
    const config = { get: jest.fn().mockReturnValue('secret') };
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const guard = new (JwtAuthGuard as any)(jwt, config, prisma) as JwtAuthGuard;

    await expect(guard.canActivate(context({ headers: {}, cookies: { accessToken: 'valid-token' } })))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });
});
