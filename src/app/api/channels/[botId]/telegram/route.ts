// POST   /api/channels/[botId]/telegram   { token } → connect
// DELETE /api/channels/[botId]/telegram             → disconnect
//
// Connect flow:
//   1. Validate token by calling getMe() — also captures bot username.
//   2. Generate a random webhookSecret.
//   3. Persist the channel row (upsert — re-connecting overwrites stale creds).
//   4. Register the webhook URL with Telegram using the secret.
//   5. Return the bot username so the dashboard can link to t.me/<username>.
//
// On any failure after step 3 we attempt to delete the webhook so a half-
// configured bot never blocks future reconnects.

import { withAuth, jsonError } from '@/app/api/_helpers';
import { getBotForUser } from '@/db/queries/bots';
import {
  upsertChannel, disconnectChannel, getChannel, markChannelError,
} from '@/db/queries/channels';
import {
  getBotInfo, setWebhook, deleteWebhook, generateWebhookSecret,
  TelegramApiError,
} from '@/lib/telegram';
import type { TelegramChannelCreds } from '@/db/schema';

export const runtime = 'nodejs';

/** Same env precedence as Lemon's getAppUrl — request origin is the
 *  fallback so local-tunnel setups (ngrok / Cloudflare Tunnel) work. */
function publicAppUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (env) return env;
  try { return new URL(req.url).origin; }
  catch { return 'http://localhost:3000'; }
}

/** Bot tokens look like "1234567890:ABCDEFghijklmnoPQRSTuvwxyz1234567890". */
function looksLikeTelegramToken(s: string): boolean {
  return /^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(s);
}

export const POST = withAuth<{ botId: string }>(async ({ user, req, params }) => {
  if (!params.botId) return jsonError(400, 'MISSING_BOT_ID');

  const bot = await getBotForUser(user.id, params.botId);
  if (!bot) return jsonError(404, 'BOT_NOT_FOUND');

  let body: { token?: string };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const token = body.token?.trim();
  if (!token || !looksLikeTelegramToken(token)) {
    return jsonError(400, 'INVALID_TOKEN',
      'Telegram bot tokens look like "123456:ABCDEF..." — get one from @BotFather.');
  }

  // ── Step 1: validate token + capture identity ────────────────────────
  let botInfo;
  try {
    botInfo = await getBotInfo(token);
  } catch (e) {
    if (e instanceof TelegramApiError && e.status === 401) {
      return jsonError(400, 'INVALID_TOKEN',
        'Telegram rejected the token. Re-issue it via @BotFather → /revoke and try again.');
    }
    console.error('[channels/telegram] getMe failed:', e);
    return jsonError(502, 'TELEGRAM_ERROR',
      e instanceof Error ? e.message : 'Telegram unreachable');
  }

  // ── Step 2-3: store credentials before we register the webhook so a
  // partial setup is still reflected in the dashboard as "error" rather
  // than silently dropped. ─────────────────────────────────────────────
  const webhookSecret = generateWebhookSecret();
  const appUrl = publicAppUrl(req);
  const webhookUrl = `${appUrl}/api/channels/telegram/webhook/${webhookSecret}`;

  const creds: TelegramChannelCreds = {
    botToken:      token,
    botUsername:   botInfo.username,
    webhookSecret,
    webhookUrl,
  };
  await upsertChannel(bot.id, 'telegram', creds as unknown as Record<string, unknown>);

  // ── Step 4: ask Telegram to start delivering updates ─────────────────
  try {
    await setWebhook(token, webhookUrl, webhookSecret);
  } catch (e) {
    console.error('[channels/telegram] setWebhook failed:', e);
    await markChannelError(bot.id, 'telegram',
      e instanceof Error ? e.message : 'webhook_register_failed');
    return jsonError(502, 'WEBHOOK_REGISTER_FAILED',
      e instanceof Error ? e.message : 'Telegram refused the webhook');
  }

  return {
    ok:          true,
    botUsername: botInfo.username,
    inviteUrl:   botInfo.username ? `https://t.me/${botInfo.username}` : null,
  };
});

export const DELETE = withAuth<{ botId: string }>(async ({ user, params }) => {
  if (!params.botId) return jsonError(400, 'MISSING_BOT_ID');

  const bot = await getBotForUser(user.id, params.botId);
  if (!bot) return jsonError(404, 'BOT_NOT_FOUND');

  const existing = await getChannel(bot.id, 'telegram');
  if (!existing) return { ok: true, alreadyDisconnected: true };

  const creds = existing.credentials as TelegramChannelCreds;
  // Best-effort: tell TG to stop delivering. We still mark the row
  // disconnected even if the request fails (token may already be revoked).
  if (creds?.botToken) {
    await deleteWebhook(creds.botToken);
  }

  await disconnectChannel(bot.id, 'telegram');
  return { ok: true };
});
