import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('वेळापत्रक')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/timetable')
export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  @Get('division')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  getByDivision(
    @Query('unitId') unitId: string,
    @Query('divisionId') divisionId: string,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.service.getByDivision(unitId, divisionId, academicYearId);
  }

  @Get('unit')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  getByUnit(@Query('unitId') unitId: string, @Query('academicYearId') academicYearId: string) {
    return this.service.getByUnit(unitId, academicYearId);
  }

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  saveBulk(@Body() body: { entries: any[] }) {
    return this.service.saveBulk(body.entries || []);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  saveEntry(@Body() dto: any) {
    return this.service.saveEntry(dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  deleteEntry(@Param('id') id: string) {
    return this.service.deleteEntry(id);
  }
}
