import { IsString, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { RoleScope, Permission } from './role.entity';

export class CreateRoleDto {
  @IsString() sansthaId: string;
  @IsString() nameMr: string;
  @IsString() nameEn: string;
  @IsOptional() @IsString() systemKey?: string;
  @IsEnum(RoleScope) scope: RoleScope;
  @IsArray() permissions: Permission[];
  @IsOptional() @IsBoolean() isSystemRole?: boolean;
}

export class UpdateRoleDto {
  @IsOptional() @IsString() nameMr?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsArray() permissions?: Permission[];
}
