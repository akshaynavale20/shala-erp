import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';

@Entity('sanstha')
export class Sanstha extends BaseEntity {
  @Column({ name: 'name_mr' })
  nameMr: string;

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ name: 'ptr_number', nullable: true })
  ptrNumber: string;

  @Column({ name: 'pan', nullable: true })
  pan: string;

  @Column({ name: 'address_mr', nullable: true, type: 'text' })
  addressMr: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
