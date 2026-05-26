import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TournamentsService } from '../tournaments/tournaments.service';

@Processor('background-jobs')
export class JobsProcessor extends WorkerHost {
  constructor(private readonly tournamentsService: TournamentsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'AUTO_UPDATE_TOURNAMENTS':
        await this.tournamentsService.autoUpdateStatuses();
        break;
      case 'SEND_REMINDER':
        // Stub for SEND_REMINDER background task
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}
// Force IDE cache refresh
