import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { reportPeriodState } from '../report-period';
@Injectable()
export class ScheduledTasksService {
  constructor(private readonly prisma: PrismaService) {}
  @Cron('0 0 12 10 * *', { name: 'overdue-reports-job', timeZone: 'Europe/Moscow' })
  async handleOverdueReports() {
    const reports = await this.prisma.monthlyReport.findMany({ where: { status: 'NOT_FILLED' } });
    for (const report of reports) if (reportPeriodState(report.year, report.month).overdue) {
      await this.prisma.monthlyReport.update({ where: { id: report.id }, data: { status: 'OVERDUE' } });
    }
  }
  @Cron('0 0 0 1 * *', { name: 'lock-reports-job', timeZone: 'Europe/Moscow' })
  async handleLockReports() {
    const reports = await this.prisma.monthlyReport.findMany({ where: { isLocked: false } });
    for (const report of reports) if (reportPeriodState(report.year, report.month).locked) {
      // Snapshot was captured with the report. Never recalculate history here.
      await this.prisma.monthlyReport.update({ where: { id: report.id }, data: { isLocked: true } });
    }
  }
}
