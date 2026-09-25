import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CoffeeShopsModule } from '../coffee-shops/coffee-shops.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [PrismaModule, CoffeeShopsModule, MetricsModule],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
