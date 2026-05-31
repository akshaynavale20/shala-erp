import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Gender, BloodGroup, AdmissionStatus } from './student.entity';

export class CreateStudentDto {
  @IsString() sansthaId: string;
  @IsString() unitId: string;
  @IsString() academicYearId: string;
  @IsString() nameMr: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() fatherNameMr?: string;
  @IsOptional() @IsString() motherNameMr?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() birthPlaceMr?: string;
  @IsOptional() @IsEnum(BloodGroup) bloodGroup?: BloodGroup;
  @IsOptional() @IsString() gradeConfigId?: string;
  @IsOptional() @IsString() divisionId?: string;
  @IsOptional() @IsString() rollNumber?: string;
  @IsOptional() @IsString() grNumber?: string;
  @IsOptional() @IsString() saralId?: string;
  @IsOptional() @IsDateString() admissionDate?: string;
  @IsOptional() @IsString() admissionNumber?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() casteMr?: string;
  @IsOptional() @IsString() religionMr?: string;
  @IsOptional() @IsString() nationalityMr?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() addressMr?: string;
  @IsOptional() @IsString() aadhaarLast4?: string;
}

export class UpdateStudentDto {
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() academicYearId?: string;
  @IsOptional() @IsString() nameMr?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() fatherNameMr?: string;
  @IsOptional() @IsString() motherNameMr?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() birthPlaceMr?: string;
  @IsOptional() @IsEnum(BloodGroup) bloodGroup?: BloodGroup;
  @IsOptional() @IsString() gradeConfigId?: string;
  @IsOptional() @IsString() divisionId?: string;
  @IsOptional() @IsString() rollNumber?: string;
  @IsOptional() @IsString() grNumber?: string;
  @IsOptional() @IsString() saralId?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() casteMr?: string;
  @IsOptional() @IsString() religionMr?: string;
  @IsOptional() @IsString() nationalityMr?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() addressMr?: string;
  @IsOptional() @IsString() aadhaarLast4?: string;
  @IsOptional() @IsEnum(AdmissionStatus) status?: AdmissionStatus;
  @IsOptional() @IsDateString() admissionDate?: string;
  @IsOptional() @IsString() admissionNumber?: string;
  @IsOptional() @IsDateString() leavingDate?: string;
  @IsOptional() @IsString() leavingReasonMr?: string;
}
