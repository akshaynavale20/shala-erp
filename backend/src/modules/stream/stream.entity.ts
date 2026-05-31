import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UnitBaseEntity } from '../../database/base.entity';
import { Unit } from '../unit/unit.entity';

export enum StreamCode {
  ARTS = 'arts',
  SCIENCE = 'science',
  COMMERCE = 'commerce',
}

@Entity('stream')
export class Stream extends UnitBaseEntity {
  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  // e.g. "कला शाखा"
  @Column({ name: 'name_mr' })
  nameMr: string;

  @Column({
    type: 'enum',
    enum: StreamCode,
  })
  code: StreamCode;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
