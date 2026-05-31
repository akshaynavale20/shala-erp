import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';
import { Sanstha } from '../sanstha/sanstha.entity';

export enum RoleScope {
  SANSTHA = 'sanstha', // cross-unit
  UNIT = 'unit',       // unit-specific
}

// Permissions registry — add as modules are built
export const PERMISSIONS = {
  // Setup
  SETUP_MANAGE: 'setup:manage',
  UNIT_MANAGE: 'unit:manage',
  ROLE_MANAGE: 'role:manage',
  USER_MANAGE: 'user:manage',
  // Students
  STUDENT_CREATE: 'student:create',
  STUDENT_READ: 'student:read',
  STUDENT_EDIT: 'student:edit',
  STUDENT_DELETE: 'student:delete',
  // Staff
  STAFF_CREATE: 'staff:create',
  STAFF_READ: 'staff:read',
  STAFF_EDIT: 'staff:edit',
  // Attendance
  ATTENDANCE_MARK: 'attendance:mark',
  ATTENDANCE_READ: 'attendance:read',
  // Exams
  EXAM_CREATE: 'exam:create',
  EXAM_MARKS_ENTRY: 'exam:marks_entry',
  EXAM_READ: 'exam:read',
  // Fees
  FEE_COLLECT: 'fee:collect',
  FEE_READ: 'fee:read',
  FEE_MANAGE: 'fee:manage',
  // Salary
  SALARY_RUN: 'salary:run',
  SALARY_READ: 'salary:read',
  SALARY_MANAGE: 'salary:manage',
  // Certificates
  CERT_ISSUE: 'certificate:issue',
  CERT_READ: 'certificate:read',
  // Reports
  REPORT_UNIT: 'report:unit',
  REPORT_SANSTHA: 'report:sanstha',
  // Year transition
  YEAR_TRANSITION: 'year:transition',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Default system roles — created during Sanstha setup
export const SYSTEM_ROLES = {
  SANSTHA_DIRECTOR: 'sanstha_director',
  SANSTHA_PRESIDENT: 'sanstha_president',
  SANSTHA_SECRETARY: 'sanstha_secretary',
  SANSTHA_TREASURER: 'sanstha_treasurer',
  SANSTHA_ACCOUNTANT: 'sanstha_accountant',
  HEADMASTER: 'headmaster',
  PRINCIPAL: 'principal',
  DEPUTY_HEADMASTER: 'deputy_headmaster',
  CLASS_TEACHER: 'class_teacher',
  SUBJECT_TEACHER: 'subject_teacher',
  LECTURER: 'lecturer',
  CLERK: 'clerk',
  LIBRARIAN: 'librarian',
} as const;

@Entity('role')
export class Role extends SansthaBaseEntity {
  @ManyToOne(() => Sanstha)
  @JoinColumn({ name: 'sanstha_id' })
  sanstha: Sanstha;

  // e.g. "संस्था संचालक"
  @Column({ name: 'name_mr' })
  nameMr: string;

  @Column({ name: 'name_en' })
  nameEn: string;

  @Column({ name: 'system_key', nullable: true })
  systemKey: string; // matches SYSTEM_ROLES keys

  @Column({
    type: 'enum',
    enum: RoleScope,
    default: RoleScope.UNIT,
  })
  scope: RoleScope;

  // Array of Permission strings
  @Column({ type: 'jsonb', default: [] })
  permissions: Permission[];

  // System roles cannot be deleted
  @Column({ name: 'is_system_role', default: false })
  isSystemRole: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
