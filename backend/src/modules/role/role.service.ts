import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { CreateRoleDto, UpdateRoleDto } from './role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    return this.repo.save(this.repo.create(dto));
  }

  async findBySanstha(sansthaId: string): Promise<Role[]> {
    return this.repo.find({
      where: { sansthaId, isActive: true },
      order: { nameEn: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('भूमिका सापडली नाही');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    // Cannot update system role names
    if (!role.isSystemRole) {
      Object.assign(role, dto);
    } else {
      // Only permissions can be updated on system roles
      if (dto.permissions) role.permissions = dto.permissions;
    }
    return this.repo.save(role);
  }
}
