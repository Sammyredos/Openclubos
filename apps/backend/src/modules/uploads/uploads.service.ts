import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucket: string;
  private cdnBaseUrl: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_KEY');
    this.bucket = this.configService.get<string>('R2_BUCKET') || 'openclub-assets';
    this.cdnBaseUrl = this.configService.get<string>('CDN_BASE_URL') || '';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  async getPresignedUrl(filename: string, contentType: string) {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!ALLOWED_TYPES.includes(contentType)) {
      throw new BadRequestException('Invalid file type');
    }

    const uniqueId = crypto.randomBytes(16).toString('hex');
    const key = `uploads/${uniqueId}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    
    const publicUrl = this.cdnBaseUrl 
      ? `${this.cdnBaseUrl.replace(/\/$/, '')}/${key}` 
      : `${this.s3Client.config.endpoint}/${this.bucket}/${key}`;

    return { uploadUrl, publicUrl };
  }
}
