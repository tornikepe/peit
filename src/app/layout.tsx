import type { Metadata } from "next";
import { Geist, Noto_Sans_Georgian } from "next/font/google";
import Providers from "@/components/Providers";
import JsonLd, { organizationSchema } from "@/components/JsonLd";
import "./globals.css";

// `next/font/google` self-hosts the font files, applies them via a
// CSS variable, and emits `font-display: swap` so there's zero
// render-blocking on first paint and zero CLS once the web font lands.
//
// Geist — primary Latin face. `latin-ext` covers extended Latin glyphs
// for occasional Czech / Polish customer names. No cyrillic subset
// here — Russian content uses Noto_Sans_Georgian's fallback chain
// which already handles Cyrillic via system fonts (Geist itself has
// no Cyrillic glyphs, so adding the subset would only inflate
// bundle without rendering benefit).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Georgian-script primary face. The `georgian` Google subset is the
// only one that ships the glyphs we actually need; adding `latin`
// would inflate the woff2 payload without changing rendering since
// the Latin glyphs come from Geist via the fallback chain in
// globals.css.
const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = "https://peit.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Peit — AI ჩატბოტი ქართული ბიზნესისთვის · 7 დღე უფასოდ",
    template: "%s — Peit",
  },
  description:
    "Peit-ის AI ჩატბოტი პასუხობს კლიენტებს ქართულად 24/7, აგროვებს ლიდებს და ცვლის support-ის სპეციალისტს — ₾45-დან თვეში. 10 წუთის setup, კოდი არ სჭირდება. 7 დღე უფასოდ.",
  keywords: [
    "AI ჩატბოტი",
    "AI ასისტენტი",
    "ბიზნეს ავტომატიზაცია",
    "Georgia chatbot",
    "ქართული chatbot",
    "ლიდების შეგროვება",
    "Telegram bot",
    "Instagram chatbot",
    "Peit",
  ],
  authors: [{ name: "Peit" }],
  openGraph: {
    type: "website",
    locale: "ka_GE",
    url: SITE_URL,
    siteName: "Peit",
    title: "Peit — AI ჩატბოტი ქართული ბიზნესისთვის",
    description:
      "AI ჩატბოტი, რომელიც პასუხობს კლიენტებს ქართულად 24/7. 10 წუთის setup, 7 დღე უფასოდ.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peit — AI ჩატბოტი ქართული ბიზნესისთვის",
    description:
      "AI ჩატბოტი, რომელიც პასუხობს კლიენტებს ქართულად 24/7. 7 დღე უფასოდ.",
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ka-GE": SITE_URL,
      "en":    `${SITE_URL}?lang=en`,
      "ru":    `${SITE_URL}?lang=ru`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// Schema.org payloads now live in components/JsonLd.tsx — single source
// of truth across pages. Organization on every page (lives in this
// layout); SoftwareApplication on homepage + pricing; Article on each
// blog post; FAQPage on the homepage.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ld = organizationSchema();
  return (
    <html lang="ka" className={`${geistSans.variable} ${notoSansGeorgian.variable}`}>
      <head>
        {/* Preconnect to the third-party domains the very first request
            already hits. Saves ~100-300ms of TCP+TLS handshake time on
            the next call — measurable LCP win on mobile networks. */}
        <link rel="preconnect" href="https://accounts.clerk.com" crossOrigin="" />
        <link rel="preconnect" href="https://img.clerk.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://api.lemonsqueezy.com" />

        {/* x-default hreflang — points to the canonical (Georgian) site. */}
        <link rel="alternate" hrefLang="x-default" href={SITE_URL + '/'} />
        <link rel="alternate" hrefLang="ka"        href={SITE_URL + '/'} />
        <link rel="alternate" hrefLang="en"        href={SITE_URL + '/en'} />
        <link rel="alternate" hrefLang="ru"        href={SITE_URL + '/ru'} />
        {/* Organization JSON-LD — present on every page so AI / search
            engines have a stable entity to attach reviews + sameAs to. */}
        <JsonLd data={ld} />
      </head>
      <body className="flex flex-col min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
