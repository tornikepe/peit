// POST /api/bots/migrate
// Body: { bots: Bot[] }  — bulk-import the user's localStorage bots
// into the cloud DB. Skips bots whose id collides with an existing row.

import { withAuth, jsonError } from '@/app/api/_helpers';
import { createBotForUser } from '@/db/queries/bots';
import type { Bot } from '@/lib/bots';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = withAuth(async ({ user, req }) => {
  let body: { bots?: Bot[] };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'INVALID_JSON');
  }
  if (!Array.isArray(body.bots)) return jsonError(400, 'BOTS_NOT_ARRAY');

  const imported: string[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const b of body.bots) {
    try {
      const created = await createBotForUser(user.id, {
        name:         b.name || 'Imported Bot',
        industry:     b.industry || 'services',
        languages:    b.languages || ['ka'],
        primaryLang:  b.primaryLang || 'ka',
        tone:         b.tone || 'friendly',
        greeting:     b.greeting || {},
        fallback:     b.fallback || {},
        websiteUrl:   b.websiteUrl,
        brandColor:   b.brandColor || '#2563eb',
        leadCapture:  b.leadCapture || { enabled: true, fields: ['name', 'email'] },
        status:       b.status || 'active',
        faqs:         (b.faqs || []).map(f => ({ q: f.q, a: f.a })),
        knowledgeChunks: (b.knowledgeChunks || []).map(c => ({
          heading: c.heading, content: c.content, keywords: c.keywords,
        })),
      });
      imported.push(created.id);
    } catch (e) {
      failed.push({
        name: b.name || 'unknown',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { ok: true, imported, failed };
});
