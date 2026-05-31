import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserUnitRole } from '../user/user.entity';
import { Role, SYSTEM_ROLES } from '../role/role.entity';

export interface JwtPayload {
  sub: string;        // user id
  email: string;
  sansthaId: string;
  nameMr: string;
  isSansthaDirector: boolean;
  permissions: string[];
  unitIds: string[];  // units this user can access
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserUnitRole)
    private readonly uurRepo: Repository<UserUnitRole>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    // Find by email regardless of isActive first (so we can give better errors)
    const userAny = await this.userRepo.findOne({ where: { email } });

    if (!userAny) {
      this.logger.warn(`Login failed — email not found: ${email}`);
      throw new UnauthorizedException('चुकीचा ईमेल किंवा पासवर्ड');
    }

    if (!userAny.isActive) {
      this.logger.warn(`Login failed — account inactive: ${email}`);
      throw new UnauthorizedException('हे खाते निष्क्रिय आहे. संस्था संचालकाशी संपर्क साधा.');
    }

    const valid = await bcrypt.compare(password, userAny.passwordHash);
    if (!valid) {
      this.logger.warn(`Login failed — wrong password: ${email}`);
      throw new UnauthorizedException('चुकीचा ईमेल किंवा पासवर्ड');
    }

    return userAny;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    // Load all active unit-role assignments
    const assignments = await this.uurRepo.find({
      where: { userId: user.id, isActive: true },
      relations: { role: true },
    });

    // Aggregate permissions
    const allPermissions = new Set<string>();
    const unitIds: string[] = [];
    let isSansthaDirector = false;

    for (const a of assignments) {
      if (a.role.systemKey === SYSTEM_ROLES.SANSTHA_DIRECTOR) {
        isSansthaDirector = true;
      }
      a.role.permissions.forEach((p) => allPermissions.add(p));
      if (a.unitId) unitIds.push(a.unitId);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sansthaId: user.sansthaId,
      nameMr: user.nameMr,
      isSansthaDirector,
      permissions: Array.from(allPermissions),
      unitIds,
    };

    // Update last login
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: user.id,
        nameMr: user.nameMr,
        email: user.email,
        sansthaId: user.sansthaId,
        isSansthaDirector,
        mustChangePassword: user.mustChangePassword,
        forcePasswordChange: user.forcePasswordChange ?? false,
        permissions: Array.from(allPermissions),
        unitIds,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('टोकन अवैध किंवा कालबाह्य');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });
    if (!user) throw new UnauthorizedException('वापरकर्ता सापडला नाही');

    const assignments = await this.uurRepo.find({
      where: { userId: user.id, isActive: true },
      relations: { role: true },
    });

    const allPermissions = new Set<string>();
    const unitIds: string[] = [];
    let isSansthaDirector = false;

    for (const a of assignments) {
      if (a.role.systemKey === SYSTEM_ROLES.SANSTHA_DIRECTOR) isSansthaDirector = true;
      a.role.permissions.forEach((p) => allPermissions.add(p));
      if (a.unitId) unitIds.push(a.unitId);
    }

    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sansthaId: user.sansthaId,
      nameMr: user.nameMr,
      isSansthaDirector,
      permissions: Array.from(allPermissions),
      unitIds,
    };

    return { accessToken: this.jwtService.sign(newPayload) };
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }
}
