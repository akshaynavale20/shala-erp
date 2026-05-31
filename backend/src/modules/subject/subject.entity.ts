import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UnitBaseEntity } from '../../database/base.entity';
import { Unit } from '../unit/unit.entity';

export enum SubjectType {
  THEORY = 'theory',
  PRACTICAL = 'practical',
  BIFOCAL = 'bifocal',
  COMPULSORY = 'compulsory',
}

@Entity('subject')
export class Subject extends UnitBaseEntity {
  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'name_mr' })
  nameMr: string;

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ name: 'subject_code', nullable: true })
  subjectCode: string;

  // null = compulsory for all streams
  @Column({ name: 'stream_id', nullable: true })
  streamId: string;

  // grade range this subject is taught
  @Column({ name: 'grade_range_start', nullable: true })
  gradeRangeStart: number;

  @Column({ name: 'grade_range_end', nullable: true })
  gradeRangeEnd: number;

  @Column({
    name: 'subject_type',
    type: 'enum',
    enum: SubjectType,
    default: SubjectType.THEORY,
  })
  subjectType: SubjectType;

  // marks config
  @Column({ name: 'max_theory_marks', type: 'decimal', precision: 6, scale: 2, default: 80 })
  maxTheoryMarks: number;

  @Column({ name: 'max_internal_marks', type: 'decimal', precision: 6, scale: 2, default: 20 })
  maxInternalMarks: number;

  // for lab subjects (Physics/Chem/Bio): 30; else 0
  @Column({ name: 'max_practical_marks', type: 'decimal', precision: 6, scale: 2, default: 0 })
  maxPracticalMarks: number;

  // bifocal subjects have total 200 marks
  @Column({ name: 'is_bifocal', default: false })
  isBifocal: boolean;

  @Column({ name: 'bifocal_total_marks', nullable: true, type: 'decimal', precision: 6, scale: 2 })
  bifocalTotalMarks: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
