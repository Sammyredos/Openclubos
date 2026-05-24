import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CourseStatus } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // Lightweight list used by tournament wizard dropdowns — filtered by club
  async findAll(clubId?: string) {
    const courses = await this.prisma.course.findMany({
      where: clubId ? { clubId, status: CourseStatus.ACTIVE } : { status: CourseStatus.ACTIVE },
      select: {
        id: true,
        name: true,
        holesCount: true,
        clubId: true,
        club: { select: { id: true, name: true } },
        address: true,
        city: true,
        state: true,
        country: true,
        par: true,
        type: true,
        status: true,
        coverImage: true,
      },
      orderBy: { name: 'asc' },
    });

    return courses.map(c => ({
      ...c,
      holes: c.holesCount,
    }));
  }

  // Paginated admin list with stats for the Golf Courses management page
  async findAllAdmin(query: {
    skip?: number;
    take?: number;
    search?: string;
    country?: string;
    status?: string;
    type?: string;
  }) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 10;
    const search = query.search?.trim();

    const where: any = {};
    if (search) {
      const q = search.trim();
      const tokens = q.split(/[\s-]+/).filter(Boolean);

      if (tokens.length > 0) {
        where.AND = tokens.map(token => ({
          OR: [
            { name: { contains: token, mode: 'insensitive' } },
            { club: { name: { contains: token, mode: 'insensitive' } } },
          ],
        }));
      }
    }
    if (query.country) where.country = query.country;
    if (query.status) where.status = query.status as CourseStatus;
    if (query.type) where.type = query.type;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        include: {
          club: { select: { id: true, name: true } },
          _count: { select: { tournaments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    const totalCourses = await this.prisma.course.count();
    const activeCourses = await this.prisma.course.count({ where: { status: CourseStatus.ACTIVE } });
    
    // Get unique countries for stats
    const uniqueCountries = await this.prisma.course.groupBy({
      by: ['country'],
      _count: true,
    });

    // Get unique cities for stats
    const uniqueCities = await this.prisma.course.groupBy({
      by: ['city'],
      where: { city: { not: null } },
      _count: true,
    });

    const items = courses.map((c) => ({
      ...c,
      holes: c.holesCount,
      tournamentCount: c._count.tournaments,
    }));

    return {
      items,
      total,
      stats: {
        totalCourses,
        countries: uniqueCountries.length,
        cities: uniqueCities.length,
        activeCourses,
        inactiveCourses: totalCourses - activeCourses,
      },
    };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true } },
        teeBoxes: true,
        holes: true,
        _count: { select: { tournaments: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    return {
      ...course,
      holes: course.holesCount,
      holeDetails: course.holes,
      tournamentCount: course._count.tournaments,
    };
  }

  private mapPayloadToData(dto: any) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.alsoKnownAs !== undefined) data.alsoKnownAs = dto.alsoKnownAs;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.latitude !== undefined) {
      if (typeof dto.latitude === 'string') {
        const val = parseFloat(dto.latitude.replace(/[°NSEW]/g, '').trim());
        const isNegative = /[SW]/i.test(dto.latitude);
        data.latitude = isNegative ? -val : val;
      } else {
        data.latitude = dto.latitude;
      }
    }
    if (dto.longitude !== undefined) {
      if (typeof dto.longitude === 'string') {
        const val = parseFloat(dto.longitude.replace(/[°NSEW]/g, '').trim());
        const isNegative = /[SW]/i.test(dto.longitude);
        data.longitude = isNegative ? -val : val;
      } else {
        data.longitude = dto.longitude;
      }
    }
    if (dto.holes !== undefined) data.holesCount = dto.holes;
    if (dto.par !== undefined) data.par = dto.par;
    if (dto.yearEstablished !== undefined) data.yearEstablished = dto.yearEstablished;
    if (dto.architect !== undefined) data.architect = dto.architect;
    if (dto.courseRating !== undefined) data.courseRating = dto.courseRating;
    if (dto.slopeRating !== undefined) data.slopeRating = dto.slopeRating;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.bookingUrl !== undefined) data.bookingUrl = dto.bookingUrl;
    if (dto.amenities !== undefined) data.amenities = dto.amenities;
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.galleryImages !== undefined) data.galleryImages = dto.galleryImages;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;
    if (dto.clubId !== undefined) data.clubId = dto.clubId === '' ? null : dto.clubId;
    return data;
  }

  async create(dto: any) {
    const data = this.mapPayloadToData(dto);

    // Uniqueness checks
    if (data.email) {
      const existingEmail = await this.prisma.course.findFirst({ where: { email: data.email } });
      if (existingEmail) throw new BadRequestException('Email is already in use by another course');
    }
    if (data.phone) {
      const existingPhone = await this.prisma.course.findFirst({ where: { phone: data.phone } });
      if (existingPhone) throw new BadRequestException('Phone number is already in use by another course');
    }

    // Duplication check (Name + City + Country)
    const duplicate = await this.prisma.course.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        city: { equals: data.city, mode: 'insensitive' },
        country: data.country,
      },
    });
    if (duplicate) throw new BadRequestException(`A course named "${data.name}" already exists in ${data.city}, ${data.country}`);
    
    
    // Handle teeBoxes
    if (dto.teeBoxes && Array.isArray(dto.teeBoxes)) {
      data.teeBoxes = {
        create: dto.teeBoxes.map((tb: any) => ({
          name: tb.name,
          color: tb.color,
          yardage: tb.yardage,
          rating: tb.rating,
          slope: tb.slope,
        })),
      };
    }

    // Handle per-hole configuration
    if (dto.holeDetails && Array.isArray(dto.holeDetails)) {
      data.holes = {
        create: dto.holeDetails.map((h: any) => ({
          number: h.number,
          par: h.par,
          index: h.index,
          distance: h.distance,
        })),
      };
    }

    const course = await this.prisma.course.create({
      data,
      include: { 
        club: { select: { id: true, name: true } }, 
        teeBoxes: true,
        holes: true 
      },
    });

    return { ...course, holes: course.holesCount, holeDetails: course.holes };
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course not found');

    const data = this.mapPayloadToData(dto);

    // Uniqueness checks
    if (data.email && data.email !== existing.email) {
      const existingEmail = await this.prisma.course.findFirst({ where: { email: data.email } });
      if (existingEmail) throw new BadRequestException('Email is already in use by another course');
    }
    if (data.phone && data.phone !== existing.phone) {
      const existingPhone = await this.prisma.course.findFirst({ where: { phone: data.phone } });
      if (existingPhone) throw new BadRequestException('Phone number is already in use by another course');
    }

    // Duplication check (Name + City + Country)
    if (data.name || data.city || data.country) {
      const duplicate = await this.prisma.course.findFirst({
        where: {
          id: { not: id },
          name: { equals: data.name || existing.name, mode: 'insensitive' },
          city: { equals: data.city || existing.city, mode: 'insensitive' },
          country: data.country || existing.country,
        },
      });
      if (duplicate) throw new BadRequestException('A course with this name already exists in this location');
    }
    

    // Replace all teeBoxes to simplify update
    if (dto.teeBoxes && Array.isArray(dto.teeBoxes)) {
      data.teeBoxes = {
        deleteMany: {},
        create: dto.teeBoxes.map((tb: any) => ({
          name: tb.name,
          color: tb.color,
          yardage: tb.yardage,
          rating: tb.rating,
          slope: tb.slope,
        })),
      };
    }

    // Replace all holes to simplify update
    if (dto.holeDetails && Array.isArray(dto.holeDetails)) {
      data.holes = {
        deleteMany: {},
        create: dto.holeDetails.map((h: any) => ({
          number: h.number,
          par: h.par,
          index: h.index,
          distance: h.distance,
        })),
      };
    }

    const course = await this.prisma.course.update({
      where: { id },
      data,
      include: { 
        club: { select: { id: true, name: true } }, 
        teeBoxes: true,
        holes: true 
      },
    });

    return { ...course, holes: course.holesCount, holeDetails: course.holes };
  }

  async remove(id: string) {
    const existing = await this.prisma.course.findUnique({
      where: { id },
      select: { 
        id: true,
        _count: { select: { tournaments: true } }
      },
    });
    if (!existing) throw new NotFoundException('Course not found');

    if (existing._count.tournaments > 0) {
      throw new BadRequestException(`Cannot delete course. It is currently associated with ${existing._count.tournaments} tournament(s). Deactivate the course instead.`);
    }

    await this.prisma.$transaction(async (tx) => {
      const holes = await tx.hole.findMany({
        where: { courseId: id },
        select: { id: true },
      });
      const holeIds = holes.map((h) => h.id);
      if (holeIds.length) {
        await tx.score.deleteMany({ where: { holeId: { in: holeIds } } });
        await tx.hole.deleteMany({ where: { courseId: id } });
      }
      
      // TeeBoxes will be deleted via Cascade in Prisma, or we can manually delete them:
      await tx.teeBox.deleteMany({ where: { courseId: id } });
      await tx.course.delete({ where: { id } });
    });

    return { id, deleted: true };
  }
}
