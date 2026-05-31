import {
  Controller, Get, Post, Put, Body, Param, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { SansthaService } from './sanstha.service';
import { CreateSansthaDto, UpdateSansthaDto } from './sanstha.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PERMISSIONS } from '../role/role.entity';

const logoStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `logo-${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('संस्था')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/sanstha')
export class SansthaController {
  constructor(private readonly service: SansthaService) {}

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
  @ApiOperation({ summary: 'संस्थेचा लोगो अपलोड करा' })
  @UseInterceptors(FileInterceptor('logo', {
    storage: logoStorage,
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
    const logoUrl = `/uploads/${file.filename}`;
    return this.service.uploadLogo(id, logoUrl);
  }
}
