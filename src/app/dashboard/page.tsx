import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Zap, MessageSquare, TrendingUp, Users, Settings,
  Plus, CheckCircle2, Circle, ArrowRight, Bell,
  BarChart3, Globe, Code2,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Peit",
};

const checklist = [
  { done: true,  label: "ანგარიში შეიქმნა" },
  { done: false, label: "პირველი ბოტის კონფიგურაცია" },
  { done: false, label: "FAQ / კონტენტის ატვირთვა" },
  { done: false, label: "ვებსაიტზე ჩასმის კოდის დაამატება" },
  { done: false, label: "Telegram / Instagram ინტეგრაცია" },
];

const quickActions = [
  { icon: Plus,    label: "ახალი ბოტი",       sub: "10 წუთი",       color: "from-violet-600 to-purple-700" },
  { icon: Globe,   label: "ვებ ინტეგრაცია",   sub: "კოდის ჩასმა",   color: "from-blue-600 to-cyan-600"    },
  { icon: BarChart3, label: "ანალიტიკა",      sub: "სტატისტიკა",    color: "from-emerald-600 to-teal-600" },
  { icon: Code2,   label: "API წვდომა",        sub: "დოკუმენტაცია",  color: "from-orange-500 to-amber-500" },
];

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/signin");

  const user = await currentUser();
  const firstName = user?.firstName ?? "მომხმარებელი";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const completedSteps = checklist.filter(c => c.done).length;
  const totalSteps = checklist.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

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
            {['Overview', 'Bots', 'Analytics', 'Integrations'].map(item => (
              <button key={item}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
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
          <button className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm w-fit">
            <Plus className="w-4 h-4" />
            ახალი ბოტი
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "შეტყობინება დღეს",  value: "0",    icon: MessageSquare, color: "text-violet-400",  bg: "bg-violet-600/10 border-violet-500/20" },
            { label: "ლიდი ამ თვეში",      value: "0",    icon: TrendingUp,    color: "text-emerald-400", bg: "bg-emerald-600/10 border-emerald-500/20" },
            { label: "აქტიური ბოტი",       value: "0",    icon: Users,         color: "text-blue-400",    bg: "bg-blue-600/10 border-blue-500/20" },
            { label: "კონვერსია",           value: "—",    icon: BarChart3,     color: "text-orange-400",  bg: "bg-orange-600/10 border-orange-500/20" },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${s.bg}`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: 18, height: 18 }} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Onboarding checklist */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-semibold text-lg">დაწყების სახელმძღვანელო</h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  {completedSteps}/{totalSteps} ნაბიჯი შესრულებულია
                </p>
              </div>
              <div className="text-right">
                <p className="text-violet-400 font-bold text-xl">{progress}%</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/[0.05] rounded-full h-1.5 mb-6">
              <div
                className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-col gap-3">
              {checklist.map((item, i) => (
                <div key={i}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                    item.done
                      ? 'bg-emerald-600/5 border-emerald-500/15'
                      : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
                  }`}>
                  {item.done
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    : <Circle className="w-5 h-5 text-gray-600 shrink-0" />
                  }
                  <p className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                    {item.label}
                  </p>
                  {!item.done && (
                    <ArrowRight className="w-4 h-4 text-gray-600 ml-auto shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Quick actions */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">სწრაფი მოქმედებები</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((a, i) => (
                  <button key={i}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-white/[0.06] hover:border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all group">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <a.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-white text-xs font-medium leading-tight">{a.label}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">{a.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trial info */}
            <div className="relative rounded-2xl overflow-hidden border border-violet-500/20 bg-gradient-to-br from-violet-950/60 to-purple-950/40 p-5">
              <div className="absolute inset-0 hero-glow opacity-30 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <p className="text-violet-300 text-sm font-semibold">Starter Trial</p>
                </div>
                <p className="text-white font-bold text-2xl mb-1">7 <span className="text-gray-400 text-base font-normal">დღე დარჩა</span></p>
                <p className="text-gray-400 text-xs mb-4">
                  ტრიალი მთავრდება — გადადი სრულ პლანზე.
                </p>
                <Link href="/pricing"
                  className="btn-primary flex items-center justify-center gap-1.5 text-white text-xs font-semibold py-2.5 rounded-xl">
                  <Settings className="w-3.5 h-3.5" />
                  პლანის არჩევა
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity placeholder */}
        <div className="mt-6 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">ბოლო აქტივობა</h2>
            <button className="text-violet-400 hover:text-violet-300 text-sm transition-colors">ყველა →</button>
          </div>
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">შეტყობინებები ჯერ არ არის</p>
            <p className="text-gray-600 text-xs">ბოტის შექმნის შემდეგ, საუბრები აქ გამოჩნდება</p>
          </div>
        </div>

      </main>
    </div>
  );
}
