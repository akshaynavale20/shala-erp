import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicYearService } from './academic-year.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';

@ApiTags('शैक्षणिक वर्ष')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/academic-years')
export class AcademicYearController {
  constructor(private readonly service: AcademicYearService) {}

  @Get()
  findAll(@CurrentSansthaId() sansthaId: string) {
    return this.service.findBySanstha(sansthaId);
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }
}
