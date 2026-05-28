'use client';

// Slide-in drawer showing the full transcript of one conversation.
//
// Desktop: side panel anchored to the right, list stays visible behind
// a darkened scrim.
// Mobile (<md): full-screen takeover — push-navigation feel, "back" arrow
// replaces the close X.

import { useEffect, useState } from 'react';
import { ArrowLeft, X, Globe, Send, MapPin, Clock, Download, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '@/components/icons/BrandIcons';
import { useFetch } from './useConversations';
import TagInput from './TagInput';
import HandoffButton from './HandoffButton';

interface Message {
  id:        string;
  role:      'user' | 'bot';
  content:   string;
  source:    string | null;
  feedback:  'positive' | 'negative' | null;
  createdAt: string;
}

interface ConversationDetail {
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
  messages:     Message[];
}

interface Props {
  conversationId: string;
  onClose:        () => void;
  /** Called after a PATCH so the list can re-fetch fresh tags/handoff. */
  onChange?:      () => void;
}

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  web:       <Globe         className="w-4 h-4" />,
  telegram:  <Send          className="w-4 h-4" />,
  instagram: <InstagramIcon className="w-4 h-4" />,
  facebook:  <FacebookIcon  className="w-4 h-4" />,
  playground:<Globe         className="w-4 h-4" />,
};
const CHANNEL_LABEL: Record<string, string> = {
  web:       'ვებსაიტი',
  telegram:  'Telegram',
  instagram: 'Instagram',
  facebook:  'Messenger',
  playground:'Playground',
};

export default function TranscriptPanel({ conversationId, onClose, onChange }: Props) {
  const { data, loading, error, refetch } = useFetch<{ conversation: ConversationDetail }>(
    `/api/conversations/${conversationId}`,
    { revalidateOnFocus: false },
  );

  // Disable body scroll while open (mobile especially).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function patch(body: { tags?: string[]; isHandedOff?: boolean }) {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method:  'PATCH',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? json?.message ?? 'patch failed');
    refetch();
    onChange?.();
  }

  const c = data?.conversation;

  return (
    <>
      {/* Scrim — only on md+ where the list stays visible behind */}
      <div
        className="hidden md:block fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-[560px] lg:w-[640px] z-50 bg-[#0d0d1a] md:border-l border-white/[0.06] flex flex-col"
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white"
              aria-label="back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {c && CHANNEL_ICON[c.channel]}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {c?.botName ?? '…'}
              </div>
              <div className="text-[11px] text-gray-500 truncate">
                {c
                  ? `${CHANNEL_LABEL[c.channel] ?? c.channel}${c.city ? ` · ${c.city}` : ''}${c.country ? ` · ${c.country}` : ''}`
                  : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {c && <ExportDropdown id={c.id} />}
            <button
              type="button"
              onClick={onClose}
              className="hidden md:inline-flex p-1.5 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white"
              aria-label="close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {loading && !c && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          </div>
        )}

        {error && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-2 text-xs text-violet-400 hover:text-violet-300"
            >
              ხელახლა სცადე
            </button>
          </div>
        )}

        {c && (
          <>
            {/* Metadata strip */}
            <div className="px-4 py-2 border-b border-white/[0.04] grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(c.startedAt).toLocaleString('ka-GE', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin className="w-3 h-3" />
                {c.city ?? c.country ?? 'უცნობი'}
              </div>
              <div className="col-span-2 text-gray-500">
                ხანგრძლივობა: {formatDuration(c.startedAt, c.endedAt, c.messages)}
                {' · '}{c.messages.length} მესიჯი
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
              {c.messages.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-8">მესიჯები არ არის</p>
              ) : c.messages.map(m => <Bubble key={m.id} message={m} />)}
            </div>

            {/* Footer: tags + handoff */}
            <div className="border-t border-white/[0.06] p-4 flex flex-col gap-3 bg-black/30">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">
                  ჭდეები
                </label>
                <TagInput
                  value={c.tags}
                  onSave={async tags => { await patch({ tags }); }}
                />
              </div>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <HandoffButton
                  isHandedOff={c.isHandedOff}
                  handedOffAt={c.handedOffAt}
                  onChange={async ({ isHandedOff }) => { await patch({ isHandedOff }); }}
                />
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${
        isUser
          ? 'bg-violet-500/90 text-white rounded-br-sm'
          : 'bg-white/[0.06] text-gray-100 rounded-bl-sm'
      }`}>
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
        <div className={`text-[10px] mt-1 flex items-center gap-1.5 ${
          isUser ? 'text-violet-100/70' : 'text-gray-500'
        }`}>
          <span>
            {new Date(message.createdAt).toLocaleTimeString('ka-GE', {
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
          {message.source && message.source !== null && (
            <span className="opacity-60">· {sourceLabel(message.source)}</span>
          )}
          {!isUser && message.feedback === 'positive' && (
            <span className="inline-flex items-center gap-0.5 text-emerald-400" title="Thumbs up">
              · <ThumbsUp className="w-2.5 h-2.5" />
            </span>
          )}
          {!isUser && message.feedback === 'negative' && (
            <span className="inline-flex items-center gap-0.5 text-rose-400" title="Thumbs down">
              · <ThumbsDown className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function sourceLabel(s: string): string {
  switch (s) {
    case 'faq':       return 'FAQ';
    case 'knowledge': return 'საიტიდან';
    case 'ai':        return 'AI';
    case 'fallback':  return 'fallback';
    case 'human':     return 'ოპერატორი';
    default:          return s;
  }
}

function formatDuration(startedAt: string, endedAt: string | null, messages: Message[]): string {
  const startMs = new Date(startedAt).getTime();
  const endMs   = endedAt
    ? new Date(endedAt).getTime()
    : messages.length > 0
      ? new Date(messages[messages.length - 1].createdAt).getTime()
      : Date.now();
  const secs = Math.max(0, Math.round((endMs - startMs) / 1000));
  if (secs < 60)    return `${secs}წმ`;
  if (secs < 3600)  return `${Math.round(secs / 60)} წთ`;
  return `${(secs / 3600).toFixed(1)} სთ`;
}

function ExportDropdown({ id }: { id: string }) {
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white" aria-label="export">
        <Download className="w-4 h-4" />
      </summary>
      <div className="absolute top-full mt-1 right-0 z-10 bg-[#0d0d1a] border border-white/10 rounded-lg shadow-xl py-1 w-32">
        <a
          href={`/api/conversations/${id}/export?format=json`}
          className="block px-3 py-1.5 text-xs text-gray-300 hover:bg-white/[0.05] hover:text-white"
          target="_blank"
          rel="noopener"
        >
          JSON
        </a>
        <a
          href={`/api/conversations/${id}/export?format=csv`}
          className="block px-3 py-1.5 text-xs text-gray-300 hover:bg-white/[0.05] hover:text-white"
          target="_blank"
          rel="noopener"
        >
          CSV
        </a>
      </div>
    </details>
  );
}
