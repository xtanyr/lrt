import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersAdminService } from './users-admin.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, UsersAdminService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
