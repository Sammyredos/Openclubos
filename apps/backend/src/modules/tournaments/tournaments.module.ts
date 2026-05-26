import { Module, forwardRef } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { CacheModule } from '../../common/cache/cache.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [CacheModule, forwardRef(() => JobsModule)],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
