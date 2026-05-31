import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountTransaction, TransactionType } from './accounts.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountTransaction)
    private readonly repo: Repository<AccountTransaction>,
  ) {}

  create(dto: Partial<AccountTransaction>): Promise<AccountTransaction> {
    return this.repo.save(this.repo.create(dto));
  }

  findAll(sansthaId: string, params?: {
    unitId?: string; financialYearId?: string;
    type?: string; startDate?: string; endDate?: string;
  }): Promise<AccountTransaction[]> {
    const qb = this.repo.createQueryBuilder('t')
      .where('t.sanstha_id = :sansthaId', { sansthaId })
      .orderBy('t.transaction_date', 'DESC');
    if (params?.unitId) qb.andWhere('t.unit_id = :unitId', { unitId: params.unitId });
    if (params?.financialYearId) qb.andWhere('t.financial_year_id = :fy', { fy: params.financialYearId });
    if (params?.type) qb.andWhere('t.type = :type', { type: params.type });
    if (params?.startDate) qb.andWhere('t.transaction_date >= :sd', { sd: params.startDate });
    if (params?.endDate) qb.andWhere('t.transaction_date <= :ed', { ed: params.endDate });
    return qb.getMany();
  }

  findOneForTenant(id: string, sansthaId: string): Promise<AccountTransaction | null> {
    return this.repo.findOne({ where: { id, sansthaId } });
  }

  async update(id: string, dto: Partial<AccountTransaction>): Promise<AccountTransaction> {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } }) as Promise<AccountTransaction>;
  }

  async approve(id: string, approvedBy: string): Promise<void> {
    await this.repo.update(id, { isApproved: true, approvedBy });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async summary(sansthaId: string, params?: { financialYearId?: string; startDate?: string; endDate?: string }) {
    const all = await this.findAll(sansthaId, params);
    const income = all.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + (+t.amount || 0), 0);
    const expense = all.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + (+t.amount || 0), 0);

    const byCategory: Record<string, { income: number; expense: number }> = {};
    for (const t of all) {
      if (!byCategory[t.category]) byCategory[t.category] = { income: 0, expense: 0 };
      if (t.type === TransactionType.INCOME) byCategory[t.category].income += +t.amount || 0;
      else byCategory[t.category].expense += +t.amount || 0;
    }

    const byMonth: Record<string, { income: number; expense: number }> = {};
    for (const t of all) {
      const key = t.transactionDate?.slice(0, 7) || 'unknown';
      if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
      if (t.type === TransactionType.INCOME) byMonth[key].income += +t.amount || 0;
      else byMonth[key].expense += +t.amount || 0;
    }

    return { totalIncome: income, totalExpense: expense, balance: income - expense, byCategory, byMonth, count: all.length };
  }

  async nextVoucherNumber(sansthaId: string, type: string): Promise<string> {
    const prefix = type === 'income' ? 'JM' : 'KH';
    const count = await this.repo.count({ where: { sansthaId, type: type as any } });
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
}
