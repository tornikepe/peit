import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, Bell, Plus } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import BotsList from "@/components/dashboard/BotsList";
import DashboardStats from "@/components/dashboard/DashboardStats";
import MigrationBanner from "@/components/dashboard/MigrationBanner";
import StorageModeBadge from "@/components/dashboard/StorageModeBadge";
import UsagePanel from "@/components/dashboard/UsagePanel";

export const metadata: Metadata = {
  title: "Dashboard — Peit",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/signin");

  const user = await currentUser();
  const firstName = user?.firstName ?? "მომხმარებელი";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-lg">Peit</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard" className="px-4 py-2 text-sm text-white bg-white/[0.05] rounded-lg">
              Overview
            </Link>
            <Link href="/dashboard/conversations" className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
              საუბრები
            </Link>
            <Link href="/dashboard/analytics" className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
              ანალიტიკა
            </Link>
            <Link href="/dashboard/leads" className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
              ლიდები
            </Link>
            <Link href="/dashboard/billing" className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
              Billing
            </Link>
            <Link href="/dashboard/settings/profile" className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
              პარამეტრები
            </Link>
            <Link href="/dashboard/privacy" className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
              Privacy
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <StorageModeBadge />
            <button className="relative p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-gray-400 hover:text-white">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500" />
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome banner */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              გამარჯობა, {firstName}! 👋
            </h1>
            <p className="text-gray-400 text-sm">{email}</p>
          </div>
          <Link
            href="/dashboard/bots/new"
            className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm w-fit"
          >
            <Plus className="w-4 h-4" />
            ახალი ბოტი
          </Link>
        </div>

        {/* Migration banner (only shows if cloud + local bots exist) */}
        <MigrationBanner />

        {/* Plan + usage */}
        <UsagePanel />

        {/* Stats */}
        <div className="mb-8">
          <DashboardStats />
        </div>

        {/* Bots list */}
        <BotsList />
      </main>
    </div>
  );
}
