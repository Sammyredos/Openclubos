import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MemberStatus, UserRole } from '@prisma/client';
import { SkipClubGuard } from '../../common/guards/club.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateMemberDto } from './dto/create-member.dto';
import { InviteManagerDto } from './dto/invite-manager.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_ADMIN)
  @SkipClubGuard()
  @HttpCode(HttpStatus.CREATED)
  async inviteManager(@Request() req: any, @Body() dto: InviteManagerDto) {
    const clubId = req.user?.clubId;
    const clubName = req.user?.clubName || 'Your Club';
    if (!clubId) {
      throw new ForbiddenException('You must be associated with a club to invite managers.');
    }
    return this.membersService.inviteManager({
      ...dto,
      clubId,
      clubName,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Request() req: any,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
    @Query('status') status?: MemberStatus,
    @Query('clubId') clubId?: string,
    @Query('role') filterRole?: UserRole,
  ) {
    const role = req.user?.role as UserRole | undefined;
    const userClubId = req.user?.clubId as string | undefined;

    const effectiveClubId = role === UserRole.CLUB_ADMIN ? userClubId : clubId;
    const viewerId =
      req.user?.id ||
      req.user?.userId ||
      req.headers['x-user-id'] ||
      req.headers['x-player-id'];

    return this.membersService.findAll({
      skip,
      take,
      search,
      status,
      clubId: effectiveClubId,
      role: filterRole,
      viewerId,
    });
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  findAllUsers(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
    @Query('status') status?: MemberStatus,
    @Query('clubId') clubId?: string,
    @Query('role') role?: UserRole,
    @Query('handicap') handicap?: string,
    @Query('isPrimaryOrganizer') isPrimaryOrganizer?: string,
  ) {
    return this.membersService.findAllUsers({
      skip,
      take,
      search,
      status,
      clubId,
      role,
      handicap,
      isPrimaryOrganizer: isPrimaryOrganizer === 'true',
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, updateMemberDto);
  }

  @Post(':id/force-logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  forceLogout(@Param('id') id: string) {
    return this.membersService.forceLogout(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN)
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }
}
