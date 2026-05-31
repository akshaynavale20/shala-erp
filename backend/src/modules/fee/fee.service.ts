import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  FeeStructure, FeeInstallment, ConcessionTemplate,
  FeeDemand, FeePayment, FeePaymentItem,
} from './fee.entity';
import { AccountTransaction, TransactionType, AccountCategory, PaymentMethod } from '../accounts/accounts.entity';

// Map FeePayment paymentMode → AccountTransaction PaymentMethod
function toPaymentMethod(mode: string): PaymentMethod {
  const map: Record<string, PaymentMethod> = {
    cash: PaymentMethod.CASH,
    cheque: PaymentMethod.CHEQUE,
    neft: PaymentMethod.NEFT,
    upi: PaymentMethod.UPI,
    dd: PaymentMethod.NEFT,
    online: PaymentMethod.BANK_TRANSFER,
  };
  return map[mode] ?? PaymentMethod.CASH;
}

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(FeeStructure) private readonly structRepo: Repository<FeeStructure>,
    @InjectRepository(FeeInstallment) private readonly installRepo: Repository<FeeInstallment>,
    @InjectRepository(ConcessionTemplate) private readonly concTemplateRepo: Repository<ConcessionTemplate>,
    @InjectRepository(FeeDemand) private readonly demandRepo: Repository<FeeDemand>,
    @InjectRepository(FeePayment) private readonly payRepo: Repository<FeePayment>,
    @InjectRepository(FeePaymentItem) private readonly payItemRepo: Repository<FeePaymentItem>,
    @InjectRepository(AccountTransaction) private readonly ledgerRepo: Repository<AccountTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Fee Structures ──────────────────────────────────────────────────────────

  async createStructure(dto: Partial<FeeStructure>): Promise<FeeStructure> {
    const struct = await this.structRepo.save(this.structRepo.create(dto));
    // Auto-generate demands for existing students in this unit/grade/year
    if (dto.unitId && dto.academicYearId) {
      const query = dto.gradeConfigId
        ? `SELECT id FROM student WHERE unit_id = $1 AND grade_config_id = $2 AND is_active = true`
        : `SELECT id FROM student WHERE unit_id = $1 AND is_active = true`;
      const params = dto.gradeConfigId ? [dto.unitId, dto.gradeConfigId] : [dto.unitId];
      const rows: { id: string }[] = await this.dataSource.query(query, params);
      if (rows.length > 0) {
        await this.generateDemands(dto.unitId, dto.academicYearId, rows.map(r => r.id));
      }
    }
    return struct;
  }

  async findStructures(
    sansthaId: string,
    unitId?: string,
    academicYearId?: string,
    isTemplate?: boolean,
  ): Promise<FeeStructure[]> {
    const where: any = { sansthaId, isActive: true };
    if (unitId) where.unitId = unitId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (isTemplate !== undefined) where.isTemplate = isTemplate;
    return this.structRepo.find({ where, order: { feeType: 'ASC' } });
  }

  async updateStructure(id: string, dto: Partial<FeeStructure>): Promise<FeeStructure> {
    const s = await this.structRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('शुल्क रचना सापडली नाही');
    Object.assign(s, dto);
    return this.structRepo.save(s);
  }

  /**
   * Attach a template to one or more grade configs.
   * Each assignment can override amount, dueDate, installmentCount.
   * Skips grades that already have a fee_structure derived from this template.
   */
  async attachTemplateToGrades(
    templateId: string,
    assignments: Array<{
      gradeConfigId: string;
      amount?: number;
      dueDate?: string;
      installmentCount?: number;
    }>,
  ): Promise<FeeStructure[]> {
    const template = await this.structRepo.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException('टेम्प्लेट सापडला नाही');
    if (!template.isTemplate) throw new BadRequestException('हे टेम्प्लेट नाही');

    const results: FeeStructure[] = [];

    for (const assignment of assignments) {
      // Check if already attached to this grade from this template
      const existing = await this.structRepo.findOne({
        where: { sourceTemplateId: templateId, gradeConfigId: assignment.gradeConfigId },
      });
      if (existing) {
        // Update instead of creating duplicate
        Object.assign(existing, {
          amount: assignment.amount ?? template.amount,
          dueDate: assignment.dueDate ?? template.dueDate,
          installmentCount: assignment.installmentCount ?? template.installmentCount,
          isActive: true,
        });
        const saved = await this.structRepo.save(existing);
        results.push(saved);
        continue;
      }

      const newStruct = this.structRepo.create({
        sansthaId: template.sansthaId,
        unitId: template.unitId,
        academicYearId: template.academicYearId,
        feeType: template.feeType,
        nameMr: template.nameMr,
        isMandatory: template.isMandatory,
        isTemplate: false,
        sourceTemplateId: templateId,
        gradeConfigId: assignment.gradeConfigId,
        amount: assignment.amount ?? template.amount,
        dueDate: assignment.dueDate ?? template.dueDate,
        installmentCount: assignment.installmentCount ?? template.installmentCount,
      });
      const saved = await this.structRepo.save(newStruct);
      results.push(saved);

      // Auto-generate demands for students in this grade
      const rows: { id: string }[] = await this.dataSource.query(
        `SELECT id FROM student WHERE unit_id = $1 AND grade_config_id = $2 AND is_active = true`,
        [template.unitId, assignment.gradeConfigId],
      );
      if (rows.length > 0) {
        await this.generateDemands(template.unitId, template.academicYearId, rows.map(r => r.id));
      }
    }

    return results;
  }

  // ── Installment Schedules ───────────────────────────────────────────────────

  async saveInstallments(feeStructureId: string, installments: Partial<FeeInstallment>[]): Promise<FeeInstallment[]> {
    await this.installRepo.delete({ feeStructureId });
    if (!installments?.length) return [];
    const entities = installments.map((i, idx) =>
      this.installRepo.create({ ...i, feeStructureId, installmentNumber: i.installmentNumber ?? (idx + 1) })
    );
    return this.installRepo.save(entities);
  }

  async getInstallments(feeStructureId: string): Promise<FeeInstallment[]> {
    return this.installRepo.find({
      where: { feeStructureId },
      order: { installmentNumber: 'ASC' },
    });
  }

  // ── Concession Templates ────────────────────────────────────────────────────

  async createConcessionTemplate(dto: Partial<ConcessionTemplate>): Promise<ConcessionTemplate> {
    return this.concTemplateRepo.save(this.concTemplateRepo.create(dto));
  }

  async findConcessionTemplates(sansthaId: string): Promise<ConcessionTemplate[]> {
    return this.concTemplateRepo.find({ where: { sansthaId, isActive: true } });
  }

  async updateConcessionTemplate(id: string, dto: Partial<ConcessionTemplate>): Promise<ConcessionTemplate> {
    const t = await this.concTemplateRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException();
    Object.assign(t, dto);
    return this.concTemplateRepo.save(t);
  }

  // ── Demand Generation ───────────────────────────────────────────────────────

  async generateDemands(unitId: string, academicYearId: string, studentIds: string[]): Promise<FeeDemand[]> {
    const structures = await this.structRepo.find({ where: { unitId, academicYearId, isActive: true } });
    const created: FeeDemand[] = [];

    for (const s of structures) {
      const installments = await this.installRepo.find({
        where: { feeStructureId: s.id },
        order: { installmentNumber: 'ASC' },
      });

      for (const studentId of studentIds) {
        if (installments.length > 0) {
          for (const inst of installments) {
            const existing = await this.demandRepo.findOne({
              where: { studentId, feeStructureId: s.id, installmentNumber: inst.installmentNumber },
            });
            if (existing) continue;
            created.push(this.demandRepo.create({
              sansthaId: s.sansthaId, unitId, studentId,
              feeStructureId: s.id, academicYearId,
              installmentNumber: inst.installmentNumber,
              installmentLabel: inst.labelMr,
              dueDate: inst.dueDate,
              amount: inst.amount,
              concessionAmount: 0,
              netAmount: inst.amount,
              paidAmount: 0,
            }));
          }
        } else {
          const existing = await this.demandRepo.findOne({
            where: { studentId, feeStructureId: s.id, installmentNumber: 1 },
          });
          if (existing) continue;
          created.push(this.demandRepo.create({
            sansthaId: s.sansthaId, unitId, studentId,
            feeStructureId: s.id, academicYearId,
            installmentNumber: 1,
            dueDate: s.dueDate,
            amount: s.amount,
            concessionAmount: 0,
            netAmount: s.amount,
            paidAmount: 0,
          }));
        }
      }
    }

    if (created.length === 0) return [];
    return this.demandRepo.save(created);
  }

  async getStudentDemands(studentId: string, academicYearId?: string): Promise<FeeDemand[]> {
    const where: any = { studentId };
    if (academicYearId) where.academicYearId = academicYearId;
    const existing = await this.demandRepo.find({ where, order: { feeStructureId: 'ASC', installmentNumber: 'ASC' } });
    if (existing.length > 0 || !academicYearId) return existing;

    // Lazy auto-generate: student has no demands yet — find their unit + grade and generate
    const studentRows: { unit_id: string; grade_config_id: string }[] =
      await this.dataSource.query(
        `SELECT unit_id, grade_config_id FROM student WHERE id = $1 AND is_active = true`,
        [studentId],
      );
    const s = studentRows[0];
    if (s?.unit_id) {
      await this.generateDemands(s.unit_id, academicYearId, [studentId]);
      return this.demandRepo.find({ where, order: { feeStructureId: 'ASC', installmentNumber: 'ASC' } });
    }
    return existing;
  }

  async updateConcession(demandId: string, concessionAmount: number, reason: string, templateId?: string): Promise<FeeDemand> {
    const d = await this.demandRepo.findOne({ where: { id: demandId } });
    if (!d) throw new NotFoundException();
    d.concessionAmount = concessionAmount;
    d.concessionReason = reason;
    (d as any).concessionTemplateId = templateId || null;
    d.netAmount = Math.max(0, +d.amount - concessionAmount);
    return this.demandRepo.save(d);
  }

  async applyConcessionTemplate(studentId: string, academicYearId: string, templateId: string): Promise<FeeDemand[]> {
    const template = await this.concTemplateRepo.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException('सवलत टेम्प्लेट सापडला नाही');

    const demands = await this.demandRepo.find({ where: { studentId, academicYearId } });
    const allowedTypes: string[] = template.appliesToFeeTypes
      ? JSON.parse(template.appliesToFeeTypes) : null;

    for (const d of demands) {
      if (allowedTypes) {
        const struct = await this.structRepo.findOne({ where: { id: d.feeStructureId } });
        if (!struct || !allowedTypes.includes(struct.feeType)) continue;
      }
      const base = +d.amount;
      const concession = template.discountType === 'percentage'
        ? (base * +template.discountValue) / 100
        : Math.min(+template.discountValue, base);
      d.concessionAmount = concession;
      d.concessionReason = template.nameMr;
      d.concessionTemplateId = templateId;
      d.netAmount = Math.max(0, base - concession);
    }
    return this.demandRepo.save(demands);
  }

  // ── Fee Collection ──────────────────────────────────────────────────────────

  async collectFee(dto: {
    unitId: string; academicYearId: string; studentId: string; sansthaId: string;
    receiptNumber: string; paymentDate: string; paymentMode: string;
    chequeNumber?: string; chequeDate?: string; bankNameMr?: string; utrNumber?: string;
    collectedBy: string; remarks?: string;
    items: Array<{ demandId: string; amount: number }>;
  }): Promise<{ payment: FeePayment; items: FeePaymentItem[] }> {
    if (!dto.items?.length) throw new BadRequestException('किमान एक शुल्क निवडा');
    const totalAmount = dto.items.reduce((s, i) => s + Number(i.amount), 0);

    return this.dataSource.transaction(async (em) => {
      const payment = await em.save(em.create(FeePayment, {
        unitId: dto.unitId, academicYearId: dto.academicYearId,
        studentId: dto.studentId, sansthaId: dto.sansthaId,
        receiptNumber: dto.receiptNumber, paymentDate: dto.paymentDate,
        amount: totalAmount, paymentMode: dto.paymentMode as any,
        chequeNumber: dto.chequeNumber, chequeDate: dto.chequeDate,
        bankNameMr: dto.bankNameMr, utrNumber: dto.utrNumber,
        collectedBy: dto.collectedBy, remarks: dto.remarks,
      }));

      const items: FeePaymentItem[] = [];
      for (const item of dto.items) {
        const demand = await em.findOne(FeeDemand, { where: { id: item.demandId } });
        if (!demand) continue;
        const newPaid = +demand.paidAmount + Number(item.amount);
        if (newPaid > +demand.netAmount + 0.01) {
          throw new BadRequestException(`मागणी ${demand.id}: जास्त रक्कम भरता येत नाही`);
        }
        demand.paidAmount = newPaid;
        await em.save(demand);
        const pi = await em.save(em.create(FeePaymentItem, {
          paymentId: payment.id, demandId: item.demandId,
          studentId: dto.studentId, sansthaId: dto.sansthaId, amount: item.amount,
        }));
        items.push(pi);
      }

      // ── Auto-post to general ledger ────────────────────────────────────────
      await em.save(em.create(AccountTransaction, {
        sansthaId: dto.sansthaId,
        unitId: dto.unitId,
        type: TransactionType.INCOME,
        category: AccountCategory.FEE_INCOME,
        descriptionMr: `शुल्क संकलन — पावती: ${dto.receiptNumber}`,
        amount: totalAmount,
        transactionDate: dto.paymentDate,
        paymentMethod: toPaymentMethod(dto.paymentMode),
        referenceNumber: payment.id,        // link back to fee_payment.id
        bankName: dto.bankNameMr ?? undefined,
        voucherNumber: dto.receiptNumber,
        enteredBy: dto.collectedBy,
        isApproved: true,                   // auto-approve fee collection entries
      }));

      return { payment, items };
    });
  }

  async cancelPayment(id: string, reason?: string): Promise<void> {
    const payment = await this.payRepo.findOne({ where: { id } });
    if (!payment || payment.isCancelled) throw new NotFoundException();

    await this.dataSource.transaction(async (manager) => {
      const items = await manager.find(FeePaymentItem, { where: { paymentId: id } });
      for (const item of items) {
        const demand = await manager.findOne(FeeDemand, { where: { id: item.demandId } });
        if (demand) {
          demand.paidAmount = Math.max(0, +demand.paidAmount - +item.amount);
          await manager.save(FeeDemand, demand);
        }
      }
      await manager.update(FeePayment, id, { isCancelled: true, cancelReason: reason });

      // ── Reverse the ledger entry posted at collection time ─────────────────
      const original = await manager.findOne(AccountTransaction, { where: { referenceNumber: id } });
      if (original) {
        await manager.save(AccountTransaction, manager.create(AccountTransaction, {
          sansthaId: original.sansthaId,
          unitId: original.unitId,
          type: TransactionType.EXPENSE,
          category: AccountCategory.FEE_INCOME,
          descriptionMr: `शुल्क पावती रद्द — ${original.voucherNumber}${reason ? ' (' + reason + ')' : ''}`,
          amount: original.amount,
          transactionDate: new Date().toISOString().split('T')[0],
          paymentMethod: original.paymentMethod,
          referenceNumber: `CANCEL-${id}`,
          voucherNumber: original.voucherNumber,
          enteredBy: original.enteredBy,
          isApproved: true,
        }));
      }
    });
  }

  // ── Payment History ─────────────────────────────────────────────────────────

  async getStudentPayments(studentId: string, academicYearId?: string): Promise<any[]> {
    const where: any = { studentId, isCancelled: false };
    if (academicYearId) where.academicYearId = academicYearId;
    const payments = await this.payRepo.find({ where, order: { paymentDate: 'DESC' } });
    const result: any[] = [];
    for (const p of payments) {
      const items = await this.payItemRepo.find({ where: { paymentId: p.id } });
      result.push({ ...(p as any), items });
    }
    return result;
  }

  async getUnitPayments(unitId: string, academicYearId: string): Promise<FeePayment[]> {
    return this.payRepo.find({
      where: { unitId, academicYearId, isCancelled: false },
      order: { paymentDate: 'DESC' },
    });
  }

  async nextReceiptNumber(unitId: string): Promise<{ receiptNumber: string }> {
    const count = await this.payRepo.count({ where: { unitId } });
    return { receiptNumber: `RCP-${String(count + 1).padStart(5, '0')}` };
  }

  // ── Outstanding ─────────────────────────────────────────────────────────────

  async getStudentOutstanding(studentId: string, academicYearId: string): Promise<any> {
    const demands = await this.demandRepo.find({ where: { studentId, academicYearId } });
    const totalDemand = demands.reduce((s, d) => s + +d.netAmount, 0);
    const totalPaid = demands.reduce((s, d) => s + +d.paidAmount, 0);
    return { demands, totalDemand, totalPaid, outstanding: totalDemand - totalPaid };
  }

  async getUnitOutstanding(unitId: string, academicYearId: string): Promise<any[]> {
    const demands = await this.demandRepo.find({ where: { unitId, academicYearId } });
    const map: Record<string, { demand: number; paid: number }> = {};
    for (const d of demands) {
      if (!map[d.studentId]) map[d.studentId] = { demand: 0, paid: 0 };
      map[d.studentId].demand += +d.netAmount;
      map[d.studentId].paid += +d.paidAmount;
    }
    return Object.entries(map).map(([studentId, v]) => ({
      studentId, ...v, outstanding: v.demand - v.paid,
    }));
  }

  // ── Division-based demands (for class-first fee flow) ───────────────────────

  async getDivisionDemands(unitId: string, academicYearId: string, divisionId: string): Promise<any[]> {
    // Get all students in this division from student table via raw query
    // Returns demands grouped by student
    const demands = await this.demandRepo
      .createQueryBuilder('d')
      .innerJoin(
        'student',
        's',
        's.id = d.student_id AND s.division_id = :divisionId AND s.is_active = true',
        { divisionId },
      )
      .where('d.unit_id = :unitId', { unitId })
      .andWhere('d.academic_year_id = :academicYearId', { academicYearId })
      .addSelect(['s.id', 's.name_mr', 's.roll_number'])
      .orderBy('s.roll_number', 'ASC')
      .addOrderBy('d.fee_structure_id', 'ASC')
      .getRawAndEntities();
    return demands.entities;
  }

  // ── Defaulters ───────────────────────────────────────────────────────────────

  async getFeeMetrics(unitId: string, academicYearId: string): Promise<{
    totalDemanded: number; totalCollected: number; collectionPercent: number;
    defaultersCount: number; todayCollected: number;
  }> {
    const [totals, todayRows, defRows] = await Promise.all([
      this.dataSource.query(
        `SELECT COALESCE(SUM(net_amount),0) AS demanded, COALESCE(SUM(paid_amount),0) AS collected
         FROM fee_demand WHERE unit_id=$1 AND academic_year_id=$2`,
        [unitId, academicYearId],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount),0) AS today FROM fee_payment
         WHERE unit_id=$1 AND academic_year_id=$2 AND payment_date=CURRENT_DATE AND is_cancelled=false`,
        [unitId, academicYearId],
      ),
      this.dataSource.query(
        `SELECT COUNT(DISTINCT student_id) AS cnt FROM fee_demand
         WHERE unit_id=$1 AND academic_year_id=$2
           AND is_waived=false AND paid_amount < net_amount
           AND (due_date IS NULL OR due_date <= CURRENT_DATE)`,
        [unitId, academicYearId],
      ),
    ]);
    const demanded  = parseFloat(totals[0].demanded)  || 0;
    const collected = parseFloat(totals[0].collected) || 0;
    return {
      totalDemanded:     demanded,
      totalCollected:    collected,
      collectionPercent: demanded > 0 ? Math.round((collected / demanded) * 100) : 0,
      defaultersCount:   parseInt(defRows[0].cnt, 10) || 0,
      todayCollected:    parseFloat(todayRows[0].today) || 0,
    };
  }

  async getDefaulters(unitId: string, academicYearId: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    const demands = await this.demandRepo
      .createQueryBuilder('d')
      .where('d.unit_id = :unitId', { unitId })
      .andWhere('d.academic_year_id = :academicYearId', { academicYearId })
      .andWhere('d.is_waived = false')
      .andWhere('d.paid_amount < d.net_amount')
      .andWhere('(d.due_date IS NULL OR d.due_date <= :today)', { today })
      .orderBy('d.student_id')
      .getMany();

    const map: Record<string, { demands: FeeDemand[]; outstanding: number; maxDaysOverdue: number }> = {};
    for (const d of demands) {
      if (!map[d.studentId]) map[d.studentId] = { demands: [], outstanding: 0, maxDaysOverdue: 0 };
      map[d.studentId].demands.push(d);
      map[d.studentId].outstanding += +d.netAmount - +d.paidAmount;
      if (d.dueDate) {
        const days = Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86400000);
        if (days > map[d.studentId].maxDaysOverdue) map[d.studentId].maxDaysOverdue = days;
      }
    }
    return Object.entries(map).map(([studentId, v]) => ({ studentId, ...v }));
  }
}
