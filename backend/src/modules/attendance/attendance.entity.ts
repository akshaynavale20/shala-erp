import { Entity, Column, Index } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum AttendanceStatus {
  PRESENT = 'P',   // उपस्थित
  ABSENT = 'A',    // अनुपस्थित
  HALF_DAY = 'H',  // अर्धदिवस
  LATE = 'L',      // उशिरा
  HOLIDAY = 'HD',  // सुट्टी
}

@Entity('student_attendance')
@Index(['unitId', 'divisionId', 'date'])
@Index(['studentId', 'date'], { unique: true })
export class StudentAttendance extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'division_id' })
  divisionId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Column({ name: 'marked_by', nullable: true })
  markedBy: string; // userId

  @Column({ nullable: true })
  remarks: string;
}

@Entity('staff_attendance')
@Index(['unitId', 'date'])
@Index(['staffId', 'date'], { unique: true })
export class StaffAttendance extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'staff_id' })
  staffId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Column({ nullable: true })
  remarks: string;
}
