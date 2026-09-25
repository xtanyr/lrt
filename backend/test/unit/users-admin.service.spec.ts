import { BadRequestException } from '@nestjs/common';
import { UsersAdminService } from '../../src/users/users-admin.service';

describe('UsersAdminService coffee shop assignment history', () => {
  const oldUser = {
    id: 5,
    name: 'Old leader',
    email: 'old@example.com',
    role: 'LEADER',
    approvedAt: null,
    coffeeShopAssignments: [],
    cityAssignments: [],
  };

  function setup(active: { id: number } | null) {
    const tx = {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(oldUser),
        update: jest.fn().mockResolvedValue(oldUser),
      },
      city: { count: jest.fn() },
      userCityAssignment: { deleteMany: jest.fn(), upsert: jest.fn() },
      coffeeShop: { count: jest.fn().mockResolvedValue(1) },
      userCoffeeShopAssignment: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findFirst: jest.fn().mockResolvedValue(active),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
      configChangeLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    return { service: new UsersAdminService(prisma as any), tx };
  }

  it('closes the selected current assignment without deleting its history', async () => {
    const { service, tx } = setup({ id: 11 });

    await service.update(5, {
      coffeeShopIds: [1],
      assignmentFrom: '2026-01-01',
      assignmentUntil: '2026-08-31',
    }, 1);

    expect(tx.userCoffeeShopAssignment.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: {
        assignedFrom: new Date('2026-01-01'),
        assignedUntil: new Date('2026-08-31'),
      },
    });
    expect(tx.userCoffeeShopAssignment.create).not.toHaveBeenCalled();
  });

  it('creates a new active assignment when the removal date is empty', async () => {
    const { service, tx } = setup(null);

    await service.update(5, {
      coffeeShopIds: [2],
      assignmentFrom: '2026-09-01',
      assignmentUntil: '',
    }, 1);

    expect(tx.userCoffeeShopAssignment.create).toHaveBeenCalledWith({
      data: {
        userId: 5,
        coffeeShopId: 2,
        assignedFrom: new Date('2026-09-01'),
        assignedUntil: null,
      },
    });
  });

  it('rejects a removal date before the appointment date', async () => {
    const { service } = setup({ id: 11 });

    await expect(service.update(5, {
      coffeeShopIds: [1],
      assignmentFrom: '2026-09-01',
      assignmentUntil: '2026-08-31',
    }, 1)).rejects.toBeInstanceOf(BadRequestException);
  });
});
