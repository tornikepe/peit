import type { Metadata } from "next";
import { Geist, Noto_Sans_Georgian } from "next/font/google";
import Providers from "@/components/Providers";
import JsonLd, { organizationSchema } from "@/components/JsonLd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Georgian-script font, designed by Google for Georgian text rendering.
// Used as the primary font when lang=ka; falls back to Geist for Latin glyphs.
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
