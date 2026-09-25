import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService, Actor } from '../common/access.service';
import { meaningfulText, numberValue, positiveId } from '../common/validation';

@Injectable()
export class IpvTriggersService {
 constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}
 getTriggerConfigs() {return this.prisma.triggerConfig.findMany({orderBy:{code:'asc'}});}
 async updateTriggerConfig(id: number, data: any, user: Actor) {
  const fields=['thresholdRating','monthsCount','minMonthsOnPosition','minMonthsSinceApproval','isActive'];
  if (!data || Object.keys(data).some(k=>!fields.includes(k))) throw new BadRequestException('Неизвестное поле конфигурации');
  const update:any={};
  for(const key of fields) if(data[key]!==undefined) {
   if(key==='isActive') {if(typeof data[key]!=='boolean')throw new BadRequestException('Ожидается логическое значение');update[key]=data[key];}
   else {const value=numberValue(data[key],key)!;if(value<0||value>100||(key!=='thresholdRating'&&(!Number.isInteger(value)||value>36||(key==='monthsCount'&&value===0))))throw new BadRequestException('Недопустимый параметр триггера');update[key]=value;}
  }
  return this.prisma.$transaction(async tx=>{
   const old=await tx.triggerConfig.findUniqueOrThrow({where:{id}});
   const result=await tx.triggerConfig.update({where:{id},data:update});
   await tx.configChangeLog.create({data:{changedById:user.id!,fieldChanged:'trigger:'+id,oldValue:JSON.stringify(old),newValue:JSON.stringify(result)}});
   return result;
  });
 }
 async getIpvStatuses(user: Actor) {
  const rows=await this.prisma.iPVStatus.findMany({where:{coffeeShop:this.access.shopWhere(user)},include:{coffeeShop:{include:{city:true,assignments:{include:{user:{select:{exemptions:{where:{isActive:true},select:{id:true,reason:true}}}}}}}}},orderBy:{triggeredAt:'desc'}});
  return rows.map(r=>({...r,rule:r.triggerCode,severity:'critical',daysOverdue:r.status==='NOT_STARTED'?Math.max(0,Math.floor((Date.now()-r.triggeredAt.getTime())/86400000)-14):0}));
 }
 async updateIpvStatus(id: number, data: any, user: Actor) {
  if(!['IN_PROGRESS','COMPLETED'].includes(data?.status))throw new BadRequestException('Некорректный статус');
  const old=await this.prisma.iPVStatus.findUnique({where:{id}});
  if(!old)throw new NotFoundException('ИПВ не найден');
  await this.access.requireShop(user,old.coffeeShopId);
  if(old.status==='COMPLETED'||(old.status==='NOT_STARTED'&&data.status==='COMPLETED'))throw new BadRequestException('Сначала начните ИПВ');
  if(data.status==='COMPLETED'&&!meaningfulText(data.closeReason))throw new BadRequestException('Укажите итог ИПВ');
  return this.prisma.$transaction(async tx=>{
   const result=await tx.iPVStatus.update({where:{id},data:{status:data.status,statusChangedBy:user.id,statusChangedAt:new Date()},include:{coffeeShop:{include:{city:true}}}});
   await tx.notification.updateMany({where:{ipvStatusId:id},data:{isRead:true,readAt:new Date()}});
   await tx.configChangeLog.create({data:{changedById:user.id!,fieldChanged:'ipv:'+id,oldValue:old.status,newValue:JSON.stringify({status:data.status,closeReason:data.closeReason})}});
   return result;
  });
 }
 private async requireLeader(user: Actor,userId: number) {
  const leader=await this.prisma.user.findUnique({where:{id:userId},include:{coffeeShopAssignments:{include:{coffeeShop:true}}}});
  if(!leader||leader.role!=='LEADER')throw new NotFoundException('Лидер не найден');
  if(!this.access.global(user)) {
   if(!leader.coffeeShopAssignments.length)throw new ForbiddenException('Лидер вне вашей зоны');
   for(const assignment of leader.coffeeShopAssignments)await this.access.requireShop(user,assignment.coffeeShopId);
  }
  return leader;
 }
 async createExemption(data: any,user: Actor) {
  const userId=positiveId(data.userId);await this.requireLeader(user,userId);
  if(!meaningfulText(data.reason)||data.reason.length>1000)throw new BadRequestException('Укажите причину исключения');
  return this.prisma.triggerExemption.create({data:{userId,reason:data.reason.trim(),setById:user.id!},include:{user:{select:{id:true,name:true}}}});
 }
 async clearExemption(id: number,user: Actor) {
  const exemption=await this.prisma.triggerExemption.findUnique({where:{id}});
  if(!exemption)throw new NotFoundException('Исключение не найдено');
  await this.requireLeader(user,exemption.userId);
  if(!this.access.global(user)&&exemption.setById!==user.id)throw new ForbiddenException('Снять исключение может автор или COO');
  return this.prisma.triggerExemption.update({where:{id},data:{isActive:false,clearedById:user.id,clearedAt:new Date()}});
 }
 async getExemptions(user: Actor) {
  const where:any={isActive:true};
  if(!this.access.global(user))where.user={coffeeShopAssignments:{some:{coffeeShop:this.access.shopWhere(user)}}};
  return this.prisma.triggerExemption.findMany({where,include:{user:{select:{id:true,name:true}}}});
 }
}
