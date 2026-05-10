import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { OrganizersModule } from './modules/organizers/organizers.module';
import { MembersModule } from './modules/members/members.module';
import { SuperAdminDashboardModule } from './modules/super-admin-dashboard/super-admin-dashboard.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { ScoresModule } from './modules/scores/scores.module';
import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    AuthModule,
    ClubsModule,
    OrganizersModule,
    MembersModule,
    SuperAdminDashboardModule,
    TournamentsModule,
    RegistrationsModule,
    ScoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
