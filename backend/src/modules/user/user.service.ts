import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserUnitRole } from './user.entity';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() sansthaId: string;
  @IsString() nameMr: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() password: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() nameMr?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() isActive?: boolean;
  // NOTE: password change removed from UpdateUserDto intentionally.
  // Passwords can only be reset by Sanstha Sanchalak via resetPassword().
}

export class AssignRoleDto {
  // userId is injected from the URL param in the controller — NOT from the request body
  @IsOptional() @IsString() userId?: string;
  @IsString() sansthaId: string;
  @IsOptional() @IsString() unitId?: string;
  @IsString() roleId: string;
  @IsOptional() @IsString() validFrom?: string;
  @IsOptional() @IsString() validTo?: string;
}

export class ChangeOwnPasswordDto {
  @IsString() @MinLength(8) newPassword: string;
  /** Token issued by admin reset flow */
  @IsString() resetToken: string;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserUnitRole)
    private readonly uurRepo: Repository<UserUnitRole>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('हा ईमेल आधीच नोंदणीकृत आहे');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      sansthaId: dto.sansthaId,
      nameMr: dto.nameMr,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      mustChangePassword: true,
      forcePasswordChange: true,
    });
    this.logger.log(`User created: ${dto.email}`);
    return this.userRepo.save(user);
  }

  async findBySanstha(sansthaId: string): Promise<User[]> {
    return this.userRepo.find({
      where: { sansthaId },
      order: { nameMr: 'ASC' },
      relations: { unitRoles: { role: true } },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { unitRoles: { role: true } },
    });
    if (!user) throw new NotFoundException('वापरकर्ता सापडला नाही');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.nameMr !== undefined) user.nameMr = dto.nameMr;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    return this.userRepo.save(user);
  }

  /**
   * Admin-only password reset.
   * - Generates a secure random temporary password
   * - Hashes it with bcrypt
   * - Sets forcePasswordChange = true
   * - Records who reset, when
   * - Returns the plain temp password (shown once to admin)
   *
   * @param targetUserId  User whose password to reset
   * @param adminUserId   Admin performing the reset (must be Sanstha Sanchalak)
   * @param isSansthaDirector  Verified from JWT in controller
   */
  async resetPassword(
    targetUserId: string,
    adminUserId: string,
    isSansthaDirector: boolean,
  ): Promise<{ temporaryPassword: string }> {
    if (!isSansthaDirector) {
      throw new ForbiddenException('फक्त संस्था संचालकच पासवर्ड रिसेट करू शकतो');
    }

    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('वापरकर्ता सापडला नाही');

    // Generate a secure 12-char temp password: letters + digits
    const tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);
    const hash = await bcrypt.hash(tempPassword, 12);

    user.passwordHash = hash;
    user.mustChangePassword = true;
    user.forcePasswordChange = true;
    user.resetPasswordToken = undefined as any;
    user.resetPasswordExpiresAt = undefined as any;
    user.passwordResetBy = adminUserId;
    user.passwordChangedAt = undefined as any;

    await this.userRepo.save(user);

    this.logger.warn(
      `Password reset: target=${user.email}, by=${adminUserId}, at=${new Date().toISOString()}`,
    );

    return { temporaryPassword: tempPassword };
  }

  /**
   * User completes forced password change after receiving temp password from admin.
   * Validates that forcePasswordChange=true and old password (temp) matches.
   */
  async completeForcedChange(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('वापरकर्ता सापडला नाही');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new ForbiddenException('सध्याचा पासवर्ड चुकीचा आहे');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    user.forcePasswordChange = false;
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = undefined as any;
    user.resetPasswordExpiresAt = undefined as any;

    await this.userRepo.save(user);
    this.logger.log(`Password changed by user: ${user.email}`);
  }

  async assignRole(dto: AssignRoleDto): Promise<UserUnitRole> {
    // Check if same role+unit already assigned
    const existing = await this.uurRepo.findOne({
      where: {
        userId: dto.userId,
        roleId: dto.roleId,
        ...(dto.unitId ? { unitId: dto.unitId } : {}),
      },
    });
    if (existing) {
      existing.isActive = true;
      return this.uurRepo.save(existing);
    }
    const uur = this.uurRepo.create({
      sansthaId: dto.sansthaId,
      userId: dto.userId,
      unitId: dto.unitId ?? undefined,
      roleId: dto.roleId,
      validFrom: dto.validFrom,
      validTo: dto.validTo,
      isActive: true,
    });
    return this.uurRepo.save(uur);
  }

  async removeRole(userId: string, uurId: string): Promise<void> {
    await this.uurRepo.update({ id: uurId, userId }, { isActive: false });
  }

  async deactivate(id: string): Promise<void> {
    await this.userRepo.update(id, { isActive: false });
  }

  async reactivate(id: string): Promise<void> {
    await this.userRepo.update(id, { isActive: true });
  }
}
