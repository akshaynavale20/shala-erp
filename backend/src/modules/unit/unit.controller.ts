import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UnitService, CreateUnitDto } from './unit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('घटक')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/units')
export class UnitController {
  constructor(private readonly service: UnitService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.UNIT_MANAGE)
  @ApiOperation({ summary: 'नवीन घटक जोडा' })
  create(@Body() dto: CreateUnitDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'घटक यादी' })
  findAll(@Query('sansthaId') sansthaId: string) {
    return this.service.findBySanstha(sansthaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'घटक माहिती' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.UNIT_MANAGE)
  @ApiOperation({ summary: 'घटक माहिती अद्ययावत करा' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateUnitDto>) {
    return this.service.update(id, dto);
  }
}
