import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClubsService } from './clubs.service';
import { UpdateClubDto } from './dto/update-club.dto';

@Controller('clubs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(@Query('search') search?: string) {
    return this.clubsService.findAll({ search });
  }

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN)
  stats(@Param('id') id: string) {
    return this.clubsService.stats(id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN)
  findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN)
  update(@Param('id') id: string, @Body() body: UpdateClubDto) {
    return this.clubsService.update(id, body);
  }

  @Post(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  suspend(@Param('id') id: string) {
    return this.clubsService.suspend(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  activate(@Param('id') id: string) {
    return this.clubsService.activate(id);
  }

  @Post(':id/force-logout')
  @Roles(UserRole.SUPER_ADMIN)
  forceLogout(@Param('id') id: string) {
    return this.clubsService.forceLogout(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.clubsService.remove(id);
  }
}
