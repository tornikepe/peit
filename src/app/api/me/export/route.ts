// GET /api/me/export — GDPR Art. 15 (right of access) + Art. 20 (portability).
// Streams a JSON dump of everything we hold about the current user:
//   profile, bots (+ FAQs, knowledge chunks), conversations, messages,
//   leads, subscription. Personal data only — no internal IDs the user
//   couldn't already get via the dashboard.
//
// Auth: signed-in user only. Rate limit: 3 per hour per user.

import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { getDb, schema } from '@/db';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const GET = withAuth(async ({ user }) => {
  // Tight rate limit — generating a full export is expensive and these
  // calls should be rare.
  const rl = await checkRateLimit(rateLimitKey(['export', user.id]), 3, 3600);
  if (!rl.allowed) {
    return jsonError(429, 'RATE_LIMITED',
      `Try again in ${Math.ceil(rl.resetInMs / 1000)}s.`);
  }

  const db = getDb()!;

  // 1. Bots owned by this user.
  const bots = await db.query.bots.findMany({
    where: eq(schema.bots.ownerId, user.id),
    with: { faqs: true, chunks: true },
  });
  const botIds = bots.map(b => b.id);

  // 2. Conversations + messages for those bots.
  const conversations = botIds.length
    ? await db.query.conversations.findMany({
        where: inArray(schema.conversations.botId, botIds),
        with: { messages: true },
      })
    : [];

  // 3. Leads.
  const leads = botIds.length
    ? await db.query.leads.findMany({
        where: inArray(schema.leads.botId, botIds),
      })
    : [];

  // 4. Subscription (singleton per user).
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  // ── Build a clean, human-readable payload ──────────────────────────────
  // We strip vector embeddings (binary, useless to a human) and drop
  // server-side metadata that has no meaning outside our schema.
  const payload = {
    exportedAt: new Date().toISOString(),
    exportVersion: 1,
    note: 'GDPR Art. 15 + Art. 20 export. Contains all data Peit stores for your account.',

    profile: {
      id:        user.id,
      email:     user.email,
      name:      user.name,
      imageUrl:  user.imageUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },

    bots: bots.map(b => ({
      id:           b.id,
      name:         b.name,
      industry:     b.industry,
      languages:    b.languages,
      primaryLang:  b.primaryLang,
      tone:         b.tone,
      greeting:     b.greeting,
      fallback:     b.fallback,
      websiteUrl:   b.websiteUrl,
      brandColor:   b.brandColor,
      leadCapture:  b.leadCapture,
      allowedOrigins: b.allowedOrigins,
      status:       b.status,
      statsCache:   b.statsCache,
      createdAt:    b.createdAt.toISOString(),
      updatedAt:    b.updatedAt.toISOString(),
      faqs: b.faqs.map(f => ({
        id:        f.id,
        question:  f.question,
        answer:    f.answer,
        position:  f.position,
        createdAt: f.createdAt.toISOString(),
      })),
      knowledgeChunks: b.chunks.map(c => ({
        id:        c.id,
        heading:   c.heading,
        content:   c.content,
        keywords:  c.keywords,
        // Note: embedding vectors omitted — they're derivative and not useful
        // outside our retrieval system.
        embedded:  c.embedding !== null,
        createdAt: c.createdAt.toISOString(),
      })),
    })),

    conversations: conversations.map(c => ({
      id:         c.id,
      botId:      c.botId,
      channel:    c.channel,
      language:   c.language,
      visitorId:  c.visitorId,
      startedAt:  c.startedAt.toISOString(),
      endedAt:    c.endedAt?.toISOString() ?? null,
      metadata:   c.metadata,
      messages:   c.messages
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(m => ({
          id:        m.id,
          fromUser:  m.fromUser,
          content:   m.content,
          source:    m.source,
          createdAt: m.createdAt.toISOString(),
        })),
    })),

    leads: leads.map(l => ({
      id:             l.id,
      botId:          l.botId,
      conversationId: l.conversationId,
      name:           l.name,
      email:          l.email,
      phone:          l.phone,
      message:        l.message,
      status:         l.status,
      score:          l.score,
      metadata:       l.metadata,
      createdAt:      l.createdAt.toISOString(),
    })),

    subscription: subscription ? {
      plan:                   subscription.plan,
      status:                 subscription.status,
      trialEndsAt:            subscription.trialEndsAt?.toISOString() ?? null,
      currentPeriodStart:     subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd:       subscription.currentPeriodEnd?.toISOString() ?? null,
      messagesThisPeriod:     subscription.messagesThisPeriod,
      tokensInputThisPeriod:  subscription.tokensInputThisPeriod,
      tokensOutputThisPeriod: subscription.tokensOutputThisPeriod,
      tokensCachedThisPeriod: subscription.tokensCachedThisPeriod,
      cancelAtPeriodEnd:      subscription.cancelAtPeriodEnd,
      createdAt:              subscription.createdAt.toISOString(),
      updatedAt:              subscription.updatedAt.toISOString(),
    } : null,

    summary: {
      bots:          bots.length,
      faqs:          bots.reduce((sum, b) => sum + b.faqs.length, 0),
      chunks:        bots.reduce((sum, b) => sum + b.chunks.length, 0),
      conversations: conversations.length,
      messages:      conversations.reduce((sum, c) => sum + c.messages.length, 0),
      leads:         leads.length,
    },
  };

  const filename = `peit-export-${user.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type':        'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
});
