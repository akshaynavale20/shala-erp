import { Entity, Column } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum CertificateType {
  BONAFIDE = 'bonafide',           // बोनाफाईड प्रमाणपत्र
  LEAVING = 'leaving',             // शाळा सोडल्याचा दाखला (TC)
  CHARACTER = 'character',         // चारित्र्य प्रमाणपत्र
  CASTE = 'caste_validity',        // जाती वैधता
  STUDY = 'study',                 // अध्ययन प्रमाणपत्र
  MIGRATION = 'migration',         // स्थलांतर प्रमाणपत्र
  MEDIUM = 'medium',               // माध्यम प्रमाणपत्र
}

export enum CertificateStatus {
  ISSUED = 'issued',     // दिले
  CANCELLED = 'cancelled', // रद्द
}

@Entity('certificate')
export class Certificate extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'academic_year_id', nullable: true })
  academicYearId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ type: 'enum', enum: CertificateType })
  certificateType: CertificateType;

  @Column({ name: 'certificate_number' })
  certificateNumber: string; // प्रमाणपत्र क्रमांक

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: string;

  @Column({ name: 'issued_by' })
  issuedBy: string; // userId

  @Column({ name: 'purpose_mr', nullable: true })
  purposeMr: string; // कारण/उद्देश

  @Column({ type: 'enum', enum: CertificateStatus, default: CertificateStatus.ISSUED })
  status: CertificateStatus;

  @Column({ name: 'remarks', nullable: true })
  remarks: string;

  // Type-specific extra fields (TC: conduct, classLastStudied, duesCleared etc.)
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
