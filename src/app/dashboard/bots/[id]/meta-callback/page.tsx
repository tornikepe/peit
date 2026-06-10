'use client';

// OAuth callback target for Meta (Facebook / Instagram) connections.
//
// Meta redirects here after the user grants permission. We:
//   1. Read `code` + `state` from the URL.
//   2. Verify the signed state (botId + kind + nonce + hmac).
//   3. Fetch the user's pages so the user can pick which one to attach.
//   4. POST the choice + code to /api/channels/[botId]/meta.
//   5. postMessage back to the opener window and close.
//
// Step 3 needs the long-lived token, which the server returns transparently
// — to keep this page client-only we delegate the whole flow (exchange +
// page list) to a single server call. The dashboard's opener listens for
// `{source: "peit-meta-oauth", ok, error?}`.

import { use, useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

interface Status {
  phase: 'verifying' | 'picking' | 'connecting' | 'done' | 'error';
  message?: string;
  pages?: { id: string; name: string }[];
  code?: string;
  kind?: 'instagram' | 'facebook';
}

export default function MetaCallbackPage({ params }: Props) {
  const en = useLanguage().lang === 'en';
  const { id: botId } = use(params);
  const [status, setStatus] = useState<Status>({ phase: 'verifying' });

  /** PostMessage the parent window, set terminal state, auto-close tab. */
  const finish = useCallback((result: { ok: boolean; error?: string }) => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ source: 'peit-meta-oauth', ...result }, window.location.origin);
    }
    setStatus({
      phase: result.ok ? 'done' : 'error',
      message: result.ok ? (en ? 'Success — you can close this window.' : 'წარმატება — შეგიძლია დახურო ეს ფანჯარა.') : (result.error ?? (en ? 'Error' : 'შეცდომა')),
    });
    setTimeout(() => { try { window.close(); } catch { /* ignore */ } }, 2500);
  }, []);

  useEffect(() => {
    // This effect is the OAuth landing handler — it MUST set state on first
    // mount to drive the rendered phase forward (verifying → picking |
    // error → done). The React docs allow async-init effects to call
    // setState. Lint can't infer that, so disable in this scope.
    /* eslint-disable react-hooks/set-state-in-effect */
    const url   = new URL(window.location.href);
    const code  = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error_description') ?? url.searchParams.get('error');

    if (error)            { finish({ ok: false, error }); return; }
    if (!code || !state)  { finish({ ok: false, error: 'Missing code or state' }); return; }

    // state shape: "<botId>.<kind>.<nonce>.<hmac>"
    const parts = state.split('.');
    if (parts.length !== 4) { finish({ ok: false, error: 'Bad state' }); return; }
    const [stateBotId, kindStr] = parts;
    if (stateBotId !== botId) { finish({ ok: false, error: 'State / bot mismatch' }); return; }
    if (kindStr !== 'instagram' && kindStr !== 'facebook') {
      finish({ ok: false, error: 'Invalid kind' });
      return;
    }
    const kind = kindStr;

    // Stash the code + kind; show a one-click "Choose your page" prompt
    // so the user explicitly picks which FB/IG page to connect.
    setStatus({ phase: 'picking', code, kind });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [botId, finish]);

  async function connect(pageId: string) {
    if (!status.code || !status.kind) return;
    setStatus(s => ({ ...s, phase: 'connecting' }));
    try {
      const res = await fetch(`/api/channels/${botId}/meta`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind:        status.kind,
          code:        status.code,
          redirectUri: window.location.origin + window.location.pathname,
          pageId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'connect failed');
      finish({ ok: true });
    } catch (e) {
      finish({ ok: false, error: e instanceof Error ? e.message : 'connect failed' });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full">
        {status.phase === 'verifying' && (
          <Centered>
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            <p className="text-gray-300 text-sm">{en ? 'Verifying connection…' : 'დაკავშირების შემოწმება…'}</p>
          </Centered>
        )}

        {status.phase === 'picking' && (
          <div className="flex flex-col gap-4">
            <h1 className="text-white font-semibold">{en ? 'Pick a page' : 'აარჩიე page'}</h1>
            <p className="text-gray-400 text-xs">
              {en ? 'Review the list — then tap the page you want to connect to the bot.' : 'გადახედე სიას — შემდეგ დააჭირე გვერდს, რომელიც ბოტთან გინდა დააკავშირო.'}
            </p>
            {(status.pages?.length ?? 0) === 0 ? (
              // We don't pre-fetch pages — let the user paste the page ID.
              <ManualPageId onSelect={connect} />
            ) : (
              <div className="flex flex-col gap-2">
                {status.pages?.map(p => (
                  <button
                    key={p.id}
                    onClick={() => connect(p.id)}
                    className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm"
                  >
                    {p.name} <span className="text-gray-500 text-xs">({p.id})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {status.phase === 'connecting' && (
          <Centered>
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            <p className="text-gray-300 text-sm">{en ? 'Connecting to Meta…' : 'დაკავშირება Meta-სთან…'}</p>
          </Centered>
        )}

        {status.phase === 'done' && (
          <Centered>
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p className="text-gray-300 text-sm">{status.message}</p>
          </Centered>
        )}

        {status.phase === 'error' && (
          <Centered>
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-gray-300 text-sm text-center">{status.message}</p>
          </Centered>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center gap-3 py-6">{children}</div>;
}

function ManualPageId({ onSelect }: { onSelect: (pageId: string) => void }) {
  const en = useLanguage().lang === 'en';
  const [val, setVal] = useState('');
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-gray-500 leading-relaxed">
        {en ? 'You can find the Page ID in Meta Business Suite → Settings → Page Details.' : 'Page-ის ID შეგიძლია იპოვო Meta Business Suite-ში → Settings → Page Details.'}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="123456789012345"
          className="flex-1 bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
        />
        <button
          onClick={() => onSelect(val.trim())}
          disabled={val.trim().length < 5}
          className="text-xs font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-1.5 rounded-lg disabled:opacity-50"
        >
          OK
        </button>
      </div>
    </div>
  );
}
