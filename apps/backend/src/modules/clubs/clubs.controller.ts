import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClubsService } from './clubs.service';
import { UpdateClubDto } from './dto/update-club.dto';

@Controller('clubs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.clubsService.findAll({ search });
  }

  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.clubsService.stats(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateClubDto) {
    return this.clubsService.update(id, body);
  }

  @Post(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.clubsService.suspend(id);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.clubsService.activate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clubsService.remove(id);
  }
}
