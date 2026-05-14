import type { Metadata } from "next";
import { Geist, Noto_Sans_Georgian } from "next/font/google";
import Providers from "@/components/Providers";
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

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Peit",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description:
    "AI chatbot SaaS for Georgian small and medium businesses. Natural Georgian language support, multi-channel deployment, lead capture.",
  email: "info@peit.ge",
  areaServed: { "@type": "Country", name: "Georgia" },
  sameAs: [SITE_URL],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Peit",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    { "@type": "Offer", name: "Basic",    price: "45",  priceCurrency: "GEL" },
    { "@type": "Offer", name: "Pro",      price: "65",  priceCurrency: "GEL" },
    { "@type": "Offer", name: "Ultimate", price: "155", priceCurrency: "GEL" },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "320",
    bestRating: "5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" className={`${geistSans.variable} ${notoSansGeorgian.variable}`}>
      <head>
        {/* Structured data so AI / search engines understand Peit's entity */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
