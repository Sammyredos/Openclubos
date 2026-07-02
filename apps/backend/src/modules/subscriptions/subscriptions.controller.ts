import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.findAll();
  }

  @Post('plans')
  async createPlan(@Body() data: any) {
    return this.subscriptionsService.create(data);
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.subscriptionsService.update(id, data);
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }

  @Get('admin')
  async getAdminStats(@Query('type') type?: string) {
    return this.subscriptionsService.getAdminStats(type);
  }
}
