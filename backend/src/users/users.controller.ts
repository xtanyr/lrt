import { Controller, Get, Param, Body, Patch, UseGuards } from '@nestjs/common';
import { UsersAdminService } from './users-admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COO)
export class UsersController {
 constructor(private readonly users: UsersAdminService) {}
 @Get(':id') findOne(@Param('id') id:string){return this.users.findOne(Number(id));}
 @Patch(':id') update(@Param('id') id:string,@Body() body:any,@GetUser() user:any){return this.users.update(Number(id),body,user.id);}
 @Patch(':id/role') role(@Param('id') id:string,@Body() body:any,@GetUser() user:any){return this.users.update(Number(id),{role:body.role},user.id);}
 @Patch(':id/cities') cities(@Param('id') id:string,@Body() body:any,@GetUser() user:any){return this.users.update(Number(id),{cityIds:body.cityIds},user.id);}
 @Patch(':id/coffee-shops') shops(@Param('id') id:string,@Body() body:any,@GetUser() user:any){return this.users.update(Number(id),{coffeeShopIds:body.coffeeShopIds},user.id);}
}
