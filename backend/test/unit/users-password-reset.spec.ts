import { createHash } from 'crypto';
import { UsersService } from '../../src/users/users.service';

describe('UsersService password reset tokens', () => {
  it('returns a cryptographically sized secret and stores only its digest for 24 hours', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prisma = { passwordResetToken: { create } };
    const service = new UsersService(prisma as any);
    const before = Date.now();

    const token = await service.createPasswordResetToken(12);

    const data = create.mock.calls[0][0].data;
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(data.token).toBe(createHash('sha256').update(token).digest('hex'));
    expect(data.token).not.toBe(token);
    expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000);
    expect(data.expiresAt.getTime()).toBeLessThan(before + 24 * 60 * 60 * 1000 + 1000);
  });

  it('looks up reset tokens by digest rather than querying with the bearer secret', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const prisma = { passwordResetToken: { findUnique } };
    const service = new UsersService(prisma as any);

    await service.findByResetToken('raw-reset-token');

    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { token: createHash('sha256').update('raw-reset-token').digest('hex') },
    }));
  });

  it('claims a valid token and changes the password in one transaction', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const userUpdate = jest.fn().mockResolvedValue({});
    const transactionClient = {
      passwordResetToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 4,
          userId: 12,
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
        }),
        updateMany,
      },
      user: { update: userUpdate },
    };
    const prisma = {
      $transaction: jest.fn((operation) => operation(transactionClient)),
    };
    const service = new UsersService(prisma as any);

    await expect(service.completePasswordReset('raw-reset-token', 'new-hash')).resolves.toBe(true);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 4, usedAt: null }),
    }));
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 12 },
      data: { passwordHash: 'new-hash' },
    });
  });

  it('does not change a password when another request already claimed the token', async () => {
    const userUpdate = jest.fn();
    const transactionClient = {
      passwordResetToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 4,
          userId: 12,
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      user: { update: userUpdate },
    };
    const prisma = {
      $transaction: jest.fn((operation) => operation(transactionClient)),
    };
    const service = new UsersService(prisma as any);

    await expect(service.completePasswordReset('raw-reset-token', 'new-hash')).resolves.toBe(false);
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
