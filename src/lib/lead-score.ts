// Rule-based lead scoring. Keep simple, deterministic and language-aware
// (Georgian + English + Russian) so we score Tbilisi visitors fairly.
//
// Tier definitions:
//   hot  — full contact (email AND phone) AND buying-signal in message,
//          OR email/phone + strong keyword like "ვყიდულობ" / "buy"
//   warm — email or phone provided (qualified but no urgency signal)
//   cold — name-only / message-only / anonymous

export type LeadScore = 'cold' | 'warm' | 'hot';

/**
 * Words that signal "this person is ready to buy" — Georgian, English, Russian.
 * Match is case-insensitive substring; intentionally broad rather than precise
 * (false positives are cheaper than missed hot leads for SMB sales).
 */
const HOT_KEYWORDS: ReadonlyArray<string> = [
  // Georgian
  'ვყიდულობ', 'ვიყიდი', 'მინდა ვიყიდო', 'ფასი', 'ღირებულება',
  'შეკვეთა', 'შეძენა', 'შეთავაზება', 'ჯავშანი', 'ვაჯავშნი',
  'სასწრაფო', 'გადახდა', 'ანგარიში', 'demo', 'დემო',
  // English
  'buy', 'purchase', 'price', 'pricing', 'order',
  'invoice', 'quote', 'subscribe', 'sign up', 'how much',
  'urgent', 'asap', 'today', 'book',
  // Russian
  'купить', 'покупаю', 'цена', 'стоимость',
  'заказ', 'заказать', 'оплата', 'счёт', 'счет',
  'срочно', 'сегодня', 'забронировать',
];

export interface LeadInputs {
  email?:   string | null;
  phone?:   string | null;
  message?: string | null;
}

export function scoreLead({ email, phone, message }: LeadInputs): LeadScore {
  const hasEmail = !!email?.trim();
  const hasPhone = !!phone?.trim();
  const lower    = (message ?? '').toLowerCase();
  const hot      = HOT_KEYWORDS.some(k => lower.includes(k));

  // Full contact + buying signal → top tier
  if (hasEmail && hasPhone && hot) return 'hot';
  // Buying signal with at least one contact channel is still hot — the
  // sender wants to be reached.
  if (hot && (hasEmail || hasPhone)) return 'hot';
  // Solid contact, no urgency → warm
  if (hasEmail && hasPhone) return 'warm';
  if (hasEmail || hasPhone) return 'warm';
  return 'cold';
}

/**
 * E.164-ish phone validation: optional leading +, 7-20 chars total, allows
 * digits, spaces, dashes, parens. Rejects pure-letter strings.
 */
export function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 7 || trimmed.length > 20) return false;
  return /^[+]?[\d\s\-()]+$/.test(trimmed);
}

/**
 * RFC-5322-lite email validation. Rejects consecutive dots, leading/trailing
 * dots in local-part, and bare-domain hostnames. Caps total length at 254
 * (SMTP-compliant). Intentionally stricter than the previous one-liner so
 * we don't accept `foo..bar@example.com` or `foo@bar`.
 */
export function isValidEmail(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  // local-part: no leading/trailing dot, no consecutive dots
  // domain: at least one dot, TLD ≥ 2 chars, no consecutive dots
  return /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/.test(trimmed);
}
