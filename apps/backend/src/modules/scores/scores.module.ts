import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { JobsModule } from '../jobs/jobs.module';
import { LeaderboardGrpcController } from './scores-grpc.controller';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';
import { LeaderboardGateway } from './leaderboard.gateway';

@Module({
  imports: [PrismaModule, forwardRef(() => JobsModule)],
  controllers: [ScoresController, LeaderboardGrpcController],
  providers: [ScoresService, LeaderboardGateway],
  exports: [ScoresService, LeaderboardGateway],
})
export class ScoresModule {}
