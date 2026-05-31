import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialYearService } from './financial-year.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';

@ApiTags('आर्थिक वर्ष')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/financial-years')
export class FinancialYearController {
  constructor(private readonly service: FinancialYearService) {}

  @Get()
  findAll(@CurrentSansthaId() sansthaId: string) {
    return this.service.findBySanstha(sansthaId);
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }
}
