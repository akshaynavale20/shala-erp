import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimetableEntry } from './timetable.entity';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(TimetableEntry) private readonly repo: Repository<TimetableEntry>,
  ) {}

  async getByDivision(unitId: string, divisionId: string, academicYearId: string): Promise<TimetableEntry[]> {
    return this.repo.find({
      where: { unitId, divisionId, academicYearId },
      order: { dayOfWeek: 'ASC', periodNumber: 'ASC' },
    });
  }

  async getByUnit(unitId: string, academicYearId: string): Promise<TimetableEntry[]> {
    return this.repo.find({
      where: { unitId, academicYearId },
      order: { dayOfWeek: 'ASC', periodNumber: 'ASC' },
    });
  }

  async saveEntry(dto: Partial<TimetableEntry>): Promise<TimetableEntry> {
    // Upsert by unique index
    const existing = await this.repo.findOne({
      where: {
        unitId: dto.unitId,
        divisionId: dto.divisionId,
        dayOfWeek: dto.dayOfWeek,
        periodNumber: dto.periodNumber,
      },
    });
    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create(dto));
  }

  async saveBulk(entries: Partial<TimetableEntry>[]): Promise<TimetableEntry[]> {
    const results: TimetableEntry[] = [];
    for (const e of entries) {
      results.push(await this.saveEntry(e));
    }
    return results;
  }

  async deleteEntry(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
