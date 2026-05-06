import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    <html lang="ka" className={`${geistSans.variable}`}>
      <body className="flex flex-col min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
