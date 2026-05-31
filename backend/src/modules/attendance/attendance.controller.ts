import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService, BulkAttendanceDto } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('हजेरी')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_MARK)
  markBulk(@Body() dto: BulkAttendanceDto) { return this.service.markBulk(dto); }

  @Get('by-unit')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  getByUnitDate(
    @Query('unitId') unitId: string,
    @Query('date') date: string,
  ) { return this.service.getByUnitDate(unitId, date); }

  @Get('division')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  getByDivisionDate(
    @Query('divisionId') divisionId: string,
    @Query('date') date: string,
  ) { return this.service.getByDivisionDate(divisionId, date); }

  @Get('monthly')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  monthly(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId: string,
    @Query('divisionId') divisionId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) { return this.service.getMonthlyReport(sansthaId, unitId, divisionId, +year, +month); }
}
