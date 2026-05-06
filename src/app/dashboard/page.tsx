import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, MessageSquare, TrendingUp, Users, Settings, LogOut } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Peit",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/signin");

  const user = await currentUser();
  const firstName = user?.firstName ?? "მომხმარებელი";

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Top nav */}
      <header className="border-b border-white/[0.06] bg-[#07070f]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-white text-lg">Peit</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">გამარჯობა, {firstName}!</span>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            გასვლა
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            კეთილი იყოს თქვენი დაბრუნება, {firstName}! 👋
          </h1>
          <p className="text-gray-400">
            თქვენი Peit AI ასისტენტი მზადაა. დააყენეთ პირველი ბოტი 10 წუთში.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[
            { label: "შეტყობინება დღეს", value: "0", icon: MessageSquare, color: "text-violet-400" },
            { label: "ლიდი ამ თვეში", value: "0", icon: TrendingUp, color: "text-emerald-400" },
            { label: "აქტიური ბოტი", value: "0", icon: Users, color: "text-blue-400" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-6 flex items-center gap-4">
              <div className={`${stat.color} bg-white/[0.05] p-3 rounded-xl`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
            <Zap className="w-7 h-7 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">პირველი ბოტის შექმნა</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            ატვირთეთ FAQ ან ვებსაიტის URL, დააკოპირეთ ჩასმის კოდი და ბოტი 10 წუთში მზადაა.
          </p>
          <button className="btn-primary text-white font-semibold px-8 py-3 rounded-xl inline-flex items-center gap-2">
            <Settings className="w-4 h-4" />
            ბოტის კონფიგურაცია
          </button>
          <p className="text-gray-600 text-xs mt-4">
            ეს ფუნქციონალი მალე იქნება ხელმისაწვდომი
          </p>
        </div>
      </main>
    </div>
  );
}
