import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { UploadsService } from './uploads.service';

import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned')
  async getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.uploadsService.getPresignedUrl(dto.filename, dto.contentType);
  }
}
