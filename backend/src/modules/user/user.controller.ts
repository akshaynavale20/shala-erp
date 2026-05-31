import {
  Controller, Get, Post, Put, Body, Param,
  Query, UseGuards, Delete, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService, CreateUserDto, UpdateUserDto, AssignRoleDto } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('वापरकर्ते')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @ApiOperation({ summary: 'नवीन वापरकर्ता तयार करा' })
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @ApiOperation({ summary: 'संस्थेचे सर्व वापरकर्ते' })
  findAll(@Query('sansthaId') sansthaId: string) {
    return this.service.findBySanstha(sansthaId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @ApiOperation({ summary: 'वापरकर्ता माहिती अद्ययावत करा (नाव/फोन फक्त)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/roles')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @ApiOperation({ summary: 'वापरकर्त्याला भूमिका द्या' })
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.service.assignRole({ ...dto, userId: id });
  }

  @Delete(':id/roles/:uurId')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @ApiOperation({ summary: 'भूमिका काढून टाका' })
  removeRole(@Param('id') id: string, @Param('uurId') uurId: string) {
    return this.service.removeRole(id, uurId);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Put(':id/reactivate')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  reactivate(@Param('id') id: string) {
    return this.service.reactivate(id);
  }

  /**
   * Admin password reset — ONLY for Sanstha Sanchalak (isSansthaDirector in JWT).
   * Returns a one-time temporary password shown once to the admin.
   * User is forced to change it on next login.
   */
  @Post(':id/reset-password')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'वापरकर्त्याचा पासवर्ड रिसेट करा (फक्त संस्था संचालक)' })
  resetPassword(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.service.resetPassword(
      id,
      req.user.id,
      req.user.isSansthaDirector,
    );
  }

  /**
   * Force-change flow: user sets their own password after receiving temp password from admin.
   * No extra permission needed — authenticated user only.
   */
  @Post('me/complete-forced-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'जबरी पासवर्ड बदल पूर्ण करा' })
  completeForcedChange(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.service.completeForcedChange(req.user.id, body.currentPassword, body.newPassword);
  }
}
