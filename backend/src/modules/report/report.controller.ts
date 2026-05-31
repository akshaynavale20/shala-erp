import {
  Controller, Get, Post, Put, Delete,
  Query, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';
import { PERMISSIONS } from '../role/role.entity';
import { ReportService } from './report.service';

@ApiTags('अहवाल')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/reports')
export class ReportController {
  constructor(private readonly service: ReportService) {}

  // ─── Summary reports ──────────────────────────────────────────

  @Get('sanstha-summary')
  @RequirePermissions(PERMISSIONS.REPORT_SANSTHA)
  sansthaSummary(@CurrentSansthaId() sansthaId: string) {
    return this.service.sansthaSummary(sansthaId);
  }

  @Get('unit-summary')
  @RequirePermissions(PERMISSIONS.REPORT_UNIT)
  unitSummary(
    @Query('unitId') unitId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.service.unitSummary(unitId, academicYearId);
  }

  @Get('attendance')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  attendanceReport(
    @Query('unitId') unitId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.service.attendanceReport(unitId, startDate, endDate);
  }

  @Get('fee-collection')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  feeCollection(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.service.feeCollection(sansthaId, unitId, academicYearId);
  }

  @Get('salary')
  @RequirePermissions(PERMISSIONS.SALARY_READ)
  salaryReport(
    @CurrentSansthaId() sansthaId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.service.salaryReport(sansthaId, month, year);
  }

  @Get('certificates')
  @RequirePermissions(PERMISSIONS.CERT_READ)
  certReport(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.service.certReport(sansthaId, unitId);
  }

  // ─── Raw data endpoints ───────────────────────────────────────

  @Get('data/students')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  dataStudents(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('gradeId') gradeId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('gender') gender?: string,
    @Query('category') category?: string,
  ) {
    return this.service.fetchStudents(sansthaId, { unitId, academicYearId, gradeId, divisionId, gender, category });
  }

  @Get('data/fee-demands')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  dataFeeDemands(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('gradeId') gradeId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.fetchFeeDemands(sansthaId, { unitId, academicYearId, gradeId, divisionId, status });
  }

  @Get('data/fee-payments')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  dataFeePayments(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('paymentMode') paymentMode?: string,
    @Query('gradeId') gradeId?: string,
  ) {
    return this.service.fetchFeePayments(sansthaId, { unitId, academicYearId, dateFrom, dateTo, paymentMode, gradeId });
  }

  @Get('data/staff')
  @RequirePermissions(PERMISSIONS.STAFF_READ)
  dataStaff(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
    @Query('employeeType') employeeType?: string,
  ) {
    return this.service.fetchStaff(sansthaId, { unitId, employeeType });
  }

  @Get('data/exam-marks')
  @RequirePermissions(PERMISSIONS.EXAM_READ)
  dataExamMarks(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('examId') examId?: string,
    @Query('gradeId') gradeId?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.service.fetchExamMarks(sansthaId, { unitId, academicYearId, examId, gradeId, divisionId });
  }

  // ─── ERP named reports ───────────────────────────────────────

  @Get('class-strength')
  @RequirePermissions(PERMISSIONS.REPORT_UNIT)
  classStrength(
    @Query('unitId') unitId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.service.classStrength(unitId, academicYearId);
  }

  @Get('defaulters')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  defaultersList(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.service.defaultersList(sansthaId, unitId, academicYearId);
  }

  @Get('day-book')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  dayBook(
    @Query('unitId') unitId: string,
    @Query('date') date: string,
  ) {
    return this.service.dayBook(unitId, date);
  }

  @Get('new-admissions')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  newAdmissions(
    @Query('unitId') unitId: string,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.service.newAdmissions(unitId, academicYearId);
  }

  @Get('pass-fail')
  @RequirePermissions(PERMISSIONS.EXAM_READ)
  passFailAnalysis(
    @Query('unitId') unitId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('examId') examId?: string,
  ) {
    return this.service.passFailAnalysis(unitId, academicYearId, examId);
  }

  // ─── Report Templates ─────────────────────────────────────────

  @Post('templates')
  @RequirePermissions(PERMISSIONS.REPORT_SANSTHA)
  createTemplate(
    @CurrentSansthaId() sansthaId: string,
    @Body() body: any,
  ) {
    return this.service.createTemplate({ ...body, sansthaId });
  }

  @Get('templates')
  @RequirePermissions(PERMISSIONS.REPORT_SANSTHA)
  findTemplates(@CurrentSansthaId() sansthaId: string) {
    return this.service.findTemplates(sansthaId);
  }

  @Put('templates/:id')
  @RequirePermissions(PERMISSIONS.REPORT_SANSTHA)
  updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.service.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @RequirePermissions(PERMISSIONS.REPORT_SANSTHA)
  deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  @Post('templates/:id/execute')
  @RequirePermissions(PERMISSIONS.REPORT_SANSTHA)
  executeTemplate(
    @Param('id') id: string,
    @CurrentSansthaId() sansthaId: string,
    @Body() filters: Record<string, any>,
  ) {
    return this.service.executeTemplate(id, sansthaId, filters);
  }
}
