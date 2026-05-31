import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, Delete, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { CreateStudentDto, UpdateStudentDto } from './student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';
import { PERMISSIONS } from '../role/role.entity';
import { S3UploadService } from '../../common/services/s3-upload.service';

@ApiTags('विद्यार्थी')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/students')
export class StudentController {
  constructor(
    private readonly service: StudentService,
    private readonly s3: S3UploadService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.STUDENT_CREATE)
  create(@Body() dto: CreateStudentDto) { return this.service.create(dto); }

  @Get()
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  findAll(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('divisionId') divisionId?: string,
  ) { return this.service.findBySanstha(sansthaId, unitId, academicYearId, divisionId); }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.STUDENT_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.STUDENT_EDIT)
  deactivate(@Param('id') id: string) { return this.service.deactivate(id); }

  @Post('import')
  @RequirePermissions(PERMISSIONS.STUDENT_CREATE)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async importExcel(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId: string,
    @Query('academicYearId') academicYearId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Excel फाईल आवश्यक आहे');
    return this.service.importFromExcel(file.buffer, sansthaId, unitId, academicYearId);
  }

  @Post(':id/photo')
  @RequirePermissions(PERMISSIONS.STUDENT_EDIT)
  @UseInterceptors(FileInterceptor('photo', {
    storage: memoryStorage(),
    limits: { fileSize: 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(png|jpeg|jpg)$/)) return cb(new BadRequestException('फक्त PNG/JPEG'), false);
      cb(null, true);
    },
  }))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('फोटो आवश्यक आहे');
    const existing = await this.service.findOne(id);
    await this.s3.deleteIfS3(existing?.photoUrl);
    const photoUrl = await this.s3.upload(file, 'student-photos');
    return this.service.uploadPhoto(id, photoUrl);
  }
}
