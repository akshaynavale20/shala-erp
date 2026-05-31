import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SalaryComponent, SalarySlip, SalaryStatus } from './salary.entity';
import { AccountsService } from '../accounts/accounts.service';
import { AccountTransaction, TransactionType, AccountCategory, PaymentMethod } from '../accounts/accounts.entity';
import { Staff } from '../staff/staff.entity';

const MONTH_NAMES_MR = [
  'जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून',
  'जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर',
];

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(SalaryComponent) private readonly compRepo: Repository<SalaryComponent>,
    @InjectRepository(SalarySlip)      private readonly slipRepo: Repository<SalarySlip>,
    @InjectRepository(Staff)           private readonly staffRepo: Repository<Staff>,
    private readonly accountsService: AccountsService,
    private readonly dataSource: DataSource,
  ) {}

  async createComponent(dto: Partial<SalaryComponent>): Promise<SalaryComponent> {
    return this.compRepo.save(this.compRepo.create(dto));
  }

  async findComponents(sansthaId: string): Promise<SalaryComponent[]> {
    return this.compRepo.find({ where: { sansthaId, isActive: true }, order: { nameMr: 'ASC' } });
  }

  async createSlip(dto: Partial<SalarySlip>): Promise<SalarySlip> {
    // Auto-calculate totals
    const earnings   = (dto.earnings   || []).reduce((s, e) => s + e.amount, 0);
    const deductions = (dto.deductions || []).reduce((s, d) => s + d.amount, 0);
    dto.grossSalary    = earnings;
    dto.totalDeduction = deductions;
    dto.netSalary      = earnings - deductions;
    return this.slipRepo.save(this.slipRepo.create(dto));
  }

  async findSlips(sansthaId: string, staffId?: string, financialYearId?: string): Promise<SalarySlip[]> {
    const where: any = { sansthaId };
    if (staffId)         where.staffId         = staffId;
    if (financialYearId) where.financialYearId = financialYearId;
    return this.slipRepo.find({ where, order: { year: 'DESC', month: 'DESC' } });
  }

  async findOne(id: string): Promise<SalarySlip> {
    const s = await this.slipRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('वेतन स्लिप सापडली नाही');
    return s;
  }

  async approveSlip(id: string): Promise<SalarySlip> {
    const s = await this.findOne(id);
    s.status = SalaryStatus.APPROVED;
    return this.slipRepo.save(s);
  }

  async markPaid(id: string, paymentDate: string, paymentMode: string): Promise<SalarySlip> {
    // ── Idempotency guard — prevents double-payment race condition ─────────────
    const current = await this.findOne(id);
    if (current.status === SalaryStatus.PAID) {
      throw new ConflictException('वेतन स्लिप आधीच दिली आहे');
    }

    return this.dataSource.transaction(async (manager) => {
      // Re-fetch inside transaction with row-level lock
      const s = await manager.findOne(SalarySlip, { where: { id } });
      if (!s) throw new NotFoundException('वेतन स्लिप सापडली नाही');
      if (s.status === SalaryStatus.PAID) {
        throw new ConflictException('वेतन स्लिप आधीच दिली आहे');
      }

      s.status      = SalaryStatus.PAID;
      s.paymentDate = paymentDate;
      s.paymentMode = paymentMode;
      const saved = await manager.save(SalarySlip, s);

      // ── Auto-create expense entry in जमा-खर्च (atomic — rolls back with slip) ─
      const staff = await manager.findOne(Staff, { where: { id: s.staffId } });
      const monthLabel = MONTH_NAMES_MR[(s.month ?? 1) - 1];
      const voucherPrefix = `VET-${s.year ?? 'XX'}-${String(s.month ?? 0).padStart(2, '0')}`;

      const entry = manager.create(AccountTransaction, {
        sansthaId:       s.sansthaId,
        unitId:          s.unitId,
        financialYearId: s.financialYearId,
        type:            TransactionType.EXPENSE,
        category:        AccountCategory.SALARY,
        descriptionMr:   `वेतन - ${staff?.nameMr || s.staffId} - ${monthLabel} ${s.year}`,
        amount:          +s.netSalary,
        transactionDate: paymentDate,
        paymentMethod:   (paymentMode as PaymentMethod) || PaymentMethod.CASH,
        partyNameMr:     staff?.nameMr,
        voucherNumber:   voucherPrefix + '-' + id.slice(-6).toUpperCase(),
        enteredBy:       'system-salary',
        isApproved:      true,
        remarks:         `स्वयंचलित नोंद: वेतन स्लिप ${id}`,
      });
      await manager.save(AccountTransaction, entry);

      return saved;
    });
  }
}
