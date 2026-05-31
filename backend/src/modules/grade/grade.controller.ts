import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GradeService } from './grade.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('इयत्ता व तुकडी')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/grades')
export class GradeController {
  constructor(private readonly service: GradeService) {}

  // ── GradeConfig ────────────────────────────────────────────────────────────

  @Post()
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  createGrade(@Body() dto: any) { return this.service.createGrade(dto); }

  @Get()
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  findGrades(
    @Query('unitId') unitId: string,
    @Query('academicYearId') academicYearId?: string,
  ) { return this.service.findGrades(unitId, academicYearId); }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  updateGrade(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateGrade(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  deleteGrade(@Param('id') id: string) { return this.service.deleteGrade(id); }

  // ── Division ───────────────────────────────────────────────────────────────

  @Post('divisions')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  createDivision(@Body() dto: any) { return this.service.createDivision(dto); }

  @Get('divisions')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  findDivisions(
    @Query('unitId') unitId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('gradeConfigId') gradeConfigId?: string,
  ) { return this.service.findDivisions(unitId, academicYearId, gradeConfigId); }

  @Get('divisions/with-grade')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  findDivisionsWithGrade(
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('sansthaId') sansthaId?: string,
  ) { return this.service.findDivisionsWithGrade(unitId, academicYearId, sansthaId); }

  @Put('divisions/:id')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  updateDivision(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateDivision(id, dto);
  }

  @Delete('divisions/:id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  deleteDivision(@Param('id') id: string) { return this.service.deleteDivision(id); }
}
