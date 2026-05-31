import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';
import { Sanstha } from '../sanstha/sanstha.entity';
import { Role } from '../role/role.entity';

@Entity('user')
export class User extends SansthaBaseEntity {
  @ManyToOne(() => Sanstha)
  @JoinColumn({ name: 'sanstha_id' })
  sanstha: Sanstha;

  @Column({ name: 'name_mr' })
  nameMr: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamptz' })
  lastLoginAt: Date;

  @Column({ name: 'must_change_password', default: false })
  mustChangePassword: boolean;

  // ── Password reset fields ─────────────────────────────────────
  /** One-time token for password reset */
  @Column({ name: 'reset_password_token', nullable: true, type: 'varchar' })
  resetPasswordToken: string;

  /** UTC expiry for the reset token */
  @Column({ name: 'reset_password_expires_at', nullable: true, type: 'timestamptz' })
  resetPasswordExpiresAt: Date;

  /** Force password change on next login (set after admin reset) */
  @Column({ name: 'force_password_change', default: false })
  forcePasswordChange: boolean;

  /** Timestamp of last successful password change */
  @Column({ name: 'password_changed_at', nullable: true, type: 'timestamptz' })
  passwordChangedAt: Date;

  /** ID of the admin user who last reset this password */
  @Column({ name: 'password_reset_by', nullable: true, type: 'varchar' })
  passwordResetBy: string;

  @OneToMany(() => UserUnitRole, (uur) => uur.user)
  unitRoles: UserUnitRole[];
}

@Entity('user_unit_role')
export class UserUnitRole extends SansthaBaseEntity {
  @ManyToOne(() => User, (u) => u.unitRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  // null = sanstha-wide access
  @Column({ name: 'unit_id', nullable: true })
  unitId: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ name: 'valid_from', type: 'date', nullable: true })
  validFrom: string;

  @Column({ name: 'valid_to', type: 'date', nullable: true })
  validTo: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
