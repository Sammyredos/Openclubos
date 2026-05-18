export default {
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public",
  },
};
