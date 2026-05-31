import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './unit.entity';
import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { UnitType, DivisionalBoard } from './unit.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnitDto {
  @IsString() sansthaId: string;
  @IsString() nameMr: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsEnum(UnitType) unitType: UnitType;
  @IsOptional() @IsString() udiseCode?: string;
  @IsOptional() @IsString() addressMr?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsBoolean() aided?: boolean;
  @IsOptional() @IsEnum(DivisionalBoard) divisionalBoard?: DivisionalBoard;
  @IsOptional() @IsNumber() establishedYear?: number;
}

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit)
    private readonly repo: Repository<Unit>,
  ) {}

  async create(dto: CreateUnitDto): Promise<Unit> {
    const unit = this.repo.create(dto);
    return this.repo.save(unit);
  }

  async findBySanstha(sansthaId: string): Promise<Unit[]> {
    return this.repo.find({
      where: { sansthaId, isActive: true },
      order: { nameMr: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Unit> {
    const unit = await this.repo.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('घटक सापडला नाही');
    return unit;
  }

  async update(id: string, dto: Partial<CreateUnitDto>): Promise<Unit> {
    const unit = await this.findOne(id);
    Object.assign(unit, dto);
    return this.repo.save(unit);
  }
}
