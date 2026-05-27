import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

export const SKIP_CLUB_GUARD_KEY = 'skipClubGuard';
export const SkipClubGuard = () => SetMetadata(SKIP_CLUB_GUARD_KEY, true);

@Injectable()
export class ClubGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if @SkipClubGuard() decorator is applied to handler or class
    const skipClubGuard = this.reflector.getAllAndOverride<boolean>(
      SKIP_CLUB_GUARD_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipClubGuard) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const controllerName = context.getClass().name;
    const { id } = request.params;

    const targetControllers = [
      'TournamentsController',
      'CoursesController',
      'RegistrationsController',
      'MembersController',
      'ClubsController',
    ];

    if (!targetControllers.includes(controllerName)) {
      return true;
    }

    // Only run ID parameter checks if ID is present or if it's a POST request
    if (!id && request.method !== 'POST') {
      return true;
    }

    // 3. Extract and verify JWT token to get user context
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach user to request so that downstream guards/controllers can reuse it
    request.user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role === 'STAFF' ? 'PLAYER' : payload.role,
      clubId: payload.clubId,
    };

    // 4. Only enforce club ownership validation for CLUB_ADMIN role
    if (payload.role !== 'CLUB_ADMIN') {
      return true;
    }

    const userClubId = payload.clubId;

    // 5. Verify POST create operations for clubId injection/validation
    if (request.method === 'POST') {
      // If the CLUB_ADMIN is creating a resource, ensure they pass their own clubId
      if (request.body && request.body.clubId) {
        if (request.body.clubId !== userClubId) {
          throw new ForbiddenException('You cannot create resources for another club');
        }
      } else {
        // If clubId is missing, inject it securely so they don't have to provide it
        request.body = request.body || {};
        request.body.clubId = userClubId;
      }
      return true;
    }

    // 6. Verify the resource ownership (Update/Delete operations)
    try {
      if (controllerName === 'TournamentsController') {
        const tournament = await this.prisma.tournament.findUnique({
          where: { id },
          select: { clubId: true },
        });
        if (tournament && tournament.clubId !== userClubId) {
          throw new ForbiddenException('You do not have access to this tournament');
        }
      } else if (controllerName === 'CoursesController') {
        const course = await this.prisma.course.findUnique({
          where: { id },
          select: { clubId: true },
        });
        if (course && course.clubId !== userClubId) {
          throw new ForbiddenException('You do not have access to this course');
        }
      } else if (controllerName === 'RegistrationsController') {
        const registration = await this.prisma.registration.findUnique({
          where: { id },
          select: {
            tournament: {
              select: { clubId: true },
            },
          },
        });
        if (registration && registration.tournament?.clubId !== userClubId) {
          throw new ForbiddenException('You do not have access to this registration');
        }
      } else if (controllerName === 'MembersController') {
        const member = await this.prisma.user.findUnique({
          where: { id },
          select: { clubId: true },
        });
        if (member && member.clubId !== userClubId) {
          throw new ForbiddenException('You do not have access to this member');
        }
      } else if (controllerName === 'ClubsController') {
        if (id !== userClubId) {
          throw new ForbiddenException('You do not have access to this club');
        }
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Log database warnings but return true for syntax/format issues (like non-uuid IDs)
      // to let the controller route validation handle bad requests.
      console.warn(`[ClubGuard] Database lookup failed or skipped for ID ${id}:`, error);
      return true;
    }

    return true;
  }
}
