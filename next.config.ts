import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Bundle the SQL migration files so the /api/admin/migrate endpoint can
  // read them at runtime on Vercel. Without this Next.js prunes the folder
  // as "unused" (the import graph never references it explicitly).
  outputFileTracingIncludes: {
    "/api/admin/migrate": ["./drizzle/**/*.sql", "./drizzle/meta/**/*"],
  },
  // Pin Turbopack to this directory. Without this, when a parent git
  // worktree also has a package-lock.json (which is the normal git
  // worktree layout), Turbopack walks up and picks the parent as root —
  // producing the noisy "multiple lockfiles" warning every dev start.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
