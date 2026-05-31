import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';
import { Sanstha } from '../sanstha/sanstha.entity';

export enum FinancialYearStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('financial_year')
export class FinancialYear extends SansthaBaseEntity {
  @ManyToOne(() => Sanstha)
  @JoinColumn({ name: 'sanstha_id' })
  sanstha: Sanstha;

  // e.g. "२०२६-२७"
  @Column({ name: 'label_mr' })
  labelMr: string;

  @Column({ name: 'label_en' })
  labelEn: string;

  // Apr 1
  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  // Mar 31
  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({
    type: 'enum',
    enum: FinancialYearStatus,
    default: FinancialYearStatus.ACTIVE,
  })
  status: FinancialYearStatus;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;

  @Column({ name: 'locked_by', nullable: true })
  lockedBy: string;

  @Column({ name: 'locked_at', nullable: true, type: 'timestamptz' })
  lockedAt: Date;
}
