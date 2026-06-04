# Peit — Design System ("Midnight Signal")

The visual language for Peit: a dark-only, cool‑toned product surface with a
single clean **blue** accent. This document is the source of truth for tokens,
components, and patterns. If something here disagrees with the code, the code in
`src/styles/midnight.css` (landing) and `src/app/globals.css` (app/dashboard)
wins — update this doc to match.

---

## 1. Foundations

### 1.1 Two rendering surfaces

Peit has **two** styling systems that share one brand:

| Surface | Where | Styling method | Scope |
|---------|-------|----------------|-------|
| **Landing** | `src/components/landing/MidnightLanding.tsx` | Hand-written CSS tokens in `src/styles/midnight.css` | Everything inside `.ms-root` |
| **App / Dashboard** | `src/app/dashboard/**`, `src/components/dashboard*/**` | Tailwind utilities | Global |

They look identical because both resolve to the same blue palette (see §2.3).

### 1.2 Brand wordmark

The logo is the text wordmark **`peit`** (component `src/components/Logo.tsx`).
Never replace it with an image mark. The "it" is emphasised in accent blue.

---

## 2. Color

### 2.1 Landing tokens (`midnight.css`, OKLCH)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `oklch(0.155 0.013 264)` | Page background |
| `--bg-deep` | `oklch(0.125 0.012 264)` | Deepest wells |
| `--panel` | `oklch(0.195 0.014 264)` | Card surface |
| `--panel-2` | `oklch(0.225 0.015 264)` | Raised card / hover |
| `--panel-hi` | `oklch(0.26 0.016 264)` | Highest elevation |
| `--line` | `oklch(1 0 0 / 0.09)` | Hairline border |
| `--line-strong` | `oklch(1 0 0 / 0.16)` | Emphasised border |
| `--text` | `oklch(0.975 0.004 264)` | Primary text |
| `--text-muted` | `oklch(0.74 0.012 264)` | Secondary text |
| `--text-faint` | `oklch(0.56 0.013 264)` | Tertiary / hints |
| `--accent` | `oklch(0.62 0.18 258)` | **Brand blue** |
| `--accent-bright` | `oklch(0.71 0.15 252)` | Links, highlights |
| `--accent-deep` | `oklch(0.50 0.19 262)` | Gradient bottom, pressed |
| `--accent-soft` | `accent / 0.14` | Tinted backgrounds |
| `--accent-line` | `accent / 0.34` | Accent borders |
| `--live` | `oklch(0.82 0.16 162)` | "Online/active" green |

Radii: `--radius 18px`, `--radius-sm 12px`, `--radius-lg 26px`.
Container: `--maxw 1200px`.

### 2.2 Dashboard surfaces (Tailwind hex)

The dashboard uses a small, fixed set of near‑black surfaces. **Do not invent
new shades** — pick from this scale:

| Hex | Role |
|-----|------|
| `#07070f` | App background / topbar base |
| `#0a0a14` | Sidebar, deepest panels |
| `#0c0c16` | Popovers / Clerk surfaces |
| `#0d0d1a` | Elevated cards, dropdowns |
| `#13131f` | Inputs, inset fields |

Borders use `white/[0.06]` (hairline) and `white/[0.08]–[0.10]` (hover).

### 2.3 The blue remap (important)

`globals.css` overrides Tailwind's `violet`, `purple` (→ blue) and `fuchsia`
(→ sky) color scales at the CSS‑variable level. That means **`bg-violet-500`,
`text-purple-400`, `fuchsia-500`, etc. all render as brand blue.** Historic
class names were never mass‑renamed — the remap makes them correct. When writing
new code prefer `blue-*` directly; if you see `violet-*`, it is intentional and
already blue.

Accent reference: blue-500 `#3b82f6`, blue-600 `#2563eb`.

### 2.4 Semantic colors

| Meaning | Color |
|---------|-------|
| Success / live | emerald / `--live` green |
| Warning | amber `#f59e0b` |
| Danger | red `#ef4444` |
| Info / brand | blue `#2563eb` |
| CTA accent (auth header) | amber `#e5a44d` (Sign‑up button only) |

---

## 3. Typography

