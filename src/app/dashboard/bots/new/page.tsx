'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, ArrowLeft, ArrowRight, Check, Bot as BotIcon,
  MessageSquare, Palette, Sparkles, Plus, Trash2,
  Globe, Loader2, AlertCircle, Wand2,
} from 'lucide-react';
import { useBots } from '@/context/BotsContext';
import {
  INDUSTRIES, TONES, BRAND_COLORS,
  DEFAULT_GREETINGS, DEFAULT_FALLBACKS,
  makeNewBot, createFaqId,
  type Bot, type BotLang, type BotTone, type FAQItem, type KnowledgeChunk,
} from '@/lib/bots';

const LANG_OPTIONS: { value: BotLang; label: string; flag: string }[] = [
  { value: 'ka', label: 'ქართული',  flag: '🇬🇪' },
  { value: 'en', label: 'English',  flag: '🇬🇧' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const STEPS = [
  { num: 1, label: 'საფუძველი',     icon: BotIcon },
  { num: 2, label: 'ცოდნის ბაზა',   icon: MessageSquare },
  { num: 3, label: 'პერსონალი',     icon: Palette },
  { num: 4, label: 'მიმოხილვა',     icon: Sparkles },
];

export default function NewBotPage() {
  const router = useRouter();
  const { addBot } = useBots();

  const [step, setStep] = useState(1);

  // Form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState<string>('services');
  const [languages, setLanguages] = useState<BotLang[]>(['ka']);
  const [primaryLang, setPrimaryLang] = useState<BotLang>('ka');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([
    { id: createFaqId(), q: '', a: '' },
  ]);
  const [tone, setTone] = useState<BotTone>('friendly');
  const [greeting, setGreeting] = useState<Partial<Record<BotLang, string>>>({
    ka: DEFAULT_GREETINGS.ka,
  });
  const [brandColor, setBrandColor] = useState<string>(BRAND_COLORS[0]);

  // Site analysis state
  const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    description: string;
    detectedIndustry: string | null;
    pagesScraped: number;
    signals: Record<string, boolean>;
    contact: { emails: string[]; phones: string[]; addresses: string[] };
    source: 'ai' | 'heuristic';
  } | null>(null);

  async function analyzeSite() {
    if (!websiteUrl.trim()) {
      setAnalyzeError('გთხოვთ შეიყვანოთ ვებსაიტის URL');
      return;
    }
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/analyze-site', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, lang: primaryLang }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'ანალიზი ვერ მოხერხდა');
      }

      // Auto-fill industry if detected and user hasn't customized
      if (data.analysis.detectedIndustry && industry === 'services') {
        const matched = INDUSTRIES.find(i => i.slug === data.analysis.detectedIndustry);
        if (matched) setIndustry(matched.slug);
      }

      // Auto-fill name if empty
      if (!name.trim() && data.analysis.title) {
        const cleanTitle = data.analysis.title
          .replace(/\s*[|\-—–]\s*.*$/, '') // strip "| Tagline"
          .slice(0, 60);
        if (cleanTitle.length >= 2) setName(cleanTitle);
      }

      // Save knowledge chunks
      if (Array.isArray(data.chunks) && data.chunks.length > 0) {
        setKnowledgeChunks(data.chunks as KnowledgeChunk[]);
      }

      // Replace FAQs with generated ones
      const generatedFaqs: FAQItem[] = (data.faqs as { q: string; a: string }[]).map(f => ({
        id: createFaqId(),
        q: f.q,
        a: f.a,
      }));

      if (generatedFaqs.length > 0) {
        setFaqs(generatedFaqs);
      }

      setAnalysisResult({
        title: data.analysis.title,
        description: data.analysis.description,
        detectedIndustry: data.analysis.detectedIndustry,
        pagesScraped: data.analysis.pagesScraped,
        signals: data.analysis.signals,
        contact: data.analysis.contact,
        source: data.source,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'უცნობი შეცდომა';
      setAnalyzeError(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  // Validation per step
  const canNext = (() => {
    if (step === 1) return name.trim().length >= 2 && languages.length > 0;
    if (step === 2) return true; // FAQs optional
    if (step === 3) return true;
    return true;
  })();

  function toggleLang(l: BotLang) {
    setLanguages(prev => {
      const has = prev.includes(l);
      const next = has ? prev.filter(x => x !== l) : [...prev, l];
      // Always keep at least one
      if (next.length === 0) return prev;
      // Initialize greeting for newly added language
      if (!has && !greeting[l]) {
        setGreeting(g => ({ ...g, [l]: DEFAULT_GREETINGS[l] }));
      }
      // If primary removed, switch
      if (has && primaryLang === l) setPrimaryLang(next[0]);
      return next;
    });
  }

  function addFaq() {
    setFaqs(prev => [...prev, { id: createFaqId(), q: '', a: '' }]);
  }
  function updateFaq(id: string, patch: Partial<FAQItem>) {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }
  function removeFaq(id: string) {
    setFaqs(prev => prev.filter(f => f.id !== id));
  }

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const cleanFaqs = faqs.filter(f => f.q.trim() && f.a.trim());

      const finalGreeting: Partial<Record<BotLang, string>> = {};
      const finalFallback: Partial<Record<BotLang, string>> = {};
      for (const l of languages) {
        finalGreeting[l] = greeting[l]?.trim() || DEFAULT_GREETINGS[l];
        finalFallback[l] = DEFAULT_FALLBACKS[l];
      }

      const draft: Bot = makeNewBot({
        name: name.trim(),
        industry,
        languages,
        primaryLang,
        tone,
        greeting: finalGreeting,
        fallback: finalFallback,
        faqs: cleanFaqs,
        knowledgeChunks,
        websiteUrl: websiteUrl.trim() || undefined,
        brandColor,
        status: 'active',
      });

      const created = await addBot(draft);
      router.push(`/dashboard/bots/${created.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'შენახვა ვერ მოხერხდა');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070f]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-sm">Peit</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const done = step > s.num;
              const active = step === s.num;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center gap-2 ${i === 0 ? '' : 'flex-1'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      done ? 'bg-violet-600 text-white' :
                      active ? 'bg-violet-600/20 border-2 border-violet-500 text-violet-300' :
                      'bg-white/[0.04] border border-white/[0.08] text-gray-600'
                    }`}>
                      {done ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <p className={`text-xs font-medium hidden sm:block ${
                      active ? 'text-white' : done ? 'text-violet-400' : 'text-gray-600'
                    }`}>{s.label}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 -mt-5 ${done ? 'bg-violet-500' : 'bg-white/[0.08]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          {/* ─── Step 1: Basics ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-7">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">დავიწყოთ ბოტი</h2>
                <p className="text-gray-400 text-sm">საბაზისო ინფორმაცია შენი ბოტის შესახებ.</p>
              </div>

              {/* Bot name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ბოტის სახელი <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="მაგ. Restorani XYZ Assistant"
                  className="w-full bg-[#13131f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-violet-500/60 transition-colors"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ინდუსტრია
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind.slug}
                      type="button"
                      onClick={() => setIndustry(ind.slug)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                        industry === ind.slug
                          ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                          : 'bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ენები <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANG_OPTIONS.map(l => {
                    const checked = languages.includes(l.value);
                    return (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => toggleLang(l.value)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          checked
                            ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                            : 'bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>{l.flag}</span> {l.label}
                        {checked && <Check className="w-3.5 h-3.5 text-violet-400" />}
                      </button>
                    );
                  })}
                </div>

                {languages.length > 1 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">ძირითადი ენა (default):</p>
                    <div className="flex gap-2">
                      {languages.map(l => {
                        const opt = LANG_OPTIONS.find(o => o.value === l)!;
                        return (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setPrimaryLang(l)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                              primaryLang === l
                                ? 'bg-violet-600 text-white'
                                : 'bg-white/[0.04] text-gray-400 hover:text-white'
                            }`}
                          >
                            {opt.flag} {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Step 2: Knowledge base ─────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-7">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">ცოდნის ბაზა</h2>
                <p className="text-gray-400 text-sm">
                  ბოტი ისწავლის ამ ინფორმაციით — რაც უფრო მეტი FAQ, მით უკეთესი პასუხები.
                </p>
              </div>

              {/* Website URL + Analyze */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ვებსაიტის URL <span className="text-gray-600 font-normal">(ავტო-ანალიზი)</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={e => { setWebsiteUrl(e.target.value); setAnalyzeError(null); }}
                      placeholder="https://yourbusiness.ge"
                      disabled={analyzing}
                      className="w-full bg-[#13131f] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-violet-500/60 transition-colors disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={analyzeSite}
                    disabled={analyzing || !websiteUrl.trim()}
                    className="btn-primary inline-flex items-center justify-center gap-2 text-white font-semibold px-5 py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        ანალიზი...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        გაანალიზე
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ბოტი ავტომატურად წაიკითხავს საიტს, გაიგებს რას აკეთებთ და შექმნის FAQ-ებს.
                </p>

                {/* Error */}
                {analyzeError && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs leading-relaxed">{analyzeError}</p>
                  </div>
                )}

                {/* Result */}
                {analysisResult && (
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-emerald-300 text-sm font-semibold mb-0.5">
                          ანალიზი დასრულდა
                        </p>
                        <p className="text-gray-400 text-xs">
                          {analysisResult.pagesScraped} გვერდი წაიკითხა ·{' '}
                          {analysisResult.source === 'ai' ? '🧠 AI-powered' : '⚡ Rule-based'} ·{' '}
                          {faqs.length} FAQ · {knowledgeChunks.length} chunk
                        </p>
                      </div>
                    </div>

                    {analysisResult.title && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">გაიგო რას აკეთებთ:</p>
                        <p className="text-white text-sm font-medium">{analysisResult.title}</p>
                        {analysisResult.description && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{analysisResult.description}</p>
                        )}
                      </div>
                    )}

                    {/* Detected signals */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {analysisResult.detectedIndustry && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300">
                          📌 {INDUSTRIES.find(i => i.slug === analysisResult.detectedIndustry)?.label ?? analysisResult.detectedIndustry}
                        </span>
                      )}
                      {analysisResult.signals.hasPricing && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">💰 ფასები</span>
                      )}
                      {analysisResult.signals.hasHours && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">🕒 საათები</span>
                      )}
                      {analysisResult.signals.hasBooking && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">📅 ჯავშანი</span>
                      )}
                      {analysisResult.signals.hasShipping && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">🚚 მიწოდება</span>
                      )}
                      {analysisResult.contact.phones.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">📞 {analysisResult.contact.phones[0]}</span>
                      )}
                      {analysisResult.contact.emails.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">✉️ {analysisResult.contact.emails[0]}</span>
                      )}
                    </div>

                    <p className="text-gray-500 text-[11px] mt-3">
                      ↓ FAQ-ები ქვემოთ ავტომატურად შეივსო. შეგიძლია შეცვალო ან ჩაამატო.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300">
                    ხშირად დასმული კითხვები
                  </label>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    დამატება
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {faqs.map((faq, i) => (
                    <div key={faq.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500">FAQ #{i + 1}</span>
                        {faqs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFaq(faq.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={faq.q}
                        onChange={e => updateFaq(faq.id, { q: e.target.value })}
                        placeholder="კითხვა (მაგ. რა არის თქვენი სამუშაო საათები?)"
                        className="w-full bg-[#13131f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/60 mb-2"
                      />
                      <textarea
                        value={faq.a}
                        onChange={e => updateFaq(faq.id, { a: e.target.value })}
                        placeholder="პასუხი..."
                        rows={2}
                        className="w-full bg-[#13131f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/60 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Personality ─────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-7">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">პერსონალი და სტილი</h2>
                <p className="text-gray-400 text-sm">როგორ ესაუბრება ბოტი შენს კლიენტებს.</p>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ტონი
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        tone === t.value
                          ? 'bg-violet-600/15 border-violet-500/50'
                          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-2">{t.emoji}</div>
                      <p className="text-white font-semibold text-sm mb-1">{t.label}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Greetings per language */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  მისალმების შეტყობინება
                </label>
                <div className="flex flex-col gap-3">
                  {languages.map(l => {
                    const opt = LANG_OPTIONS.find(o => o.value === l)!;
                    return (
                      <div key={l}>
                        <p className="text-xs text-gray-500 mb-1.5">{opt.flag} {opt.label}</p>
                        <input
                          type="text"
                          value={greeting[l] ?? DEFAULT_GREETINGS[l]}
                          onChange={e => setGreeting(g => ({ ...g, [l]: e.target.value }))}
                          className="w-full bg-[#13131f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/60"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brand color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ბრენდის ფერი
                </label>
                <div className="flex flex-wrap gap-2">
                  {BRAND_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBrandColor(c)}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        brandColor === c ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[#0d0d1a] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 4: Review ─────────────────────────────── */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">თითქმის მზადაა! ✨</h2>
                <p className="text-gray-400 text-sm">გადახედე და დაადასტურე — ამის შემდეგ ბოტი აქტიური იქნება.</p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}aa)` }}
                  >
                    <BotIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{name || '—'}</p>
                    <p className="text-gray-500 text-sm">
                      {INDUSTRIES.find(i => i.slug === industry)?.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ენები</p>
                    <p className="text-white text-sm">
                      {languages.map(l => LANG_OPTIONS.find(o => o.value === l)!.flag).join(' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ტონი</p>
                    <p className="text-white text-sm">
                      {TONES.find(t => t.value === tone)?.emoji} {TONES.find(t => t.value === tone)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">FAQ ჩანაწერი</p>
                    <p className="text-white text-sm">
                      {faqs.filter(f => f.q.trim() && f.a.trim()).length} კითხვა
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ვებსაიტი</p>
                    <p className="text-white text-sm truncate">{websiteUrl || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-600/5 p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium mb-1">შემდეგი ნაბიჯი</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    შექმნის შემდეგ მიიღებ ჩასმის კოდს ვებსაიტისთვის და შეგიძლია გაწვრთნო ბოტი ცოცხალი ჩატის playground-ში.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            უკან
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              შემდეგი
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {submitError && (
                <p className="text-red-400 text-xs">{submitError}</p>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ვქმნი...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    ბოტის შექმნა
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
