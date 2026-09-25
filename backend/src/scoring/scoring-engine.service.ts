import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateScore } from './rating-calculator';
import { reportPeriodState } from '../common/report-period';

@Injectable()
export class ScoringEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateRating(coffeeShopId: number, year: number, month: number) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { coffeeShopId_year_month: { coffeeShopId, year, month } },
      include: {
        metricValues: true,
      },
    });

    if (!report) {
      throw new BadRequestException('Report not found');
    }

    const reportSnapshot = (report as typeof report & { ratingSnapshot?: unknown }).ratingSnapshot;
    if (report.isLocked || reportPeriodState(year, month).locked) {
      if (!reportSnapshot) {
        throw new BadRequestException('Locked report rating snapshot not found');
      }
      return reportSnapshot;
    }

    const activeMetrics = await this.prisma.metric.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    return calculateScore(activeMetrics, report);
  }
}
