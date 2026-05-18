import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the SQL migration files so the /api/admin/migrate endpoint can
  // read them at runtime on Vercel. Without this Next.js prunes the folder
  // as "unused" (the import graph never references it explicitly).
  outputFileTracingIncludes: {
    "/api/admin/migrate": ["./drizzle/**/*.sql", "./drizzle/meta/**/*"],
  },
};

export default nextConfig;
