import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { previousReportingPeriod } from '../common/report-period';
import { monthsOld, triggerMatch } from './trigger-rules';

@Injectable()
export class TriggerMonitorService {
  constructor(private readonly prisma: PrismaService) {}
  @Cron('0 */15 * * * *', { timeZone: 'Europe/Moscow' })
  async evaluate(now = new Date()) {
    const end = previousReportingPeriod(now);
    const shops = await this.prisma.coffeeShop.findMany({where:{isActive:true},include:{assignments:{include:{user:{include:{exemptions:{where:{isActive:true}}}}}},city:{include:{cityAssignments:true}}}});
    const configs = await this.prisma.triggerConfig.findMany({where:{isActive:true}});
    for (const shop of shops) {
      const leaders = shop.assignments.filter(a => a.user.role === 'LEADER');
      if (!leaders.length || leaders.some(a => a.user.exemptions.length)) continue;
      const reports = await this.prisma.monthlyReport.findMany({where:{coffeeShopId:shop.id,status:'SUBMITTED'},orderBy:[{year:'desc'},{month:'desc'}],take:36});
      for (const config of configs) {
        if (leaders.some(a => !monthsOld(a.assignedFrom, config.minMonthsOnPosition, now) || !monthsOld(a.user.approvedAt, config.minMonthsSinceApproval, now))) continue;
        const match = triggerMatch(reports,config,end.year,end.month);
        if (!match) continue;
        await this.prisma.$transaction(async tx => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(${shop.id}::bigint)`;
          if (await tx.iPVStatus.findFirst({where:{coffeeShopId:shop.id,status:{not:'COMPLETED'}}})) return;
          const key = `ipv:${shop.id}:${config.code}:${end.year}:${end.month}`;
          if (await tx.systemSetting.findUnique({where:{key}})) return;
          const status = await tx.iPVStatus.upsert({where:{coffeeShopId_triggerCode:{coffeeShopId:shop.id,triggerCode:config.code}},create:{coffeeShopId:shop.id,triggerCode:config.code,metricId:match.metricId,triggeredAt:now},update:{status:'NOT_STARTED',metricId:match.metricId,triggeredAt:now,statusChangedAt:null,statusChangedBy:null}});
          await tx.systemSetting.create({data:{key,value:String(status.id)}});
          for (const assignment of shop.city.cityAssignments) await tx.notification.create({data:{userId:assignment.userId,ipvStatusId:status.id,title:'Требует внимания',message:`${shop.name} — сработал триггер ${config.code}`}});
        });
      }
    }
  }
}
