import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('जमा-खर्च')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/accounts')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  create(@Body() dto: any, @Request() req: any) {
    return this.service.create({ ...dto, enteredBy: req.user?.userId });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.FEE_READ)
  findAll(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
    @Query('financialYearId') financialYearId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(sansthaId, { unitId, financialYearId, type, startDate, endDate });
  }

  @Get('summary')
  @RequirePermissions(PERMISSIONS.FEE_READ)
  summary(
    @CurrentSansthaId() sansthaId: string,
    @Query('financialYearId') financialYearId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.summary(sansthaId, { financialYearId, startDate, endDate });
  }

  @Get('next-voucher/:type')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  nextVoucher(@CurrentSansthaId() sansthaId: string, @Param('type') type: string) {
    return this.service.nextVoucherNumber(sansthaId, type);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  async update(@Param('id') id: string, @Body() dto: any, @CurrentSansthaId() sansthaId: string) {
    const existing = await this.service.findOneForTenant(id, sansthaId);
    if (!existing) throw new NotFoundException('नोंद सापडली नाही');
    return this.service.update(id, dto);
  }

  @Put(':id/approve')
  @RequirePermissions(PERMISSIONS.SALARY_MANAGE)
  approve(@Param('id') id: string, @Request() req: any) {
    return this.service.approve(id, req.user?.userId);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.FEE_MANAGE)
  async remove(@Param('id') id: string, @CurrentSansthaId() sansthaId: string) {
    const existing = await this.service.findOneForTenant(id, sansthaId);
    if (!existing) throw new NotFoundException('नोंद सापडली नाही');
    return this.service.delete(id);
  }
}
