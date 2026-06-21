import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { JobsModule } from '../jobs/jobs.module';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [ScoresController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule {}
