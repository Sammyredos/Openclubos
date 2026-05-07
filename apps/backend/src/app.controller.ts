import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { SystemStatus } from '@openclubos/types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  getStatus(): SystemStatus {
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
