// Structured logger — emits one JSON line per event to stdout (captured by
// Vercel's log drains) and, if LOGTAIL_SOURCE_TOKEN is set AND @logtail/node
// is installed, mirrors non-debug events to Better Stack / Logtail.
//
// Design rules (from the DevOps spec):
//   - MUST NEVER throw. Every sink call is wrapped; logging failures are
//     swallowed so a logging hiccup can never break a request.
//   - Degrades gracefully: no token / no package → console-only, silently.
//   - debug() is suppressed in production.

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  userId?:   string;
  botId?:    string;
  route?:    string;
  duration?: number;
  [key: string]: unknown;
}

// ─── Optional Logtail sink ────────────────────────────────────────────────
// Lazily and defensively loaded: if the package isn't installed or init
// fails, we just stay console-only. Typed loosely on purpose — the dep is
// optional and not part of the type graph.
type LogtailLike = { info: Fn; warn: Fn; error: Fn } | null;
type Fn = (message: string, context?: Record<string, unknown>) => unknown;

let logtail: LogtailLike = null;
let logtailInit = false;

function getLogtail(): LogtailLike {
  if (logtailInit) return logtail;
  logtailInit = true;
  const token = process.env.LOGTAIL_SOURCE_TOKEN?.trim();
  if (!token) return null;
  try {
    // Indirect require so bundlers don't hard-fail when the optional dep is
    // absent. Only runs server-side where a token is configured.
    const req = eval('require') as (id: string) => unknown;
    const mod = req('@logtail/node') as { Logtail: new (t: string) => LogtailLike };
    logtail = new mod.Logtail(token);
  } catch {
    logtail = null; // package missing or failed to init — console-only.
  }
  return logtail;
}

function emit(level: LogLevel, message: string, ctx?: LogContext): void {
  const entry = { level, message, timestamp: new Date().toISOString(), ...ctx };

  // 1) stdout — always, structured.
  try {
    const line = JSON.stringify(entry);
    if (level === 'error')      console.error(line);
    else if (level === 'warn')  console.warn(line);
    else                        console.log(line);
  } catch {
    // Circular ctx or similar — fall back to a plain message, never throw.
    try { console.log(`[${level}] ${message}`); } catch { /* give up silently */ }
  }

  // 2) Logtail — non-debug only, fully guarded.
  if (level !== 'debug') {
    try {
      const lt = getLogtail();
      lt?.[level]?.(message, ctx ?? {});
    } catch { /* never let logging break the caller */ }
  }
}

export const logger = {
  info:  (message: string, ctx?: LogContext) => emit('info', message, ctx),
  warn:  (message: string, ctx?: LogContext) => emit('warn', message, ctx),
  error: (message: string, ctx?: LogContext) => emit('error', message, ctx),
  debug: (message: string, ctx?: LogContext) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', message, ctx);
  },
};
