import { Entity, Column, Index } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum SalaryStatus {
  DRAFT = 'draft',         // मसुदा
  APPROVED = 'approved',   // मंजूर
  PAID = 'paid',           // दिले
  CANCELLED = 'cancelled', // रद्द
}

// Salary component definition (reusable per sanstha)
@Entity('salary_component')
export class SalaryComponent extends SansthaBaseEntity {
  @Column({ name: 'name_mr' })
  nameMr: string; // e.g. मूळ वेतन, महागाई भत्ता, घरभाडे भत्ता

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ name: 'is_earning', default: true })
  isEarning: boolean; // true = earning, false = deduction

  @Column({ name: 'is_taxable', default: false })
  isTaxable: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'shalarth_head_code', nullable: true })
  shalarthHeadCode: string;
}

// Monthly salary slip per staff
@Entity('salary_slip')
@Index(['staffId', 'month', 'year', 'financialYearId'], { unique: true })
export class SalarySlip extends SansthaBaseEntity {
  @Column({ name: 'unit_id', nullable: true })
  unitId: string;

  @Column({ name: 'staff_id' })
  staffId: string;

  @Column({ name: 'financial_year_id' })
  financialYearId: string;

  @Column({ name: 'month' }) // 1–12
  month: number;

  @Column({ name: 'year' })
  year: number;

  @Column({ type: 'jsonb', default: [] })
  earnings: { componentId: string; nameMr: string; amount: number }[];

  @Column({ type: 'jsonb', default: [] })
  deductions: { componentId: string; nameMr: string; amount: number }[];

  @Column({ name: 'gross_salary', type: 'decimal', precision: 10, scale: 2, default: 0 })
  grossSalary: number;

  @Column({ name: 'total_deduction', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDeduction: number;

  @Column({ name: 'net_salary', type: 'decimal', precision: 10, scale: 2, default: 0 })
  netSalary: number;

  @Column({ name: 'working_days', nullable: true })
  workingDays: number;

  @Column({ name: 'present_days', nullable: true })
  presentDays: number;

  @Column({ type: 'enum', enum: SalaryStatus, default: SalaryStatus.DRAFT })
  status: SalaryStatus;

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate: string;

  @Column({ name: 'payment_mode', nullable: true })
  paymentMode: string;

  @Column({ name: 'remarks', nullable: true })
  remarks: string;
}