- **Sans:** FiraGO → Noto Sans (Cyrillic) → Noto Sans Georgian → system. Set via
  `--font-sans`; the chain guarantees Georgian/Russian/Latin glyph coverage.
- **Mono:** JetBrains Mono (kickers, numeric `tnum`).

| Class | Size | Use |
|-------|------|-----|
| `.h-display` | `clamp(40px,7vw,84px)` | Hero headline |
| `.h-section` | `clamp(30px,4.4vw,54px)` | Section titles |
| `.lede` | `clamp(16px,1.5vw,20px)` | Intro paragraph |
| `.kicker` | 12px mono, uppercase, `0.18em` | Eyebrow label |

Weights in use: 400 / 500 / 600 / 700. Headlines are 600 with tight tracking
(`-0.025em`–`-0.03em`).

---

## 4. Components

### 4.1 Buttons

| Variant | Class | Visual |
|---------|-------|--------|
| Primary | `.btn-primary` / Tailwind blue gradient | Blue gradient, white text, glow shadow |
| Ghost | `.btn-ghost` | Transparent, hairline border, lifts on hover |
| Sign in (nav) | `.nav-signin` | Ghost **pill**, light text |
| Sign up (nav) | `.nav-signup` | Solid **amber pill** `#e5a44d`, dark text |

States: hover lifts `translateY(-1–2px)` + stronger glow; focus shows accent
ring; disabled drops opacity and removes motion.

### 4.2 Cards

`.glass` / `rounded-2xl border border-white/[0.06]` on a `#0d0d1a` surface with
`--shadow-card`. Hover raises the border to `white/[0.10]` or accent.

### 4.3 Inputs

Background `#13131f`, border `white/10`, radius `0.7–0.75rem`, focus
`border-blue-500/60 ring-blue-500/20`.

### 4.4 Badges / pills

Status pills use a tinted bg + matching border, e.g. live =
`bg-emerald-500/15 text-emerald-300`, brand = `bg-blue-500/15 text-blue-300`.

### 4.5 Navigation

- **Landing nav:** pill links (`border-radius:999px`), language toggle, theme
  toggle, then auth actions (see §5).
- **Dashboard sidebar:** `src/components/dashboard-shell/Sidebar.tsx`, active row
  highlighted with accent text + subtle fill.
- **Topbar:** `src/components/dashboard-shell/Topbar.tsx` — 56px, search,
  notifications, "new bot" CTA, Clerk `UserButton`.

---

## 5. Patterns

### 5.1 Auth header (logged‑out)

Mirrors the reference layout: a ghost **Sign in** pill next to a solid **amber
Sign up** pill. Logged‑in visitors instead see **Dashboard** + the Clerk
`UserButton`. Implemented in `MidnightLanding.tsx` (`Nav`) with styles
`.nav-signin` / `.nav-signup` in `midnight.css`.

### 5.2 Clerk theming (dark)

Clerk's popover, the **Manage account** modal, and the sign‑in/up cards are
themed dark via two layers:

1. `src/lib/clerk-appearance.ts` — brand `colorPrimary` + primary‑button gradient
   (applied globally on `ClerkProvider`).
2. Global `.cl-*` overrides in `globals.css` (search **"Clerk dark theme"**) —
   these enforce dark surfaces + light text with `!important`, because Clerk's
   own CSS‑in‑JS wins specificity over the appearance prop.

> The orange **"Development mode"** badge is shown only because the project still
> uses Clerk **development** keys. It disappears automatically once production
> keys are configured.

### 5.3 Motion

Standard easing `cubic-bezier(.2,.7,.3,1)`, durations 0.18–0.25s for hovers,
0.5s for theme transitions. Respect reduced‑motion where added.

---

## 6. Do / Don't

| ✅ Do | ❌ Don't |
|------|---------|
| Use the surface scale in §2.2 | Invent new near‑black hexes |
| Keep one blue accent | Add a second brand color (amber is auth‑CTA only) |
| Use `.cl-*` overrides for Clerk | Fight Clerk via inline element classes |
| Keep the `peit` wordmark | Swap in an image logo |
| Prefer `blue-*` in new code | Add new `violet-*` (legacy‑only, already blue) |
