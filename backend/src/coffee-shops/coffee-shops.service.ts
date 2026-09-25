import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoffeeShopsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(cityId?: number, scope: any = {}) {
    return this.prisma.coffeeShop.findMany({
      where: {
        isActive: true,
        AND: [scope],
        ...(cityId ? { cityId } : {}),
      },
      include: {
        city: true,
        category: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.coffeeShop.findUnique({
      where: { id },
      include: {
        city: true,
        category: true,
      },
    });
  }

  async create(data: { name: string; cityId: number; categoryId?: number }, changedById: number) {
    return this.prisma.$transaction(async (tx) => {
      const shop = await tx.coffeeShop.create({
        data,
        include: { city: true, category: true },
      });
      await tx.configChangeLog.create({
        data: { changedById, fieldChanged: `structure:coffee-shop:${shop.id}:create`, newValue: JSON.stringify(shop) },
      });
      return shop;
    });
  }

  async update(id: number, data: { name?: string; isActive?: boolean; categoryId?: number }, changedById: number) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.coffeeShop.findUnique({ where: { id }, include: { city: true, category: true } });
      const shop = await tx.coffeeShop.update({
        where: { id },
        data,
        include: { city: true, category: true },
      });
      await tx.configChangeLog.create({
        data: {
          changedById,
          fieldChanged: `structure:coffee-shop:${id}:update`,
          oldValue: JSON.stringify(current),
          newValue: JSON.stringify(shop),
        },
      });
      return shop;
    });
  }
}
