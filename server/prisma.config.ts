import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    // CLI (db push / migrate) uses the direct connection (bypasses pgBouncer)
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
