import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';
import { Sanstha } from '../sanstha/sanstha.entity';

export enum AcademicYearStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  CLOSING = 'closing',
  CLOSED = 'closed',
}

@Entity('academic_year')
export class AcademicYear extends SansthaBaseEntity {
  @ManyToOne(() => Sanstha)
  @JoinColumn({ name: 'sanstha_id' })
  sanstha: Sanstha;

  // null unit_id = Sanstha-wide default; set for unit-specific overrides
  @Column({ name: 'unit_id', nullable: true })
  unitId: string;

  // e.g. "२०२६-२७"
  @Column({ name: 'label_mr' })
  labelMr: string;

  @Column({ name: 'label_en' })
  labelEn: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({
    type: 'enum',
    enum: AcademicYearStatus,
    default: AcademicYearStatus.UPCOMING,
  })
  status: AcademicYearStatus;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;
}
