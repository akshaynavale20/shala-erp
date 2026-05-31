import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: JwtPayload) {
    // Attaches to request.user
    return {
      id: payload.sub,
      email: payload.email,
      sansthaId: payload.sansthaId,
      nameMr: payload.nameMr,
      isSansthaDirector: payload.isSansthaDirector,
      permissions: payload.permissions,
      unitIds: payload.unitIds,
    };
  }
}
