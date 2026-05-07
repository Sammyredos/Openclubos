import { Injectable, NotFoundException } from '@nestjs/common';
import { ClubStatus, MemberStatus, TournamentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string }) {
    const search = query.search?.trim();
    return this.prisma.club.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? { name: { contains: search, mode: 'insensitive' } }
          : undefined),
      },
      include: {
        _count: { select: { users: true, tournaments: true, courses: true } },
        users: {
          where: { role: UserRole.CLUB_ADMIN },
          select: { id: true, email: true, firstName: true, lastName: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const club = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { users: true, tournaments: true, courses: true } },
        users: {
          where: { role: UserRole.CLUB_ADMIN },
          select: { id: true, email: true, firstName: true, lastName: true },
          take: 1,
        },
      },
    });
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async update(id: string, dto: UpdateClubDto) {
    const existing = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: {
          where: { role: UserRole.CLUB_ADMIN },
          select: { id: true, email: true, firstName: true, lastName: true },
          take: 1,
        },
      },
    });
    if (!existing) throw new NotFoundException('Club not found');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.plan !== undefined) data.plan = dto.plan;

    const [firstName, ...rest] = (dto.adminName || '').trim().split(/\s+/).filter(Boolean);
    const lastName = rest.join(' ');

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.club.update({ where: { id }, data });
      }

      const admin = existing.users?.[0];
      if (admin && (dto.adminEmail !== undefined || dto.adminName !== undefined)) {
        const userData: any = {};
        if (dto.adminEmail !== undefined) userData.email = dto.adminEmail;
        if (dto.adminName !== undefined) {
          userData.firstName = firstName || null;
          userData.lastName = lastName || null;
        }
        if (Object.keys(userData).length > 0) {
          await tx.user.update({ where: { id: admin.id }, data: userData });
        }
      }
    });

    return this.findOne(id);
  }

  async suspend(id: string) {
    const club = await this.prisma.club.findFirst({ where: { id, deletedAt: null } });
    if (!club) throw new NotFoundException('Club not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.club.update({ where: { id }, data: { status: ClubStatus.SUSPENDED } });
      await tx.user.updateMany({
        where: { clubId: id, deletedAt: null, status: { not: MemberStatus.EXPIRED } },
        data: { status: MemberStatus.SUSPENDED },
      });
      await tx.tournament.updateMany({
        where: { clubId: id, deletedAt: null, status: { in: [TournamentStatus.ONGOING, TournamentStatus.REGISTRATION_OPEN] } },
        data: { status: TournamentStatus.CANCELLED },
      });
    });

    return this.findOne(id);
  }

  async activate(id: string) {
    const club = await this.prisma.club.findFirst({ where: { id, deletedAt: null } });
    if (!club) throw new NotFoundException('Club not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.club.update({ where: { id }, data: { status: ClubStatus.ACTIVE } });
      await tx.user.updateMany({
        where: { clubId: id, deletedAt: null, status: MemberStatus.SUSPENDED },
        data: { status: MemberStatus.ACTIVE },
      });
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const club = await this.prisma.club.findFirst({ where: { id, deletedAt: null } });
    if (!club) throw new NotFoundException('Club not found');

    await this.prisma.club.update({
      where: { id },
      data: { deletedAt: new Date(), status: ClubStatus.EXPIRED },
    });

    return { id, deletedAt: true };
  }
}
