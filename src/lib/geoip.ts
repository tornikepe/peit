// Edge geoip helper. Vercel injects two headers on every request whose
// origin it can geolocate:
//   x-vercel-ip-country  — ISO 3166-1 alpha-2 (e.g. "GE", "US")
//   x-vercel-ip-city     — URL-encoded city name (Vercel encodes the few
//                          cities with non-ASCII names so they survive HTTP)
//
// We only ever read — no external API call, no fee, no latency. On
// non-Vercel runtimes (local dev, tests) both headers are absent and
// we return null so the column stays NULL rather than getting "unknown".

interface Geo {
  country: string | null;
  city:    string | null;
}

export function extractGeo(req: Request): Geo {
  const country = req.headers.get('x-vercel-ip-country');
  const cityRaw = req.headers.get('x-vercel-ip-city');

  let city: string | null = null;
  if (cityRaw) {
    // Vercel URL-encodes city names with non-ASCII chars (e.g. T%27bilisi
    // for T'bilisi, or %C3%9Cmranci%C5%9F for Ümrancış). Decode best-effort.
    try { city = decodeURIComponent(cityRaw).slice(0, 80); }
    catch { city = cityRaw.slice(0, 80); }
  }

  return {
    country: country ? country.slice(0, 2).toUpperCase() : null,
    city,
  };
}
