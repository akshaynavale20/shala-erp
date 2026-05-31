import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FeeService } from './fee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('शुल्क')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/fees')
export class FeeController {
  constructor(private readonly service: FeeService) {}

  // ── Fee Structures ──────────────────────────────────────────────────────────

  @Post('structures')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  createStructure(@Body() dto: any) { return this.service.createStructure(dto); }

  @Get('structures')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  findStructures(
    @CurrentSansthaId() s: string,
    @Query('unitId') u?: string,
    @Query('academicYearId') a?: string,
    @Query('isTemplate') isTemplate?: string,
  ) {
    const tpl = isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined;
    return this.service.findStructures(s, u, a, tpl);
  }

  @Put('structures/:id')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  updateStructure(@Param('id') id: string, @Body() dto: any) { return this.service.updateStructure(id, dto); }

  @Post('structures/:id/attach-to-grades')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  attachTemplateToGrades(
    @Param('id') templateId: string,
    @Body() body: { assignments: Array<{ gradeConfigId: string; amount?: number; dueDate?: string; installmentCount?: number }> },
  ) {
    return this.service.attachTemplateToGrades(templateId, body.assignments ?? []);
  }

  // ── Installments ────────────────────────────────────────────────────────────

  @Post('structures/:id/installments')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  saveInstallments(@Param('id') id: string, @Body() body: { installments: any[] }) {
    return this.service.saveInstallments(id, body.installments || []);
  }

  @Get('structures/:id/installments')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  getInstallments(@Param('id') id: string) {
    return this.service.getInstallments(id);
  }

  // ── Concession Templates ────────────────────────────────────────────────────

  @Post('concession-templates')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  createConcessionTemplate(@Body() dto: any) { return this.service.createConcessionTemplate(dto); }

  @Get('concession-templates')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  findConcessionTemplates(@CurrentSansthaId() sansthaId: string) {
    return this.service.findConcessionTemplates(sansthaId);
  }

  @Put('concession-templates/:id')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  updateConcessionTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateConcessionTemplate(id, dto);
  }

  // ── Demands ─────────────────────────────────────────────────────────────────

  @Post('demands/generate')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  generateDemands(@Body() body: { unitId: string; academicYearId: string; studentIds: string[] }) {
    return this.service.generateDemands(body.unitId, body.academicYearId, body.studentIds);
  }

  @Get('demands/student/:studentId')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  studentDemands(@Param('studentId') studentId: string, @Query('academicYearId') ay?: string) {
    return this.service.getStudentDemands(studentId, ay);
  }

  @Put('demands/:id/concession')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  updateConcession(
    @Param('id') id: string,
    @Body() body: { concessionAmount: number; reason: string; templateId?: string },
  ) {
    return this.service.updateConcession(id, body.concessionAmount, body.reason, body.templateId);
  }

  @Post('demands/apply-template')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  applyConcessionTemplate(@Body() body: { studentId: string; academicYearId: string; templateId: string }) {
    return this.service.applyConcessionTemplate(body.studentId, body.academicYearId, body.templateId);
  }

  // ── Collection ──────────────────────────────────────────────────────────────

  @Post('collect')
  @RequirePermissions(PERMISSIONS.FEE_COLLECT)
  collect(@Body() dto: any) { return this.service.collectFee(dto); }

  @Get('receipt-number/:unitId')
  @RequirePermissions(PERMISSIONS.FEE_COLLECT)
  nextReceipt(@Param('unitId') unitId: string) { return this.service.nextReceiptNumber(unitId); }

  @Put('payments/:id/cancel')
  @RequirePermissions(PERMISSIONS.FEE_COLLECT)
  cancelPayment(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.cancelPayment(id, body?.reason);
  }

  // ── Payment History ─────────────────────────────────────────────────────────

  @Get('student/:studentId')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  studentPayments(@Param('studentId') studentId: string, @Query('academicYearId') a?: string) {
    return this.service.getStudentPayments(studentId, a);
  }

  @Get('unit/:unitId')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  unitPayments(@Param('unitId') unitId: string, @Query('academicYearId') a: string) {
    return this.service.getUnitPayments(unitId, a);
  }

  // ── Outstanding & Defaulters ─────────────────────────────────────────────────

  @Get('outstanding/student/:studentId')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  studentOutstanding(@Param('studentId') studentId: string, @Query('academicYearId') ay: string) {
    return this.service.getStudentOutstanding(studentId, ay);
  }

  @Get('outstanding/unit/:unitId')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  unitOutstanding(@Param('unitId') unitId: string, @Query('academicYearId') ay: string) {
    return this.service.getUnitOutstanding(unitId, ay);
  }

  @Get('demands/division/:divisionId')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  divisionDemands(
    @Param('divisionId') divisionId: string,
    @Query('unitId') unitId: string,
    @Query('academicYearId') ay: string,
  ) { return this.service.getDivisionDemands(unitId, ay, divisionId); }

  @Get('defaulters/:unitId')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  defaulters(@Param('unitId') unitId: string, @Query('academicYearId') ay: string) {
    return this.service.getDefaulters(unitId, ay);
  }

  @Get('metrics/:unitId')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  feeMetrics(@Param('unitId') unitId: string, @Query('academicYearId') ay: string) {
    return this.service.getFeeMetrics(unitId, ay);
  }
}
