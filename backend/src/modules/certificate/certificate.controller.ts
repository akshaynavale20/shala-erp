import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('प्रमाणपत्रे')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/certificates')
export class CertificateController {
  constructor(private readonly service: CertificateService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.CERT_ISSUE)
  issue(@Body() dto: any) { return this.service.issue(dto); }

  @Get()
  @RequirePermissions(PERMISSIONS.CERT_READ)
  findAll(@CurrentSansthaId() s: string, @Query('unitId') u?: string) {
    return this.service.findBySanstha(s, u);
  }

  @Get('next-number/:unitId/:type')
  @RequirePermissions(PERMISSIONS.CERT_ISSUE)
  nextNumber(@Param('unitId') unitId: string, @Param('type') type: string) {
    return this.service.nextCertNumber(unitId, type);
  }

  @Get('student/:studentId')
  @RequirePermissions(PERMISSIONS.CERT_READ)
  byStudent(@Param('studentId') studentId: string) { return this.service.findByStudent(studentId); }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CERT_READ)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id/cancel')
  @RequirePermissions(PERMISSIONS.CERT_ISSUE)
  cancel(@Param('id') id: string) { return this.service.cancel(id); }
}
