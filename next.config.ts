import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The Netlify demo runtime bootstraps the existing SQLite/Drizzle schema from
  // the checked-in migrations and seed data. Include those SQL assets in the
  // server bundle so Netlify Functions can initialise a fresh demo database.
  outputFileTracingIncludes: {
    '/*': ['./drizzle/**/*.sql', './db/seed.sql'],
  },
  // A small number of routes still import the old Cloudflare binding module.
  // During the demo migration, resolve those imports to the Netlify/Neon shim
  // instead of requiring Cloudflare packages at build or runtime.
  turbopack: {
    resolveAlias: {
      'cloudflare:workers': './lib/db/cloudflare-workers-shim.ts',
    },
  },
};

export default nextConfig;
