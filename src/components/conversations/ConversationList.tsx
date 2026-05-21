'use client';

// Conversation list — search + filter + paginated table, with row click
// to open the transcript drawer. URL is the source of truth for search,
// filters, and page number, so deep-linking + back-button work.
//
// The drawer renders OVER the list on mobile (full-screen takeover) and
// to the right of it on desktop.

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Globe, Send, ChevronLeft, ChevronRight, Loader2, Filter, X } from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '@/components/icons/BrandIcons';
import TranscriptPanel from './TranscriptPanel';
import { useFetch } from './useConversations';

interface ConversationRow {
  id:           string;
  botId:        string;
  botName:      string;
  channel:      string;
  language:     string;
  country:      string | null;
  city:         string | null;
  tags:         string[];
  isHandedOff:  boolean;
  handedOffAt:  string | null;
  startedAt:    string;
  endedAt:      string | null;
  messageCount: number;
}

interface ListResponse {
  conversations: ConversationRow[];
  total:         number;
  page:          number;
  limit:         number;
  allTags?:      string[];
}

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  web:       <Globe         className="w-3.5 h-3.5" />,
  telegram:  <Send          className="w-3.5 h-3.5" />,
  instagram: <InstagramIcon className="w-3.5 h-3.5" />,
  facebook:  <FacebookIcon  className="w-3.5 h-3.5" />,
  playground:<Globe         className="w-3.5 h-3.5" />,
};
const CHANNEL_LABEL: Record<string, string> = {
  web: 'ვებსაიტი', telegram: 'Telegram', instagram: 'Instagram', facebook: 'Messenger', playground: 'Playground',
};
const CHANNELS = ['web', 'telegram', 'instagram', 'facebook'] as const;

