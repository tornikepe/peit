import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the SQL migration files so the /api/admin/migrate endpoint can
  // read them at runtime on Vercel. Without this Next.js prunes the folder
  // as "unused" (the import graph never references it explicitly).
  outputFileTracingIncludes: {
    "/api/admin/migrate": ["./drizzle/**/*.sql", "./drizzle/meta/**/*"],
  },
  // NOTE: tried setting `turbopack.root: path.resolve(import.meta.dirname)`
  // here to silence the local-dev "multiple lockfiles" warning, but it
  // caused MIDDLEWARE_INVOCATION_FAILED on Vercel — the resolved path
  // exists on the dev laptop but not in the serverless filesystem layout.
  // The warning was only noisy in local dev, never in production, so the
  // workaround isn't worth the risk.
};

export default nextConfig;
