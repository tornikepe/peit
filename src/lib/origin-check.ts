// Per-bot domain allowlist.
//
// `allowed` array stores hostnames or full origins. Empty array = allow all.
// Wildcard "*.example.com" is supported and matches any subdomain.

/**
 * Normalize a user-provided origin/host string into a canonical form
 * (lowercase, no trailing slash, port stripped if default).
 */
export function normalizeOrigin(input: string): string {
  let s = input.trim().toLowerCase();
  if (!s) return '';
  if (!/^https?:\/\//.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    return u.origin;
  } catch {
    return '';
  }
}

/**
 * Pull just the hostname from a header value (e.g. "https://foo.com:443" → "foo.com").
 */
function hostnameOf(originHeader: string): string {
  try {
    const u = new URL(originHeader);
    return u.hostname.toLowerCase();
  } catch {
    return originHeader.toLowerCase();
  }
}

/**
 * Decide whether a request's Origin header is allowed by the bot's policy.
 * - allowedOrigins empty → always allow (default for new bots)
 * - exact match (origin or hostname)
 * - "*.example.com" wildcard match
 * - host-only entries match any scheme/port
 */
export function isOriginAllowed(
  allowedOrigins: string[] | null | undefined,
  originHeader: string | null,
): boolean {
  if (!allowedOrigins || allowedOrigins.length === 0) return true;
  if (!originHeader) return false;

  const reqOrigin   = normalizeOrigin(originHeader);
  const reqHost     = hostnameOf(originHeader);

  for (const entry of allowedOrigins) {
    const e = entry.trim().toLowerCase();
    if (!e) continue;

    // Wildcard subdomain
    if (e.startsWith('*.')) {
      const suffix = e.slice(1); // ".example.com"
      if (reqHost.endsWith(suffix) || reqHost === e.slice(2)) return true;
      continue;
    }

    // Full origin match
    const norm = normalizeOrigin(e);
    if (norm && norm === reqOrigin) return true;

    // Host-only match (no scheme provided)
    if (e === reqHost) return true;
  }

  return false;
}
