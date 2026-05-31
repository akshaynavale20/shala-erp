import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeConfig, Division } from './grade.entity';

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(GradeConfig) private readonly gradeRepo: Repository<GradeConfig>,
    @InjectRepository(Division)    private readonly divRepo: Repository<Division>,
  ) {}

  // ── GradeConfig ────────────────────────────────────────────────────────────

  async createGrade(dto: Partial<GradeConfig>): Promise<GradeConfig> {
    return this.gradeRepo.save(this.gradeRepo.create(dto));
  }

  async findGrades(unitId: string, academicYearId?: string): Promise<GradeConfig[]> {
    const where: any = { unitId, isActive: true };
    if (academicYearId) where.academicYearId = academicYearId;
    return this.gradeRepo.find({ where, order: { gradeNumber: 'ASC' } });
  }

  async updateGrade(id: string, dto: Partial<GradeConfig>): Promise<GradeConfig> {
    const g = await this.gradeRepo.findOne({ where: { id } });
    if (!g) throw new NotFoundException('इयत्ता सापडली नाही');
    Object.assign(g, dto);
    return this.gradeRepo.save(g);
  }

  async deleteGrade(id: string): Promise<void> {
    await this.gradeRepo.update(id, { isActive: false });
  }

  // ── Division ───────────────────────────────────────────────────────────────

  async createDivision(dto: Partial<Division>): Promise<Division> {
    return this.divRepo.save(this.divRepo.create(dto));
  }

  async findDivisions(unitId: string, academicYearId?: string, gradeConfigId?: string): Promise<Division[]> {
    const where: any = { unitId, isActive: true };
    if (academicYearId) where.academicYearId = academicYearId;
    if (gradeConfigId) where.gradeConfigId = gradeConfigId;
    return this.divRepo.find({
      where,
      order: { gradeConfigId: 'ASC', nameMr: 'ASC' },
    });
  }

  async findDivisionsWithGrade(unitId: string | undefined, academicYearId?: string, sansthaId?: string): Promise<any[]> {
    const qb = this.divRepo.createQueryBuilder('d')
      .leftJoinAndSelect('d.gradeConfig', 'g')
      .andWhere('d.is_active = true');
    if (unitId) {
      qb.where('d.unit_id = :unitId', { unitId });
    } else if (sansthaId) {
      qb.innerJoin('d.unit', 'u').where('u.sanstha_id = :sansthaId', { sansthaId });
    }
    if (academicYearId) qb.andWhere('d.academic_year_id = :academicYearId', { academicYearId });
    qb.orderBy('g.grade_number', 'ASC').addOrderBy('d.name_mr', 'ASC');
    return qb.getMany();
  }

  async updateDivision(id: string, dto: Partial<Division>): Promise<Division> {
    const d = await this.divRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('तुकडी सापडली नाही');
    Object.assign(d, dto);
    return this.divRepo.save(d);
  }

  async deleteDivision(id: string): Promise<void> {
    await this.divRepo.update(id, { isActive: false });
  }
}
