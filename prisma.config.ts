import path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '.env') });

export default {
  schema: path.join(__dirname, 'database/prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:your-secure-password@127.0.0.1:5433/openclub?schema=public',
  },
};
