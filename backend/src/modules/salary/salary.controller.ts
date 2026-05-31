import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('वेतन')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/salary')
export class SalaryController {
  constructor(private readonly service: SalaryService) {}

  @Post('components')
  @RequirePermissions(PERMISSIONS.SALARY_MANAGE)
  createComponent(@Body() dto: any) { return this.service.createComponent(dto); }

  @Get('components')
  @RequirePermissions(PERMISSIONS.SALARY_READ)
  findComponents(@CurrentSansthaId() sansthaId: string) { return this.service.findComponents(sansthaId); }

  @Post('slips')
  @RequirePermissions(PERMISSIONS.SALARY_RUN)
  createSlip(@Body() dto: any) { return this.service.createSlip(dto); }

  @Get('slips')
  @RequirePermissions(PERMISSIONS.SALARY_READ)
  findSlips(@CurrentSansthaId() s: string, @Query('staffId') staffId?: string, @Query('financialYearId') fy?: string) {
    return this.service.findSlips(s, staffId, fy);
  }

  @Get('slips/:id')
  @RequirePermissions(PERMISSIONS.SALARY_READ)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put('slips/:id/approve')
  @RequirePermissions(PERMISSIONS.SALARY_MANAGE)
  approve(@Param('id') id: string) { return this.service.approveSlip(id); }

  @Put('slips/:id/paid')
  @RequirePermissions(PERMISSIONS.SALARY_RUN)
  markPaid(@Param('id') id: string, @Body() body: { paymentDate: string; paymentMode: string }) {
    return this.service.markPaid(id, body.paymentDate, body.paymentMode);
  }
}
