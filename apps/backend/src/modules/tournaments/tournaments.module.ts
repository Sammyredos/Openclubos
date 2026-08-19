import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '../../common/cache/cache.module';
import { JobsModule } from '../jobs/jobs.module';
import { SendchampModule } from '../sendchamp/sendchamp.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [CacheModule, forwardRef(() => JobsModule), SendchampModule],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
