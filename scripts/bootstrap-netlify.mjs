// Netlify production builds can inherit local shell variables in addition to
// project-scoped environment variables. Always make the explicitly configured
// Netlify DATABASE_URL authoritative for the bootstrap so a stale local
// DATABASE_URL_UNPOOLED cannot redirect the build to the wrong host.
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
}

await import('./bootstrap-neon.mjs');
