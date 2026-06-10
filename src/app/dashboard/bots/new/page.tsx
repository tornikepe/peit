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
import { useLanguage } from '@/context/LanguageContext';
import {
  INDUSTRIES, TONES, BRAND_COLORS,
  DEFAULT_GREETINGS, DEFAULT_FALLBACKS,
  makeNewBot, createFaqId,
  type Bot, type BotLang, type BotTone, type FAQItem, type KnowledgeChunk,
} from '@/lib/bots';

// Russian was removed product-wide — new bots offer Georgian + English only.
const LANG_OPTIONS: { value: BotLang; label: string; flag: string }[] = [
  { value: 'ka', label: 'ქართული',  flag: '🇬🇪' },
  { value: 'en', label: 'English',  flag: '🇬🇧' },
];

const STEPS = (en: boolean) => [
  { num: 1, label: en ? 'Basics' : 'საფუძველი',          icon: BotIcon },
  { num: 2, label: en ? 'Knowledge base' : 'ცოდნის ბაზა', icon: MessageSquare },
  { num: 3, label: en ? 'Personality' : 'პერსონალი',      icon: Palette },
  { num: 4, label: en ? 'Review' : 'მიმოხილვა',           icon: Sparkles },
];

export default function NewBotPage() {
  const en = useLanguage().lang === 'en';
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
      setAnalyzeError(en ? 'Please enter your website URL' : 'გთხოვთ შეიყვანოთ ვებსაიტის URL');
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
        throw new Error(data.error || (en ? 'Analysis failed' : 'ანალიზი ვერ მოხერხდა'));
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
      const msg = err instanceof Error ? err.message : (en ? 'Unknown error' : 'უცნობი შეცდომა');
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
      setSubmitError(e instanceof Error ? e.message : (en ? 'Save failed' : 'შენახვა ვერ მოხერხდა'));
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
        {/* Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {STEPS(en).map((s, i) => {
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
                  {i < STEPS(en).length - 1 && (
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
                <h2 className="text-2xl font-bold text-white mb-2">{en ? 'Let\u2019s start your bot' : 'დავიწყოთ ბოტი'}</h2>
                <p className="text-gray-400 text-sm">{en ? 'Basic information about your bot.' : 'საბაზისო ინფორმაცია შენი ბოტის შესახებ.'}</p>
              </div>

              {/* Bot name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {en ? 'Bot name' : 'ბოტის სახელი'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={en ? 'e.g. Restaurant XYZ Assistant' : 'მაგ. Restorani XYZ Assistant'}
                  className="w-full bg-[#13131f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-violet-500/60 transition-colors"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {en ? 'Industry' : 'ინდუსტრია'}
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
                      {en ? ind.labelEn : ind.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {en ? 'Languages' : 'ენები'} <span className="text-red-400">*</span>
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
                    <p className="text-xs text-gray-500 mb-2">{en ? 'Primary language (default):' : 'ძირითადი ენა (default):'}</p>
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
                <h2 className="text-2xl font-bold text-white mb-2">{en ? 'Knowledge base' : 'ცოდნის ბაზა'}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {en ? 'Enter your site URL and the bot learns automatically — FAQs are optional.' : 'ჩაწერე საიტის URL და ბოტი ავტომატურად ისწავლის — FAQ-ები სავალდებულო არ არის.'}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-2.5 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  {en ? 'A URL is enough — sitemap + 12 pages + AI-grounded answers' : 'URL-ით საკმარისია — Sitemap + 12 გვერდი + AI-grounded პასუხები'}
                </div>
              </div>

              {/* Website URL + Analyze */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {en ? 'Website URL' : 'ვებსაიტის URL'} <span className="text-gray-600 font-normal">{en ? '(auto-analysis)' : '(ავტო-ანალიზი)'}</span>
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
                        {en ? 'Analyzing...' : 'ანალიზი...'}
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        {en ? 'Analyze' : 'გაანალიზე'}
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {en ? 'The bot reads your site automatically, learns what you do and builds FAQs.' : 'ბოტი ავტომატურად წაიკითხავს საიტს, გაიგებს რას აკეთებთ და შექმნის FAQ-ებს.'}
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
                          {en ? 'Analysis complete' : 'ანალიზი დასრულდა'}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {analysisResult.pagesScraped} {en ? 'pages read' : 'გვერდი წაიკითხა'} ·{' '}
                          {analysisResult.source === 'ai' ? '🧠 AI-powered' : '⚡ Rule-based'} ·{' '}
                          {faqs.length} FAQ · {knowledgeChunks.length} chunk
                        </p>
                      </div>
                    </div>

                    {analysisResult.title && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">{en ? 'Understood what you do:' : 'გაიგო რას აკეთებთ:'}</p>
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
                          📌 {(en ? INDUSTRIES.find(i => i.slug === analysisResult.detectedIndustry)?.labelEn : INDUSTRIES.find(i => i.slug === analysisResult.detectedIndustry)?.label) ?? analysisResult.detectedIndustry}
                        </span>
                      )}
                      {analysisResult.signals.hasPricing && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">💰 {en ? 'Prices' : 'ფასები'}</span>
                      )}
                      {analysisResult.signals.hasHours && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">🕒 {en ? 'Hours' : 'საათები'}</span>
                      )}
                      {analysisResult.signals.hasBooking && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">📅 {en ? 'Booking' : 'ჯავშანი'}</span>
                      )}
                      {analysisResult.signals.hasShipping && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">🚚 {en ? 'Delivery' : 'მიწოდება'}</span>
                      )}
                      {analysisResult.contact.phones.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">📞 {analysisResult.contact.phones[0]}</span>
                      )}
                      {analysisResult.contact.emails.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">✉️ {analysisResult.contact.emails[0]}</span>
                      )}
                    </div>

                    <p className="text-gray-500 text-[11px] mt-3">
                      {en ? '↓ FAQs below were filled automatically. You can edit or add more.' : '↓ FAQ-ები ქვემოთ ავტომატურად შეივსო. შეგიძლია შეცვალო ან ჩაამატო.'}
                    </p>
                  </div>
                )}
              </div>

              {/* FAQs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300">
                    {en ? 'Frequently asked questions' : 'ხშირად დასმული კითხვები'}
                    <span className="ml-2 text-xs font-normal text-gray-600">{en ? '(optional)' : '(არჩევითი)'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {en ? 'Add' : 'დამატება'}
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
                        placeholder={en ? 'Question (e.g. What are your working hours?)' : 'კითხვა (მაგ. რა არის თქვენი სამუშაო საათები?)'}
                        className="w-full bg-[#13131f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/60 mb-2"
                      />
                      <textarea
                        value={faq.a}
                        onChange={e => updateFaq(faq.id, { a: e.target.value })}
                        placeholder={en ? 'Answer...' : 'პასუხი...'}
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
                <h2 className="text-2xl font-bold text-white mb-2">{en ? 'Personality & style' : 'პერსონალი და სტილი'}</h2>
                <p className="text-gray-400 text-sm">{en ? 'How the bot talks to your customers.' : 'როგორ ესაუბრება ბოტი შენს კლიენტებს.'}</p>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {en ? 'Tone' : 'ტონი'}
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
                      <p className="text-white font-semibold text-sm mb-1">{en ? t.labelEn : t.label}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">{en ? t.descEn : t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Greetings per language */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {en ? 'Greeting message' : 'მისალმების შეტყობინება'}
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
                  {en ? 'Brand color' : 'ბრენდის ფერი'}
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
                <h2 className="text-2xl font-bold text-white mb-2">{en ? 'Almost ready! ✨' : 'თითქმის მზადაა! ✨'}</h2>
                <p className="text-gray-400 text-sm">{en ? 'Review and confirm — after this your bot goes live.' : 'გადახედე და დაადასტურე — ამის შემდეგ ბოტი აქტიური იქნება.'}</p>
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
                      {en ? INDUSTRIES.find(i => i.slug === industry)?.labelEn : INDUSTRIES.find(i => i.slug === industry)?.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{en ? 'Languages' : 'ენები'}</p>
                    <p className="text-white text-sm">
                      {languages.map(l => LANG_OPTIONS.find(o => o.value === l)!.flag).join(' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{en ? 'Tone' : 'ტონი'}</p>
                    <p className="text-white text-sm">
                      {TONES.find(t => t.value === tone)?.emoji} {en ? TONES.find(t => t.value === tone)?.labelEn : TONES.find(t => t.value === tone)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{en ? 'FAQ entries' : 'FAQ ჩანაწერი'}</p>
                    <p className="text-white text-sm">
                      {faqs.filter(f => f.q.trim() && f.a.trim()).length} {en ? 'questions' : 'კითხვა'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{en ? 'Website' : 'ვებსაიტი'}</p>
                    <p className="text-white text-sm truncate">{websiteUrl || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-600/5 p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium mb-1">{en ? 'Next step' : 'შემდეგი ნაბიჯი'}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {en ? 'After creating you get an embed code for your website and can train the bot in the live chat playground.' : 'შექმნის შემდეგ მიიღებ ჩასმის კოდს ვებსაიტისთვის და შეგიძლია გაწვრთნო ბოტი ცოცხალი ჩატის playground-ში.'}
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
            {en ? 'Back' : 'უკან'}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {en ? 'Next' : 'შემდეგი'}
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
                    {en ? 'Creating...' : 'ვქმნი...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {en ? 'Create bot' : 'ბოტის შექმნა'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
    </div>
  );
}
