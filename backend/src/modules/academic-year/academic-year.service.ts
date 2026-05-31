import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from './academic-year.entity';

@Injectable()
export class AcademicYearService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly repo: Repository<AcademicYear>,
  ) {}

  findBySanstha(sansthaId: string): Promise<AcademicYear[]> {
    return this.repo.find({
      where: { sansthaId },
      order: { startDate: 'DESC' },
    });
  }

  create(dto: Partial<AcademicYear>): Promise<AcademicYear> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<AcademicYear>): Promise<AcademicYear> {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } }) as Promise<AcademicYear>;
  }
}
