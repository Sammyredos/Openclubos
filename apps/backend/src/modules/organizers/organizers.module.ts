import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { OrganizersController } from './organizers.controller';
import { OrganizersService } from './organizers.service';

@Module({
  imports: [JobsModule],
  controllers: [OrganizersController],
  providers: [OrganizersService],
})
export class OrganizersModule {}
