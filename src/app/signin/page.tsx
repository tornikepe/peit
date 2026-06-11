'use client';

// Custom sign-in page — our own design (replyory-style card), Clerk runs
// invisibly underneath via the headless useSignIn() flow. No Clerk UI,
// no "Development mode" badge, no third-party look.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useSignIn } from '@clerk/nextjs';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import AuthShell, { Field, inputCls } from '@/components/auth/AuthShell';
import GoogleButton from '@/components/auth/GoogleButton';
import { clerkErrorText } from '@/components/auth/clerk-errors';
import { useLanguage } from '@/context/LanguageContext';

export default function SignInPage() {
  const en = useLanguage().lang === 'en';
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn } = useSignIn();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Already signed in → straight to the dashboard.
  if (isSignedIn) {
    router.replace('/dashboard');
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await signIn.password({ identifier: email.trim(), password });
      if (err) {
        setError(clerkErrorText(err, en));
        return;
      }
      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.push('/dashboard');
      } else {
        // 2FA / extra factors aren't enabled on this instance; be honest if
        // Clerk ever asks for more than email+password.
        setError(en ? 'Additional verification required — contact support.' : 'დამატებითი ვერიფიკაციაა საჭირო — დაგვიკავშირდი.');
      }
    } catch (err) {
      setError(clerkErrorText(err, en));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!signIn || busy) return;
    setError(null);
    try {
      const { error: err } = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: '/dashboard',
        redirectCallbackUrl: '/sso-callback',
      });
      if (err) setError(clerkErrorText(err, en));
    } catch (err) {
      setError(clerkErrorText(err, en));
    }
  }

  return (
    <AuthShell
      title={en ? 'Welcome back' : 'კარგია, რომ დაბრუნდი'}
      subtitle={en ? 'Sign in to manage your AI agents.' : 'შედი და მართე შენი AI აგენტები.'}
      footer={
        <>
          {en ? "Don't have an account? " : 'არ გაქვს ანგარიში? '}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
            {en ? 'Sign up free' : 'დარეგისტრირდი უფასოდ'}
          </Link>
        </>
      }
    >
      <GoogleButton label={en ? 'Continue with Google' : 'გაგრძელება Google-ით'} onClick={google} disabled={busy} />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-[11px] text-gray-600 uppercase tracking-wider">{en ? 'or' : 'ან'}</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={en ? 'Email' : 'ელფოსტა'}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.ge"
            className={inputCls}
          />
        </Field>

        <Field label={en ? 'Password' : 'პაროლი'}>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls + ' pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label={showPw ? 'hide password' : 'show password'}
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !email || !password}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {en ? 'Sign in' : 'შესვლა'}
        </button>
      </form>
    </AuthShell>
  );
}
