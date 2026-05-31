import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentAttendance, StaffAttendance, AttendanceStatus } from './attendance.entity';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class BulkAttendanceDto {
  @IsString() unitId: string;
  @IsString() sansthaId: string;
  @IsString() @IsOptional() academicYearId: string;
  @IsString() @IsOptional() divisionId: string;
  @IsString() date: string;
  @IsString() @IsOptional() markedBy: string;
  @IsArray() records: { studentId: string; status: AttendanceStatus; remarks?: string }[];
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(StudentAttendance)
    private readonly satRepo: Repository<StudentAttendance>,
    @InjectRepository(StaffAttendance)
    private readonly staffAtRepo: Repository<StaffAttendance>,
  ) {}

  async markBulk(dto: BulkAttendanceDto): Promise<StudentAttendance[]> {
    const records = dto.records.map((r) =>
      this.satRepo.create({
        sansthaId: dto.sansthaId,
        unitId: dto.unitId,
        academicYearId: dto.academicYearId,
        divisionId: dto.divisionId,
        date: dto.date,
        markedBy: dto.markedBy,
        studentId: r.studentId,
        status: r.status,
        remarks: r.remarks,
      }),
    );
    // Upsert by student + date
    await this.satRepo
      .createQueryBuilder()
      .insert()
      .into(StudentAttendance)
      .values(records)
      .orUpdate(['status', 'remarks', 'marked_by'], ['student_id', 'date'])
      .execute();
    return records;
  }

  async getByDivisionDate(divisionId: string, date: string): Promise<StudentAttendance[]> {
    return this.satRepo.find({ where: { divisionId, date } });
  }

  async getByUnitDate(unitId: string, date: string): Promise<StudentAttendance[]> {
    return this.satRepo.find({ where: { unitId, date } });
  }

  async getMonthlyReport(
    sansthaId: string, unitId: string, divisionId: string,
    year: number, month: number,
  ): Promise<StudentAttendance[]> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0];
    return this.satRepo
      .createQueryBuilder('a')
      .where('a.sansthaId = :sansthaId', { sansthaId })
      .andWhere('a.unitId = :unitId', { unitId })
      .andWhere('a.divisionId = :divisionId', { divisionId })
      .andWhere('a.date BETWEEN :start AND :end', { start, end })
      .getMany();
  }
}
