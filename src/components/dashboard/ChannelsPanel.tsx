'use client';

// Per-bot multi-channel manager. Renders a row for each supported channel
// (Telegram, Instagram, Facebook Messenger) with connect/disconnect UX.
//
// - Telegram: user pastes a bot token from @BotFather. We POST it to
//   /api/channels/[botId]/telegram which validates with getMe(), registers
//   the webhook, and stores credentials.
// - Instagram / Facebook: we ask /api/channels/[botId]/meta/auth-url for
//   a Meta OAuth URL, open it in a new window, and let the user complete
//   the flow on Meta's side. The callback page (next file) posts the
//   resulting code back here.
//
// Loads its own state from /api/channels/[botId] on mount and after every
// successful change.

import { useCallback, useEffect, useState } from 'react';
import {
  Send, Loader2, Plug, Trash2, ExternalLink, AlertCircle, CheckCircle2,
} from 'lucide-react';

// lucide-react v1 (the fork pinned in this repo) doesn't ship Instagram /
// Facebook glyphs, so we inline the official brand marks. Tiny enough to
// drop straight into the component tree.
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

interface ChannelView {
  channel:        'telegram' | 'instagram' | 'facebook';
  status:         'active' | 'disconnected' | 'error';
  credentials:    Record<string, unknown>;
  lastInboundAt:  string | null;
  totalInbound:   number;
  lastError:      string | null;
  updatedAt:      string;
}

interface Props { botId: string }

