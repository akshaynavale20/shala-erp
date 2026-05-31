import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate, CertificateStatus } from './certificate.entity';

@Injectable()
export class CertificateService {
  constructor(
    @InjectRepository(Certificate)
    private readonly repo: Repository<Certificate>,
  ) {}

  async issue(dto: Partial<Certificate>): Promise<Certificate> {
    const cert = this.repo.create(dto);
    return this.repo.save(cert);
  }

  async findByStudent(studentId: string): Promise<Certificate[]> {
    return this.repo.find({ where: { studentId }, order: { issueDate: 'DESC' } });
  }

  async findBySanstha(sansthaId: string, unitId?: string): Promise<Certificate[]> {
    const where: any = { sansthaId };
    if (unitId) where.unitId = unitId;
    return this.repo.find({ where, order: { issueDate: 'DESC' } });
  }

  async findOne(id: string): Promise<Certificate> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('प्रमाणपत्र सापडले नाही');
    return c;
  }

  async cancel(id: string): Promise<void> {
    await this.repo.update(id, { status: CertificateStatus.CANCELLED });
  }

  async nextCertNumber(unitId: string, type: string): Promise<string> {
    const prefix = type.toUpperCase().slice(0, 3);
    const count = await this.repo.count({ where: { unitId, certificateType: type as any } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}
