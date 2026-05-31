import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('परीक्षा')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/exams')
export class ExamController {
  constructor(private readonly service: ExamService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  create(@Body() dto: any) { return this.service.createExam(dto); }

  @Get()
  @RequirePermissions(PERMISSIONS.EXAM_READ)
  findAll(@CurrentSansthaId() s: string, @Query('unitId') u?: string, @Query('academicYearId') a?: string) {
    return this.service.findBySanstha(s, u, a);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.EXAM_READ)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.updateExam(id, dto); }

  @Post(':id/marks')
  @RequirePermissions(PERMISSIONS.EXAM_MARKS_ENTRY)
  saveMarks(@Param('id') examId: string, @Body() body: any) {
    // Accept array directly OR { marks: [...] }
    const rawMarks = Array.isArray(body) ? body : (body.marks || []);
    return this.service.saveMarks(examId, rawMarks);
  }

  @Get(':id/marks')
  @RequirePermissions(PERMISSIONS.EXAM_READ)
  getMarks(@Param('id') examId: string) { return this.service.getMarksByExam(examId); }
}
