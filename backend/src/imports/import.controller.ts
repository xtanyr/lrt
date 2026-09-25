import { Controller, Post, UseGuards, UploadedFile, BadRequestException, Body, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('imports')
@ApiBearerAuth()
@Controller('admin/imports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('preview')
  @Roles(UserRole.ADMIN, UserRole.COO)
  @ApiOperation({ summary: 'Preview xlsx import for historical data' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  preview(@GetUser() user: any, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.importService.previewImport(file, user.id);
  }

  @Post('confirm')
  @Roles(UserRole.ADMIN, UserRole.COO)
  @ApiOperation({ summary: 'Confirm import and save historical data' })
  confirm(@GetUser() user: any, @Body() data: any) {
    return this.importService.confirmImport(data, user.id);
  }
}
