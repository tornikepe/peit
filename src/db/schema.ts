// Database schema (Drizzle ORM, Postgres)
// Run `npm run db:push` to sync changes to your DATABASE_URL.

import {
  pgTable, pgEnum, text, timestamp, integer, jsonb, boolean,
  uuid, varchar, index, uniqueIndex, vector,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Voyage AI embedding dimensions (voyage-3, voyage-3-lite — both 1024)
export const EMBEDDING_DIMS = 1024;

/** A file a visitor attached to a chat message (Feature #3). Defined here
 *  (not lib/bots) so the schema has no client-side import. */
export interface MessageAttachment {
  /** Vercel Blob URL (private — not directly viewable). */
  url:       string;
  /** Blob pathname, used to re-read the bytes server-side. */
  pathname:  string;
  filename:  string;
  mimeType:  string;
  kind:      'image' | 'document';
}

// ─── Enums ─────────────────────────────────────────────────────────────────

export const botStatusEnum = pgEnum('bot_status', ['draft', 'active', 'paused']);
export const subStatusEnum = pgEnum('subscription_status', [
  'trialing', 'active', 'past_due', 'canceled', 'incomplete',
]);
export const subPlanEnum   = pgEnum('subscription_plan', [
  'basic', 'pro', 'ultimate', 'enterprise',
]);
export const messageSourceEnum = pgEnum('message_source', [
  'faq', 'knowledge', 'fallback', 'ai', 'human',
]);
export const messageFeedbackEnum = pgEnum('message_feedback', [
  'positive', 'negative',
]);
export const messageSentimentEnum = pgEnum('message_sentiment', [
  'positive', 'neutral', 'negative', 'frustrated',
]);
export const channelEnum = pgEnum('channel', [
  'web', 'telegram', 'instagram', 'facebook', 'playground',
]);
export const leadStatusEnum = pgEnum('lead_status', [
  'new', 'contacted', 'qualified', 'won', 'lost',
]);
// Hot = high-intent (email+phone + buying-signal keywords),
// Warm = solid contact (email or phone present),
// Cold = name-only or anonymous.
export const leadScoreEnum = pgEnum('lead_score', ['cold', 'warm', 'hot']);

// ─── users ─────────────────────────────────────────────────────────────────
// Synced from Clerk via lazy provisioning (see src/db/queries/users.ts).

/**
 * Email opt-in flags. Transactional emails (billing receipt, account
 * deletion confirmation, lead-capture confirmation to visitors) are NOT
 * controlled by these flags — they're contractually required. Everything
 * else is opt-out per category.
 */
export interface EmailPrefs {
  /** "You have a new lead" notifications to the bot owner. */
  leadAlerts:     boolean;
  /** Marketing — product news, feature launches, tips. */
  productUpdates: boolean;
  /** Trial-ending (3 days before) and trial-ended reminders. */
  trialReminders: boolean;
  /** Triggered when a conversation flips to is_handed_off in transcript panel. */
  handoffAlerts?:  boolean;
  /** Monday-morning summary of last week's volume / leads / conversion. */
  weeklyReport?:   boolean;
}

export const DEFAULT_EMAIL_PREFS: EmailPrefs = {
  leadAlerts:     true,
  productUpdates: true,
  trialReminders: true,
  handoffAlerts:  true,
  weeklyReport:   false,
};

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  clerkId:   varchar('clerk_id', { length: 64 }).notNull(),
  email:     varchar('email', { length: 255 }).notNull(),
  name:      varchar('name', { length: 120 }),
  imageUrl:  text('image_url'),
  /** Preferred language for emails — defaults to Georgian (the primary market). */
  locale:    varchar('locale', { length: 4 }).notNull().default('ka'),
  /** Per-category opt-in toggles. See EmailPrefs above. */
  emailPrefs: jsonb('email_prefs').$type<EmailPrefs>().notNull().default(DEFAULT_EMAIL_PREFS),
  /** Unique referral code, e.g. "tornike-x7k2". Generated on first provisioning. */
  referralCode: varchar('referral_code', { length: 40 }),
  /** Who invited this user (FK → users.id), set once at provisioning from ?ref. */
  referredBy:   uuid('referred_by'),
  /** Free months credited to this user as a referrer (applied on next renewal). */
  freeMonthsEarned: integer('free_months_earned').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, t => ({
  clerkIdx: uniqueIndex('users_clerk_id_idx').on(t.clerkId),
  emailIdx: index('users_email_idx').on(t.email),
  referralCodeIdx: uniqueIndex('users_referral_code_idx').on(t.referralCode),
}));

