import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll(@Request() req: any, @Query('clubId') clubId?: string) {
    const role = req.user?.role as UserRole | undefined;
    const userClubId = req.user?.clubId as string | undefined;

    const effectiveClubId =
      role === UserRole.CLUB_ADMIN ? userClubId : clubId;

    return this.coursesService.findAll(effectiveClubId);
  }

  @Get('admin')
  findAllPaged(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('country') country?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('clubId') clubId?: string,
  ) {
    const role = req.user?.role as UserRole | undefined;
    const userClubId = req.user?.clubId as string | undefined;

    const effectiveClubId =
      role === UserRole.CLUB_ADMIN ? userClubId : clubId;

    return this.coursesService.findAllAdmin({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      country,
      status,
      type,
      clubId: effectiveClubId,
    });
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const course = await this.coursesService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (role === UserRole.CLUB_ADMIN && course.clubId !== userClubId) {
      throw new ForbiddenException('You do not have access to this course');
    }
    return course;
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    const course = await this.coursesService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (role === UserRole.CLUB_ADMIN && course.clubId !== userClubId) {
      throw new ForbiddenException('You do not have access to this course');
    }
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const course = await this.coursesService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (role === UserRole.CLUB_ADMIN && course.clubId !== userClubId) {
      throw new ForbiddenException('You do not have access to this course');
    }
    return this.coursesService.remove(id);
  }
}
