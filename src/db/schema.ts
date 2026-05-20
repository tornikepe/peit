// Database schema (Drizzle ORM, Postgres)
// Run `npm run db:push` to sync changes to your DATABASE_URL.

import {
  pgTable, pgEnum, text, timestamp, integer, jsonb, boolean,
  uuid, varchar, index, uniqueIndex, vector,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Voyage AI embedding dimensions (voyage-3, voyage-3-lite — both 1024)
export const EMBEDDING_DIMS = 1024;

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
}

export const DEFAULT_EMAIL_PREFS: EmailPrefs = {
  leadAlerts:     true,
  productUpdates: true,
  trialReminders: true,
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, t => ({
  clerkIdx: uniqueIndex('users_clerk_id_idx').on(t.clerkId),
  emailIdx: index('users_email_idx').on(t.email),
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
  brandColor:   varchar('brand_color', { length: 16 }).notNull().default('#7c3aed'),
  leadCapture:  jsonb('lead_capture').$type<{ enabled: boolean; fields: string[] }>()
                  .notNull().default({ enabled: true, fields: ['name', 'email'] }),
  /** Empty array = allow any domain. Otherwise widget only loads on listed origins. */
  allowedOrigins: jsonb('allowed_origins').$type<string[]>().notNull().default([]),
  /** When the website was last crawled to refresh knowledge chunks. */
  lastCrawledAt: timestamp('last_crawled_at'),
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

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id:        uuid('id').primaryKey().defaultRandom(),
  botId:     uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  heading:   text('heading').notNull(),
  content:   text('content').notNull(),
  keywords:  jsonb('keywords').$type<string[]>().notNull().default([]),
  /** Voyage AI embedding vector — null until indexed. */
  embedding: vector('embedding', { dimensions: EMBEDDING_DIMS }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({
  botIdx: index('knowledge_chunks_bot_idx').on(t.botId),
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
  startedAt:   timestamp('started_at').defaultNow().notNull(),
  endedAt:     timestamp('ended_at'),
  metadata:    jsonb('metadata').$type<Record<string, unknown>>().default({}),
}, t => ({
  botIdx:     index('conversations_bot_idx').on(t.botId),
  startedIdx: index('conversations_started_idx').on(t.startedAt),
  countryIdx: index('conversations_country_idx').on(t.country),
}));

// ─── messages ──────────────────────────────────────────────────────────────

export const messages = pgTable('messages', {
  id:             uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull()
                    .references(() => conversations.id, { onDelete: 'cascade' }),
  fromUser:       boolean('from_user').notNull(),
  content:        text('content').notNull(),
  source:         messageSourceEnum('source'),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
}, t => ({
  convoIdx: index('messages_convo_idx').on(t.conversationId),
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
