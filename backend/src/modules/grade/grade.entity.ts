import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UnitBaseEntity } from '../../database/base.entity';
import { Unit } from '../unit/unit.entity';
import { AcademicYear } from '../academic-year/academic-year.entity';

export enum GradeLevel {
  PRE_PRIMARY = 'pre_primary',
  PRIMARY = 'primary',           // Std 1-4
  UPPER_PRIMARY = 'upper_primary', // Std 5-8
  SECONDARY = 'secondary',       // Std 9-10
  HSC = 'hsc',                   // Std 11-12
}

export enum PromotionMode {
  AUTO = 'auto',          // Std 1-4 (RTE no-detention)
  MANUAL = 'manual',      // Std 5,6,7,8,9,11 — teacher decides
  BOARD_RESULT = 'board_result', // Std 10, 12 — wait for board
}

@Entity('grade_config')
export class GradeConfig extends UnitBaseEntity {
  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  // 1–12; 0 = pre-primary
  @Column({ name: 'grade_number' })
  gradeNumber: number;

  // e.g. "इयत्ता पाचवी"
  @Column({ name: 'grade_label_mr' })
  gradeLabelMr: string;

  @Column({
    type: 'enum',
    enum: GradeLevel,
  })
  level: GradeLevel;

  @Column({
    name: 'promotion_mode',
    type: 'enum',
    enum: PromotionMode,
    default: PromotionMode.MANUAL,
  })
  promotionMode: PromotionMode;

  // null = not enforced; e.g. 35 for Std 9+
  @Column({ name: 'pass_marks_pct', nullable: true, type: 'decimal', precision: 5, scale: 2 })
  passMarksPct: number;

  // null = not enforced; e.g. 75
  @Column({ name: 'min_attendance_pct', nullable: true, type: 'decimal', precision: 5, scale: 2 })
  minAttendancePct: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

@Entity('division')
export class Division extends UnitBaseEntity {
  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @ManyToOne(() => GradeConfig)
  @JoinColumn({ name: 'grade_config_id' })
  gradeConfig: GradeConfig;

  @Column({ name: 'grade_config_id' })
  gradeConfigId: string;

  // e.g. "तुकडी अ"
  @Column({ name: 'name_mr' })
  nameMr: string;

  // FK to staff — set after staff module
  @Column({ name: 'class_teacher_id', nullable: true })
  classTeacherId: string;

  @Column({ name: 'room_number', nullable: true })
  roomNumber: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
