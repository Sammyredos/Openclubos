import { Module } from '@nestjs/common';
import { SendchampService } from './sendchamp.service';

@Module({
  providers: [SendchampService],
  exports: [SendchampService],
})
export class SendchampModule {}
