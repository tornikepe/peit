# Peit — AI ასისტენტი ქართული ბიზნესისთვის

<div align="center">

![Peit](https://img.shields.io/badge/Peit-AI%20Assistant-7c3aed?style=for-the-badge&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6c47ff?style=for-the-badge&logoColor=white)

**24/7 AI ჩატბოტი · ქართული / English / Русский · 10 წუთი Setup**

[📋 Issues](https://github.com/tornikepe/peit/issues) · [🚀 Deploy Guide](#-deployment)

</div>

---

## 📋 სარჩევი

- [პროექტის შესახებ](#-პროექტის-შესახებ)
- [ფუნქციები](#-ფუნქციები)
- [ტექნოლოგიები](#-ტექნოლოგიები)
- [პროექტის სტრუქტურა](#-პროექტის-სტრუქტურა)
- [დაყენება](#-დაყენება)
- [გარემოს ცვლადები](#-გარემოს-ცვლადები)
- [Authentication](#-authentication)
- [Internationalization](#-internationalization-i18n)
- [კომპონენტები](#-კომპონენტები)
- [გვერდები](#-გვერდები)
- [Design System](#-design-system)
- [Deployment](#-deployment)

---

## 🚀 პროექტის შესახებ

**Peit** — Georgian-first SaaS პლატფორმა. AI ჩატბოტი, რომელიც ქართულ ბიზნესებს ეხმარება კლიენტებთან 24/7 კომუნიკაციაში — ვებსაიტზე, Telegram-ზე, Instagram-სა და Facebook Messenger-ზე.

ეს repository შეიცავს **marketing landing page**-ს Next.js 16 App Router-ზე — სრული Clerk authentication-ით, 3-ენიანი i18n სისტემით, 21-გვერდიანი SSG/SSR hybrid-ით და responsive dark glassmorphism design-ით.

### მიზნობრივი ბაზარი
| სეგმენტი | Use Case |
|---|---|
| E-commerce | ორდერის ტრეკინგი, მარაგის კითხვები, დაბრუნება |
| რესტორნები / სასტუმროები | ჯავშნის მართვა, მენიუ, ხელმისაწვდომობა |
| კლინიკები / სალონები | ვიზიტის ჩაწერა, სერვისების ინფო |
| B2B / SaaS | Lead qualification, onboarding support |
| იურიდიული კომპანიები | კონსულტაციის ჯავშანი, FAQ |

---

## ✨ ფუნქციები

### Landing Page სექციები
| სექცია | აღწერა |
|---|---|
| **Hero** | 2-სვეტიანი layout, ანიმირებული live chat demo, stats (80% / 3x / 24/7) |
| **TrustBar** | Avatar cluster, ★4.9 rating, `requestAnimationFrame` auto-scroll ticker |
| **Features** | 8-ბარათიანი grid — 24/7, Multi-channel, Georgian-first, Lead Capture, Analytics, CRM, Setup, Security |
| **Testimonials** | 6 ბარათი, 5-წამიანი auto-rotation, pause-on-hover, carousel controls |
| **How It Works** | 3 ნაბიჯი numbered cards-ით, desktop connecting line |
| **Industries** | 8 ინდუსტრია-სპეციფიური SEO-optimized გვერდი |
| **Pricing** | 4 tier (Starter / Pro / Business / Enterprise), comparison banner |
| **Urgency CTA** | Gradient border, animated glow, join count |
| **FAQ** | Animated accordion, 5 კითხვა |
| **Footer** | Mega footer, CTA banner, industry links, legal, support email |
| **ChatWidget** | Floating bottom-right popup widget |

### Authentication
- ✅ Email / Password Sign In & Sign Up
- ✅ Google OAuth one-click
- ✅ Forgot Password (Clerk built-in)
- ✅ Protected `/dashboard` via middleware
- ✅ `UserButton` avatar dropdown in Navbar
- ✅ Post-auth redirect logic

### Internationalization
- 🇬🇪 **ქართული** — default
- 🇬🇧 **English**
- 🇷🇺 **Русский**
- `localStorage` persistence (ინახება reload-ზე)
- Chat demo სხვადასხვა ენაზე სხვადასხვა საუბარი

### Developer Experience
- Zero TypeScript errors (`strict` mode)
- 21 route, 0 build warnings
- `generateStaticParams` for dynamic routes
- Type-safe translations (`typeof ka` enforced on EN/RU)

---

## 🛠 ტექნოლოგიები

| ტექნოლოგია | ვერსია | გამოყენება |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.2.4 | App Router, SSG, API routes, Middleware |
| [React](https://react.dev) | 19.2.4 | UI, hooks, Context |
| [TypeScript](https://typescriptlang.org) | 5.x | Full type safety |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Utility-first styling |
| [Clerk](https://clerk.com) | 7.3.x | Auth — Sign In/Up, Google OAuth, session |
| [Lucide React](https://lucide.dev) | 1.14.x | Icon library (40+ icons used) |
| [Geist](https://vercel.com/font) | — | Variable font by Vercel |
| [clsx](https://github.com/lukeed/clsx) | 2.x | Conditional className utility |

---

## 📁 პროექტის სტრუქტურა

```
peit/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout — Providers + Geist font
│   │   ├── page.tsx                      # Landing page (section assembly)
│   │   ├── globals.css                   # Design tokens, utility classes
│   │   ├── signin/page.tsx               # Clerk <SignIn> (hash routing)
│   │   ├── signup/page.tsx               # Clerk <SignUp> + Google OAuth
│   │   ├── dashboard/page.tsx            # Protected async server component
│   │   ├── pricing/page.tsx              # Standalone pricing page
│   │   ├── how-it-works/page.tsx         # Process explanation
│   │   ├── blog/page.tsx                 # Blog listing
│   │   ├── industries/[slug]/page.tsx    # 8× SSG industry pages
│   │   └── alternatives/[slug]/page.tsx  # 3× SSG competitor pages
│   │
│   ├── components/                       # UI components
│   │   ├── Providers.tsx                 # ClerkProvider + LanguageProvider
│   │   ├── Navbar.tsx                    # Header, lang switcher, auth state
│   │   ├── Hero.tsx                      # Hero + AnimatedChat
│   │   ├── TrustBar.tsx                  # Social proof + ticker
│   │   ├── Features.tsx                  # 8-card feature grid
│   │   ├── Testimonials.tsx              # Rotating carousel (6 cards)
│   │   ├── HowItWorks.tsx                # 3-step process
│   │   ├── Industries.tsx                # Industry icon grid
│   │   ├── Pricing.tsx                   # 4-tier pricing + enterprise
│   │   ├── Urgency.tsx                   # Bottom urgency CTA
│   │   ├── FAQ.tsx                       # Accordion FAQ
│   │   ├── Footer.tsx                    # Mega footer
│   │   ├── ChatWidget.tsx                # Floating chat popup
│   │   └── ScrollReveal.tsx              # IntersectionObserver animations
│   │
│   ├── context/
│   │   └── LanguageContext.tsx           # i18n state, useLanguage() hook
│   │
│   ├── lib/
│   │   └── i18n.ts                       # KA / EN / RU translation dictionaries
│   │
│   └── middleware.ts                     # Clerk route protection
│
├── .env.local                            # API keys (gitignored)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚙️ დაყენება

### Requirements
- **Node.js** 18+
- **npm** 9+ (ან yarn / pnpm)
- [Clerk](https://clerk.com) ანგარიში — უფასო

### 1. Clone & Install

```bash
git clone https://github.com/tornikepe/peit.git
cd peit
npm install
```

### 2. Clerk Setup

1. [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application**
2. Application name: `Peit`
3. Sign-in options: ✅ Email · ✅ Google
4. **API Keys** tab → დააკოპირე ორივე key

### 3. `.env.local` შექმნა

```bash
# root directory-ში შექმენი .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ჩასვი_აქ
CLERK_SECRET_KEY=sk_test_ჩასვი_აქ

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 4. გაშვება

```bash
npm run dev
# → http://localhost:3000
```

### 5. Production build

```bash
npm run build   # 0 errors expected
npm start
```

---

## 🔑 გარემოს ცვლადები

| ცვლადი | სავალდებულო | აღწერა |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key (server-only) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ✅ | `/signin` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | ✅ | `/signup` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | ✅ | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | ✅ | `/dashboard` |

> ⚠️ `.env.local` **არასოდეს** commit-დება — `.gitignore`-ში `env*` შეტანილია.

---

## 🔐 Authentication

### Flow

```
User visits /signup
    ↓
Clerk <SignUp> renders (routing="hash")
    ↓
Email/Password  OR  Google OAuth
    ↓
Email verification (if email/pass)
    ↓
Redirect → /dashboard
```

### Middleware (`src/middleware.ts`)

```typescript
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});
```

Unauthenticated `/dashboard` request → ავტომატურად redirect `/signin`-ზე.

### Dashboard (`src/app/dashboard/page.tsx`)

```typescript
// Server Component — Clerk server-side auth
const { userId } = await auth();
if (!userId) redirect('/signin');
const user = await currentUser();
```

### Navbar Auth State

```typescript
const { isSignedIn } = useAuth();
// isSignedIn → UserButton + Dashboard link
// !isSignedIn → Sign In + Try Free buttons
```

---

## 🌍 Internationalization (i18n)

### არქიტექტურა

URL-ის გარეშე, React Context-based — ენა `localStorage`-ში ინახება.

```
useLanguage() hook
    ↓
LanguageContext (lang, setLang, t)
    ↓
translations[lang]  ←  src/lib/i18n.ts
```

### Translation სტრუქტურა

```typescript
// src/lib/i18n.ts
const ka = {
  nav:          { howItWorks, pricing, signIn, tryFree... },
  hero:         { badge, h1a, h1b, sub, cta1, cta2, stats... },
  features:     { label, title, sub, items: [{ title, desc }] },
  testimonials: { label, title, sub, join },
  howItWorks:   { label, title, sub, steps: [{ title, desc, detail }] },
  pricing:      { plans: [...], enterprise: {...} },
  faq:          { items: [{ q, a }] },
  footer:       { tagline, ctaTitle, copyright... },
  ...
};

// TypeScript enforces EN and RU match KA exactly:
const en: typeof ka = { ... };
const ru: typeof ka = { ... };
```

### გამოყენება

```typescript
'use client';
import { useLanguage } from '@/context/LanguageContext';

export default function MyComponent() {
  const { t, lang, setLang } = useLanguage();

  return (
    <>
      <h1>{t.hero.h1a} <span>{t.hero.h1b}</span></h1>
      <button onClick={() => setLang('en')}>EN</button>
    </>
  );
}
```

### Chat Demo — ენის მიხედვით

| ენა | Chat-ის თემა |
|---|---|
| 🇬🇪 ქართული | "მინდა ვიცოდე მიტანის ფასები" → ₾3 / ₾8 |
| 🇬🇧 English | "What are your delivery prices?" → ₾3 / ₾8 |
| 🇷🇺 Русский | "Сколько стоит доставка?" → ₾3 / ₾8 |

---

## 🧩 კომპონენტები

### `<Navbar />`
`'use client'` — `useAuth()` + `useLanguage()`
- Fixed header, `backdrop-blur-xl`
- Language dropdown with click-away overlay (`fixed inset-0` transparent div)
- Mobile hamburger → language selector row + auth buttons
- Active language indicator dot

### `<Hero />`
`'use client'` — `useLanguage()`
- `AnimatedChat` — loops every 10s, `setTimeout` chain, typing indicator
- Stats grid: 80% / 3x / 24/7
- Two CTAs: primary (gradient) + secondary (outline)

### `<TrustBar />`
`'use client'` — `useEffect`, `requestAnimationFrame`
- `ref` on scroll div → smooth infinite ticker
- Cleanup: `cancelAnimationFrame` on unmount

### `<Testimonials />`
`'use client'` — `useState`, `useEffect`, `useCallback`
- `setInterval` auto-rotation, cleared on `paused`
- `indices = [active, active+1, active+2]` circular
- Exact Georgian quotes from replyory.com

### `<Pricing />`
`'use client'` — `useLanguage()`
- Plans from `t.pricing.plans` array
- Enterprise card — full-width, separate layout
- `ShieldCheck` cancel note on each plan

### `<ScrollReveal />`
`'use client'` — `useEffect`
- Mounts `IntersectionObserver` on all `.reveal` elements
- Adds `.revealed` class → CSS handles fade+slide animation
- Disconnects on unmount

---

## 📄 გვერდები

| Route | Rendering | აღწერა |
|---|---|---|
| `/` | Static | Main landing (all sections) |
| `/signin` | Static | Clerk SignIn |
| `/signup` | Static | Clerk SignUp + Google OAuth |
| `/dashboard` | Dynamic (SSR) | Protected user dashboard |
| `/pricing` | Static | Standalone pricing |
| `/how-it-works` | Static | 3-step process page |
| `/blog` | Static | Blog listing |
| `/industries/restaurants` | SSG | Restaurant industry page |
| `/industries/ecommerce` | SSG | E-commerce page |
| `/industries/hotels` | SSG | Hotels page |
| `/industries/real-estate` | SSG | Real estate page |
| `/industries/clinics` | SSG | Clinics page |
| `/industries/gyms` | SSG | Gyms page |
| `/industries/salons` | SSG | Salons page |
| `/industries/law-firms` | SSG | Law firms page |
| `/alternatives/tidio` | SSG | Tidio vs Peit comparison |
| `/alternatives/drift` | SSG | Drift vs Peit comparison |
| `/alternatives/intercom` | SSG | Intercom vs Peit comparison |

---

## 🎨 Design System

### ფერები

```css
Background:   #07070f    /* near-black */
Primary:      #7c3aed    /* violet-600 */
Accent:       #a855f7    /* purple-500 */
Surface:      rgba(255,255,255,0.04)   /* glass card */
Border:       rgba(255,255,255,0.06)
Text:         #ffffff / #9ca3af / #6b7280
```

### Utility Classes

```css
.glass          /* bg + border + backdrop-blur glassmorphism */
.gradient-text  /* violet→purple text gradient via bg-clip */
.btn-primary    /* gradient bg + shadow-violet-500/25 + hover */
.hero-glow      /* radial-gradient violet background glow */
.reveal         /* opacity-0 + translateY(20px) — initial */
.revealed       /* opacity-1 + translateY(0) — animated in */
```

### Animation tokens (`globals.css`)

```css
@keyframes fadeIn   { from: opacity 0 + translateY(8px) }
.animate-fade-in    { animation: fadeIn 0.3s ease-out }
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

Vercel dashboard-ში Environment Variables:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  = pk_live_...
CLERK_SECRET_KEY                   = sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL      = /signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL      = /signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /dashboard
```

### Clerk Production Setup

1. Clerk dashboard → **Production** instance შექმნა
2. Google OAuth → Authorized domains დამატება
3. `pk_live_...` / `sk_live_...` keys გამოყენება

### Pre-deploy Checklist

- [ ] `.env.local` — production Clerk keys
- [ ] `npm run build` — 0 errors
- [ ] Clerk → Allowed origins configured
- [ ] Google OAuth → Production callback URL
- [ ] Domain → Clerk dashboard-ში registered

---

## 🤝 Contributing

```bash
# 1. Fork
git fork https://github.com/tornikepe/peit

# 2. Branch
git checkout -b feat/my-feature

# 3. Commit
git commit -m "feat: add new feature"

# 4. Push
git push origin feat/my-feature

# 5. Pull Request → GitHub
```

### Commit Convention

```
feat:     ახალი ფუნქცია
fix:      bug fix
style:    UI/styling ცვლილება
refactor: კოდის refactoring
docs:     documentation
chore:    dependencies, config
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

დამზადებულია ❤️ საქართველოში

**[peit.ge](https://peit.ge)** · [info@peit.ge](mailto:info@peit.ge)

</div>
