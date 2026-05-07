import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(createMemberDto: CreateMemberDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createMemberDto.email },
    });

    if (existing) {
      throw new ConflictException('Member with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createMemberDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createMemberDto,
        password: hashedPassword,
        role: UserRole.PLAYER, // Default role for members
      },
    });
  }

  async findAll(query: {
    skip?: number;
    take?: number;
    search?: string;
    status?: MemberStatus;
    clubId?: string;
  }) {
    const { skip, take, search, status, clubId } = query;

    const where: any = { role: UserRole.PLAYER };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clubId) {
      where.clubId = clubId;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { ...where, deletedAt: null },
        skip: skip ? +skip : 0,
        take: take ? +take : 10,
        orderBy: { createdAt: 'desc' },
        include: { club: true },
      }),
      this.prisma.user.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { items, total };
  }

  async findAllUsers(query: {
    skip?: number;
    take?: number;
    search?: string;
    status?: MemberStatus;
    clubId?: string;
    role?: UserRole;
  }) {
    const { skip, take, search, status, clubId, role } = query;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (clubId) where.clubId = clubId;
    if (role) where.role = role;

    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [items, total, totalUsers, activeUsers, suspendedUsers, newThisMonth, superAdmins, roleCounts] =
      await Promise.all([
        this.prisma.user.findMany({
          where,
          skip: skip ? +skip : 0,
          take: take ? +take : 10,
          orderBy: { createdAt: 'desc' },
          include: { club: { select: { id: true, name: true } } },
        }),
        this.prisma.user.count({ where }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: null, status: MemberStatus.ACTIVE } }),
        this.prisma.user.count({ where: { deletedAt: null, status: MemberStatus.SUSPENDED } }),
        this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: startThisMonth, lt: startNextMonth } } }),
        this.prisma.user.count({ where: { deletedAt: null, role: UserRole.SUPER_ADMIN } }),
        this.prisma.user.groupBy({
          by: ['role'],
          where: { deletedAt: null },
          _count: { role: true },
        }),
      ]);

    const roles: Record<string, number> = {};
    for (const r of roleCounts) {
      roles[r.role] = r._count.role;
    }

    return {
      items,
      total,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        newThisMonth,
        superAdmins,
        roles,
      },
    };
  }

  async findOne(id: string) {
    const member = await this.prisma.user.findUnique({
      where: { id },
      include: { club: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async forceLogout(id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Member not found');

    await this.prisma.user.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return { success: true };
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    if (updateMemberDto.password) {
      updateMemberDto.password = await bcrypt.hash(updateMemberDto.password, 10);
    }

    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Member not found');

    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateMemberDto,
      });
    } catch (error) {
      throw new NotFoundException('Member not found');
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Member not found');

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
