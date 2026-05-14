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

export const metadata: Metadata = {
  title: "Peit — AI ასისტენტი თქვენი ბიზნესისთვის",
  description:
    "Peit-ს AI ჩატბოტი პასუხობს კითხვებს, კვალიფიცირებს ლიდებს და ზრდის გაყიდვებს — 24/7, ქართულად.",
  keywords: "AI ჩატბოტი, AI ასისტენტი, ბიზნეს ავტომატიზაცია, Georgia, Peit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" className={`${geistSans.variable} ${notoSansGeorgian.variable}`}>
      <body className="flex flex-col min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
