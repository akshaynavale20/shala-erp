import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam, ExamMarks } from './exam.entity';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam) private readonly examRepo: Repository<Exam>,
    @InjectRepository(ExamMarks) private readonly marksRepo: Repository<ExamMarks>,
  ) {}

  async createExam(dto: Partial<Exam>): Promise<Exam> {
    return this.examRepo.save(this.examRepo.create(dto));
  }

  async findBySanstha(sansthaId: string, unitId?: string, academicYearId?: string): Promise<Exam[]> {
    const where: any = { sansthaId, isActive: true };
    if (unitId) where.unitId = unitId;
    if (academicYearId) where.academicYearId = academicYearId;
    return this.examRepo.find({ where, order: { startDate: 'DESC' } });
  }

  async findOne(id: string): Promise<Exam> {
    const e = await this.examRepo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('परीक्षा सापडली नाही');
    return e;
  }

  async updateExam(id: string, dto: Partial<Exam>): Promise<Exam> {
    const e = await this.findOne(id);
    Object.assign(e, dto);
    return this.examRepo.save(e);
  }

  async saveMarks(examId: string, marks: Partial<ExamMarks>[]): Promise<ExamMarks[]> {
    if (!marks || marks.length === 0) return [];
    // Delete existing marks for this exam, then insert fresh
    await this.marksRepo.delete({ examId });
    const entities = marks.filter(m => m.studentId).map((m) =>
      this.marksRepo.create({ ...m, examId })
    );
    if (entities.length === 0) return [];
    return this.marksRepo.save(entities);
  }

  async getMarksByExam(examId: string): Promise<ExamMarks[]> {
    return this.marksRepo.find({ where: { examId } });
  }

  async getMarksByStudent(studentId: string, examId: string): Promise<ExamMarks[]> {
    return this.marksRepo.find({ where: { studentId, examId } });
  }
}
