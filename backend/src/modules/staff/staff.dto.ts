import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffGender, EmployeeType } from './staff.entity';

export class CreateStaffDto {
  @ApiProperty()
  @IsString()
  sansthaId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiProperty({ example: 'रामकृष्ण पाटील' })
  @IsString()
  nameMr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ enum: StaffGender })
  @IsOptional()
  @IsEnum(StaffGender)
  gender?: StaffGender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty()
  @IsDateString()
  joiningDate: string;

  @ApiProperty({ example: 'मुख्याध्यापक' })
  @IsString()
  designationMr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualificationMr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectMr?: string;

  @ApiProperty({ enum: EmployeeType })
  @IsEnum(EmployeeType)
  employeeType: EmployeeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryGrade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4)
  aadhaarLast4?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  saralId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateStaffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameMr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ enum: StaffGender })
  @IsOptional()
  @IsEnum(StaffGender)
  gender?: StaffGender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designationMr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualificationMr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectMr?: string;

  @ApiPropertyOptional({ enum: EmployeeType })
  @IsOptional()
  @IsEnum(EmployeeType)
  employeeType?: EmployeeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryGrade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4)
  aadhaarLast4?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  saralId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
