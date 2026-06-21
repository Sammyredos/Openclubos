import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned')
  async getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.uploadsService.getPresignedUrl(dto.filename, dto.contentType);
  }
}
