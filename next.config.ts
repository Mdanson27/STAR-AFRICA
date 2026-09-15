import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The Netlify demo runtime bootstraps the existing SQLite/Drizzle schema from
  // the checked-in migrations and seed data. Include those SQL assets in the
  // server bundle so Netlify Functions can initialise a fresh demo database.
  outputFileTracingIncludes: {
    '/*': ['./drizzle/**/*.sql', './db/seed.sql'],
  },
};

export default nextConfig;
