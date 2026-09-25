import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(cityIds?: number[], includeInactiveShops = false) {
    return this.prisma.city.findMany({
      where: { isActive: true, ...(cityIds ? { id: { in: cityIds } } : {}) },
      include: {
        coffeeShops: includeInactiveShops ? { orderBy: { name: 'asc' as const } } : { where: { isActive: true }, orderBy: { name: 'asc' as const } },
        _count: { select: { coffeeShops: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.city.findUnique({
      where: { id },
      include: { coffeeShops: { where: { isActive: true } } },
    });
  }

  async create(data: { name: string }, changedById: number) {
    return this.prisma.$transaction(async (tx) => {
      const city = await tx.city.create({
        data,
        include: { coffeeShops: { where: { isActive: true } } },
      });
      await tx.configChangeLog.create({
        data: { changedById, fieldChanged: `structure:city:${city.id}:create`, newValue: JSON.stringify(city) },
      });
      return city;
    });
  }

  async update(id: number, data: { name?: string; isActive?: boolean }, changedById: number) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.city.findUnique({ where: { id } });
      const city = await tx.city.update({ where: { id }, data });
      await tx.configChangeLog.create({
        data: {
          changedById,
          fieldChanged: `structure:city:${id}:update`,
          oldValue: JSON.stringify(current),
          newValue: JSON.stringify(city),
        },
      });
      return city;
    });
  }
}
