'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, ArrowLeft, Bot as BotIcon, Play, Pause, Trash2,
  Copy, Check, Code2, MessageSquare, Settings, Globe,
  TrendingUp, Plus, Sparkles, Loader2, RefreshCw,
  Database, Workflow, LayoutDashboard, Palette,
} from 'lucide-react';
import { useBots } from '@/context/BotsContext';
import { INDUSTRIES, TONES, type BotStatus, type FAQItem, createFaqId } from '@/lib/bots';
import AllowedOrigins from '@/components/dashboard/AllowedOrigins';
import BotInstructionsEditor from '@/components/dashboard/BotInstructionsEditor';
import ChannelsPanel  from '@/components/dashboard/ChannelsPanel';
import QuickRepliesEditor from '@/components/dashboard/QuickRepliesEditor';
import CustomCssEditor    from '@/components/dashboard/CustomCssEditor';
import GreetingVariantsEditor from '@/components/dashboard/GreetingVariantsEditor';
import FlowsEditor from '@/components/dashboard/FlowsEditor';
import KnowledgeUploads from '@/components/dashboard/KnowledgeUploads';

export default function BotDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getBot, updateBot, deleteBot, loaded } = useBots();
  const bot = getBot(id);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** Active tab on the bot detail page. Keeps the layout shallow even when
   *  there are 12+ sub-editors. */
  const [tab, setTab] = useState<'overview' | 'knowledge' | 'widget' | 'automation'>('overview');

  // Local FAQ state — typing edits this; saves to bot only on blur
  const [editFaqs, setEditFaqs] = useState<FAQItem[]>([]);
  useEffect(() => {
    // Re-sync local edit buffer when the upstream bot changes (initial
    // load or after a server-side update). This MUST run as an effect —
    // we can't read external state synchronously during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (bot) setEditFaqs(bot.faqs);
  }, [bot?.id, bot?.updatedAt]);

  // Re-crawl state
  const [recrawling, setRecrawling] = useState(false);
  const [recrawlResult, setRecrawlResult] = useState<string | null>(null);

  async function recrawlSite() {
    if (!bot) return;
    setRecrawling(true);
    setRecrawlResult(null);
    try {
      const res = await fetch(`/api/bots/${bot.id}/recrawl`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setRecrawlResult(`❌ ${data.message || data.error || 'შეცდომა'}`);
      } else {
        const parts = [
          `${data.pagesScraped} გვერდი`,
          data.sitemapPages > 0 && `📍 ${data.sitemapPages} sitemap-დან`,
          `${data.chunksCreated} chunk`,
          data.embedded > 0 && `🧠 ${data.embedded} embedded`,
        ].filter(Boolean);
        setRecrawlResult(`✅ ${parts.join(' · ')}`);
      }
      // Refresh bot data so lastCrawledAt updates in UI
      setTimeout(() => setRecrawlResult(null), 8000);
    } catch (e) {
      setRecrawlResult(`❌ ${e instanceof Error ? e.message : 'network error'}`);
    } finally {
      setRecrawling(false);
    }
  }

  // Rebuild AI index state
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState<string | null>(null);

  async function rebuildIndex() {
    if (!bot) return;
    setReindexing(true);
    setReindexResult(null);
    try {
      const res = await fetch(`/api/bots/${bot.id}/reindex`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setReindexResult(
          data.error === 'EMBEDDINGS_NOT_CONFIGURED'
            ? '⚠ VOYAGE_API_KEY არ არის დაყენებული'
            : `❌ ${data.error || 'შეცდომა'}`,
        );
      } else {
        setReindexResult(`✅ ${data.indexed} chunk-ი indexed-ულია`);
      }
      setTimeout(() => setReindexResult(null), 5000);
    } catch (e) {
      setReindexResult(`❌ ${e instanceof Error ? e.message : 'network error'}`);
    } finally {
      setReindexing(false);
    }
  }

  if (!loaded) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <p className="text-white text-lg mb-2">ბოტი ვერ მოიძებნა</p>
        <p className="text-gray-500 text-sm mb-6">ეს ბოტი არ არსებობს ან წაშლილია</p>
        <Link
          href="/dashboard"
          className="btn-primary text-white font-semibold px-6 py-3 rounded-xl text-sm"
        >
          Dashboard-ზე დაბრუნება
        </Link>
      </div>
    );
  }

  const industry = INDUSTRIES.find(i => i.slug === bot.industry);
  const toneInfo = TONES.find(t => t.value === bot.tone);

  // Auto-detect origin so the embed code points at the right server
  // in dev / staging / prod without hardcoding.
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://peit.vercel.app';

  const embedCode = `<script
  src="${origin}/widget.js"
  data-bot-id="${bot.id}"
  data-color="${bot.brandColor}"
  defer
></script>`;

  function copyEmbed() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleStatus() {
    if (!bot) return;
    const next: BotStatus = bot.status === 'active' ? 'paused' : 'active';
    await updateBot(bot.id, { status: next });
  }

  async function handleDelete() {
    if (!bot) return;
    try {
      await deleteBot(bot.id);
    } catch (e) {
      console.error('[bot-details] delete failed:', e);
    }
    router.push('/dashboard');
  }

  async function addQuickFaq() {
    if (!bot) return;
    const newFaqs = [...editFaqs, { id: createFaqId(), q: '', a: '' }];
    setEditFaqs(newFaqs);
    await updateBot(bot.id, { faqs: newFaqs });
  }

  // Local edit only — does NOT hit the API
  function editFaqLocal(faqId: string, patch: { q?: string; a?: string }) {
    setEditFaqs(prev => prev.map(f => f.id === faqId ? { ...f, ...patch } : f));
  }

  // Save on blur — only if something actually changed vs the bot's current FAQs
  async function saveFaqsIfChanged() {
    if (!bot) return;
    const orig  = JSON.stringify(bot.faqs.map(f => ({ id: f.id, q: f.q, a: f.a })));
    const curr  = JSON.stringify(editFaqs.map(f => ({ id: f.id, q: f.q, a: f.a })));
    if (orig === curr) return;
    await updateBot(bot.id, { faqs: editFaqs });
  }

  async function removeFaq(faqId: string) {
    if (!bot) return;
    const newFaqs = editFaqs.filter(f => f.id !== faqId);
    setEditFaqs(newFaqs);
    await updateBot(bot.id, { faqs: newFaqs });
  }

  return (
    <div className="max-w-6xl mx-auto">
        {/* Bot header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${bot.brandColor}, ${bot.brandColor}aa)` }}
            >
              <BotIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{bot.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-sm">{industry?.label}</span>
                <span className="text-gray-700">·</span>
                {bot.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    აქტიური
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium">
                    <Pause className="w-3 h-3" />
                    შეჩერებული
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/bots/${bot.id}/playground`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08] transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Playground
            </Link>
            <button
              onClick={toggleStatus}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08] transition-colors"
            >
              {bot.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {bot.status === 'active' ? 'შეჩერება' : 'გააქტიურება'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'შეტყობინება', value: bot.stats.messages, icon: MessageSquare, color: 'text-violet-400' },
            { label: 'ლიდი',         value: bot.stats.leads,    icon: TrendingUp,    color: 'text-emerald-400' },
            { label: 'საუბარი',     value: bot.stats.conversations, icon: Globe,    color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <s.icon className={`w-4 h-4 ${s.color} mb-3`} />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab bar — keeps the 12+ editor sections from drowning the page in
            an endless vertical scroll. Each tab is a coherent task: overview
            for the at-a-glance + FAQ, knowledge for content sources, widget
            for look-and-feel, automation for flows + channels. */}
        <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-white/[0.06] pb-0">
          {[
            { id: 'overview',   label: 'მიმოხილვა',     icon: LayoutDashboard },
            { id: 'knowledge',  label: 'ცოდნა',         icon: Database },
            { id: 'widget',     label: 'ვიჯეტი',        icon: Palette },
            { id: 'automation', label: 'ავტომატიზაცია', icon: Workflow },
          ].map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'text-white border-violet-500'
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-white/10'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ─── Overview tab ─────────────────────────────────────────────── */}
        {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* FAQs */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-white font-semibold">FAQ ბაზა</h2>
                  <p className="text-gray-500 text-sm mt-0.5">{editFaqs.length} ჩანაწერი</p>
                </div>
                <button
                  onClick={addQuickFaq}
                  className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  დამატება
                </button>
              </div>

              {editFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">FAQ ჯერ არ არის</p>
                  <button onClick={addQuickFaq} className="text-violet-400 hover:text-violet-300 text-sm mt-2">
                    + პირველი FAQ-ის დამატება
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {editFaqs.map((faq, i) => (
                    <div key={faq.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500">FAQ #{i + 1}</span>
                        <button
                          onClick={() => removeFaq(faq.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.q}
                        onChange={e => editFaqLocal(faq.id, { q: e.target.value })}
                        onBlur={saveFaqsIfChanged}
                        placeholder="კითხვა..."
                        className="w-full bg-[#13131f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/60 mb-2"
                      />
                      <textarea
                        value={faq.a}
                        onChange={e => editFaqLocal(faq.id, { a: e.target.value })}
                        onBlur={saveFaqsIfChanged}
                        placeholder="პასუხი..."
                        rows={2}
                        className="w-full bg-[#13131f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/60 resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Owner instructions — tailor the bot to this business */}
            <BotInstructionsEditor botId={bot.id} initial={bot.instructions ?? ''} />

            {/* Settings summary */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Settings className="w-4 h-4 text-gray-400" />
                <h2 className="text-white font-semibold">პარამეტრები</h2>
              </div>
              <dl className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <dt className="text-xs text-gray-500 mb-1">ტონი</dt>
                  <dd className="text-white text-sm">{toneInfo?.emoji} {toneInfo?.label}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">ენები</dt>
                  <dd className="text-white text-sm">{bot.languages.join(', ').toUpperCase()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">ვებსაიტი</dt>
                  <dd className="text-white text-sm truncate">{bot.websiteUrl || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">ბრენდის ფერი</dt>
                  <dd className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded" style={{ background: bot.brandColor }} />
                    <span className="text-white text-sm font-mono">{bot.brandColor}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right column on Overview: embed snippet + Bot ID. The rest of
              the secondary editors live under their own tab. */}
          <div className="flex flex-col gap-6">
            {/* Embed code */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="w-4 h-4 text-violet-400" />
                <h2 className="text-white font-semibold">ჩასმის კოდი</h2>
              </div>
              <p className="text-gray-500 text-xs mb-4">
                ჩასვი ეს კოდი ვებსაიტის <code className="text-violet-400">&lt;/body&gt;</code>-ის წინ
              </p>
              <div className="relative">
                <pre className="bg-[#0a0a14] border border-white/[0.08] rounded-xl p-3 text-xs text-gray-300 overflow-x-auto font-mono">
{embedCode}
                </pre>
                <button
                  onClick={copyEmbed}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-colors"
                  title="დაკოპირება"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {copied && (
                <p className="text-emerald-400 text-xs mt-2">✓ დაკოპირდა!</p>
              )}

              <a
                href={`/widget/${bot.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 text-xs text-violet-400 hover:text-violet-300 border border-violet-500/20 hover:bg-violet-500/5 rounded-lg py-2 transition-colors"
              >
                <Globe className="w-3 h-3" />
                ცალკე ფანჯარაში ნახვა
              </a>
            </div>

            {/* Bot ID */}
            <div className="glass rounded-2xl p-6">
              <p className="text-gray-500 text-xs mb-2">Bot ID</p>
              <p className="text-white text-sm font-mono break-all">{bot.id}</p>
            </div>
          </div>
        </div>
        )}

        {/* ─── Knowledge tab ────────────────────────────────────────────── */}
        {tab === 'knowledge' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PDF / DOCX / TXT uploads — spans both cols on smaller knowledge sets */}
          <div className="lg:col-span-2">
            <KnowledgeUploads botId={bot.id} />
          </div>

          {/* Website Sync */}
          {bot.websiteUrl && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <h2 className="text-white font-semibold">საიტიდან განახლება</h2>
              </div>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                წაიკითხავს {bot.websiteUrl?.replace(/^https?:\/\//, '')}-ს ხელახლა, ჩაანაცვლებს ყველა chunk-ს და დააინდექსებს AI-სთვის.
              </p>

              <button
                onClick={recrawlSite}
                disabled={recrawling}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600/15 border border-blue-500/30 text-blue-300 hover:bg-blue-600/25 transition-colors disabled:opacity-50"
              >
                {recrawling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    ხელახლა წაკითხვა
                  </>
                )}
              </button>

              {recrawlResult && (
                <p className="mt-2 text-xs text-gray-300">{recrawlResult}</p>
              )}

              {bot.lastCrawledAt && (
                <p className="mt-3 text-[11px] text-gray-600 text-center">
                  ბოლო წაკითხვა: {new Date(bot.lastCrawledAt).toLocaleString('ka-GE')}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between gap-2">
                <label className="text-xs text-gray-400">ავტომატური განახლება</label>
                <select
                  value={bot.syncIntervalDays ?? 7}
                  onChange={e => updateBot(bot.id, { syncIntervalDays: Number(e.target.value) })}
                  className="bg-black/30 border border-white/[0.08] rounded-md px-2 py-1 text-xs text-gray-100 outline-none focus:border-blue-500/40"
                >
                  <option value={0}>გამორთული</option>
                  <option value={1}>ყოველდღე</option>
                  <option value={7}>ყოველ კვირას</option>
                  <option value={14}>2 კვირაში ერთხელ</option>
                  <option value={30}>თვეში ერთხელ</option>
                </select>
              </div>
            </div>
          )}

          {/* AI Index */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h2 className="text-white font-semibold">AI Index</h2>
            </div>
            <p className="text-gray-500 text-xs mb-4 leading-relaxed">
              ცოდნის ბაზის Vector embeddings — საშუალებას აძლევს ბოტს გაიგოს კითხვა ბუნებრივად, არა მხოლოდ keyword-ებით.
            </p>
            <button
              onClick={rebuildIndex}
              disabled={reindexing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600/15 border border-violet-500/30 text-violet-300 hover:bg-violet-600/25 transition-colors disabled:opacity-50"
            >
              {reindexing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ინდექსაცია...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Index-ის გადაშენება
                </>
              )}
            </button>
            {reindexResult && (
              <p className="mt-2 text-xs text-gray-300">{reindexResult}</p>
            )}
          </div>
        </div>
        )}

        {/* ─── Widget tab ───────────────────────────────────────────────── */}
        {tab === 'widget' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickRepliesEditor
            value={bot.quickReplies ?? []}
            onSave={async next => {
              await updateBot(bot.id, { quickReplies: next });
            }}
          />
          <GreetingVariantsEditor botId={bot.id} />
          <div className="lg:col-span-2">
            <CustomCssEditor
              botId={bot.id}
              value={bot.customCss ?? ''}
              onSave={async next => {
                await updateBot(bot.id, { customCss: next });
              }}
            />
          </div>
          <div className="lg:col-span-2">
            <AllowedOrigins
              value={bot.allowedOrigins ?? []}
              onSave={async next => {
                await updateBot(bot.id, { allowedOrigins: next });
              }}
            />
          </div>
        </div>
        )}

        {/* ─── Automation tab ───────────────────────────────────────────── */}
        {tab === 'automation' && (
        <div className="flex flex-col gap-6">
          <FlowsEditor botId={bot.id} />
          <ChannelsPanel botId={bot.id} />
        </div>
        )}

        {/* Danger zone — always visible at the bottom, regardless of tab.
            Deletion is a high-stakes action that shouldn't hide behind a
            sub-navigation. */}
        <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">
          <h2 className="text-red-400 font-semibold mb-2">სახიფათო ზონა</h2>
          <p className="text-gray-500 text-xs mb-4">
            ბოტის წაშლის შემდეგ მონაცემები ვერ აღდგება.
          </p>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              ბოტის წაშლა
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                დადასტურება — წაშლა
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
              >
                გაუქმება
              </button>
            </div>
          )}
        </div>
    </div>
  );
}
