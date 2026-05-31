import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sanstha } from './sanstha.entity';
import { CreateSansthaDto, UpdateSansthaDto } from './sanstha.dto';

@Injectable()
export class SansthaService {
  constructor(
    @InjectRepository(Sanstha)
    private readonly repo: Repository<Sanstha>,
  ) {}

  async create(dto: CreateSansthaDto): Promise<Sanstha> {
    const sanstha = this.repo.create(dto);
    return this.repo.save(sanstha);
  }

  async findAll(): Promise<Sanstha[]> {
    return this.repo.find({ where: { isActive: true }, order: { nameMr: 'ASC' } });
  }

  async findOne(id: string): Promise<Sanstha> {
    const sanstha = await this.repo.findOne({ where: { id } });
    if (!sanstha) throw new NotFoundException(`संस्था सापडली नाही`);
    return sanstha;
  }

  async update(id: string, dto: UpdateSansthaDto): Promise<Sanstha> {
    const sanstha = await this.findOne(id);
    Object.assign(sanstha, dto);
    return this.repo.save(sanstha);
  }

  async uploadLogo(id: string, logoUrl: string): Promise<Sanstha> {
    const sanstha = await this.findOne(id);
    sanstha.logoUrl = logoUrl;
    return this.repo.save(sanstha);
  }
}
