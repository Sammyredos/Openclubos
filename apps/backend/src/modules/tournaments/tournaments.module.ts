import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '../../common/cache/cache.module';
import { JobsModule } from '../jobs/jobs.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [CacheModule, forwardRef(() => JobsModule)],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
