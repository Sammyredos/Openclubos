export default {
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:your-secure-password@localhost:5433/openclub?schema=public",
  },
};
