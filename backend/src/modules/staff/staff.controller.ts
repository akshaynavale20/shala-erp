import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSansthaId } from '../../common/decorators/current-sanstha-id.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PERMISSIONS } from '../role/role.entity';
import { S3UploadService } from '../../common/services/s3-upload.service';

@ApiTags('कर्मचारी')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/staff')
export class StaffController {
  constructor(
    private readonly service: StaffService,
    private readonly s3: S3UploadService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.STAFF_CREATE)
  @ApiOperation({ summary: 'नवीन कर्मचारी तयार करा' })
  create(@Body() dto: CreateStaffDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.STAFF_READ)
  @ApiOperation({ summary: 'कर्मचारी यादी' })
  findBySanstha(
    @CurrentSansthaId() sansthaId: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.service.findBySanstha(sansthaId, unitId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.STAFF_READ)
  @ApiOperation({ summary: 'कर्मचारी माहिती' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  @ApiOperation({ summary: 'कर्मचारी माहिती अद्ययावत करा' })
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  @ApiOperation({ summary: 'कर्मचारी निष्क्रिय करा' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Post(':id/photo')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'कर्मचारी फोटो S3 वर अपलोड करा' })
  @UseInterceptors(FileInterceptor('photo', {
    storage: memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(png|jpeg|jpg)$/)) {
        return cb(new BadRequestException('फक्त PNG/JPEG फाईल अपलोड करा'), false);
      }
      cb(null, true);
    },
  }))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('फोटो फाईल आवश्यक आहे');
    const existing = await this.service.findOne(id);
    await this.s3.deleteIfS3(existing?.photoUrl);
    const photoUrl = await this.s3.upload(file, 'staff-photos');
    return this.service.uploadPhoto(id, photoUrl);
  }
}
