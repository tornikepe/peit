# Peit — Live-მდე გეგმა (Launch Checklist)

> ეს ფაილი არის ერთადერთი წყარო იმისა, თუ რა აკლია პროექტს live-მდე.
> ყოველი სესიის დასაწყისში გადახედე; პუნქტის დასრულებისას მონიშნე `[x]` და დააკომიტე.
> კოდი მზადაა — ქვემოთ ჩამოთვლილი თითქმის ყველაფერი ოპერატორის (Tornike-ს) მხარეს კეთდება.

---

## ეტაპი 1 — დომენი (≈1 დღე)

- [ ] იყიდე **peit.ge** (registrar: domains.ge ან მსგავსი)
- [ ] Vercel → peit project → Settings → Domains → დაამატე `peit.ge` (+ `www.peit.ge`)
- [ ] DNS ჩანაწერები registrar-ში Vercel-ის ინსტრუქციით (A / CNAME)
- [ ] კოდში განახლება (Claude აკეთებს): `SITE_URL` → `https://peit.ge` (layout.tsx, sitemap, robots, JSON-LD, referral ბმულები)

## ეტაპი 2 — Clerk production (≈1 საათი, ეტაპი 1-ის შემდეგ)

- [ ] Clerk Dashboard → Create production instance → დომენი `peit.ge`
- [ ] Google OAuth-ის production credentials (Google Cloud Console → OAuth client, redirect Clerk-ის მისამართზე)
- [ ] Vercel env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` → production keys → Redeploy
- [ ] შედეგი: ქრება "Development mode" ბეჯი, ქრება dev-ლიმიტები და ხანდახანი "სერვერის შეცდომა"

## ეტაპი 3 — გადახდები: Lemon Squeezy (1–2 დღე, review სჭირდება)

- [ ] Lemon Squeezy store-ის აქტივაცია (identity/store review)
- [ ] Production variant ID-ები სამივე პლანზე (Basic/Pro/Ultimate) → Vercel env-ებში
- [ ] Webhook URL production დომენზე + `LEMONSQUEEZY_WEBHOOK_SECRET`
- [ ] ერთი რეალური სატესტო გადახდა → Billing გვერდზე სტატუსი/ინვოისი ჩანს

## ეტაპი 4 — მეილები, env-ები, ბაზა (≈1 საათი)

- [ ] **Anthropic credits** — შეავსე ბალანსი (console.anthropic.com); ბოტის პასუხები ამაზე დგას
- [ ] **Resend** — peit.ge დომენის ვერიფიკაცია (TXT/DKIM) → from მისამართი `info@peit.ge` ან `noreply@peit.ge`
- [ ] **info@peit.ge ყუთი** — Zoho Mail Free (MX ჩანაწერები; Resend-ის TXT-ს არ კონფლიქტობს). საიტი Enterprise-ს ამ მისამართზე უშვებს — ვინმემ უნდა იკითხოს!
- [ ] Vercel env: `ADMIN_EMAILS` (ადმინების სია, მძიმით)
- [ ] Vercel env: `META_WEBHOOK_VERIFY_TOKEN` (ნებისმიერი ძლიერი string)
- [ ] Vercel env: `SENTRY_DSN` — Sentry კოდში უკვე ჩაშენებულია, მხოლოდ DSN აკლია (sentry.io უფასო გეგმა)
- [ ] Neon-ში migration **0022** (backup_logs) თუ ჯერ არ გაშვებულა — SQL ფაილი: `drizzle/0022_*.sql`

## ეტაპი 5 — მონიტორინგი და შემოწმება

- [ ] **UptimeRobot** (უფასო) → მონიტორი `https://peit.ge/api/health`-ზე → მეილი/SMS წაქცევისას
- [ ] **Legal გვერდები ადამიანმა გადახედოს** — Terms/Privacy/GDPR ტექსტები AI-ნაწერია; ჩასვი რეალური რეკვიზიტები (კომპანიის სახელი, საიდენტიფიკაციო, მისამართი)
- [ ] **მობილურით რეალური ტესტი** — ტელეფონით: რეგისტრაცია → ბოტის შექმნა → widget-ის ნახვა
- [ ] **ფინალური smoke-test** (Claude-სთან ერთად): ახალი ანგარიში ნულიდან → ბოტი → widget რეალურ საიტზე → გადახდა → მეილები. ნაპოვნი ხარვეზები მაშინვე სწორდება.

## Launch-ის შემდეგ (არ აჩერებს გაშვებას)

- [ ] **Meta App Review** — Instagram/Messenger არხებს კლიენტებისთვის სჭირდება `pages_messaging` (+ `instagram_manage_messages`) ნებართვის review. Telegram review-ს არ საჭიროებს — პირველი დღიდან მუშაობს.
- [ ] **Google Search Console** — peit.ge-ს დამატება + sitemap submit (`/sitemap.xml` კოდში მზადაა)

---

## სტატუსი / შენიშვნები

| თარიღი | რა გაკეთდა |
|---|---|
| 2026-06-10 | გეგმა შედგა. კოდი მზადაა: ორენოვანი საიტი+dashboard, ბილინგი (LS), არხები, ანალიტიკა, GDPR, უსაფრთხოების headers, ბექაფ-ლოგი. ყველაფერი ზემოთ — ოპერატორის მხარეს. |

**წესები (კოდის მხარეს):** ვმუშაობთ მხოლოდ `master`-ზე · ლოგო = ტექსტური "peit" wordmark · ბრენდის აქცენტი ლურჯი · რუსული ენა პროდუქტში აღარ არსებობს.
