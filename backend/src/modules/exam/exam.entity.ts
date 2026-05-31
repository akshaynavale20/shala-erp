import { Entity, Column } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum ExamType {
  UNIT_TEST = 'unit_test',        // घटक चाचणी
  HALF_YEARLY = 'half_yearly',    // अर्धवार्षिक
  ANNUAL = 'annual',              // वार्षिक
  PRELIMINARY = 'preliminary',    // प्राथमिक
  BOARD = 'board',                // मंडळ
}

export enum ResultStatus {
  PASS = 'pass',         // उत्तीर्ण
  FAIL = 'fail',         // अनुत्तीर्ण
  ABSENT = 'absent',     // अनुपस्थित
  WITHHELD = 'withheld', // प्रतीक्षित
}

// Exam definition (e.g. "अर्धवार्षिक परीक्षा २०२६-२७")
@Entity('exam')
export class Exam extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @Column({ name: 'name_mr' })
  nameMr: string; // परीक्षेचे नाव

  @Column({ type: 'enum', enum: ExamType })
  examType: ExamType;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ name: 'grade_config_id', nullable: true })
  gradeConfigId: string; // इयत्ता (null = all grades)

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

// Marks entry per student per subject
@Entity('exam_marks')
export class ExamMarks extends SansthaBaseEntity {
  @Column({ name: 'exam_id' })
  examId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'subject_id', type: 'varchar', nullable: true })
  subjectId: string;

  @Column({ name: 'theory_marks', type: 'decimal', precision: 5, scale: 2, nullable: true })
  theoryMarks: number;

  @Column({ name: 'internal_marks', type: 'decimal', precision: 5, scale: 2, nullable: true })
  internalMarks: number;

  @Column({ name: 'practical_marks', type: 'decimal', precision: 5, scale: 2, nullable: true })
  practicalMarks: number;

  @Column({ name: 'total_marks', type: 'decimal', precision: 5, scale: 2, nullable: true })
  totalMarks: number;

  @Column({ name: 'grade_letter', nullable: true })
  gradeLetter: string; // A+, A, B+, B, C, D, E

  @Column({ type: 'enum', enum: ResultStatus, nullable: true })
  resultStatus: ResultStatus;

  @Column({ nullable: true })
  remarks: string;
}
