// Telegram Bot API client — tiny REST wrapper. No SDK pulled in.
//
// Bot setup flow:
//   1. User talks to @BotFather, gets a bot token (e.g. 1234:ABC...).
//   2. They paste the token in Peit's dashboard.
//   3. We call setWebhook() to register Peit as the inbound endpoint,
//      passing a randomly-generated `secret_token` so the webhook handler
//      can verify the call came from Telegram (echoed in X-Telegram-Bot-Api-
//      Secret-Token header).
//   4. We call getMe() to validate the token and capture bot username.
//
// Webhook payload: standard "Update" object — we only care about `message`
// and `edited_message`, both of which have `chat.id`, `text`, and `from`.

const API_BASE = 'https://api.telegram.org';

export class TelegramApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`Telegram API ${status}: ${body}`);
    this.name = 'TelegramApiError';
  }
}

interface TgResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

async function tgFetch<T>(
  token: string,
  method: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  const url = `${API_BASE}/bot${token}/${method}`;
  const res = await fetch(url, {
    method:  payload ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json' },
    body:    payload ? JSON.stringify(payload) : undefined,
    // Telegram should respond within 5s; longer means transient infra issue.
    signal:  AbortSignal.timeout(10_000),
  });
  const text = await res.text();
  let body: TgResponse<T>;
  try { body = JSON.parse(text) as TgResponse<T>; }
  catch { throw new TelegramApiError(res.status, text.slice(0, 200)); }
  if (!body.ok || body.result === undefined) {
    throw new TelegramApiError(
      res.status,
      `${body.error_code ?? '?'}: ${body.description ?? text.slice(0, 200)}`,
    );
  }
  return body.result;
}

// ─── Telegram Update payload (subset we use) ──────────────────────────────

export interface TgUser {
  id:              number;
  is_bot:          boolean;
  first_name:      string;
  last_name?:      string;
  username?:       string;
  language_code?:  string;
}

export interface TgChat {
  id:        number;
  type:      'private' | 'group' | 'supergroup' | 'channel';
  title?:    string;
  username?: string;
}

export interface TgMessage {
  message_id: number;
  from?:      TgUser;
  chat:       TgChat;
  date:       number;
  text?:      string;
  reply_to_message?: { message_id: number };
}

export interface TgUpdate {
  update_id:      number;
  message?:       TgMessage;
  edited_message?: TgMessage;
}

// ─── API methods ──────────────────────────────────────────────────────────

interface BotInfo {
  id:         number;
  is_bot:     boolean;
  first_name: string;
  username?:  string;
}

/** GET getMe — validates token + returns bot identity. */
export async function getBotInfo(token: string): Promise<BotInfo> {
  return tgFetch<BotInfo>(token, 'getMe');
}

/**
 * Register `webhookUrl` as the inbound endpoint for this bot. `secretToken`
 * is echoed back by Telegram on every webhook call in the
 * X-Telegram-Bot-Api-Secret-Token header — verify it in the handler.
 *
 * `allowedUpdates` keeps the payload small by subscribing only to message
 * types we actually process.
 */
export async function setWebhook(
  token: string,
  webhookUrl: string,
  secretToken: string,
): Promise<void> {
  await tgFetch(token, 'setWebhook', {
    url:             webhookUrl,
    secret_token:    secretToken,
    allowed_updates: ['message', 'edited_message'],
    drop_pending_updates: true,
  });
}

/** Detach Peit from the bot — should run on disconnect. */
export async function deleteWebhook(token: string): Promise<void> {
  await tgFetch(token, 'deleteWebhook', { drop_pending_updates: true })
    .catch(e => {
      // Token may already be revoked; best-effort.
      console.warn('[telegram] deleteWebhook failed:', e);
    });
}

/**
 * Send a message back to a chat. Used by the webhook handler after the
 * answer engine produces a reply.
 *
 * Telegram's old "Markdown" parser is strict about balanced `_` and `*` —
 * any unmatched marker (very common in LLM output: URLs with underscores,
 * lone asterisks, Georgian text with technical terms) makes the API
 * reject the whole message with 400 "Can't parse entities". When that
 * happens we retry as plain text instead of dropping the reply on the
 * floor — customer always gets an answer, even if it loses bold/italics.
 */
export async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  opts?: { replyToMessageId?: number },
): Promise<TgMessage> {
  const truncated = text.slice(0, 4000); // TG hard cap is 4096
  const base = {
    chat_id:             chatId,
    text:                truncated,
    reply_to_message_id: opts?.replyToMessageId,
    link_preview_options: { is_disabled: true },
  };

  try {
    return await tgFetch<TgMessage>(token, 'sendMessage', {
      ...base,
      parse_mode: 'Markdown',
    });
  } catch (e) {
    // 400 from TG = parse error 99% of the time. Strip markup and retry
    // plain so the user always sees the answer text.
    if (e instanceof TelegramApiError && e.status === 400) {
      return tgFetch<TgMessage>(token, 'sendMessage', {
        ...base,
        text: stripMarkdown(truncated),
      });
    }
    throw e;
  }
}

/** Best-effort markdown → plain. Keeps content readable, drops marks only. */
function stripMarkdown(s: string): string {
  return s
    // Links: [text](url) → text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    // Bold / italic / code markers — leave underscores inside words alone.
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(^|[\s(])[*_]([^*_\n]+?)[*_]([\s.,!?;:)]|$)/g, '$1$2$3')
    .replace(/`([^`]+)`/g, '$1');
}

/**
 * Telegram chat actions show "Bot is typing..." for ~5s. Useful while we
 * wait for the LLM to generate a reply (otherwise long Claude calls feel
 * like the bot is dead).
 */
export async function sendTyping(token: string, chatId: number): Promise<void> {
  // Ignore errors — typing indicators are nice-to-have, not critical.
  await tgFetch(token, 'sendChatAction', {
    chat_id: chatId,
    action:  'typing',
  }).catch(() => undefined);
}

/** Cryptographically random 32-char secret for setWebhook. */
export function generateWebhookSecret(): string {
  // 32 chars of base36 = ~165 bits, plenty for an HMAC-grade shared secret.
  // We avoid base64 because Telegram restricts secret_token to ^[A-Za-z0-9_-]{1,256}$.
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 32);
}
