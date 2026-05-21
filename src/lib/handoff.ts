// Shared "handed off to human" reply strings + tiny helper.
//
// When the owner clicks "Hand off to human" in the transcript panel, we
// set conversations.is_handed_off = true. Every inbound webhook checks
// the flag right after resolving the conversation row: if set, we skip
// the answer engine entirely and emit one of these polite hold messages
// so the customer knows they're being routed to a person. The bot's
// usage counter is not charged for the hold message.

import type { BotLang } from './bots';

export const HANDOFF_REPLY: Record<BotLang, string> = {
  ka: 'ჩვენი წარმომადგენელი მალე გიპასუხებთ. გთხოვთ მცირე ხანი დაელოდოთ. 🙏',
  en: 'A team member will reply to you shortly. Please hold on a moment.',
  ru: 'Наш представитель скоро вам ответит. Пожалуйста, подождите немного.',
};

export function handoffReply(lang: BotLang): string {
  return HANDOFF_REPLY[lang] ?? HANDOFF_REPLY.ka;
}
