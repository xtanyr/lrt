import { Module } from '@nestjs/common';
import { IpvTriggersService } from './ipv-triggers.service';
import { IpvTriggersController } from './ipv-triggers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TriggerMonitorService } from './trigger-monitor.service';

@Module({
  imports: [PrismaModule],
  providers: [IpvTriggersService, TriggerMonitorService],
  controllers: [IpvTriggersController],
  exports: [IpvTriggersService],
})
export class IpvTriggersModule {}
