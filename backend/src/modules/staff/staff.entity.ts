import { Entity, Column } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum StaffGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum EmployeeType {
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary',
  CONTRACT = 'contract',
  AIDED = 'aided',
  UNAIDED = 'unaided',
}

@Entity('staff')
export class Staff extends SansthaBaseEntity {
  get staffId(): string {
    return this.id;
  }

  @Column({ name: 'unit_id', type: 'varchar', nullable: true })
  unitId: string;

  @Column({ name: 'name_mr' })
  nameMr: string;

  @Column({ name: 'name_en', type: 'varchar', nullable: true })
  nameEn: string;

  @Column({ type: 'enum', enum: StaffGender, nullable: true })
  gender: StaffGender;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string;

  @Column({ name: 'joining_date', type: 'date' })
  joiningDate: string;

  @Column({ name: 'designation_mr' })
  designationMr: string;

  @Column({ name: 'qualification_mr', type: 'varchar', nullable: true })
  qualificationMr: string;

  @Column({ name: 'subject_mr', type: 'varchar', nullable: true })
  subjectMr: string;

  @Column({
    name: 'employee_type',
    type: 'enum',
    enum: EmployeeType,
    default: EmployeeType.PERMANENT,
  })
  employeeType: EmployeeType;

  @Column({ name: 'salary_grade', type: 'varchar', nullable: true })
  salaryGrade: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ name: 'aadhaar_last4', type: 'varchar', nullable: true, length: 4 })
  aadhaarLast4: string;

  @Column({ name: 'saral_id', type: 'varchar', nullable: true })
  saralId: string;

  @Column({ name: 'blood_group', type: 'varchar', nullable: true })
  bloodGroup: string;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
