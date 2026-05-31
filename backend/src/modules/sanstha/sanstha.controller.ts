import {
  Controller, Get, Post, Put, Body, Param, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { SansthaService } from './sanstha.service';
import { CreateSansthaDto, UpdateSansthaDto } from './sanstha.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PERMISSIONS } from '../role/role.entity';
import { S3UploadService } from '../../common/services/s3-upload.service';

@ApiTags('संस्था')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/sanstha')
export class SansthaController {
  constructor(
    private readonly service: SansthaService,
    private readonly s3: S3UploadService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.SETUP_MANAGE)
  @ApiOperation({ summary: 'नवीन संस्था तयार करा' })
  create(@Body() dto: CreateSansthaDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.SETUP_MANAGE)
  @ApiOperation({ summary: 'संस्था यादी' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SETUP_MANAGE)
  @ApiOperation({ summary: 'संस्था माहिती' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.SETUP_MANAGE)
  @ApiOperation({ summary: 'संस्था माहिती अद्ययावत करा' })
  update(@Param('id') id: string, @Body() dto: UpdateSansthaDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/logo')
  @RequirePermissions(PERMISSIONS.SETUP_MANAGE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'संस्थेचा लोगो S3 वर अपलोड करा' })
  @UseInterceptors(FileInterceptor('logo', {
    storage: memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(png|jpeg|jpg|svg\+xml)$/)) {
        return cb(new BadRequestException('फक्त PNG/JPEG/SVG फाईल अपलोड करा'), false);
      }
      cb(null, true);
    },
  }))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('लोगो फाईल आवश्यक आहे');
    // Delete old logo if it was on S3
    const existing = await this.service.findOne(id);
    await this.s3.deleteIfS3(existing?.logoUrl);
    const logoUrl = await this.s3.upload(file, 'logos');
    return this.service.uploadLogo(id, logoUrl);
  }
}
