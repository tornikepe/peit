'use client';

// Custom sign-up page — name / email / password / confirm, our own design.
// Clerk powers it invisibly via the headless useSignUp() flow:
//   1. create({ emailAddress, password, firstName, lastName })
//   2. email-code verification step (6-digit code we render ourselves)
//   3. setActive → /dashboard
// Keeps ?plan=<slug> (pricing CTA) via the same sessionStorage resume key the
// dashboard's UpgradeCta already understands, and ?ref=<code> stays in the URL
// for the middleware's referral cookie.

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useSignUp } from '@clerk/nextjs';
import { Eye, EyeOff, Loader2, AlertCircle, MailCheck } from 'lucide-react';
import AuthShell, { Field, inputCls } from '@/components/auth/AuthShell';
import GoogleButton from '@/components/auth/GoogleButton';
import { clerkErrorText } from '@/components/auth/clerk-errors';
import { useLanguage } from '@/context/LanguageContext';

const RESUME_KEY = 'peit-resume-plan';

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpInner />
    </Suspense>
  );
}

function SignUpInner() {
  const en = useLanguage().lang === 'en';
  const router = useRouter();
  const params = useSearchParams();
  const { isSignedIn } = useAuth();
  const { signUp } = useSignUp();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Step 2 — email verification code
  const [verifying, setVerifying] = useState(false);
  const [code, setCode]           = useState('');
  const [resent, setResent]       = useState(false);

  // A pricing CTA may send /signup?plan=pro — stash it so UpgradeCta on the
  // dashboard resumes checkout right after the account is created.
  const plan = params.get('plan');
  if (plan && ['basic', 'pro', 'ultimate'].includes(plan)) {
    try { sessionStorage.setItem(RESUME_KEY, plan); } catch { /* ignore */ }
  }

  if (isSignedIn) {
    router.replace('/dashboard');
    return null;
  }

  function validate(): string | null {
    if (name.trim().length < 2)  return en ? 'Enter your name.' : 'შეიყვანე სახელი.';
    if (password.length < 8)     return en ? 'Password must be at least 8 characters.' : 'პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.';
    if (password !== confirm)    return en ? 'Passwords do not match.' : 'პაროლები არ ემთხვევა.';
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp || busy) return;
    const v = validate();
    if (v) { setError(v); return; }
    setBusy(true);
    setError(null);
    try {
      const [firstName, ...rest] = name.trim().split(/\s+/);
      const { error: err } = await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName: rest.join(' ') || undefined,
      });
      if (err) {
        setError(clerkErrorText(err, en));
        return;
      }
      if (signUp.status === 'complete') {
        await signUp.finalize();
        router.push('/dashboard');
        return;
      }
      // Instance requires email verification → send the code, show step 2.
      const { error: sendErr } = await signUp.verifications.sendEmailCode();
      if (sendErr) {
        setError(clerkErrorText(sendErr, en));
        return;
      }
      setVerifying(true);
    } catch (err) {
      setError(clerkErrorText(err, en));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (err) {
        setError(clerkErrorText(err, en));
        return;
      }
      if (signUp.status === 'complete') {
        await signUp.finalize();
        router.push('/dashboard');
      } else {
        setError(en ? 'Verification failed — try again.' : 'ვერიფიკაცია ვერ მოხერხდა — სცადე ისევ.');
      }
    } catch (err) {
      setError(clerkErrorText(err, en));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!signUp || busy) return;
    setError(null);
    try {
      const { error: err } = await signUp.verifications.sendEmailCode();
      if (err) { setError(clerkErrorText(err, en)); return; }
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(clerkErrorText(err, en));
    }
  }

  async function google() {
    if (!signUp || busy) return;
    setError(null);
    try {
      const { error: err } = await signUp.sso({
        strategy: 'oauth_google',
        redirectUrl: '/dashboard',
        redirectCallbackUrl: '/sso-callback',
      });
      if (err) setError(clerkErrorText(err, en));
    } catch (err) {
      setError(clerkErrorText(err, en));
    }
  }

  // ── Step 2: verification code ─────────────────────────────────────────
  if (verifying) {
    return (
      <AuthShell
        title={en ? 'Check your email' : 'შეამოწმე ელფოსტა'}
        subtitle={
          en
            ? `We sent a 6-digit code to ${email}. Enter it below to activate your account.`
            : `6-ნიშნა კოდი გავაგზავნეთ ${email}-ზე. შეიყვანე ქვემოთ ანგარიშის გასააქტიურებლად.`
        }
        footer={
          <button type="button" onClick={resend} className="text-blue-400 hover:text-blue-300 font-semibold">
            {resent ? (en ? 'Sent ✓' : 'გაიგზავნა ✓') : (en ? 'Resend code' : 'კოდის ხელახლა გაგზავნა')}
          </button>
        }
      >
        <form onSubmit={verify} className="flex flex-col gap-4">
          <div className="flex justify-center mb-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
              <MailCheck className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <Field label={en ? 'Verification code' : 'ვერიფიკაციის კოდი'}>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className={inputCls + ' text-center text-xl font-mono tracking-[0.5em]'}
              autoFocus
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {en ? 'Activate account' : 'ანგარიშის გააქტიურება'}
          </button>
        </form>
      </AuthShell>
    );
  }

  // ── Step 1: the form ──────────────────────────────────────────────────
  return (
    <AuthShell
      title={en ? 'Create your account' : 'შექმენი ანგარიში'}
      subtitle={en ? '7 days free. No credit card required.' : '7 დღე უფასოდ. საკრედიტო ბარათი არ გჭირდება.'}
      footer={
        <>
          {en ? 'Already have an account? ' : 'უკვე გაქვს ანგარიში? '}
          <Link href="/signin" className="text-blue-400 hover:text-blue-300 font-semibold">
            {en ? 'Sign in' : 'შესვლა'}
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
        <Field label={en ? 'Name' : 'სახელი'}>
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={en ? 'Giorgi Beridze' : 'გიორგი ბერიძე'}
            className={inputCls}
          />
        </Field>

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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={en ? 'min. 8 characters' : 'მინ. 8 სიმბოლო'}
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

        <Field label={en ? 'Confirm password' : 'გაიმეორე პაროლი'}>
          <input
            type={showPw ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={
              inputCls +
              (confirm && confirm !== password ? ' !border-red-500/50' : confirm && confirm === password ? ' !border-emerald-500/40' : '')
            }
          />
        </Field>

        {/* Clerk renders its invisible bot-protection here when enabled. */}
        <div id="clerk-captcha" />

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !name || !email || !password || !confirm}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {en ? 'Create account' : 'ანგარიშის შექმნა'}
        </button>

        <p className="text-[11px] text-gray-600 text-center leading-relaxed">
          {en ? 'By signing up you agree to our ' : 'რეგისტრაციით ეთანხმები ჩვენს '}
          <Link href="/terms" className="text-gray-400 hover:text-white underline">{en ? 'Terms' : 'წესებს'}</Link>
          {en ? ' and ' : ' და '}
          <Link href="/privacy" className="text-gray-400 hover:text-white underline">{en ? 'Privacy Policy' : 'კონფიდენციალურობის პოლიტიკას'}</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
