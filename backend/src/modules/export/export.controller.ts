import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/role.entity';
import { SaralExportService } from './saral-export.service';

@ApiTags('निर्यात')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/export')
export class ExportController {
  constructor(private readonly saralService: SaralExportService) {}

  @Get('saral')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  async saralExport(
    @Query('unitId') unitId: string,
    @Query('academicYearId') academicYearId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.saralService.exportSaral(unitId, academicYearId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="saral-export-${Date.now()}.xlsx"`);
    res.send(buffer);
  }
}