// ─── referrals ───────────────────────────────────────────────────────────────
// One row per referred user. Created at provisioning when a ?ref code resolves;
// marked 'rewarded' on the referred user's first successful payment.

export const referralStatusEnum = pgEnum('referral_status', ['pending', 'rewarded', 'expired']);

export const referrals = pgTable('referrals', {
  id:          uuid('id').primaryKey().defaultRandom(),
  referrerId:  uuid('referrer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  referredId:  uuid('referred_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status:      referralStatusEnum('status').notNull().default('pending'),
  rewardedAt:  timestamp('rewarded_at'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, t => ({
  referredIdx: uniqueIndex('referrals_referred_idx').on(t.referredId),
  referrerIdx: index('referrals_referrer_idx').on(t.referrerId),
}));

// ─── bots ──────────────────────────────────────────────────────────────────

export const bots = pgTable('bots', {
  id:           uuid('id').primaryKey().defaultRandom(),
  ownerId:      uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:         varchar('name', { length: 120 }).notNull(),
  industry:     varchar('industry', { length: 40 }).notNull().default('services'),
  languages:    jsonb('languages').$type<string[]>().notNull().default(['ka']),
  primaryLang:  varchar('primary_lang', { length: 4 }).notNull().default('ka'),
  tone:         varchar('tone', { length: 20 }).notNull().default('friendly'),
  greeting:     jsonb('greeting').$type<Record<string, string>>().notNull().default({}),
  fallback:     jsonb('fallback').$type<Record<string, string>>().notNull().default({}),
  websiteUrl:   text('website_url'),
  brandColor:   varchar('brand_color', { length: 16 }).notNull().default('#2563eb'),
  leadCapture:  jsonb('lead_capture').$type<{ enabled: boolean; fields: string[] }>()
                  .notNull().default({ enabled: true, fields: ['name', 'email'] }),
  /** Pill-buttons rendered above the widget input. See QuickReply in lib/bots.ts. */
  quickReplies: jsonb('quick_replies').$type<Array<{
    label: string;
    action: 'message' | 'url' | 'flow';
    value: string;
  }>>().notNull().default([]),
  /** Owner-authored CSS injected into the widget's scoped container.
   *  Sanitized in sanitizeCustomCss() — see lib/custom-css.ts. */
  customCss:    text('custom_css').notNull().default(''),
  /** Empty array = allow any domain. Otherwise widget only loads on listed origins. */
  allowedOrigins: jsonb('allowed_origins').$type<string[]>().notNull().default([]),
  /** When the website was last crawled to refresh knowledge chunks. */
  lastCrawledAt: timestamp('last_crawled_at'),
  /** Cadence for the daily resync cron (Feature #8). Days between auto
   *  recrawls; 0 = disabled. The cron checks lastCrawledAt + days < now. */
  syncIntervalDays: integer('sync_interval_days').notNull().default(7),
  status:       botStatusEnum('status').notNull().default('draft'),
  statsCache:   jsonb('stats_cache').$type<{ messages: number; leads: number; conversations: number }>()
                  .notNull().default({ messages: 0, leads: 0, conversations: 0 }),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
}, t => ({
  ownerIdx: index('bots_owner_idx').on(t.ownerId),
}));

// ─── faqs ──────────────────────────────────────────────────────────────────

export const faqs = pgTable('faqs', {
  id:        uuid('id').primaryKey().defaultRandom(),
  botId:     uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  question:  text('question').notNull(),
  answer:    text('answer').notNull(),
  position:  integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({
  botIdx: index('faqs_bot_idx').on(t.botId),
}));

// ─── knowledge_chunks ──────────────────────────────────────────────────────
// Scraped content used for retrieval. `keywords` stays as text[] for simple
// substring matching; vector embeddings come in a follow-up phase (pgvector).

export const knowledgeSourceEnum = pgEnum('knowledge_source', ['crawl', 'upload']);

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id:        uuid('id').primaryKey().defaultRandom(),
  botId:     uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  heading:   text('heading').notNull(),
  content:   text('content').notNull(),
  keywords:  jsonb('keywords').$type<string[]>().notNull().default([]),
  /** Voyage AI embedding vector — null until indexed. */
  embedding: vector('embedding', { dimensions: EMBEDDING_DIMS }),
  /** Origin of this chunk — 'crawl' for website scraper, 'upload' for
   *  PDF/DOCX/TXT documents the owner pushed via the dashboard (Feature #9). */
  source:    knowledgeSourceEnum('source').notNull().default('crawl'),
  /** Original document filename for source='upload' rows; null for crawl. */
  filename:  text('filename'),
  /** Vercel Blob URL so the dashboard can re-process or expose the source. */
  blobUrl:   text('blob_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({
  botIdx:      index('knowledge_chunks_bot_idx').on(t.botId),
  filenameIdx: index('knowledge_chunks_filename_idx').on(t.botId, t.filename),
  // HNSW index for fast cosine-similarity retrieval. Created via SQL in migration.
}));

// ─── conversations ─────────────────────────────────────────────────────────

export const conversations = pgTable('conversations', {
  id:          uuid('id').primaryKey().defaultRandom(),
  botId:       uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  channel:     channelEnum('channel').notNull().default('web'),
  language:    varchar('language', { length: 4 }).notNull().default('ka'),
  visitorId:   varchar('visitor_id', { length: 64 }), // anonymous cookie/uuid
  /** ISO 3166-1 alpha-2 country code from edge geoip (Vercel x-vercel-ip-country). */
  country:     varchar('country', { length: 2 }),
  /** Free-form city string from edge geoip. Truncated to 80 chars at write time. */
  city:        varchar('city', { length: 80 }),
  /** Free-form labels the owner attaches in the dashboard ("vip", "refund", ...). */
  tags:        jsonb('tags').$type<string[]>().notNull().default([]),
  /** True when the owner has handed this conversation off to a human agent —
   *  the bot stops auto-replying until the row is reset. */
  isHandedOff: boolean('is_handed_off').notNull().default(false),
  handedOffAt: timestamp('handed_off_at'),
  startedAt:   timestamp('started_at').defaultNow().notNull(),
  endedAt:     timestamp('ended_at'),
  metadata:    jsonb('metadata').$type<Record<string, unknown>>().default({}),
}, t => ({
  botIdx:     index('conversations_bot_idx').on(t.botId),
  startedIdx: index('conversations_started_idx').on(t.startedAt),
  countryIdx: index('conversations_country_idx').on(t.country),
  handoffIdx: index('conversations_handoff_idx').on(t.isHandedOff),
}));

// ─── messages ──────────────────────────────────────────────────────────────

export const messages = pgTable('messages', {
  id:             uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull()
                    .references(() => conversations.id, { onDelete: 'cascade' }),
  fromUser:       boolean('from_user').notNull(),
  content:        text('content').notNull(),
  source:         messageSourceEnum('source'),
  /** Visitor's thumbs-up/down on the bot's reply. Only set on bot messages.
   *  Null = no rating; the most recent click wins. See /api/feedback. */
  feedback:       messageFeedbackEnum('feedback'),
  /** Classified sentiment of inbound visitor messages (Feature #5). Set
   *  before the answer engine runs; null on bot messages or when the
   *  classifier wasn't available. */
  sentiment:      messageSentimentEnum('sentiment'),
  /** Files the visitor attached to this message (Feature #3) — images and
   *  documents. Nullable + no client default ON PURPOSE: Drizzle then omits
   *  the column from inserts that don't set it, so ordinary chat keeps
   *  working even before the 0020 migration adds the column. The DB-side
   *  DEFAULT '[]' (from the migration) fills it for those rows. */
  attachments:    jsonb('attachments').$type<MessageAttachment[]>(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
}, t => ({
  convoIdx:     index('messages_convo_idx').on(t.conversationId),
  feedbackIdx:  index('messages_feedback_idx').on(t.feedback),
  sentimentIdx: index('messages_sentiment_idx').on(t.sentiment),
}));

// ─── flows ─────────────────────────────────────────────────────────────────
// Multi-step conversation script (Feature #1). When a bot has an active
// flow, the widget walks through `steps` instead of calling the AI engine
// on the first visit. Each step is one of:
//
//   { id, type: 'message',  text }
//   { id, type: 'input',    text, variable, nextStepId? }
//   { id, type: 'button',   text, options: [{ label, value, nextStepId }] }
//
// `nextStepId` is the id of the step to advance to; when absent the runner
// uses the next array index. Reaching the end hands control back to AI.

export interface FlowStep {
  id:          string;
  type:        'message' | 'input' | 'button';
  text:        string;
  /** For type='input' — the variable name to save the visitor's response under. */
  variable?:   string;
  /** For type='button' — the choices that branch the flow. */
  options?:    Array<{ label: string; value: string; nextStepId?: string }>;
  /** For type='message' and 'input' — explicit branch target. */
  nextStepId?: string;
}

export const flows = pgTable('flows', {
  id:         uuid('id').primaryKey().defaultRandom(),
  botId:      uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  name:       varchar('name', { length: 120 }).notNull(),
  steps:      jsonb('steps').$type<FlowStep[]>().notNull().default([]),
  isActive:   boolean('is_active').notNull().default(false),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
}, t => ({
  botIdx: index('flows_bot_idx').on(t.botId, t.isActive),
}));

// ─── greeting_variants ─────────────────────────────────────────────────────
// Per-bot A/B test pool. The widget picks one variant per session via
// weighted-random selection, records an impression, and (if the visitor
// sends at least one message) records a conversion. See /api/ab/*.

export const greetingVariants = pgTable('greeting_variants', {
  id:           uuid('id').primaryKey().defaultRandom(),
  botId:        uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  message:      text('message').notNull(),
  weight:       integer('weight').notNull().default(50),
  impressions:  integer('impressions').notNull().default(0),
  conversions:  integer('conversions').notNull().default(0),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
}, t => ({
  botIdx: index('greeting_variants_bot_idx').on(t.botId, t.isActive),
}));

// ─── leads ─────────────────────────────────────────────────────────────────

export const leads = pgTable('leads', {
  id:             uuid('id').primaryKey().defaultRandom(),
  botId:          uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
  name:           varchar('name', { length: 120 }),
  email:          varchar('email', { length: 255 }),
  phone:          varchar('phone', { length: 32 }),
  message:        text('message'),
  status:         leadStatusEnum('status').notNull().default('new'),
  /** Auto-computed at insert time — see scoreLead() in src/lib/lead-score.ts */
  score:          leadScoreEnum('score').notNull().default('cold'),
  /** Free-form bag for { gdprConsent, gdprAt, source, utm, ... }. */
  metadata:       jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
}, t => ({
  botIdx:   index('leads_bot_idx').on(t.botId),
  scoreIdx: index('leads_score_idx').on(t.score),
}));

// ─── subscriptions ─────────────────────────────────────────────────────────
// Lemon Squeezy populates customer/sub IDs after first checkout.

export const subscriptions = pgTable('subscriptions', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  userId:               uuid('user_id').notNull()
                          .references(() => users.id, { onDelete: 'cascade' }),
  plan:                 subPlanEnum('plan').notNull().default('basic'),
  status:               subStatusEnum('status').notNull().default('trialing'),
  trialEndsAt:          timestamp('trial_ends_at'),
  currentPeriodStart:   timestamp('current_period_start').defaultNow().notNull(),
  currentPeriodEnd:     timestamp('current_period_end'),
  /** Messages used this billing period — reset on rollover. */
  messagesThisPeriod:   integer('messages_this_period').notNull().default(0),
  /** Claude input tokens billed this period (excludes cached reads). */
  tokensInputThisPeriod:  integer('tokens_input_this_period').notNull().default(0),
  /** Claude output tokens generated this period. */
  tokensOutputThisPeriod: integer('tokens_output_this_period').notNull().default(0),
  /** Cached input tokens served at ~10% cost — tracked for analytics, not billed. */
  tokensCachedThisPeriod: integer('tokens_cached_this_period').notNull().default(0),
  /** Lemon Squeezy customer ID (numeric, stored as string). */
  lsCustomerId:         varchar('ls_customer_id', { length: 32 }),
  /** Lemon Squeezy subscription ID. */
  lsSubscriptionId:     varchar('ls_subscription_id', { length: 32 }),
  /** Lemon Squeezy variant ID currently active (so we can detect plan changes). */
  lsVariantId:          varchar('ls_variant_id', { length: 32 }),
  cancelAtPeriodEnd:    boolean('cancel_at_period_end').notNull().default(false),
  /** Set when the welcome email is sent on first provisioning. Prevents
   *  duplicate sends if the user row is touched again before the worker has
   *  flushed the email queue. */
  welcomeEmailSentAt:   timestamp('welcome_email_sent_at'),
  /** Set when the "your trial ends in 3 days" email is sent. NULL = not yet. */
  trialReminderSentAt:  timestamp('trial_reminder_sent_at'),
  /** Set when the "your trial ended" email is sent. NULL = not yet. */
  trialEndedNotifiedAt: timestamp('trial_ended_notified_at'),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
  updatedAt:            timestamp('updated_at').defaultNow().notNull(),
}, t => ({
  userIdx:     uniqueIndex('subscriptions_user_idx').on(t.userId),
  lsCustIdx:   index('subscriptions_ls_customer_idx').on(t.lsCustomerId),
  lsSubIdx:    index('subscriptions_ls_subscription_idx').on(t.lsSubscriptionId),
}));

// ─── rate_limits ───────────────────────────────────────────────────────────
// Sliding-window counter, atomic via UPSERT.
// Key shape: "ip:1.2.3.4:1m", "bot:<uuid>:1h", "visitor:<uuid>:1h", etc.

export const rateLimits = pgTable('rate_limits', {
  key:           varchar('key', { length: 200 }).primaryKey(),
  count:         integer('count').notNull().default(0),
  windowStart:   timestamp('window_start').notNull().defaultNow(),
  windowSeconds: integer('window_seconds').notNull(),
});

// ─── team_members ──────────────────────────────────────────────────────────
// Per-user (owner-scoped) workspace invites. The `userId` column references
// the OWNING account; once an invite is accepted, the invitee creates their
// own Clerk session and the join happens via email lookup (see
// resolveTeamMembership() in queries/team.ts). We don't grant cross-tenant
// permissions yet — this is the storage + invite-email plumbing only.

export const teamRoleEnum    = pgEnum('team_role',   ['owner', 'admin', 'member']);
export const teamStatusEnum  = pgEnum('team_status', ['pending', 'active', 'revoked']);

export const teamMembers = pgTable('team_members', {
  id:        uuid('id').primaryKey().defaultRandom(),
  /** Owner of the workspace this invite belongs to. */
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email:     varchar('email', { length: 255 }).notNull(),
  role:      teamRoleEnum('role').notNull().default('member'),
  status:    teamStatusEnum('status').notNull().default('pending'),
  /** Random token sent in the invite email; consumed once on accept. */
  inviteToken: varchar('invite_token', { length: 64 }),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
}, t => ({
  ownerIdx:    index('team_members_user_idx').on(t.userId),
  uniqEmail:   uniqueIndex('team_members_owner_email_idx').on(t.userId, t.email),
}));

// ─── api_keys ──────────────────────────────────────────────────────────────
// Customer-facing programmatic access — same convention Stripe / OpenAI
// use: raw key shown once at creation, only a hash stored at rest, lookup
// uses a 12-char prefix (logged on use) for indexing without revealing the
// secret. SHA-256 of the raw key is the canonical hash here; the secret
// itself is 48 hex chars (192 bits of entropy), so a salted bcrypt buys
// nothing meaningful at that entropy level.

export const apiKeys = pgTable('api_keys', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:      varchar('name', { length: 80 }).notNull(),
  /** SHA-256 hex digest of the raw key. */
  keyHash:   varchar('key_hash', { length: 64 }).notNull(),
  /** First 12 chars of the raw key — safe to display + index by. */
  prefix:    varchar('prefix', { length: 16 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
  revokedAt: timestamp('revoked_at'),
}, t => ({
  ownerIdx:  index('api_keys_user_idx').on(t.userId),
  hashIdx:   uniqueIndex('api_keys_hash_idx').on(t.keyHash),
  prefixIdx: index('api_keys_prefix_idx').on(t.prefix),
}));

// ─── bot_channels ─────────────────────────────────────────────────────────
// One row per (bot, channel) — stores the per-channel credentials and
// runtime stats. The web channel never lives here (it's implicit). Telegram
// fills in { botToken, botUsername, webhookSecret }. Meta channels (IG / FB)
// fill in { pageId, pageAccessToken, igBusinessId? } once the OAuth dance
// completes.
//
// Credentials are stored as JSONB so each channel can evolve independently.
// If you ever rotate to a secrets manager, the `credentials` column is the
// single field to migrate.

export const botChannelStatusEnum = pgEnum('bot_channel_status', [
  'active', 'disconnected', 'error',
]);

/** Telegram channel credentials. */
export interface TelegramChannelCreds {
  botToken:       string;
  botUsername?:   string;
  /** Random secret we generate; Telegram echoes it in webhook header so
   *  we can verify the call really came from Telegram. */
  webhookSecret:  string;
  /** Vercel-side webhook URL we registered with TG so we can refresh it
   *  after a deploy that changes the host. */
  webhookUrl?:    string;
}

/** Meta (Instagram/Facebook) channel credentials. */
export interface MetaChannelCreds {
  pageId:           string;
  pageAccessToken:  string;
  pageName?:        string;
  igBusinessId?:    string;     // present only for Instagram
  /** When the page token last refreshed. Meta long-lived tokens last 60d. */
  tokenRefreshedAt?: string;
}

export const botChannels = pgTable('bot_channels', {
  id:        uuid('id').primaryKey().defaultRandom(),
  botId:     uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  channel:   channelEnum('channel').notNull(),
  status:    botChannelStatusEnum('status').notNull().default('active'),
  credentials: jsonb('credentials')
                 .$type<TelegramChannelCreds | MetaChannelCreds | Record<string, unknown>>()
                 .notNull().default({}),
  /** Last successful inbound message timestamp — useful for "Last active" UI. */
  lastInboundAt: timestamp('last_inbound_at'),
  /** Total inbound messages ever (across periods) — cheap analytics. */
  totalInbound:  integer('total_inbound').notNull().default(0),
  /** Last error string when status='error', null otherwise. */
  lastError:     text('last_error'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
}, t => ({
  botIdx:      index('bot_channels_bot_idx').on(t.botId),
  botChannel:  uniqueIndex('bot_channels_bot_channel_idx').on(t.botId, t.channel),
}));

// ─── Relations ─────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  bots:         many(bots),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  team:    many(teamMembers),
  apiKeys: many(apiKeys),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  owner: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  owner: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

export const botsRelations = relations(bots, ({ one, many }) => ({
  owner:    one(users, { fields: [bots.ownerId], references: [users.id] }),
  faqs:     many(faqs),
  chunks:   many(knowledgeChunks),
  convos:   many(conversations),
  leads:    many(leads),
  channels: many(botChannels),
}));

export const botChannelsRelations = relations(botChannels, ({ one }) => ({
  bot: one(bots, { fields: [botChannels.botId], references: [bots.id] }),
}));

export const faqsRelations = relations(faqs, ({ one }) => ({
  bot: one(bots, { fields: [faqs.botId], references: [bots.id] }),
}));

export const chunksRelations = relations(knowledgeChunks, ({ one }) => ({
  bot: one(bots, { fields: [knowledgeChunks.botId], references: [bots.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  bot:      one(bots, { fields: [conversations.botId], references: [bots.id] }),
  messages: many(messages),
  leads:    many(leads),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  bot:          one(bots, { fields: [leads.botId], references: [bots.id] }),
  conversation: one(conversations, {
    fields: [leads.conversationId],
    references: [conversations.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

// ─── Inferred TS types ─────────────────────────────────────────────────────

export type DbUser    = typeof users.$inferSelect;
export type DbBot     = typeof bots.$inferSelect;
export type DbFaq     = typeof faqs.$inferSelect;
export type DbChunk   = typeof knowledgeChunks.$inferSelect;
export type DbLead    = typeof leads.$inferSelect;
export type DbSub     = typeof subscriptions.$inferSelect;
export type DbChannel = typeof botChannels.$inferSelect;
export type DbTeam    = typeof teamMembers.$inferSelect;
export type DbApiKey  = typeof apiKeys.$inferSelect;
