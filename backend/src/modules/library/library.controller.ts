import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/role.entity';

@ApiTags('ग्रंथालय')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/library')
export class LibraryController {
  constructor(private readonly service: LibraryService) {}

  // ── Books ───────────────────────────────────────────────────────────────────

  @Post('books')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  addBook(@Body() dto: any) { return this.service.addBook(dto); }

  @Get('books')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  findBooks(@Query('unitId') unitId: string, @Query('search') search?: string) {
    return this.service.findBooks(unitId, search);
  }

  @Put('books/:id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  updateBook(@Param('id') id: string, @Body() dto: any) { return this.service.updateBook(id, dto); }

  // ── Stats ───────────────────────────────────────────────────────────────────

  @Get('stats')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  getStats(@Query('unitId') unitId: string) { return this.service.getStats(unitId); }

  // ── Issues ──────────────────────────────────────────────────────────────────

  @Post('issue')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  issueBook(@Body() dto: any) { return this.service.issueBook(dto); }

  @Put('issue/:id/return')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  returnBook(@Param('id') id: string, @Body() body: { returnDate: string; fineAmount?: number }) {
    return this.service.returnBook(id, body.returnDate, body.fineAmount);
  }

  @Get('issues/active')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  activeIssues(@Query('unitId') unitId: string) { return this.service.getActiveIssues(unitId); }

  @Get('issues/overdue')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  overdueBooks(@Query('unitId') unitId: string) { return this.service.getOverdueBooks(unitId); }

  @Get('issues/member/:memberId')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  memberIssues(@Param('memberId') memberId: string) { return this.service.getMemberIssues(memberId); }
}
