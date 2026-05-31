import { Entity, Column, Index } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum FeeType {
  TUITION = 'tuition',         // शिक्षण शुल्क
  EXAM = 'exam',               // परीक्षा शुल्क
  LIBRARY = 'library',         // ग्रंथालय शुल्क
  SPORTS = 'sports',           // क्रीडा शुल्क
  COMPUTER = 'computer',       // संगणक शुल्क
  TRANSPORT = 'transport',     // वाहतूक शुल्क
  HOSTEL = 'hostel',           // वसतिगृह शुल्क
  MISC = 'misc',               // विविध शुल्क
}

export enum PaymentMode {
  CASH = 'cash',         // रोख
  CHEQUE = 'cheque',     // चेक
  DD = 'dd',             // डिमांड ड्राफ्ट
  ONLINE = 'online',     // ऑनलाइन
  UPI = 'upi',           // UPI
  NEFT = 'neft',         // NEFT
}

export enum ConcessionType {
  RTE = 'rte',                    // आरटीई
  BPL = 'bpl',                    // BPL
  SIBLING = 'sibling',            // भावंड सवलत
  STAFF_CHILD = 'staff_child',    // कर्मचारी पाल्य
  MERIT = 'merit',                // गुणवत्ता सवलत
  CUSTOM = 'custom',              // इतर
}

// ─────────────────────────────────────────────────────────────────────────────
// Fee Structure — defines a fee head for a unit + year
// ─────────────────────────────────────────────────────────────────────────────
@Entity('fee_structure')
export class FeeStructure extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @Column({ name: 'grade_config_id', type: 'varchar', nullable: true })
  gradeConfigId: string; // null = all grades

  @Column({ name: 'fee_type', type: 'enum', enum: FeeType })
  feeType: FeeType;

  @Column({ name: 'name_mr' })
  nameMr: string; // शुल्काचे नाव

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // एकूण वार्षिक रक्कम

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string; // एकरकमी भरण्याची तारीख (installments नसल्यास)

  @Column({ name: 'is_mandatory', default: true })
  isMandatory: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Number of installments (0 or 1 = single payment)
  @Column({ name: 'installment_count', default: 1 })
  installmentCount: number;

  // Template support — a template is a reusable fee definition not yet tied to a grade
  @Column({ name: 'is_template', default: false })
  isTemplate: boolean;

  // If this record was created by attaching a template, stores the template's id
  @Column({ name: 'source_template_id', type: 'varchar', nullable: true })
  sourceTemplateId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fee Installment — schedule for a fee structure split into multiple due dates
// ─────────────────────────────────────────────────────────────────────────────
@Entity('fee_installment')
@Index(['feeStructureId', 'installmentNumber'], { unique: true })
export class FeeInstallment extends SansthaBaseEntity {
  @Column({ name: 'fee_structure_id' })
  feeStructureId: string;

  @Column({ name: 'installment_number' })
  installmentNumber: number; // 1, 2, 3...

  @Column({ name: 'label_mr' })
  labelMr: string; // "पहिला हप्ता", "Q1", "Term 1"

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string; // देय दिनांक

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // हप्त्याची रक्कम
}

// ─────────────────────────────────────────────────────────────────────────────
// Concession Template — presets for RTE, BPL, sibling, staff-child, etc.
// ─────────────────────────────────────────────────────────────────────────────
@Entity('concession_template')
export class ConcessionTemplate extends SansthaBaseEntity {
  @Column({ name: 'name_mr' })
  nameMr: string; // "आरटीई सवलत", "भावंड सवलत"

  @Column({ name: 'concession_type', type: 'enum', enum: ConcessionType })
  concessionType: ConcessionType;

  @Column({ name: 'discount_type' }) // 'percentage' | 'flat'
  discountType: string;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2 })
  discountValue: number; // % किंवा ₹ रक्कम

  @Column({ name: 'applies_to_fee_types', type: 'varchar', nullable: true })
  appliesToFeeTypes: string; // JSON array of FeeType, null = all

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fee Demand — per student demand (one per installment per fee head)
// ─────────────────────────────────────────────────────────────────────────────
@Entity('fee_demand')
@Index(['studentId', 'feeStructureId', 'installmentNumber'], { unique: true })
export class FeeDemand extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'fee_structure_id' })
  feeStructureId: string;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @Column({ name: 'installment_number', default: 1 })
  installmentNumber: number;

  @Column({ name: 'installment_label', type: 'varchar', nullable: true })
  installmentLabel: string; // e.g. "Q1", "Term 1"

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // मूळ रक्कम

  @Column({ name: 'concession_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  concessionAmount: number;

  @Column({ name: 'concession_reason', type: 'varchar', nullable: true })
  concessionReason: string;

  @Column({ name: 'concession_template_id', type: 'varchar', nullable: true })
  concessionTemplateId: string;

  @Column({ name: 'net_amount', type: 'decimal', precision: 10, scale: 2 })
  netAmount: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number; // paid so far (updated on payment)

  @Column({ name: 'is_waived', default: false })
  isWaived: boolean;

  @Column({ name: 'last_sms_sent_at', type: 'timestamp', nullable: true })
  lastSmsSentAt: Date;

  @Column({ name: 'amount_due', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountDue: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountPaid: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fee Payment — receipt header (one receipt can cover multiple demands)
// ─────────────────────────────────────────────────────────────────────────────
@Entity('fee_payment')
export class FeePayment extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'receipt_number' })
  receiptNumber: string; // पावती क्रमांक

  @Column({ name: 'payment_date', type: 'date' })
  paymentDate: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // एकूण भरलेली रक्कम (sum of items)

  @Column({ type: 'enum', enum: PaymentMode, default: PaymentMode.CASH })
  paymentMode: PaymentMode;

  @Column({ name: 'cheque_number', type: 'varchar', nullable: true })
  chequeNumber: string;

  @Column({ name: 'cheque_date', type: 'date', nullable: true })
  chequeDate: string;

  @Column({ name: 'bank_name_mr', type: 'varchar', nullable: true })
  bankNameMr: string;

  @Column({ name: 'utr_number', type: 'varchar', nullable: true })
  utrNumber: string; // NEFT/UPI reference

  @Column({ name: 'collected_by' })
  collectedBy: string; // userId

  @Column({ name: 'remarks', type: 'varchar', nullable: true })
  remarks: string;

  @Column({ name: 'is_cancelled', default: false })
  isCancelled: boolean;

  @Column({ name: 'cancel_reason', type: 'varchar', nullable: true })
  cancelReason: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fee Payment Item — line item: which demand, how much paid in this receipt
// ─────────────────────────────────────────────────────────────────────────────
@Entity('fee_payment_item')
export class FeePaymentItem extends SansthaBaseEntity {
  @Column({ name: 'payment_id' })
  paymentId: string;

  @Column({ name: 'demand_id' })
  demandId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // paid for this demand in this receipt
}
