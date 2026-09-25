import { Module } from '@nestjs/common';
import { CoffeeShopsService } from './coffee-shops.service';
import { CoffeeShopsController } from './coffee-shops.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CitiesModule } from '../cities/cities.module';

@Module({
  imports: [PrismaModule, CitiesModule],
  providers: [CoffeeShopsService],
  controllers: [CoffeeShopsController],
  exports: [CoffeeShopsService],
})
export class CoffeeShopsModule {}
