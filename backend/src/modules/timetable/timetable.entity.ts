import { Entity, Column, Index } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
}

/** Timetable entry — one period slot */
@Entity('timetable_entry')
@Index(['unitId', 'divisionId', 'dayOfWeek', 'periodNumber'], { unique: true })
export class TimetableEntry extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @Column({ name: 'grade_config_id', type: 'varchar', nullable: true })
  gradeConfigId: string;

  @Column({ name: 'division_id', type: 'varchar', nullable: true })
  divisionId: string;

  @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ name: 'period_number' })
  periodNumber: number; // 1, 2, 3...

  @Column({ name: 'period_label', type: 'varchar', nullable: true })
  periodLabel: string; // "पहिला तास", "स्वाध्याय"

  @Column({ name: 'start_time', type: 'varchar', nullable: true })
  startTime: string; // "08:00"

  @Column({ name: 'end_time', type: 'varchar', nullable: true })
  endTime: string; // "08:40"

  @Column({ name: 'subject_name_mr', type: 'varchar', nullable: true })
  subjectNameMr: string; // विषयाचे नाव

  @Column({ name: 'staff_id', type: 'varchar', nullable: true })
  staffId: string; // शिक्षक

  @Column({ name: 'room', type: 'varchar', nullable: true })
  room: string; // खोली / वर्गखोली
}
