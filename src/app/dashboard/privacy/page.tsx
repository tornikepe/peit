'use client';

// Dashboard → Privacy & Data
// GDPR self-service: export everything we hold + permanently delete the
// account. Cookie preferences and email subscription controls also live here.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import {
  ArrowLeft, Download, Trash2, AlertTriangle, Loader2, ShieldCheck,
  Cookie, ExternalLink, CheckCircle2, Mail, Globe,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

type Locale = 'ka' | 'en' | 'ru';
interface EmailPrefs {
  leadAlerts:     boolean;
  productUpdates: boolean;
  trialReminders: boolean;
}

export default function PrivacyDataPage() {
  const router    = useRouter();
  const { signOut } = useClerk();

  const [exporting, setExporting]     = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting]       = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Email preferences ─────────────────────────────────────────────────
  const [prefs, setPrefs]         = useState<EmailPrefs | null>(null);
  const [locale, setLocale]       = useState<Locale>('ka');
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/me/email-preferences')
      .then(r => r.json())
      .then(d => {
        if (!alive) return;
        if (d.ok) {
          setPrefs(d.prefs);
          setLocale(d.locale);
        } else {
          setPrefsError(d.message ?? d.error ?? 'ვერ ჩაიტვირთა');
        }
      })
      .catch(e => {
        if (alive) setPrefsError(e instanceof Error ? e.message : 'უცნობი შეცდომა');
      })
      .finally(() => { if (alive) setPrefsLoading(false); });
    return () => { alive = false; };
  }, []);

  async function patchPrefs(patch: Partial<EmailPrefs> & { locale?: Locale }) {
    if (prefsBusy) return;
    setPrefsBusy(true);
    setPrefsSaved(false);
    setPrefsError(null);
    try {
      const res = await fetch('/api/me/email-preferences', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(patch),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        setPrefsError(d.message ?? d.error ?? `Failed (${res.status})`);
        return;
      }
      setPrefs(d.prefs);
      setLocale(d.locale);
      setPrefsSaved(true);
      // Hide the "saved" pill after 2s — non-blocking, never cancelled.
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch (e) {
      setPrefsError(e instanceof Error ? e.message : 'უცნობი შეცდომა');
    } finally {
      setPrefsBusy(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch('/api/me/export');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setExportError(body.message ?? body.error ?? `Failed (${res.status})`);
        return;
      }
      // Parse the filename from Content-Disposition, fall back to generic.
      const disposition = res.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `peit-export-${Date.now()}.json`;
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Free the blob URL on the next microtask — the download has started.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'უცნობი შეცდომა');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/me/delete', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ confirm: 'DELETE' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setDeleteError(json.message ?? json.error ?? `Failed (${res.status})`);
        return;
      }
      // Successful — sign out and bounce home.
      await signOut(() => router.push('/?deleted=1'));
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'უცნობი შეცდომა');
    } finally {
      setDeleting(false);
    }
  }

  function openCookiePrefs() {
    const w = window as unknown as { __peit_open_cookie_prefs?: () => void };
    if (typeof w.__peit_open_cookie_prefs === 'function') {
      w.__peit_open_cookie_prefs();
    }
  }

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070f]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-white font-semibold text-sm">Privacy & Data</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-white text-xl tracking-[-0.04em] leading-none">
              pe<span className="gradient-text">i</span>t
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Privacy & მონაცემები
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
            GDPR-ის შესაბამისად, ნებისმიერ დროს შეგიძლია ჩამოტვირთო შენი მონაცემები ან წაშალო ანგარიში სრულად.
          </p>
        </div>

        {/* Export card */}
        <section className="glass rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/25 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-violet-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1">მონაცემთა გადმოწერა</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                ჩამოტვირთე JSON-ფაილი ყველაფრით, რასაც ვინახავთ: პროფილი, ბოტები, FAQ, ცოდნის ბაზა,
                საუბრები, ლიდები და გამოწერა. ფაილი მხოლოდ შენთვის — სხვა აღარავინ მიიღებს.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold px-5 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              JSON გადმოწერა
            </button>
            <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              GDPR Art. 15 + Art. 20
            </p>
          </div>

          {exportError && (
            <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs">{exportError}</p>
            </div>
          )}
        </section>

        {/* Cookie preferences card */}
        <section className="glass rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/25 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1">Cookie არჩევანი</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                შეცვალე რომელ cookie-ს იღებ — აუცილებელი, ფუნქციური, ანალიტიკა.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCookiePrefs}
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-200 text-sm font-medium px-5 py-2.5 transition-colors"
            >
              <Cookie className="w-4 h-4" />
              არჩევანის შეცვლა
            </button>
            <Link
              href="/cookies"
              className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
            >
              Cookie პოლიტიკა
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* Email preferences card */}
        <section className="glass rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/25 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1">Email არჩევანი</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                გადაწყვიტე რომელი email-ის მიღება გინდა. ბილინგი და უსაფრთხოების შეტყობინება ყოველთვის ჩართულია.
              </p>
            </div>
            {prefsSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3" /> შენახულია
              </span>
            )}
          </div>

          {prefsLoading ? (
            <div className="py-6 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            </div>
          ) : prefs ? (
            <div className="flex flex-col gap-3">
              <PrefToggle
                label="ლიდის შეტყობინებები"
                desc="როცა ბოტი ახალ ლიდს დააფიქსირებს — email-ი ცხელ ლიდზე ხდება."
                value={prefs.leadAlerts}
                disabled={prefsBusy}
                onChange={v => patchPrefs({ leadAlerts: v })}
              />
              <PrefToggle
                label="ტრიალის შეხსენებები"
                desc="3 დღით ადრე და ტრიალის ბოლოს — რომ AI არ შეგიფერხდეს."
                value={prefs.trialReminders}
                disabled={prefsBusy}
                onChange={v => patchPrefs({ trialReminders: v })}
              />
              <PrefToggle
                label="პროდუქტის სიახლეები"
                desc="ფიჩერების გამოშვება, ტიპები, წინსვლის ისტორიები — თვეში მაქს. 2-ჯერ."
                value={prefs.productUpdates}
                disabled={prefsBusy}
                onChange={v => patchPrefs({ productUpdates: v })}
              />

              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <p className="text-white text-sm font-medium">Email-ის ენა</p>
                </div>
                <p className="text-gray-500 text-xs mb-3">გადაგზავნილი email-ები ამ ენაზე იქნება.</p>
                <div className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
                  {(['ka', 'en', 'ru'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => patchPrefs({ locale: l })}
                      disabled={prefsBusy || locale === l}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        locale === l
                          ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {l === 'ka' ? '🇬🇪 ქართული' : l === 'en' ? '🇬🇧 English' : '🇷🇺 Русский'}
                    </button>
                  ))}
                </div>
              </div>

              {prefsError && (
                <div className="mt-3 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300">{prefsError}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">{prefsError ?? '—'}</p>
          )}
        </section>

        {/* Legal links card */}
        <section className="glass rounded-2xl p-6 mb-10">
          <h3 className="text-white font-semibold mb-3">სამართლებრივი დოკუმენტები</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { href: '/terms',   label: 'სერვისის წესები' },
              { href: '/privacy', label: 'კონფიდენციალურობა' },
              { href: '/gdpr',    label: 'GDPR DPA' },
              { href: '/cookies', label: 'Cookie პოლიტიკა' },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 transition-colors group"
              >
                <span className="text-sm text-gray-300 group-hover:text-white">{l.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-violet-400" />
              </Link>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 ring-1 ring-red-500/25 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1">ანგარიშის წაშლა</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                ეს ქმედება შეუქცევადია. წაიშლება ყველაფერი: ბოტები, საუბრები, ლიდები, გამოწერა.
                შენი მონაცემები 30 დღეში ფიზიკურად გადაიფარება, backup-ში — 90 დღემდე.
              </p>
              <p className="text-amber-300 text-xs mt-2 leading-relaxed">
                <AlertTriangle className="inline w-3 h-3 mr-1 -mt-px" />
                გამოწერა ცალკე უნდა გააუქმო Billing → Manage Plan-ით, წინააღმდეგ შემთხვევაში გადახდის
                ცდის შესახებ Lemon Squeezy მაინც გამოგიგზავნის email-ს.
              </p>
            </div>
          </div>

          {!confirmOpen ? (
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-200 hover:text-red-100 text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              ანგარიშის წაშლა
            </button>
          ) : (
            <div className="rounded-xl border border-red-500/30 bg-red-500/[0.08] p-4">
              <p className="text-red-200 text-sm font-semibold mb-1">დარწმუნებული ხარ?</p>
              <p className="text-gray-300 text-xs leading-relaxed mb-3">
                ჩაწერე <code className="px-1.5 py-0.5 mx-0.5 rounded bg-white/[0.08] text-violet-300 font-mono text-[11px]">DELETE</code> დადასტურებისთვის.
              </p>

              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE"
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-[#0d0d1a] border border-white/[0.1] focus:border-red-500/40 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-700 outline-none font-mono mb-3 transition-colors"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || deleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold px-5 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                  სამუდამოდ წაშლა
                </button>
                <button
                  onClick={() => { setConfirmOpen(false); setConfirmText(''); setDeleteError(null); }}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-200 text-sm font-medium px-5 py-2.5 transition-colors disabled:opacity-50"
                >
                  გაუქმება
                </button>
              </div>

              {deleteError && (
                <div className="mt-3 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300">{deleteError}</p>
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            GDPR Art. 17 — Right to erasure
          </p>
        </section>
      </main>
    </div>
  );
}

// ─── PrefToggle ───────────────────────────────────────────────────────────
// Row with label + description + a switch on the right. Disabled state is
// visually softer; the parent gates rapid double-clicks via `prefsBusy`.

function PrefToggle({
  label, desc, value, disabled, onChange,
}: {
  label:    string;
  desc:     string;
  value:    boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium mb-0.5">{label}</p>
        <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
          value ? 'bg-cyan-500' : 'bg-white/[0.1]'
        }`}
        style={{ width: '40px', height: '22px' }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-[18px]' : ''
          }`}
        />
      </button>
    </div>
  );
}
