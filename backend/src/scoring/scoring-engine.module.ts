import { Module } from '@nestjs/common';
import { ScoringEngineService } from './scoring-engine.service';
import { ScoringController } from './scoring.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ScoringEngineService],
  controllers: [ScoringController],
  exports: [ScoringEngineService],
})
export class ScoringEngineModule {}