export default function ConversationList() {
  const router = useRouter();
  const path   = usePathname();
  const params = useSearchParams();

  // ── URL state ──────────────────────────────────────────────────────────
  const urlSearch  = params.get('search')  ?? '';
  const urlTag     = params.get('tag')     ?? '';
  const urlChannel = params.get('channel') ?? '';
  const urlPage    = Math.max(1, Number(params.get('page')) || 1);
  const urlOpen    = params.get('open')    ?? '';

  // Local search input (debounced into URL).
  const [searchInput, setSearchInput] = useState(urlSearch);
  // Sync local input when the URL is changed from outside (back-button,
  // direct link). The "setState in effect" lint rule flags this; here it's
  // the canonical "sync external store to local state" pattern.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (searchInput === urlSearch) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(params.toString());
      if (searchInput) p.set('search', searchInput);
      else p.delete('search');
      p.delete('page');
      router.replace(`${path}?${p.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // params/router/path captured implicitly via fresh closure each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function setParam(key: string, value: string | undefined) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.replace(`${path}?${p.toString()}`);
  }

  // ── Build URL for the list fetch ──────────────────────────────────────
  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (urlSearch)  p.set('search',  urlSearch);
    if (urlTag)     p.set('tag',     urlTag);
    if (urlChannel) p.set('channel', urlChannel);
    p.set('page',     String(urlPage));
    p.set('limit',    '20');
    p.set('withTags', '1');
    return `/api/conversations?${p.toString()}`;
  }, [urlSearch, urlTag, urlChannel, urlPage]);

  const { data, loading, error, refetch } = useFetch<ListResponse>(listUrl);

  const allTags = data?.allTags ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <>
      <div className="glass rounded-2xl">
        {/* Toolbar */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-white/[0.04]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ეძებე მესიჯებში..."
              className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-violet-500/40 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none"
            />
          </div>
          <FilterMenu
            channel={urlChannel}
            tag={urlTag}
            allTags={allTags}
            onChange={(k, v) => setParam(k, v)}
          />
        </div>

        {/* Active filter chips */}
        {(urlTag || urlChannel) && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-white/[0.04]">
            {urlChannel && (
              <FilterChip
                label={CHANNEL_LABEL[urlChannel] ?? urlChannel}
                onRemove={() => setParam('channel', undefined)}
              />
            )}
            {urlTag && (
              <FilterChip
                label={`#${urlTag}`}
                onRemove={() => setParam('tag', undefined)}
              />
            )}
          </div>
        )}

        {/* Body */}
        {loading && !data ? (
          <SkeletonRows />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button type="button" onClick={refetch} className="mt-2 text-xs text-violet-400 hover:text-violet-300">
              ხელახლა სცადე
            </button>
          </div>
        ) : !data || data.conversations.length === 0 ? (
          <EmptyState hasFilters={!!(urlSearch || urlTag || urlChannel)} />
        ) : (
          <>
            <ul className="divide-y divide-white/[0.04]">
              {data.conversations.map(c => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setParam('open', c.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors flex items-center gap-3 ${
                      c.id === urlOpen ? 'bg-white/[0.04]' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-300 flex items-center justify-center shrink-0">
                      {CHANNEL_ICON[c.channel] ?? CHANNEL_ICON.web}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-white font-medium truncate">
                          {c.botName}
                        </span>
                        <span className="text-[11px] text-gray-500 shrink-0">
                          {formatRelative(c.startedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                        <span>{CHANNEL_LABEL[c.channel] ?? c.channel}</span>
                        <span>·</span>
                        <span>{c.messageCount} მესიჯი</span>
                        <span>·</span>
                        <span>{formatDuration(c)}</span>
                        {c.city && <><span>·</span><span>{c.city}</span></>}
                        {c.tags.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex gap-1">
                              {c.tags.slice(0, 3).map(t => (
                                <span key={t} className="px-1.5 rounded bg-violet-500/15 text-violet-200 text-[10px]">
                                  {t}
                                </span>
                              ))}
                              {c.tags.length > 3 && <span className="text-gray-600">+{c.tags.length - 3}</span>}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusPill handedOff={c.isHandedOff} />
                  </button>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-white/[0.04]">
              <span className="text-xs text-gray-500 tabular-nums">
                {data.total.toLocaleString('ka-GE')} საუბარი · გვერდი {data.page} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={data.page <= 1 || loading}
                  onClick={() => setParam('page', String(data.page - 1))}
                  className="p-1.5 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={data.page >= totalPages || loading}
                  onClick={() => setParam('page', String(data.page + 1))}
                  className="p-1.5 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500 ml-1" />}
              </div>
            </div>
          </>
        )}
      </div>

      {urlOpen && (
        <TranscriptPanel
          conversationId={urlOpen}
          onClose={() => setParam('open', undefined)}
          onChange={refetch}
        />
      )}
    </>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────

function FilterMenu({
  channel, tag, allTags, onChange,
}: {
  channel: string;
  tag:     string;
  allTags: string[];
  onChange: (k: 'channel' | 'tag', v: string | undefined) => void;
}) {
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer px-3 py-2 text-xs text-gray-300 hover:text-white border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.06] rounded-lg inline-flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5" /> ფილტრი
        {(channel || tag) && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
      </summary>
      <div className="absolute top-full mt-1 right-0 z-10 w-64 bg-[#0d0d1a] border border-white/10 rounded-lg p-3 shadow-2xl">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">არხი</p>
          <div className="flex flex-wrap gap-1">
            <ChipBtn active={!channel} onClick={() => onChange('channel', undefined)}>ყველა</ChipBtn>
            {CHANNELS.map(c => (
              <ChipBtn key={c} active={channel === c} onClick={() => onChange('channel', c)}>
                {CHANNEL_LABEL[c]}
              </ChipBtn>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">ჭდე</p>
          {allTags.length === 0 ? (
            <p className="text-[11px] text-gray-600">ჭდეები ჯერ არ გაქვს</p>
          ) : (
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              <ChipBtn active={!tag} onClick={() => onChange('tag', undefined)}>ყველა</ChipBtn>
              {allTags.map(t => (
                <ChipBtn key={t} active={tag === t} onClick={() => onChange('tag', t)}>
                  {t}
                </ChipBtn>
              ))}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

function ChipBtn({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
        active
          ? 'bg-violet-500/90 text-white'
          : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.06]'
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-200 text-[11px]">
      {label}
      <button type="button" onClick={onRemove} className="hover:text-white" aria-label="remove filter">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function StatusPill({ handedOff }: { handedOff: boolean }) {
  if (handedOff) {
    return (
      <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
        ოპერატორი
      </span>
    );
  }
  return (
    <span className="text-[10px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
      აქტიური
    </span>
  );
}

function SkeletonRows() {
  return (
    <ul className="divide-y divide-white/[0.04]">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-white/[0.05] rounded mb-2" />
            <div className="h-2 w-48 bg-white/[0.04] rounded" />
          </div>
          <div className="w-16 h-4 bg-white/[0.05] rounded-full" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="p-12 text-center">
      <p className="text-sm text-gray-400 mb-1">
        {hasFilters ? 'შედეგი ვერ მოიძებნა' : 'ჯერ საუბრები არ არის'}
      </p>
      <p className="text-[11px] text-gray-600">
        {hasFilters ? 'სცადე ფილტრის შემცირება' : 'როცა customer-ი დაიწყებს დიალოგს, აქ გამოჩნდება'}
      </p>
    </div>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const t   = new Date(iso).getTime();
  const sec = Math.max(0, Math.round((now - t) / 1000));
  if (sec < 60)    return `${sec}წმ`;
  if (sec < 3600)  return `${Math.round(sec / 60)} წთ`;
  if (sec < 86400) return `${Math.round(sec / 3600)} სთ`;
  if (sec < 604800) return `${Math.round(sec / 86400)} დღე`;
  return new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' });
}

function formatDuration(c: ConversationRow): string {
  const start = new Date(c.startedAt).getTime();
  const end   = c.endedAt ? new Date(c.endedAt).getTime() : Date.now();
  const sec   = Math.max(0, Math.round((end - start) / 1000));
  if (sec < 60)   return `${sec}წმ`;
  if (sec < 3600) return `${Math.round(sec / 60)} წთ`;
  return `${(sec / 3600).toFixed(1)} სთ`;
}
