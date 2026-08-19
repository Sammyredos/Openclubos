import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
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
    if (createMemberDto.role === UserRole.MARKER) {
      throw new BadRequestException('Markers can only be invited by organizer admins.');
    }

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
      ((createMemberDto.role as any) === UserRole.CLUB_ADMIN ||
        (createMemberDto.role as any) === UserRole.MARKER)
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

    if (clubId) {
      const isManagerRole = (
        [
          UserRole.CLUB_ADMIN,
          UserRole.STAFF,
          UserRole.MARKER,
          UserRole.MANAGER,
        ] as UserRole[]
      ).includes(createMemberDto.role || UserRole.PLAYER);

      if (isManagerRole) {
        const totalUsersCount = await this.prisma.user.count({
          where: {
            clubId,
            role: {
              in: [
                UserRole.CLUB_ADMIN,
                UserRole.STAFF,
                UserRole.MARKER,
                UserRole.MANAGER,
              ],
            },
            deletedAt: null,
          },
        });
        if (totalUsersCount >= 30) {
          throw new BadRequestException(
            'An organizer cannot have more than 30 users.',
          );
        }
      }
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
    role?: string;
  }) {
    const { skip, take, search, status, clubId, role } = query;

    const where: any = {};

    // Filter by role: if specific role requested use it, otherwise exclude SUPER_ADMIN
    if (clubId) {
      if (role) {
        if (role === UserRole.PLAYER || role === UserRole.SUPER_ADMIN) {
          where.role = { in: [] };
        } else {
          where.role = role as UserRole;
        }
      } else {
        where.role = {
          in: [
            UserRole.CLUB_ADMIN,
            UserRole.STAFF,
            UserRole.MARKER,
            UserRole.MANAGER,
          ],
        };
      }
    } else {
      if (role) {
        where.role = role as UserRole;
      } else {
        where.role = { not: UserRole.SUPER_ADMIN };
      }
    }

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

    // Auto-purge expired unactivated invitations
    const now = new Date();
    await this.prisma.user.deleteMany({
      where: {
        status: MemberStatus.PENDING,
        inviteTokenExpires: { lt: now },
      },
    }).catch(() => {});

    const baseWhere = { 
      ...where, 
      deletedAt: null,
      NOT: [
        { firstName: null },
        { lastName: null },
        { firstName: '' },
        { lastName: '' },
        { firstName: '-' },
        { firstName: '—' },
      ],
    };

    const [items, total, activeCount, suspendedCount, roleCounts] =
      await Promise.all([
        this.prisma.user.findMany({
          where: baseWhere,
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
            managerScope: true,
            club: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where: baseWhere }),
        this.prisma.user.count({
          where: { ...baseWhere, status: MemberStatus.ACTIVE },
        }),
        this.prisma.user.count({
          where: { ...baseWhere, status: MemberStatus.SUSPENDED },
        }),
        this.prisma.user.groupBy({
          by: ['role'],
          where: baseWhere,
          _count: true,
        }),
      ]);

    const roles: Record<string, number> = {};
    for (const g of roleCounts) {
      roles[g.role] = g._count;
    }

    return {
      items,
      total,
      stats: {
        totalUsers: total,
        activeUsers: activeCount,
        suspendedUsers: suspendedCount,
        newThisMonth: 0,
        superAdmins: 0,
        roles,
      },
    };
  }

  async findAllUsers(query: {
    skip?: number;
    take?: number;
    search?: string;
    status?: MemberStatus;
    clubId?: string;
    role?: UserRole;
    handicap?: string;
    isPrimaryOrganizer?: boolean;
  }) {
    const { skip, take, search, status, clubId, role, handicap, isPrimaryOrganizer } = query;
    const where: any = { deletedAt: null };

    if (isPrimaryOrganizer) {
      where.managerScope = null;
    }

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
    if (role) {
      if (role.includes(',')) {
        where.role = { in: role.split(',') };
      } else {
        where.role = role;
      }
    }
    if (handicap) {
      if (handicap === '0 - 9.9') {
        where.handicap = { gte: 0, lte: 9.9 };
      } else if (handicap === '10 - 19.9') {
        where.handicap = { gte: 10, lte: 19.9 };
      } else if (handicap === '20 - 29.9') {
        where.handicap = { gte: 20, lte: 29.9 };
      } else if (handicap === '30+') {
        where.handicap = { gte: 30 };
      }
    }

    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const baseStatsWhere: any = { deletedAt: null };
    if (clubId) baseStatsWhere.clubId = clubId;
    if (role) {
      if (role.includes(',')) {
        baseStatsWhere.role = { in: role.split(',') };
      } else {
        baseStatsWhere.role = role;
      }
    }
    if (isPrimaryOrganizer) {
      baseStatsWhere.managerScope = null;
    }

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
          managerScope: true,
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
      this.prisma.user.count({ where: baseStatsWhere }),
      this.prisma.user.count({
        where: { ...baseStatsWhere, status: MemberStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { ...baseStatsWhere, status: MemberStatus.SUSPENDED },
      }),
      this.prisma.user.count({
        where: {
          ...baseStatsWhere,
          createdAt: { gte: startThisMonth, lt: startNextMonth },
        },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, role: UserRole.SUPER_ADMIN }, // Keep global for Super Admins stat card
      }),
      this.prisma.user.groupBy({
        by: ['role', 'managerScope'],
        where: { deletedAt: null }, // Keep global so all roles are returned
        _count: { role: true },
      }),
    ]);

    const roles: Record<string, number> = {};
    let totalManagers = 0;
    for (const r of roleCounts) {
      const count = r._count.role;
      
      // Breakdown manager scopes specifically
      if (r.role === 'CLUB_ADMIN' && r.managerScope !== null) {
        const scope = r.managerScope.trim().toUpperCase() || 'UNKNOWN';
        roles[`CLUB_ADMIN_${scope}`] = (roles[`CLUB_ADMIN_${scope}`] || 0) + count;
        totalManagers += count; // Accumulate all managers
      } else {
        roles[r.role] = (roles[r.role] || 0) + count;
      }
    }
    

    // Also add to totalManagers if we want SUPER_ADMINs as well? User said "count of managers".
    // Usually "managers" means the sub-managers created by organizers. Let's return totalManagers.

    return {
      items,
      total,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        newThisMonth,
        superAdmins,
        totalManagers,
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

    if (updateMemberDto.role === UserRole.MARKER && existing.role !== UserRole.MARKER) {
      throw new BadRequestException('Markers can only be invited by organizer admins.');
    }

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
    const isNextRoleManager = (
      [
        UserRole.CLUB_ADMIN,
        UserRole.STAFF,
        UserRole.MARKER,
        UserRole.MANAGER,
      ] as UserRole[]
    ).includes(nextRole);

    const isCurrentRoleManager = (
      [
        UserRole.CLUB_ADMIN,
        UserRole.STAFF,
        UserRole.MARKER,
        UserRole.MANAGER,
      ] as UserRole[]
    ).includes(existing.role);

    if (isNextRoleManager && !isCurrentRoleManager && existing.clubId) {
      const totalUsersCount = await this.prisma.user.count({
        where: {
          clubId: existing.clubId,
          role: {
            in: [
              UserRole.CLUB_ADMIN,
              UserRole.STAFF,
              UserRole.MARKER,
              UserRole.MANAGER,
            ],
          },
          deletedAt: null,
        },
      });
      if (totalUsersCount >= 30) {
        throw new BadRequestException(
          'An organizer cannot have more than 30 users.',
        );
      }
    }

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

    if (data.managerScope === '') {
      data.managerScope = null;
    }

    if (
      nextRole === UserRole.CLUB_ADMIN &&
      (updateMemberDto.managerScope === '' || updateMemberDto.managerScope === null) &&
      clubId
    ) {
      const existingAdmins = await this.prisma.user.findMany({
        where: {
          clubId,
          role: UserRole.CLUB_ADMIN,
          OR: [{ managerScope: null }, { managerScope: '' }],
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingAdmins.length > 0) {
        await this.prisma.user.updateMany({
          where: {
            id: { in: existingAdmins.map((a) => a.id) },
          },
          data: {
            managerScope: 'FULL',
          },
        });
      }
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

  async inviteManager(dto: {
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    scope: string;
    clubId: string;
    clubName: string;
  }) {
    const email = dto.email.trim().toLowerCase();

    // Check if email already exists
    const existing = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(
        'A user with this email already exists. Please use a different email address.',
      );
    }

    // Check if the organizer already has 30 users (managers/markers)
    const totalUsersCount = await this.prisma.user.count({
      where: {
        clubId: dto.clubId,
        role: {
          in: [
            UserRole.CLUB_ADMIN,
            UserRole.STAFF,
            UserRole.MARKER,
            UserRole.MANAGER,
          ],
        },
        deletedAt: null,
      },
    });

    if (totalUsersCount >= 30) {
      throw new BadRequestException(
        'An organizer cannot have more than 30 users.',
      );
    }

    // Generate secure token
    const inviteToken = randomBytes(32).toString('hex');
    const inviteTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create a placeholder password (user will set their own on acceptance)
    const placeholderPassword = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      12,
    );

    const first = dto.firstName.trim();
    const middle = dto.middleName?.trim() || '';
    const finalFirstName = middle ? `${first} ${middle}` : first;

    const isMarker = dto.scope === 'MARKER';
    const user = await this.prisma.user.create({
      data: {
        email,
        firstName: finalFirstName,
        lastName: dto.lastName.trim(),
        password: placeholderPassword,
        role: isMarker ? UserRole.MARKER : UserRole.CLUB_ADMIN,
        status: MemberStatus.PENDING,
        clubId: dto.clubId,
        managerScope: isMarker ? null : dto.scope,
        inviteToken,
        inviteTokenExpires,
        emailVerified: true, // Skip email verification for invited managers
      },
    });

    // Fetch actual club name if default is provided
    let finalClubName = dto.clubName;
    if (!finalClubName || finalClubName === 'Your Club') {
      const club = await this.prisma.club.findUnique({
        where: { id: dto.clubId },
        select: { name: true },
      });
      if (club) {
        finalClubName = club.name;
      }
    }

    // Queue the invitation email
    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
    await this.jobsService.queueEmail('MANAGER_INVITE', email, {
      firstName: dto.firstName,
      inviteUrl,
      clubName: finalClubName,
    });

    const { password, ...result } = user;
    return result;
  }
}
