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
import { OrganizersService } from './organizers.service';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';

@Controller('organizers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class OrganizersController {
  constructor(private readonly organizersService: OrganizersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.organizersService.findAll({ search });
  }

  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.organizersService.stats(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateOrganizerDto) {
    return this.organizersService.update(id, body);
  }

  @Post(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.organizersService.suspend(id);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.organizersService.activate(id);
  }

  @Post(':id/force-logout')
  forceLogout(@Param('id') id: string) {
    return this.organizersService.forceLogout(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizersService.remove(id);
  }
}
