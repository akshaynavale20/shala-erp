import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './staff.entity';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly repo: Repository<Staff>,
  ) {}

  async create(dto: CreateStaffDto): Promise<Staff> {
    const staff = this.repo.create(dto as any);
    return this.repo.save(staff as any) as unknown as Promise<Staff>;
  }

  async findBySanstha(sansthaId: string, unitId?: string): Promise<Staff[]> {
    const where: any = { sansthaId, isActive: true };
    if (unitId) where.unitId = unitId;
    return this.repo.find({ where, order: { nameMr: 'ASC' } });
  }

  async findOne(id: string): Promise<Staff> {
    const staff = await this.repo.findOne({ where: { id } });
    if (!staff) throw new NotFoundException('कर्मचारी सापडला नाही');
    return staff;
  }

  async update(id: string, dto: UpdateStaffDto): Promise<Staff> {
    const staff = await this.findOne(id);
    Object.assign(staff, dto);
    return this.repo.save(staff);
  }

  async deactivate(id: string): Promise<void> {
    await this.repo.update(id, { isActive: false });
  }

  async uploadPhoto(id: string, photoUrl: string): Promise<Staff> {
    const staff = await this.findOne(id);
    staff.photoUrl = photoUrl;
    return this.repo.save(staff);
  }
}
