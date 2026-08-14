import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { JobsModule } from '../jobs/jobs.module';
import { LeaderboardGrpcController } from './scores-grpc.controller';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [ScoresController, LeaderboardGrpcController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule {}
