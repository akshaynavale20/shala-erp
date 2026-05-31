import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeePayment } from '../fee/fee.entity';
import { Certificate, CertificateStatus } from '../certificate/certificate.entity';
import { Sanstha } from '../sanstha/sanstha.entity';
import { Unit } from '../unit/unit.entity';

const API_BASE = process.env.API_URL || 'http://localhost:3001';

@ApiTags('सत्यापन (Public)')
@Controller('api/v1/verify')
export class VerifyController {
  constructor(
    @InjectRepository(FeePayment)  private readonly payRepo:    Repository<FeePayment>,
    @InjectRepository(Certificate) private readonly certRepo:   Repository<Certificate>,
    @InjectRepository(Sanstha)     private readonly sansthaRepo: Repository<Sanstha>,
    @InjectRepository(Unit)        private readonly unitRepo:    Repository<Unit>,
  ) {}

  /** Public — no JWT guard */
  @Get('receipt/:receiptNumber')
  async verifyReceipt(@Param('receiptNumber') receiptNumber: string) {
    const payment = await this.payRepo.findOne({ where: { receiptNumber } });

    if (!payment) {
      return { valid: false, type: 'receipt', receiptNumber, message: 'पावती आढळली नाही' };
    }

    if (payment.isCancelled) {
      return {
        valid: false,
        type: 'receipt',
        receiptNumber,
        issueDate: payment.paymentDate,
        message: 'ही पावती रद्द करण्यात आली आहे',
      };
    }

    const [sanstha, unit] = await Promise.all([
      this.sansthaRepo.findOne({ where: { id: payment.sansthaId } }),
      this.unitRepo.findOne({ where: { id: payment.unitId } }),
    ]);

    // No PII returned — receipt number is guessable; only expose validity + date + branding.
    return {
      valid: true,
      type: 'receipt',
      receiptNumber: payment.receiptNumber,
      issueDate: payment.paymentDate,
      schoolName: sanstha?.nameMr || '—',
      unitName: unit?.nameMr,
      logoUrl: sanstha?.logoUrl ? `${API_BASE}${sanstha.logoUrl}` : null,
    };
  }

  /** Public — no JWT guard */
  @Get('cert/:certificateNumber')
  async verifyCert(@Param('certificateNumber') certificateNumber: string) {
    const cert = await this.certRepo.findOne({ where: { certificateNumber } });

    if (!cert) {
      return { valid: false, type: 'cert', certificateNumber, message: 'प्रमाणपत्र आढळले नाही' };
    }

    if (cert.status === CertificateStatus.CANCELLED) {
      return {
        valid: false,
        type: 'cert',
        certificateNumber,
        issueDate: cert.issueDate,
        message: 'हे प्रमाणपत्र रद्द करण्यात आले आहे',
      };
    }

    const [sanstha, unit] = await Promise.all([
      this.sansthaRepo.findOne({ where: { id: cert.sansthaId } }),
      this.unitRepo.findOne({ where: { id: cert.unitId } }),
    ]);

    // No PII — certificate number is guessable; only expose validity + date + branding.
    return {
      valid: true,
      type: 'cert',
      certificateNumber: cert.certificateNumber,
      certificateType: cert.certificateType,
      issueDate: cert.issueDate,
      schoolName: sanstha?.nameMr || '—',
      unitName: unit?.nameMr,
      logoUrl: sanstha?.logoUrl ? `${API_BASE}${sanstha.logoUrl}` : null,
    };
  }
}
