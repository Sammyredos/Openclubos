import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readReplicas } from '@prisma/extension-read-replicas';
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
    const connectionString =
      process.env.DATABASE_URL && process.env.DATABASE_URL !== 'undefined'
        ? process.env.DATABASE_URL
        : 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public';
    const pool = new pg.Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: process.env.NODE_ENV !== 'production' ? [{ emit: 'event', level: 'query' }] : [],
    });

    const replicaUrl = process.env.DATABASE_URL_REPLICA || connectionString;
    const replicaPool = new pg.Pool({
      connectionString: replicaUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    const replicaAdapter = new PrismaPg(replicaPool);
    const replicaClient = new PrismaClient({ adapter: replicaAdapter });
    const extended = this.$extends(readReplicas({ replicas: [replicaClient] }));

    const modelsWithSoftDelete = ['User', 'Club', 'Tournament'];
    (this as any).$use(async (params: any, next: any) => {
      if (params.model && modelsWithSoftDelete.includes(params.model)) {
        if (['findUnique', 'findFirst', 'findMany'].includes(params.action)) {
          if (!params.args) params.args = {};
          if (params.action === 'findUnique') {
            params.action = 'findFirst';
          }
          params.args.where = { ...params.args.where, deletedAt: null };
        }
      }
      return next(params);
    });

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in extended) {
          return extended[prop as keyof typeof extended];
        }
        return target[prop as keyof typeof target];
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected');

      if (process.env.NODE_ENV !== 'production') {
        (this as any).$on('query', (e: any) => {
          if (e.duration > 500) {
            console.log(
              JSON.stringify({
                query: e.query,
                duration: e.duration,
                timestamp: new Date().toISOString(),
              }),
            );
          }
        });
      }

      await this.user.updateMany({
        where: { role: UserRole.STAFF },
        data: { role: UserRole.PLAYER },
      });
    } catch (error) {
      const trace =
        error instanceof Error
          ? error.stack
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);
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
