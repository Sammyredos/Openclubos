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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Admin paginated list — used by the Golf Courses management page
  @Get('admin')
  findAllAdmin(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('country') country?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.coursesService.findAllAdmin({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      search,
      country,
      status,
      type,
    });
  }

  // Club-scoped list — used by tournament wizard course dropdown
  @Get()
  findAll(@Query('clubId') clubId?: string) {
    return this.coursesService.findAll(clubId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.coursesService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.coursesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
