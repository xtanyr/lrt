import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CitiesModule } from './cities/cities.module';
import { CoffeeShopsModule } from './coffee-shops/coffee-shops.module';
import { ReportsModule } from './reports/reports.module';
import { MetricsModule } from './metrics/metrics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IpvTriggersModule } from './ipv-triggers/ipv-triggers.module';
import { AdminModule } from './admin/admin.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScoringEngineModule } from './scoring/scoring-engine.module';
import { ImportModule } from './imports/import.module';
import { ScheduledTasksService } from './common/jobs/scheduled-tasks.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CitiesModule,
    CoffeeShopsModule,
    ReportsModule,
    MetricsModule,
    DashboardModule,
    IpvTriggersModule,
    AdminModule,
    CommentsModule,
    NotificationsModule,
    ScoringEngineModule,
    ImportModule,
    HealthModule,
  ],
  providers: [ScheduledTasksService],
})
export class AppModule {}
