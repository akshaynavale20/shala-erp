import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';
import { Sanstha } from '../sanstha/sanstha.entity';

export enum UnitType {
  SCHOOL = 'school',
  JR_COLLEGE = 'jr_college',
  PRE_PRIMARY = 'pre_primary',
  DEGREE_COLLEGE = 'degree_college',
  OTHER = 'other',
}

export enum DivisionalBoard {
  PUNE = 'pune',
  MUMBAI = 'mumbai',
  NAGPUR = 'nagpur',
  AURANGABAD = 'aurangabad',
  KOLHAPUR = 'kolhapur',
  AMRAVATI = 'amravati',
  NASHIK = 'nashik',
  LATUR = 'latur',
  KONKAN = 'konkan',
}

@Entity('unit')
export class Unit extends SansthaBaseEntity {
  @ManyToOne(() => Sanstha)
  @JoinColumn({ name: 'sanstha_id' })
  sanstha: Sanstha;

  @Column({ name: 'name_mr' })
  nameMr: string;

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({
    name: 'unit_type',
    type: 'enum',
    enum: UnitType,
    default: UnitType.SCHOOL,
  })
  unitType: UnitType;

  @Column({ name: 'udise_code', nullable: true })
  udiseCode: string;

  @Column({ name: 'address_mr', nullable: true, type: 'text' })
  addressMr: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: false })
  aided: boolean;

  @Column({
    name: 'divisional_board',
    type: 'enum',
    enum: DivisionalBoard,
    nullable: true,
  })
  divisionalBoard: DivisionalBoard;

  @Column({ name: 'established_year', nullable: true })
  establishedYear: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
