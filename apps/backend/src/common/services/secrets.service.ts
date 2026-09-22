import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretsService {
  constructor(private readonly configService: ConfigService) {}

  getSecret(key: string): string | undefined {
    return this.configService.get<string>(key);
  }
}
