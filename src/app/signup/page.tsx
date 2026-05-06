import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "რეგისტრაცია — Peit",
  description: "7-დღიანი უფასო ტრიალი. საკრედიტო ბარათი არ სჭირდება.",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Background glow */}
      <div className="absolute inset-0 hero-glow opacity-30 pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
          <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-white text-xl tracking-tight">Peit</span>
      </Link>

      {/* Trial badge */}
      <div className="mb-6">
        <span className="text-xs font-bold text-amber-400 border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 rounded-full uppercase tracking-wide">
          7-დღიანი ტრიალი · საბარათო მონაცემი არ სჭირდება
        </span>
      </div>

      {/* Clerk SignUp component — includes Google OAuth, email/password, verification */}
      <SignUp
        routing="hash"
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
            card: "bg-[#0d0d1a] border border-white/[0.08] shadow-2xl shadow-black/50 rounded-2xl",
            headerTitle: "text-white font-bold",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton:
              "bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.1] transition-all rounded-xl",
            socialButtonsBlockButtonText: "text-white font-medium",
            dividerLine: "bg-white/10",
            dividerText: "text-gray-500",
            formFieldLabel: "text-gray-300 font-medium",
            formFieldInput:
              "bg-[#13131f] border border-white/10 text-white rounded-xl focus:border-violet-500/60 focus:ring-violet-500/20",
            formButtonPrimary:
              "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25",
            footerActionLink: "text-violet-400 hover:text-violet-300",
            identityPreviewEditButton: "text-violet-400 hover:text-violet-300",
            formFieldAction: "text-violet-400 hover:text-violet-300 text-sm",
            alertText: "text-red-400",
            formResendCodeLink: "text-violet-400 hover:text-violet-300",
          },
        }}
      />
    </div>
  );
}
