import { Entity, Column } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum BloodGroup {
  A_POS = 'A+', A_NEG = 'A-',
  B_POS = 'B+', B_NEG = 'B-',
  AB_POS = 'AB+', AB_NEG = 'AB-',
  O_POS = 'O+', O_NEG = 'O-',
}

export enum AdmissionStatus {
  ACTIVE = 'active',
  TRANSFERRED = 'transferred',
  LEFT = 'left',
  PASSED_OUT = 'passed_out',
}

@Entity('student')
export class Student extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  // ── Name
  @Column({ name: 'name_mr' })
  nameMr: string; // पूर्ण नाव (मराठी)

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ name: 'father_name_mr', nullable: true })
  fatherNameMr: string; // वडिलांचे नाव

  @Column({ name: 'mother_name_mr', nullable: true })
  motherNameMr: string; // आईचे नाव

  // ── Basic info
  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string;

  @Column({ name: 'birth_place_mr', nullable: true })
  birthPlaceMr: string; // जन्मस्थान

  @Column({ type: 'enum', enum: BloodGroup, nullable: true, name: 'blood_group' })
  bloodGroup: BloodGroup;

  // ── Academic
  @Column({ name: 'grade_config_id', nullable: true })
  gradeConfigId: string; // इयत्ता

  @Column({ name: 'division_id', nullable: true })
  divisionId: string; // तुकडी

  @Column({ name: 'roll_number', nullable: true })
  rollNumber: string; // हजेरी क्रमांक

  @Column({ name: 'gr_number', nullable: true })
  grNumber: string; // G.R. क्रमांक (General Register)

  @Column({ name: 'saral_id', nullable: true })
  saralId: string; // SARAL ID (free text)

  @Column({ name: 'admission_date', type: 'date', nullable: true })
  admissionDate: string; // प्रवेश दिनांक

  @Column({ name: 'admission_number', nullable: true })
  admissionNumber: string; // प्रवेश क्रमांक

  // ── Category / Reservation
  @Column({ name: 'category', nullable: true })
  category: string; // SC/ST/OBC/VJ/NT-A/NT-B/NT-C/NT-D/SBC/SEBC/EWS/Open

  @Column({ name: 'caste_mr', nullable: true })
  casteMr: string; // जात

  @Column({ name: 'religion_mr', nullable: true })
  religionMr: string; // धर्म

  @Column({ name: 'nationality_mr', nullable: true, default: 'भारतीय' })
  nationalityMr: string; // राष्ट्रीयत्व

  // ── Contact
  @Column({ nullable: true })
  phone: string; // पालकाचा दूरध्वनी

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'address_mr', type: 'text', nullable: true })
  addressMr: string; // पत्ता

  // ── Identity (DPDP compliant)
  @Column({ name: 'aadhaar_last4', nullable: true, length: 4 })
  aadhaarLast4: string; // आधार (शेवटचे ४ अंक)

  // ── Photo
  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  // ── Status
  @Column({ type: 'enum', enum: AdmissionStatus, default: AdmissionStatus.ACTIVE })
  status: AdmissionStatus;

  @Column({ name: 'leaving_date', type: 'date', nullable: true })
  leavingDate: string; // शाळा सोडल्याचा दिनांक

  @Column({ name: 'leaving_reason_mr', nullable: true })
  leavingReasonMr: string; // शाळा सोडण्याचे कारण

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sms_opt_out', default: false })
  smsOptOut: boolean;

  @Column({ name: 'mobile', nullable: true })
  mobile: string;

  @Column({ name: 'aadhaar', nullable: true })
  aadhaar: string;
}