export default function ChannelsPanel({ botId }: Props) {
  const [channels, setChannels] = useState<ChannelView[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${botId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'load failed');
      setChannels(data.channels ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed');
    } finally {
      setLoading(false);
    }
  }, [botId]);

  // Initial load + after-mount reload. The state writes happen inside the
  // async reload() — async + initial-data is exactly the case the
  // set-state-in-effect rule explicitly allows ("data fetching", per the
  // React docs). Lint can't see across the await boundary, so disable here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void reload(); }, [reload]);

  const byKind = (k: ChannelView['channel']): ChannelView | undefined =>
    channels.find(c => c.channel === k);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Plug className="w-4 h-4 text-violet-400" />
        <h2 className="text-white font-semibold">არხები</h2>
      </div>
      <p className="text-gray-500 text-xs mb-5 leading-relaxed">
        დააკავშირე ბოტი Telegram, Instagram-სა და Facebook Messenger-თან —
        ერთი და იგივე AI პასუხობს ყველგან.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <TelegramRow botId={botId} view={byKind('telegram')} onChange={reload} />
          <MetaRow     botId={botId} view={byKind('facebook')} kind="facebook"  onChange={reload} />
          <MetaRow     botId={botId} view={byKind('instagram')} kind="instagram" onChange={reload} />
        </div>
      )}

      {error && (
        <p className="mt-3 text-red-400 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Telegram row ──────────────────────────────────────────────────────────

function TelegramRow({ botId, view, onChange }: {
  botId:    string;
  view:     ChannelView | undefined;
  onChange: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [token, setToken] = useState('');
  const [busy,  setBusy]  = useState(false);
  const [msg,   setMsg]   = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const connected = view?.status === 'active';
  const username  = view?.credentials.botUsername as string | undefined;
  const inviteUrl = username ? `https://t.me/${username}` : null;

  async function connect() {
    if (!token.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/channels/${botId}/telegram`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'connect failed');
      setMsg({ kind: 'ok', text: `✅ დაკავშირდა @${data.botUsername}` });
      setToken('');
      setExpanded(false);
      onChange();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'connect failed' });
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm('მართლა გინდა Telegram-ის გათიშვა?')) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/channels/${botId}/telegram`, { method: 'DELETE' });
      if (!res.ok) throw new Error('disconnect failed');
      onChange();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'disconnect failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ChannelCard
      icon={<Send className="w-4 h-4" />}
      label="Telegram"
      status={view?.status ?? null}
      meta={username ? `@${username}` : null}
      lastInboundAt={view?.lastInboundAt ?? null}
      totalInbound={view?.totalInbound ?? 0}
      lastError={view?.lastError ?? null}
    >
      {connected ? (
        <div className="flex flex-wrap gap-2 items-center">
          {inviteUrl && (
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/20 hover:bg-violet-500/5"
            >
              <ExternalLink className="w-3 h-3" /> ბოტი Telegram-ში
            </a>
          )}
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/5 disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" /> გათიშვა
          </button>
        </div>
      ) : (
        <>
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-xs font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <Plug className="w-3 h-3" /> დაკავშირება
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                1. <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline">@BotFather</a>-ში ჩაწერე <code>/newbot</code><br />
                2. დაარქვი სახელი → მიიღებ token-ს (<code>123456:ABC...</code>)<br />
                3. ჩასვი აქ ↓
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="123456789:ABCdef..."
                  className="flex-1 bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={connect}
                  disabled={busy || token.length < 30}
                  className="text-xs font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {busy && <Loader2 className="w-3 h-3 animate-spin" />} OK
                </button>
                <button
                  type="button"
                  onClick={() => { setExpanded(false); setToken(''); setMsg(null); }}
                  disabled={busy}
                  className="text-xs text-gray-400 hover:text-gray-300 px-2"
                >
                  cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {msg && (
        <p className={`mt-2 text-[11px] ${msg.kind === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {msg.text}
        </p>
      )}
    </ChannelCard>
  );
}

// ─── Meta (FB / IG) row ───────────────────────────────────────────────────

function MetaRow({ botId, view, kind, onChange }: {
  botId:    string;
  view:     ChannelView | undefined;
  kind:     'instagram' | 'facebook';
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const connected = view?.status === 'active';
  const pageName  = view?.credentials.pageName as string | undefined;

  const Icon = kind === 'instagram' ? InstagramIcon : FacebookIcon;
  const label = kind === 'instagram' ? 'Instagram' : 'Facebook Messenger';

  async function startOAuth() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/channels/${botId}/meta/auth-url?kind=${kind}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'META_NOT_CONFIGURED') {
          setMsg({ kind: 'err', text: 'Meta App ჯერ არ არის დაყენებული server-ზე' });
          return;
        }
        throw new Error(data.message ?? data.error ?? 'oauth url failed');
      }
      // Open in a new window — the callback handler will postMessage back
      // when it's done.
      const w = window.open(data.authUrl, 'peit-meta-oauth', 'width=600,height=700');
      if (!w) {
        setMsg({ kind: 'err', text: 'Popup-ი დაიბლოკა — გახსენი popup-ი ბრაუზერისთვის' });
        return;
      }
      // Listen for the callback page's postMessage. Poll closed state as
      // a fallback so we don't hang if the user closes the window.
      const handler = (ev: MessageEvent) => {
        if (ev.origin !== window.location.origin) return;
        const m = ev.data as { source?: string; ok?: boolean; error?: string };
        if (m?.source !== 'peit-meta-oauth') return;
        window.removeEventListener('message', handler);
        if (m.ok) {
          setMsg({ kind: 'ok', text: '✅ დაკავშირდა' });
          onChange();
        } else {
          setMsg({ kind: 'err', text: m.error ?? 'oauth failed' });
        }
      };
      window.addEventListener('message', handler);
      const poll = setInterval(() => {
        if (w.closed) { clearInterval(poll); window.removeEventListener('message', handler); }
      }, 500);
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'oauth failed' });
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm(`${label}-ის გათიშვა?`)) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/channels/${botId}/meta?kind=${kind}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('disconnect failed');
      onChange();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'disconnect failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ChannelCard
      icon={<Icon className="w-4 h-4" />}
      label={label}
      status={view?.status ?? null}
      meta={pageName ?? null}
      lastInboundAt={view?.lastInboundAt ?? null}
      totalInbound={view?.totalInbound ?? 0}
      lastError={view?.lastError ?? null}
    >
      {connected ? (
        <button
          type="button"
          onClick={disconnect}
          disabled={busy}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/5 disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" /> გათიშვა
        </button>
      ) : (
        <button
          type="button"
          onClick={startOAuth}
          disabled={busy}
          className="text-xs font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
          {kind === 'instagram' ? 'Meta-ში შესვლა' : 'Page-ის შერჩევა'}
        </button>
      )}
      {msg && (
        <p className={`mt-2 text-[11px] ${msg.kind === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {msg.text}
        </p>
      )}
    </ChannelCard>
  );
}

// ─── Shared card chrome ───────────────────────────────────────────────────

function ChannelCard({
  icon, label, status, meta, lastInboundAt, totalInbound, lastError, children,
}: {
  icon:           React.ReactNode;
  label:          string;
  status:         'active' | 'disconnected' | 'error' | null;
  meta:           string | null;
  lastInboundAt:  string | null;
  totalInbound:   number;
  lastError:      string | null;
  children:       React.ReactNode;
}) {
  const pill =
    status === 'active'       ? <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5"/> აქტიური</span>
  : status === 'error'        ? <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5"/> შეცდომა</span>
  : status === 'disconnected' ? <span className="text-[10px] text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full">გათიშულია</span>
  :                              null;

  return (
    <div className="border border-white/[0.06] rounded-xl p-4 bg-white/[0.02]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-violet-300">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">{label}</span>
              {pill}
            </div>
            {meta && <div className="text-[11px] text-gray-500 mt-0.5">{meta}</div>}
          </div>
        </div>
        {status === 'active' && totalInbound > 0 && (
          <div className="text-right">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider">სულ</div>
            <div className="text-xs text-gray-300">{totalInbound.toLocaleString()}</div>
          </div>
        )}
      </div>
      {lastError && status === 'error' && (
        <p className="text-[11px] text-red-400/80 mb-2 line-clamp-2">{lastError}</p>
      )}
      <div className="mt-3">{children}</div>
      {status === 'active' && lastInboundAt && (
        <p className="mt-2 text-[10px] text-gray-600">
          ბოლო შეტყობინება: {new Date(lastInboundAt).toLocaleString('ka-GE')}
        </p>
      )}
    </div>
  );
}
