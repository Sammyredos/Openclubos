import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [JobsModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
