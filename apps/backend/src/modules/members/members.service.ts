import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UserRole, MemberStatus } from '@openclubos/types';
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

    const where: any = {
      role: UserRole.PLAYER,
    };

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
        where,
        skip: skip ? +skip : 0,
        take: take ? +take : 10,
        orderBy: { createdAt: 'desc' },
        include: { club: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
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

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    if (updateMemberDto.password) {
      updateMemberDto.password = await bcrypt.hash(updateMemberDto.password, 10);
    }

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
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Member not found');
    }
  }
}
