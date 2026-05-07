import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root
const envPath = path.join(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected');
    } catch (error) {
      const trace =
        error instanceof Error ? error.stack : typeof error === 'string' ? error : JSON.stringify(error);
      this.logger.error(
        'Prisma failed to connect. Backend will start but DB-backed endpoints may fail.',
        trace,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
