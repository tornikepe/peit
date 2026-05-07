# Peit

AI-powered chat agent for Georgian businesses. Answers questions, qualifies leads, and books appointments — 24/7, in Georgian, English, and Russian.

## Tech Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4
- **Auth** — Clerk (Email, Google OAuth)
- **i18n** — Custom React Context (KA / EN / RU)
- **Icons** — Lucide React
- **Font** — Geist

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account (free)

### Installation

```bash
git clone https://github.com/tornikepe/peit.git
cd peit
npm install
```

### Environment Variables

Copy `.env.local.example` → `.env.local` and fill in:

- **Clerk** — required for auth. Get keys from [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys.
- **`DATABASE_URL`** — optional. If set, bots persist server-side and sync across devices. If unset, they're saved to localStorage. Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for a free Postgres instance.
- **`ANTHROPIC_API_KEY`** — optional. Enables AI-generated FAQs in the website analyzer.

### Database setup (optional)

Once `DATABASE_URL` is set:

```bash
npm run db:push       # creates / updates tables in your Postgres
npm run db:studio     # browse data in Drizzle Studio
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Pages (App Router)
│   ├── dashboard/          # Protected user dashboard
│   ├── signin/             # Sign in page
│   ├── signup/             # Sign up page
│   ├── industries/[slug]/  # Industry landing pages (SSG)
│   └── alternatives/[slug]/# Competitor comparison pages (SSG)
├── components/             # UI components
├── context/
│   └── LanguageContext.tsx # i18n state
├── lib/
│   └── i18n.ts             # KA / EN / RU translations
└── middleware.ts           # Route protection
```

## Features

- **Authentication** — Sign in / Sign up with email or Google. Forgot password included. Protected routes via Clerk middleware.
- **Multilingual** — Language switcher (🇬🇪 🇬🇧 🇷🇺) with localStorage persistence. All UI text, FAQ, and feature descriptions fully translated.
- **Animated chat demo** — Live chat preview in the hero section. Loops automatically and changes conversation based on selected language.
- **Testimonials carousel** — Auto-rotating with pause on hover.
- **SEO pages** — 8 industry pages and 3 competitor comparison pages, all statically generated.

## Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftornikepe%2Fpeit&env=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,NEXT_PUBLIC_CLERK_SIGN_IN_URL,NEXT_PUBLIC_CLERK_SIGN_UP_URL,NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL&envDescription=Get%20your%20Clerk%20API%20keys%20from%20dashboard.clerk.com&envLink=https%3A%2F%2Fdashboard.clerk.com&project-name=peit&repository-name=peit)

Add your environment variables in the Vercel dashboard before deploying to production.

> For production, create a separate **Production** Clerk instance at [dashboard.clerk.com](https://dashboard.clerk.com) and use the `pk_live_` / `sk_live_` keys.

## License

MIT
