import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, AdmissionStatus } from './student.entity';
import { CreateStudentDto, UpdateStudentDto } from './student.dto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx');

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly repo: Repository<Student>,
  ) {}

  async create(dto: CreateStudentDto): Promise<Student> {
    return this.repo.save(this.repo.create(dto));
  }

  async findBySanstha(sansthaId: string, unitId?: string, academicYearId?: string, divisionId?: string): Promise<Student[]> {
    const where: any = { sansthaId, isActive: true };
    if (unitId) where.unitId = unitId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (divisionId) where.divisionId = divisionId;
    return this.repo.find({ where, order: { rollNumber: 'ASC', nameMr: 'ASC' } });
  }

  async findOne(id: string): Promise<Student> {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('विद्यार्थी सापडला नाही');
    return s;
  }

  async update(id: string, dto: UpdateStudentDto): Promise<Student> {
    const s = await this.findOne(id);
    Object.assign(s, dto);
    return this.repo.save(s);
  }

  async uploadPhoto(id: string, photoUrl: string): Promise<Student> {
    const s = await this.findOne(id);
    s.photoUrl = photoUrl;
    return this.repo.save(s);
  }

  async deactivate(id: string): Promise<void> {
    await this.repo.update(id, { isActive: false, status: AdmissionStatus.LEFT });
  }

  async countBySanstha(sansthaId: string): Promise<number> {
    return this.repo.count({ where: { sansthaId, isActive: true } });
  }

  async importFromExcel(
    buffer: Buffer,
    sansthaId: string,
    unitId: string,
    academicYearId: string,
  ): Promise<{ imported: number; failed: number; errors: any[] }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    const errors: any[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      if (!row['nameMr'] && !row['नाव (मराठी)']) {
        errors.push({ row: rowNum, field: 'nameMr', message: 'नाव (मराठी) आवश्यक आहे' });
        continue;
      }

      try {
        const student = this.repo.create({
          sansthaId,
          unitId,
          academicYearId,
          nameMr: row['nameMr'] || row['नाव (मराठी)'] || '',
          nameEn: row['nameEn'] || row['Name (English)'] || '',
          fatherNameMr: row['fatherNameMr'] || row['वडिलांचे नाव'] || '',
          motherNameMr: row['motherNameMr'] || row['आईचे नाव'] || '',
          gender: row['gender'] || row['लिंग'] || null,
          dateOfBirth: row['dateOfBirth'] || row['जन्म दिनांक'] || null,
          grNumber: row['grNumber'] || row['G.R. क्रमांक'] || '',
          rollNumber: row['rollNumber'] || row['हजेरी क्रमांक'] || '',
          admissionDate: row['admissionDate'] || row['प्रवेश दिनांक'] || null,
          category: row['category'] || row['प्रवर्ग'] || null,
          mobile: row['mobile'] || row['भ्रमणध्वनी'] || null,
          aadhaar: row['aadhaar'] || row['आधार क्रमांक'] || null,
          status: AdmissionStatus.ACTIVE,
          isActive: true,
        });
        await this.repo.save(student);
        imported++;
      } catch (e) {
        errors.push({ row: rowNum, field: 'unknown', message: String(e) });
      }
    }

    return { imported, failed: errors.length, errors };
  }
}
