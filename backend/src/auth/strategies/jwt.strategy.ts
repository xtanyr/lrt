import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService, private readonly prisma: PrismaService) {
    const secret = configService.get<string>('JWT_SECRET') || 'default-secret';
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, role: true, cityAssignments: { select: { cityId: true } }, coffeeShopAssignments: { where: { assignedUntil: null }, select: { coffeeShopId: true } } } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      cityAssignments: user.cityAssignments,
      coffeeShopAssignments: user.coffeeShopAssignments,
    };
  }
}
