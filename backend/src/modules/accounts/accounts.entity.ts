import { Entity, Column } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum TransactionType {
  INCOME = 'income',   // जमा
  EXPENSE = 'expense', // खर्च
}

export enum AccountCategory {
  // Income categories
  FEE_INCOME = 'fee_income',
  GRANT_INCOME = 'grant_income',
  DONATION = 'donation',
  OTHER_INCOME = 'other_income',
  // Expense categories
  SALARY = 'salary',
  RENT = 'rent',
  ELECTRICITY = 'electricity',
  WATER = 'water',
  MAINTENANCE = 'maintenance',
  STATIONERY = 'stationery',
  EQUIPMENT = 'equipment',
  EXAM_EXPENSE = 'exam_expense',
  SPORTS = 'sports',
  LIBRARY = 'library',
  OTHER_EXPENSE = 'other_expense',
}

export enum PaymentMethod {
  CASH = 'cash',
  CHEQUE = 'cheque',
  NEFT = 'neft',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
}

/** जमा-खर्च नोंद — General ledger entry */
@Entity('account_transaction')
export class AccountTransaction extends SansthaBaseEntity {
  @Column({ name: 'unit_id', type: 'varchar', nullable: true })
  unitId: string;  // null = sanstha-level

  @Column({ name: 'financial_year_id', type: 'varchar', nullable: true })
  financialYearId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: AccountCategory })
  category: AccountCategory;

  @Column({ name: 'description_mr' })
  descriptionMr: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: string;

  @Column({ type: 'enum', enum: PaymentMethod, name: 'payment_method', default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Column({ name: 'reference_number', type: 'varchar', nullable: true })
  referenceNumber: string;  // cheque/NEFT ref

  @Column({ name: 'bank_name', type: 'varchar', nullable: true })
  bankName: string;

  @Column({ name: 'voucher_number', type: 'varchar', nullable: true })
  voucherNumber: string;

  @Column({ name: 'party_name_mr', type: 'varchar', nullable: true })
  partyNameMr: string;  // vendor / payer name

  @Column({ name: 'remarks', type: 'varchar', nullable: true })
  remarks: string;

  @Column({ name: 'entered_by', type: 'varchar', nullable: true })
  enteredBy: string;  // userId

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  @Column({ name: 'approved_by', type: 'varchar', nullable: true })
  approvedBy: string;

  @Column({ name: 'document_url', type: 'varchar', nullable: true })
  documentUrl: string;  // receipt/bill scan
}
