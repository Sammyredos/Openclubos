import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportActionDto } from './dto/report-action.dto';
import { ReportStatus, MemberStatus, UserRole } from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates an infraction report filed against a golfer.
   */
  async createReport(dto: CreateReportDto, reqUser?: any, xUserId?: string) {
    this.logger.log(`Ingesting report: reason="${dto.reason}", reportedId="${dto.reportedId}", reporter="${dto.reporterName || dto.reporterId}"`);

    // 1. Resolve Reporter User
    let reporter: any = null;
    const candidateReporterId = reqUser?.id || xUserId || dto.reporterId;

    if (candidateReporterId && candidateReporterId !== 'anonymous' && candidateReporterId !== 'guest') {
      reporter = await this.prisma.user.findUnique({
        where: { id: candidateReporterId },
      }).catch(() => null);

      if (!reporter && candidateReporterId.includes('@')) {
        reporter = await this.prisma.user.findUnique({
          where: { email: candidateReporterId },
        }).catch(() => null);
      }
    }

    if (!reporter && dto.reporterEmail) {
      reporter = await this.prisma.user.findUnique({
        where: { email: dto.reporterEmail },
      }).catch(() => null);
    }

    if (!reporter) {
      // Fallback to any existing active user or create a system reporter
      reporter = await this.prisma.user.findFirst({
        where: { role: { in: [UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN, UserRole.PLAYER] } },
        orderBy: { createdAt: 'asc' },
      }).catch(() => null);

      if (!reporter) {
        reporter = await this.prisma.user.create({
          data: {
            email: 'system.reporter@openclubos.com',
            password: '$2a$10$Defau1tSystemReporterSecretOpenclubOS',
            firstName: 'App',
            lastName: 'Reporter',
            role: UserRole.PLAYER,
            status: MemberStatus.ACTIVE,
          },
        });
      }
    }

    // 2. Resolve Reported Golfer
    let reported: any = null;
    const candidateReportedId = dto.reportedId?.trim();

    if (candidateReportedId) {
      reported = await this.prisma.user.findUnique({
        where: { id: candidateReportedId },
        include: { club: true },
      }).catch(() => null);

      if (!reported && candidateReportedId.includes('@')) {
        reported = await this.prisma.user.findUnique({
          where: { email: candidateReportedId },
          include: { club: true },
        }).catch(() => null);
      }
    }

    if (!reported && dto.reportedName) {
      const parts = dto.reportedName.trim().split(/\s+/);
      const first = parts[0];
      const last = parts.slice(1).join(' ');

      reported = await this.prisma.user.findFirst({
        where: {
          firstName: { equals: first, mode: 'insensitive' },
          ...(last ? { lastName: { equals: last, mode: 'insensitive' } } : {}),
        },
        include: { club: true },
      }).catch(() => null);
    }

    if (!reported) {
      // Create user record for reported player so FK constraint is satisfied and Super Admin can take moderation actions
      const rawName = (dto.reportedName || dto.reportedId || 'Golfer').trim();
      const nameParts = rawName.split(/\s+/);
      const firstName = nameParts[0] || 'Reported';
      const lastName = nameParts.slice(1).join(' ') || 'Golfer';
      const cleanSlug = rawName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'golfer';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const autoEmail = `${cleanSlug}_${randomSuffix}@player.openclubos.com`;
      const parsedHcp = dto.reportedHcp ? parseFloat(dto.reportedHcp) : 0.0;

      reported = await this.prisma.user.create({
        data: {
          email: autoEmail,
          password: '$2a$10$Defau1tHashedPasswordPlaceholderOpenclubOS',
          firstName,
          lastName,
          role: UserRole.PLAYER,
          status: MemberStatus.ACTIVE,
          handicap: isNaN(parsedHcp) ? 0.0 : parsedHcp,
        },
        include: { club: true },
      });
      this.logger.log(`Created player record for reported golfer: ${reported.id} (${firstName} ${lastName})`);
    }

    // 3. Persist Report to Database
    const userReport = await this.prisma.userReport.create({
      data: {
        reporterId: reporter.id,
        reportedId: reported.id,
        reason: dto.reason || 'Unspecified Infraction',
        details: dto.details || null,
        status: ReportStatus.PENDING,
      },
      include: {
        reporter: true,
        reported: {
          include: {
            club: true,
          },
        },
      },
    });

    this.logger.log(`Report successfully created: id=${userReport.id}`);
    return this.formatReport(userReport, dto);
  }

  /**
   * Retrieves all reports for the Super Admin panel with mapped golfer metadata.
   */
  async findAllReports(statusFilter?: string) {
    const where: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const reports = await this.prisma.userReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: true,
        reported: {
          include: {
            club: true,
          },
        },
      },
    });

    return reports.map((r) => this.formatReport(r));
  }

  /**
   * Executes a moderation action on a report (SUSPEND, WARN, DISMISS).
   */
  async executeAction(reportId: string, dto: ReportActionDto, reqUser?: any) {
    const report = await this.prisma.userReport.findUnique({
      where: { id: reportId },
      include: { reported: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    if (dto.action === 'SUSPEND') {
      await this.prisma.user.update({
        where: { id: report.reportedId },
        data: { status: MemberStatus.SUSPENDED },
      });
      this.logger.log(`Suspended user ${report.reportedId} per report ${report.id}`);
    }

    const targetStatus = dto.action === 'DISMISS' ? ReportStatus.DISMISSED : ReportStatus.RESOLVED;

    const updated = await this.prisma.userReport.update({
      where: { id: reportId },
      data: {
        status: targetStatus,
        actionTaken: dto.action,
        actionNotes: dto.notes || null,
        resolvedAt: new Date(),
        resolvedBy: reqUser?.email || reqUser?.id || 'Super Admin',
      },
      include: {
        reporter: true,
        reported: {
          include: { club: true },
        },
      },
    });

    return this.formatReport(updated);
  }

  /**
   * Deletes a report and cleans up any orphan placeholder golfer record.
   */
  async deleteReport(id: string) {
    const report = await this.prisma.userReport.findUnique({
      where: { id },
      include: { reported: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    await this.prisma.userReport.delete({
      where: { id },
    });

    // If the reported user was an auto-created placeholder golfer, remove them too
    if (
      report.reported &&
      report.reported.email?.includes('@player.openclubos.com') &&
      report.reported.password?.includes('Defau1t')
    ) {
      await this.prisma.user.delete({
        where: { id: report.reportedId },
      }).catch(() => null);
    }

    return { success: true, message: `Report ${id} deleted successfully` };
  }

  /**
   * Helper to format report records to the structure expected by the frontend.
   */
  private formatReport(r: any, dto?: CreateReportDto) {
    const reporterName = [r.reporter?.firstName, r.reporter?.lastName].filter(Boolean).join(' ') ||
      dto?.reporterName ||
      r.reporter?.email ||
      'OpenClub Golfer';

    const reportedName = [r.reported?.firstName, r.reported?.lastName].filter(Boolean).join(' ') ||
      dto?.reportedName ||
      r.reported?.email ||
      'OpenClub Golfer';

    const reportedClub = r.reported?.club?.name ||
      dto?.reportedClub ||
      'OpenClub Golfer';

    const reportedHcp = (r.reported?.handicap !== undefined && r.reported?.handicap !== null)
      ? Number(r.reported.handicap).toFixed(1)
      : dto?.reportedHcp || '0.0';

    return {
      id: r.id,
      reporterId: r.reporterId,
      reporterName,
      reporterEmail: r.reporter?.email || dto?.reporterEmail || 'player@openclubos.com',
      reportedId: r.reportedId,
      reportedName,
      reportedPhoto: r.reported?.profilePhoto || null,
      reportedClub,
      reportedHcp,
      reportedUserStatus: r.reported?.status || MemberStatus.ACTIVE,
      reason: r.reason,
      details: r.details,
      status: r.status,
      actionTaken: r.actionTaken || 'NONE',
      actionNotes: r.actionNotes || null,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      resolvedAt: r.resolvedAt ? (r.resolvedAt instanceof Date ? r.resolvedAt.toISOString() : r.resolvedAt) : null,
      resolvedBy: r.resolvedBy || null,
    };
  }
}
