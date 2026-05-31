import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialYear } from './financial-year.entity';

@Injectable()
export class FinancialYearService {
  constructor(
    @InjectRepository(FinancialYear)
    private readonly repo: Repository<FinancialYear>,
  ) {}

  findBySanstha(sansthaId: string): Promise<FinancialYear[]> {
    return this.repo.find({
      where: { sansthaId },
      order: { startDate: 'DESC' },
    });
  }

  async create(dto: Partial<FinancialYear>): Promise<FinancialYear> {
    return this.repo.save(this.repo.create(dto));
  }
}
