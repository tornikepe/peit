import { SignUp } from "@clerk/nextjs";
import { Check } from "lucide-react";
import Logo from "@/components/Logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "რეგისტრაცია — Peit",
  description: "7-დღიანი უფასო ტრიალი. საკრედიტო ბარათი არ სჭირდება.",
};

interface SignUpPageProps {
  searchParams: Promise<{ redirect_url?: string; plan?: string }>;
}

/**
 * Validate the redirect target so a crafted ?redirect_url=https://evil.example
 * can't bounce signed-up users off-site. We only allow absolute internal paths.
 */
function safeRedirectUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return undefined;          // must be relative
  if (trimmed.startsWith('//')) return undefined;          // protocol-relative escape
  return trimmed;
}

const benefits = [
  "7-დღიანი ტრიალი — სრულყოფილი წვდომა",
  "Setup 10 წუთში — კოდი არ სჭირდება",
  "ქართული, ინგლისური, რუსული ენა",
  "Telegram, Instagram, Facebook, ვებსაიტი",
  "24/7 AI — ოდესმე არ ჩერდება",
  "გაუქმება ნებისმიერ დროს",
];

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  // PricingCheckoutButton sends ?redirect_url=/pricing?go=<plan> when the
  // visitor clicks a plan while signed out. We forward that to Clerk so
  // the user lands back on /pricing after sign-up and the auto-checkout
  // effect there opens Lemon Squeezy immediately.
  const sp = await searchParams;
  const redirectUrl = safeRedirectUrl(sp.redirect_url);

  return (
    <div className="min-h-screen flex bg-[#07070f]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between px-16 py-14 relative overflow-hidden bg-gradient-to-br from-violet-950/70 via-[#07070f] to-[#07070f]">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <Logo size="lg" className="relative w-fit" />

        {/* Mid */}
        <div className="relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wide">
              7-დღიანი სრული ტრიალი · საბარათო მონაცემი არ სჭირდება
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            დაიწყე{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              უფასოდ
            </span>
            <br />
            დღეს
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-10">
            10 წუთში გექნება სრული AI ასისტენტი, რომელიც 24/7 ემსახურება შენს კლიენტებს.
          </p>

          <div className="flex flex-col gap-3.5">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-violet-400" strokeWidth={2.5} />
                </div>
                <p className="text-gray-300 text-sm">{b}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { v: '10K+', l: 'ბიზნესი' },
            { v: '4.9★', l: 'შეფასება' },
            { v: '24/7', l: 'ონლაინ' },
          ].map(s => (
            <div key={s.l} className="glass rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-white">{s.v}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 relative">
        <div className="absolute inset-0 hero-glow opacity-20 pointer-events-none" />

        {/* Mobile logo */}
        <Logo size="md" className="relative mb-6 lg:hidden" />

        {/* Mobile trial badge */}
        <div className="mb-5 lg:hidden">
          <span className="text-xs font-bold text-amber-400 border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 rounded-full uppercase tracking-wide">
            7-დღიანი ტრიალი · საბარათო მონაცემი არ სჭირდება
          </span>
        </div>

        <div className="relative w-full max-w-md">
          {/* Our own header — replaces Clerk's default "Create your account".
              Clerk's card header is hidden via appearance.elements.header. */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white">ანგარიშის შექმნა</h2>
            <p className="text-gray-400 text-sm mt-1">დაიწყე 7-დღიანი უფასო ტრიალი</p>
          </div>

          <SignUp
            routing="hash"
            forceRedirectUrl={redirectUrl}
            signInForceRedirectUrl={redirectUrl}
            appearance={{
              variables: {
                colorPrimary: "#14b8a6",
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
