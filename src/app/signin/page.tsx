import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Zap, MessageSquare, TrendingUp, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "შესვლა — Peit",
};

const perks = [
  { icon: MessageSquare, text: "24/7 AI ასისტენტი ქართულად, ინგლისურად, რუსულად" },
  { icon: TrendingUp, text: "გაყიდვები 3x იზრდება ავტომატური lead capture-ით" },
  { icon: Shield, text: "SOC 2 Type II, GDPR — მონაცემები სრულად დაცულია" },
];

interface SignInPageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

/** Reject anything that isn't a same-origin path. Mirrors signup/page.tsx. */
function safeRedirectUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return undefined;
  if (trimmed.startsWith('//')) return undefined;
  return trimmed;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const sp = await searchParams;
  const redirectUrl = safeRedirectUrl(sp.redirect_url);
  return (
    <div className="min-h-screen flex bg-[#07070f]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between px-16 py-14 relative overflow-hidden bg-gradient-to-br from-violet-950/70 via-[#07070f] to-[#07070f]">
        {/* Glow */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2.5 group w-fit">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">Peit</span>
        </Link>

        {/* Mid content */}
        <div className="relative">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">AI Chatbot Platform</p>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            კეთილი იყოს
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              დაბრუნება
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-10">
            შედი შენს dashboard-ში და გაგრძელე ბოტის მართვა.
          </p>

          <div className="flex flex-col gap-5">
            {perks.map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <p.icon className="w-4 h-4 text-violet-400" />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed pt-1.5">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative glass rounded-2xl p-5 border border-white/[0.06]">
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            &ldquo;Peit-მა ჩვენი კლიენტების პასუხის დრო 0-ზე ჩამოიყვანა — ბოტი გვასწრებდა.&rdquo;
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              G
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Giorgi M.</p>
              <p className="text-gray-500 text-xs">E-commerce, თბილისი</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 relative">
        <div className="absolute inset-0 hero-glow opacity-20 pointer-events-none" />

        {/* Mobile logo */}
        <Link href="/" className="relative flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white text-xl">Peit</span>
        </Link>

        <div className="relative w-full max-w-md">
          {/* Our own header — replaces Clerk's default "Sign in to My
              Application" (the Clerk app name leaks through otherwise). The
              Clerk card header is hidden via appearance.elements.header. */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white">შესვლა</h2>
            <p className="text-gray-400 text-sm mt-1">შედი შენს Peit ანგარიშში</p>
          </div>

          <SignIn
            routing="hash"
            forceRedirectUrl={redirectUrl}
            signUpForceRedirectUrl={redirectUrl}
            appearance={{
              variables: {
                colorPrimary: "#7c3aed",
                colorBackground: "#0d0d1a",
                colorInputBackground: "#13131f",
                colorInputText: "#ffffff",
                colorText: "#ffffff",
                colorTextSecondary: "#9ca3af",
                colorDanger: "#ef4444",
                borderRadius: "0.75rem",
                fontFamily: "var(--font-geist-sans), sans-serif",
              },
              elements: {
                header: "hidden",
                card: "bg-[#0d0d1a] border border-white/[0.08] shadow-2xl shadow-black/60 rounded-2xl",
                headerTitle: "text-white font-bold text-xl",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton:
                  "bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08] transition-all rounded-xl",
                socialButtonsBlockButtonText: "text-white font-medium",
                dividerLine: "bg-white/10",
                dividerText: "text-gray-500",
                formFieldLabel: "text-gray-300 font-medium",
                formFieldInput:
                  "bg-[#13131f] border border-white/10 text-white rounded-xl focus:border-violet-500/60 focus:ring-violet-500/20",
                formButtonPrimary:
                  "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/30",
                footerActionLink: "text-violet-400 hover:text-violet-300 transition-colors",
                identityPreviewEditButton: "text-violet-400 hover:text-violet-300",
                formFieldAction: "text-violet-400 hover:text-violet-300 text-sm",
                alertText: "text-red-400",
                formResendCodeLink: "text-violet-400 hover:text-violet-300",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
