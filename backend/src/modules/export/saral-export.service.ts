import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Student } from '../student/student.entity';
import { Unit } from '../unit/unit.entity';
import { AcademicYear } from '../academic-year/academic-year.entity';

@Injectable()
export class SaralExportService {
  constructor(
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Unit) private readonly unitRepo: Repository<Unit>,
    @InjectRepository(AcademicYear) private readonly ayRepo: Repository<AcademicYear>,
  ) {}

  async exportSaral(unitId: string, academicYearId: string): Promise<Buffer> {
    const [students, unit, ay] = await Promise.all([
      this.studentRepo.find({ where: { unitId, academicYearId, isActive: true } }),
      this.unitRepo.findOne({ where: { id: unitId } }),
      this.ayRepo.findOne({ where: { id: academicYearId } }),
    ]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('SARAL Export');

    sheet.columns = [
      { header: 'General Register No.', key: 'grNumber', width: 20 },
      { header: 'Stream', key: 'stream', width: 15 },
      { header: 'Admission Academic Year', key: 'admissionYear', width: 25 },
      { header: 'Standard', key: 'standard', width: 12 },
      { header: 'Division', key: 'division', width: 12 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Middle Name', key: 'middleName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Mother First Name', key: 'motherFirst', width: 20 },
      { header: 'Mother Middle Name', key: 'motherMiddle', width: 20 },
      { header: 'Mother Last Name', key: 'motherLast', width: 20 },
      { header: 'UDISE Number', key: 'udise', width: 15 },
      { header: 'Medium', key: 'medium', width: 15 },
      { header: 'Semi English', key: 'semiEnglish', width: 15 },
      { header: 'Date of Admission', key: 'admissionDate', width: 18 },
      { header: 'Standard at Admission', key: 'standardAtAdmission', width: 22 },
      { header: 'Admission Type', key: 'admissionType', width: 18 },
      { header: 'UID/Aadhaar', key: 'aadhaar', width: 15 },
      { header: 'SARAL ID', key: 'saralId', width: 20 }, // TODO(OQ-001): verify SARAL ID format
    ];

    for (const s of students) {
      const nameParts = (s.nameMr || '').split(' ');
      const motherParts = (s.motherNameMr || '').split(' ');
      sheet.addRow({
        grNumber: s.grNumber || '',
        stream: 'Not Applicable',
        admissionYear: ay?.labelEn || '',
        standard: '',
        division: '',
        firstName: nameParts[0] || '',
        middleName: nameParts[1] || '',
        lastName: nameParts[2] || '',
        dob: s.dateOfBirth || '',
        gender: s.gender === 'male' ? 'Male' : s.gender === 'female' ? 'Female' : 'Transgender',
        motherFirst: motherParts[0] || '',
        motherMiddle: motherParts[1] || '',
        motherLast: motherParts[2] || '',
        udise: unit?.udiseCode || '',
        medium: 'Marathi',
        semiEnglish: 'No',
        admissionDate: s.admissionDate || '',
        standardAtAdmission: '',
        admissionType: 'Regular',
        aadhaar: s.aadhaar || '',
        saralId: s.saralId || '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
