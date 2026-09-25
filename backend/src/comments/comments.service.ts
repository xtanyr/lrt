import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums/user-role.enum';
import { AccessService, Actor } from '../common/access.service';
import { meaningfulText, positiveId } from '../common/validation';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  async getComments(coffeeShopId: number, user: Actor, reportId?: number) {
    await this.access.requireShop(user, coffeeShopId);
    return this.prisma.comment.findMany({
      where: {
        coffeeShopId,
        ...(reportId ? { reportId } : {}),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComment(data: { coffeeShopId: number; reportId?: number; text: string }, user: Actor) {
    const coffeeShopId = positiveId(data.coffeeShopId);
    await this.access.requireShop(user, coffeeShopId);
    if (!meaningfulText(data.text) || data.text.length > 20000) throw new BadRequestException('Введите текст комментария');
    if (data.reportId) {
      const report = await this.access.requireReport(user, positiveId(data.reportId));
      if (report.coffeeShopId !== coffeeShopId) throw new BadRequestException('Отчёт другой кофейни');
    }
    return this.prisma.comment.create({
      data: { coffeeShopId, reportId: data.reportId, text: data.text.trim(), authorId: user.id! },
      include: {
        author: { select: { id: true, name: true, email: true } },
        coffeeShop: true,
      },
    });
  }

  async updateComment(id: number, text: string, user: Actor) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.access.requireShop(user, comment.coffeeShopId);
    if (!meaningfulText(text) || text.length > 20000) throw new BadRequestException('Введите текст комментария');

    if (comment.authorId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.COO) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { text },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async deleteComment(id: number, user: Actor) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.access.requireShop(user, comment.coffeeShopId);

    if (comment.authorId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.COO) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return this.prisma.comment.delete({ where: { id } });
  }
}
