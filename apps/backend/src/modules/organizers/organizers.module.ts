import { Module } from '@nestjs/common';
import { OrganizersController } from './organizers.controller';
import { OrganizersService } from './organizers.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  controllers: [OrganizersController],
  providers: [OrganizersService],
})
export class OrganizersModule {}
