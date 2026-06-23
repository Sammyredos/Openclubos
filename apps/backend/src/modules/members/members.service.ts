import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
// Force TS cache refresh
import { MemberStatus, UserRole, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  private validateHandicap(
    handicap: number,
    gender: Gender | null | undefined,
    currentHandicap?: number | null,
  ): void {
    if (handicap < 0) {
      throw new BadRequestException(
        'Handicap cannot be negative. Minimum is 0 (scratch).',
      );
    }
    let max: number;
    switch (gender) {
      case Gender.MALE:
        max = 28;
        break;
      case Gender.FEMALE:
        max = 36;
        break;
      default:
        max = 54;
    }
    if (handicap > max) {
      throw new BadRequestException(
        `Handicap exceeds maximum for ${gender || 'unspecified gender'}. Max allowed: ${max}, Provided: ${handicap}`,
      );
    }
    if (
      currentHandicap !== null &&
      currentHandicap !== undefined &&
      handicap > currentHandicap
    ) {
      throw new BadRequestException(
        `Handicap cannot be increased. Current: ${currentHandicap}, Requested: ${handicap}`,
      );
    }
  }

  async create(createMemberDto: CreateMemberDto) {
    createMemberDto.email = createMemberDto.email?.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        email: { equals: createMemberDto.email, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Member with this email already exists');
    }

    const phone =
      typeof createMemberDto.phone === 'string'
        ? createMemberDto.phone.trim() || null
        : undefined;

    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone,
          deletedAt: null,
        },
      });
      if (existingPhone) {
        throw new ConflictException(
          'Member with this phone number already exists',
        );
      }
    }

    const plainPassword = createMemberDto.password;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let clubId = createMemberDto.clubId || null;

    if (
      !clubId &&
      createMemberDto.clubName &&
      (createMemberDto.role === UserRole.CLUB_ADMIN ||
        createMemberDto.role === UserRole.MARKER)
    ) {
      const existingClub = await this.prisma.club.findFirst({
        where: {
          name: {
            equals: createMemberDto.clubName.trim(),
            mode: 'insensitive',
          },
          deletedAt: null,
        },
      });
      if (existingClub) {
        throw new ConflictException(
          'An organization with this name already exists',
        );
      }

      const newClub = await this.prisma.club.create({
        data: {
          name: createMemberDto.clubName.trim(),
          address: createMemberDto.clubAddress?.trim() || null,
          state: createMemberDto.orgState || null,
          city: createMemberDto.orgCity || null,
          logo: createMemberDto.clubLogo || null,
          plan: (createMemberDto.clubPlan as 'PRO' | 'BASIC') || 'BASIC',
          type: createMemberDto.clubType || 'Golf Club',
          website: createMemberDto.clubWebsite || null,
          about: createMemberDto.clubAbout || null,
          facebook: createMemberDto.clubFacebook || null,
          instagram: createMemberDto.clubInstagram || null,
          country: createMemberDto.clubCountry || 'NG',
        },
      });
      clubId = newClub.id;
    }

    this.validateHandicap(
      createMemberDto.handicap ?? 0,
      createMemberDto.gender,
    );

    const user = await this.prisma.user.create({
      data: {
        email: createMemberDto.email,
        firstName: createMemberDto.firstName,
        lastName: createMemberDto.lastName,
        status: createMemberDto.status,
        handicap: createMemberDto.handicap,
        password: hashedPassword,
        role: createMemberDto.role || UserRole.PLAYER,
        profilePhoto: createMemberDto.profilePhoto,
        dob: createMemberDto.dob || null,
        gender: createMemberDto.gender || null,
        state: createMemberDto.state || null,
        city: createMemberDto.city || null,
        address: createMemberDto.address || null,
        ...(phone !== undefined ? { phone } : undefined),
        clubId,
      },
    });

    // Queue member created email with temporary password
    if (user.email) {
      this.jobsService
        .queueEmail('MEMBER_CREATED', user.email, {
          firstName: user.firstName,
          tempPassword: plainPassword,
        })
        .catch((err) => {
          console.error('Failed to queue memberCreated email:', err);
        });
    }

    return user;
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
      const q = search.trim();
      const tokens = q.split(/[\s,;-]+/).filter(Boolean);

      if (tokens.length > 0) {
        where.AND = tokens.map((token) => ({
          OR: [
            { firstName: { contains: token, mode: 'insensitive' } },
            { lastName: { contains: token, mode: 'insensitive' } },
            { email: { contains: token, mode: 'insensitive' } },
            { club: { name: { contains: token, mode: 'insensitive' } } },
          ],
        }));
      }
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
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          handicap: true,
          phone: true,
          createdAt: true,
          clubId: true,
          club: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
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
      const q = search.trim();
      const tokens = q.split(/[\s,;-]+/).filter(Boolean);

      if (tokens.length > 0) {
        where.AND = tokens.map((token) => ({
          OR: [
            { firstName: { contains: token, mode: 'insensitive' } },
            { lastName: { contains: token, mode: 'insensitive' } },
            { email: { contains: token, mode: 'insensitive' } },
            { club: { name: { contains: token, mode: 'insensitive' } } },
          ],
        }));
      }
    }

    if (status) where.status = status;
    if (clubId) where.clubId = clubId;
    if (role) where.role = role;

    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      items,
      total,
      totalUsers,
      activeUsers,
      suspendedUsers,
      newThisMonth,
      superAdmins,
      roleCounts,
    ] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: skip ? +skip : 0,
        take: take ? +take : 10,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          handicap: true,
          phone: true,
          profilePhoto: true,
          dob: true,
          gender: true,
          state: true,
          city: true,
          address: true,
          createdAt: true,
          clubId: true,
          club: {
            select: {
              id: true,
              name: true,
              logo: true,
              address: true,
              state: true,
              city: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { deletedAt: null, status: MemberStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, status: MemberStatus.SUSPENDED },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startThisMonth, lt: startNextMonth },
        },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, role: UserRole.SUPER_ADMIN },
      }),
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
      include: {
        club: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async forceLogout(id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, email: true, updatedAt: true },
    });
    if (!existing) throw new NotFoundException('Member not found');

    const bumpFrom = existing.updatedAt?.getTime?.() ?? 0;
    const nextUat = Math.max(Date.now(), bumpFrom + 1);
    await this.prisma.user.update({
      where: { id },
      data: { updatedAt: new Date(nextUat) },
    });

    // Queue security alert email
    if (existing.email) {
      this.jobsService
        .queueEmail('SECURITY_ALERT', existing.email, {
          action: 'force_logout',
        })
        .catch((err) => {
          console.error('Failed to queue securityAlert email:', err);
        });
    }

    return { success: true };
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    if (updateMemberDto.password) {
      updateMemberDto.password = await bcrypt.hash(
        updateMemberDto.password,
        10,
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        role: true,
        clubId: true,
        handicap: true,
        gender: true,
      },
    });
    if (!existing) throw new NotFoundException('Member not found');

    if (updateMemberDto.email) {
      const email = updateMemberDto.email.trim().toLowerCase();
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingEmail) {
        throw new ConflictException('Member with this email already exists');
      }
    }

    const phone =
      typeof updateMemberDto.phone === 'string'
        ? updateMemberDto.phone.trim() || null
        : undefined;

    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingPhone) {
        throw new ConflictException(
          'Member with this phone number already exists',
        );
      }
    }

    const nextRole = updateMemberDto.role ?? existing.role;
    let clubId = existing.clubId;

    if (nextRole === UserRole.CLUB_ADMIN || nextRole === UserRole.MARKER) {
      if (updateMemberDto.clubName) {
        const targetName = updateMemberDto.clubName.trim();
        const existingClub = await this.prisma.club.findFirst({
          where: {
            name: { equals: targetName, mode: 'insensitive' },
            deletedAt: null,
            ...(clubId ? { id: { not: clubId } } : {}),
          },
        });
        if (existingClub) {
          throw new ConflictException(
            'An organization with this name already exists',
          );
        }

        if (clubId) {
          await this.prisma.club.update({
            where: { id: clubId },
            data: {
              name: targetName,
              ...(updateMemberDto.clubAddress !== undefined
                ? { address: updateMemberDto.clubAddress?.trim() || null }
                : {}),
              ...(updateMemberDto.orgState !== undefined
                ? { state: updateMemberDto.orgState || null }
                : {}),
              ...(updateMemberDto.orgCity !== undefined
                ? { city: updateMemberDto.orgCity || null }
                : {}),
              ...(updateMemberDto.clubLogo !== undefined
                ? { logo: updateMemberDto.clubLogo || null }
                : {}),
              ...(updateMemberDto.clubPlan !== undefined
                ? { plan: updateMemberDto.clubPlan }
                : {}),
              ...(updateMemberDto.clubType !== undefined
                ? { type: updateMemberDto.clubType || 'Golf Club' }
                : {}),
              ...(updateMemberDto.clubWebsite !== undefined
                ? { website: updateMemberDto.clubWebsite || null }
                : {}),
              ...(updateMemberDto.clubAbout !== undefined
                ? { about: updateMemberDto.clubAbout || null }
                : {}),
              ...(updateMemberDto.clubFacebook !== undefined
                ? { facebook: updateMemberDto.clubFacebook || null }
                : {}),
              ...(updateMemberDto.clubInstagram !== undefined
                ? { instagram: updateMemberDto.clubInstagram || null }
                : {}),
              ...(updateMemberDto.clubCountry !== undefined
                ? { country: updateMemberDto.clubCountry || 'NG' }
                : {}),
            },
          });
        } else {
          const newClub = await this.prisma.club.create({
            data: {
              name: targetName,
              address: updateMemberDto.clubAddress?.trim() || null,
              state: updateMemberDto.orgState || null,
              city: updateMemberDto.orgCity || null,
              logo: updateMemberDto.clubLogo || null,
              plan: updateMemberDto.clubPlan || 'BASIC',
              type: updateMemberDto.clubType || 'Golf Club',
              website: updateMemberDto.clubWebsite || null,
              about: updateMemberDto.clubAbout || null,
              facebook: updateMemberDto.clubFacebook || null,
              instagram: updateMemberDto.clubInstagram || null,
              country: updateMemberDto.clubCountry || 'NG',
            },
          });
          clubId = newClub.id;
        }
      }
    }

    const data: any = { ...updateMemberDto };
    if (typeof data.phone === 'string') data.phone = data.phone.trim() || null;
    if (nextRole !== UserRole.CLUB_ADMIN && nextRole !== UserRole.MARKER) {
      data.clubId = null;
    } else {
      data.clubId = clubId;
    }

    delete data.clubName;
    delete data.clubAddress;
    delete data.orgState;
    delete data.orgCity;
    delete data.clubLogo;
    delete data.clubPlan;
    delete data.clubType;
    delete data.clubWebsite;
    delete data.clubAbout;
    delete data.clubFacebook;
    delete data.clubInstagram;
    delete data.clubCountry;

    if (
      updateMemberDto.handicap !== undefined ||
      updateMemberDto.gender !== undefined
    ) {
      const newHandicap = updateMemberDto.handicap ?? existing.handicap ?? 0;
      const newGender =
        (updateMemberDto.gender as Gender) ?? (existing.gender as Gender);
      this.validateHandicap(newHandicap, newGender, existing.handicap);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException('Member not found');
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!existing) throw new NotFoundException('Member not found');

    const email = existing.email?.trim().toLowerCase();
    const toDelete = await this.prisma.user.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        id: true,
        role: true,
        clubId: true,
        club: { select: { name: true } },
      },
    });
    const ids = toDelete.map((u) => u.id);

    // Validate that we are not leaving any organizer blank without a CLUB_ADMIN user
    const adminsToValidate = toDelete.filter(
      (u) => u.role === UserRole.CLUB_ADMIN && u.clubId,
    );
    for (const admin of adminsToValidate) {
      const remainingAdminsCount = await this.prisma.user.count({
        where: {
          clubId: admin.clubId,
          role: UserRole.CLUB_ADMIN,
          id: { notIn: ids },
          deletedAt: null,
        },
      });
      if (remainingAdminsCount === 0) {
        throw new ConflictException(
          `Cannot delete this user. This user is the administrator for organizer "${admin.club?.name || 'Organizer'}". Please edit and update the organizer account with a new user before deleting this user.`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.score.deleteMany({ where: { userId: { in: ids } } });
      await tx.registration.deleteMany({ where: { userId: { in: ids } } });
      await tx.user.deleteMany({ where: { id: { in: ids } } });
    });

    return { id, deleted: true, deletedCount: ids.length };
  }
}
