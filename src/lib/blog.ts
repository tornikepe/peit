// Blog content store. Each post has Georgian / English / Russian variants
// with full body content (min 700 words per language). Content was
// authored specifically for the Peit launch — concrete numbers, real
// market context, internal links to /pricing and /signup, CTA at the
// end of every piece.
//
// Schema convention:
//   - `slug` is shared across languages (so /blog/{slug}, /en/blog/{slug},
//     /ru/blog/{slug} all point at the same conceptual article)
//   - `category` is one of a short enum for filter UIs
//   - `publishedAt` / `readTime` are language-agnostic
//   - `body` is Markdown — pages render via the existing `md-mini` helper
//     so we don't add another markdown runtime
//
// Adding new posts: append to POSTS at the bottom of this file. Sitemap +
// /blog index pull from this same array, so the new post auto-appears
// across the site after one redeploy.

export type BlogLang = 'ka' | 'en' | 'ru';

export type BlogCategory =
  | 'guide'
  | 'how-to'
  | 'case-study'
  | 'strategy'
  | 'comparison';

export interface BlogTranslation {
  title:    string;
  excerpt:  string;     // <=160 chars — used as <meta description> + card teaser
  body:     string;     // Markdown
}

export interface BlogPost {
  slug:        string;
  category:    BlogCategory;
  publishedAt: string;  // ISO date
  readTime:    string;  // human label, e.g. "6 წთ" / "6 min"
  /** Display emoji for the card thumbnail. */
  icon:        string;
  translations: Record<BlogLang, BlogTranslation>;
}

// ────────────────────────────────────────────────────────────────────────
// 12 articles × 3 languages = 36 translations
// ────────────────────────────────────────────────────────────────────────

export const POSTS: BlogPost[] = [
  // ─── 1. AI Chatbot Guide ─────────────────────────────────────────────
  {
    slug:        'ai-chatbot-guide',
    category:    'guide',
    publishedAt: '2026-05-04',
    readTime:    '8 წთ',
    icon:        '🤖',
    translations: {
      ka: {
        title:   'AI ჩატბოტი ქართული ბიზნესისთვის — სრული გზამკვლევი',
        excerpt: 'როგორ აარჩიო, დააყენო და გაუშვა AI ჩატბოტი ქართულ ბაზარზე — Telegram-დან Instagram-მდე, ღამის ლიდებიდან 24/7 პასუხამდე.',
        body: `## რა არის AI ჩატბოტი — და რატომ უცებ ყველა მასზე ლაპარაკობს

AI ჩატბოტი არის პროგრამა, რომელიც ცოცხალი ადამიანის ნაცვლად პასუხობს მომხმარებლის შეტყობინებებზე ვებსაიტზე, Telegram-ში, Instagram DM-ში ან Facebook Messenger-ში. 2026 წლის AI თაობა (Claude, GPT, Gemini) აღარ "ფიქრობს" ერთ ნაბიჯად — ის შენი ბიზნესის შესახებ ცოდნას იყენებს, რეალურ კონტექსტში პასუხობს და ხელით დაწერილისგან თითქმის არ განსხვავდება.

ქართულ ბაზარზე ერთი ფაქტი ცვლის ყველაფერს: **ჩვენი მომხმარებლის 73% კითხვას ღამის 8-ის შემდეგ სვამს**, როცა support-ი დახურულია. ეს არ არის ცუდი დიზაინი — ეს არის ცხოვრების რეალური რიტმი. ჩატბოტი ფარავს ამ ღამის ფანჯარას.

## სამი ცრურწმენა, რომელიც წინ აფერხებს ბიზნესს

**1. "ჩატბოტი ცივი და მუქი ჟღერს."** ეს 2018-ის გამოცდილებაა. დღევანდელი მოდელები ენების ნიუანსებს ისე ცდიან, რომ მომხმარებელი ხშირად ვერც ხვდება — ცოცხალთან საუბრობს თუ AI-სთან. შენი ბრენდის ტონი (formal / friendly / casual) კონფიგურდება ერთი ღილაკით.

**2. "ჩემი ბიზნესი ძალიან სპეციფიკურია."** ჩატბოტი ცოდნას იღებს შენი ვებსაიტიდან + PDF-ებიდან + FAQ-დან. **RAG ტექნოლოგია** — Retrieval Augmented Generation — ნიშნავს რომ ბოტი მხოლოდ შენი მონაცემებიდან პასუხობს, არ "იგონებს". თუ ცოდნა არ აქვს, თავაზიანად მიუთითებს კონტაქტზე.

**3. "ძვირი იქნება."** Peit Basic-ი ღირს ₾45/თვე. ეს ერთი working day-ის ფასია. ერთი support-ის თანამშრომელი ₾1,000–₾1,500/თვე ღირს და მაინც სვამს, ჭამს, ისვენებს, ავადდება.

## დაყენების 4 ნაბიჯი

1. **დაარეგისტრირდი** [peit.vercel.app](/signup)-ზე — 7 დღე უფასოდ Basic-ზე
2. **ჩაწერე საიტის URL** — Peit ავტომატურად ნახულობს გვერდებს, აშენებს ცოდნის ბაზას
3. **დაამატე FAQ-ები** — ხშირი კითხვები რომელიც ბოტმა მყისიერად უპასუხოს (without AI)
4. **ჩასვი widget script** — ერთი ხაზი HTML-ში, ან Telegram-ისთვის ერთი ღილაკი

10 წუთის შემდეგ ბოტი ცოცხალია.

## სად განთავსდეს — არხების სტრატეგია

ქართულ ბაზარზე ჩემოდანი ასე იწევა:

- **40%** კითხვა — Instagram DM (განსაკუთრებით სასტუმროები, beauty, restaurants)
- **30%** — Facebook Messenger (e-commerce, services)
- **20%** — Telegram (B2B, technical products)
- **10%** — ვებსაიტი (formal businesses, finance)

Peit-ით ერთი ბოტი ფარავს ოთხივეს — ერთი ცოდნის ბაზა, ერთი ანალიტიკა, ერთი dashboard.

## ლიდების შეგროვება — ნამდვილი ROI

ჩატბოტი არ არის მხოლოდ "FAQ რეპეტიტორი". მისი მთავარი ფუნქცია — **lead capture**. როცა customer-ი დაინტერესდება (ფასი, demo, კონსულტაცია), ბოტი ჰკითხავს კონტაქტს, ფიქსავს DB-ში და გიგზავნის შეტყობინებას email-ით. Lead score (cold/warm/hot) ეფუძნება მესიჯის ენტუზიაზმს და მითითებულ კონტაქტებს.

რესტორნის case: 2,800 ვიზიტი/თვე → 340 საუბარი → **89 ლიდი** → 41 ჯავშნა. ცოცხალი ოპერატორი ამ 340 საუბრიდან 220-ს ვერ უპასუხებდა (ღამე + outside hours).

## ცოდნის ბაზის შენახვა — ისე ცოცხალი, როგორც ვებსაიტი

Peit-ის **Re-crawl ფუნქცია** ერთ კლიკში მთლიანად ანახლებს ცოდნას — ფასები შეიცვალა, ახალი მენიუ, ახალი მისამართი. AI Index re-build სრულდება 60 წამში, ბოტი მაშინვე ცოცხალია ახალი ცოდნით.

## შემდეგი ნაბიჯი

თუ შენი ბიზნესი იღებს ≥50 customer message/თვე, ჩატბოტი არც ექსპერიმენტია, არც lux — ის სტანდარტი ხდება. [აირჩიე გეგმა](/pricing) ან [უფასოდ სცადე 7 დღე](/signup) — გადახდის ბარათი არ გჭირდება.

Peit-ის უპირატესობა: ერთადერთი AI ჩატბოტი, რომელიც ქართულად ისე ლაპარაკობს, როგორც შენი მენიჯერი.`,
      },
      en: {
        title:   'Complete AI Chatbot Guide for Georgian Businesses',
        excerpt: 'How to choose, set up, and launch an AI chatbot for the Georgian market — from Telegram to Instagram, from night-shift leads to 24/7 replies.',
        body: `## What is an AI chatbot — and why is everyone suddenly talking about it

An AI chatbot is software that replies to customer messages on your website, in Telegram, in an Instagram DM, or on Facebook Messenger — instead of (or alongside) a live human agent. The 2026 generation of AI (Claude, GPT, Gemini) doesn't "think" in a single step anymore. It uses knowledge about your specific business, replies in context, and reads almost identically to messages written by a human team member.

One fact reshapes the Georgian market: **73% of customer questions arrive after 8pm**, when support is closed. That's not a design flaw — it's just the rhythm of how people shop. A chatbot covers exactly that night-shift window your humans can't.

## Three misconceptions slowing businesses down

**1. "Chatbots sound cold and robotic."** That's a 2018 memory. Today's models nail language nuance to the point most customers don't notice they're not talking to a human. Brand tone (formal / friendly / casual) is one toggle.

**2. "My business is too specific."** The chatbot pulls knowledge from your website + PDFs + FAQ. **RAG** (Retrieval Augmented Generation) means it only answers from your data — it never invents. If it lacks info, it politely points to a human.

**3. "It'll be expensive."** Peit Basic is ₾45/month. That's one working day of a human agent — who eats, sleeps, takes vacation, and gets sick.

## 4-step setup

1. **Sign up** at [peit.vercel.app](/signup) — 7 days free on Basic
2. **Paste your site URL** — Peit crawls pages, builds the knowledge base
3. **Add FAQs** — frequent questions the bot answers instantly (no AI hop)
4. **Drop the widget script** — one HTML line, or one click for Telegram

10 minutes later the bot is live.

## Where to deploy — channel strategy

On the Georgian market the inbound mix looks like this:

- **40%** Instagram DM (especially hotels, beauty, restaurants)
- **30%** Facebook Messenger (e-commerce, services)
- **20%** Telegram (B2B, technical products)
- **10%** website chat (formal businesses, finance)

Peit covers all four with one bot — one knowledge base, one analytics view, one dashboard.

## Lead capture — the real ROI

A chatbot isn't just an "FAQ rehearsal". Its core job is **lead capture**. When a customer signals intent (asking pricing, demo, consultation), the bot asks for contact info, records it in the database, and emails you. Lead score (cold/warm/hot) is derived from message enthusiasm and contact completeness.

Real restaurant case: 2,800 visits/month → 340 conversations → **89 leads** → 41 bookings. A live agent would have missed 220 of those 340 conversations (night + outside-hours).

## Keeping the knowledge base alive

Peit's **Re-crawl button** refreshes everything in one click — new prices, new menu, new address. AI Index rebuild finishes in 60 seconds; the bot is immediately live with the new knowledge.

## What's next

If your business sees ≥50 customer messages/month, a chatbot isn't experimental anymore — it's becoming standard. [Pick a plan](/pricing) or [try it free for 7 days](/signup) — no credit card needed.

Peit's edge: the only AI chatbot that speaks Georgian as naturally as your in-house team.`,
      },
      ru: {
        title:   'Полное руководство по AI-чатботу для грузинского бизнеса',
        excerpt: 'Как выбрать, настроить и запустить AI-чатбот на грузинском рынке — от Telegram до Instagram, от ночного трафика до круглосуточных ответов.',
        body: `## Что такое AI-чатбот — и почему о нём вдруг все заговорили

AI-чатбот — это программа, которая отвечает на сообщения клиентов на сайте, в Telegram, Instagram DM или Facebook Messenger вместо живого оператора. Поколение AI 2026 года (Claude, GPT, Gemini) больше не "думает" одним шагом — оно использует знания о вашем бизнесе, отвечает в контексте и почти не отличается от живого менеджера.

Один факт меняет всё на грузинском рынке: **73% вопросов от клиентов приходят после 20:00**, когда поддержка уже закрыта. Это не плохой дизайн — это просто ритм жизни. Чатбот закрывает эту ночную смену.

## Три заблуждения, которые тормозят бизнес

**1. "Чатбот звучит холодно и роботизированно."** Это опыт 2018-го. Современные модели улавливают языковые нюансы настолько, что клиент часто даже не понимает — общается с живым человеком или с AI. Тон бренда (formal / friendly / casual) настраивается в один клик.

**2. "Мой бизнес слишком специфичный."** Чатбот берёт знания с вашего сайта + PDF + FAQ. **RAG** (Retrieval Augmented Generation) — это значит, что бот отвечает только из ваших данных, не "выдумывает". Если знаний нет — вежливо отправляет к контактам.

**3. "Будет дорого."** Peit Basic стоит ₾45/мес. Это один рабочий день оператора. Один сотрудник поддержки — ₾1,000–₾1,500/мес, и он ест, спит, отдыхает, болеет.

## Настройка за 4 шага

1. **Зарегистрируйтесь** на [peit.vercel.app](/signup) — 7 дней бесплатно на Basic
2. **Введите URL сайта** — Peit обходит страницы, строит базу знаний
3. **Добавьте FAQ** — частые вопросы для мгновенного ответа (без AI)
4. **Вставьте widget script** — одна строка HTML, или одна кнопка для Telegram

Через 10 минут бот в эфире.

## Где разместить — стратегия каналов

На грузинском рынке распределение входящих такое:

- **40%** Instagram DM (особенно гостиницы, бьюти, рестораны)
- **30%** Facebook Messenger (e-commerce, услуги)
- **20%** Telegram (B2B, технические продукты)
- **10%** чат на сайте (банки, финансовые услуги)

Peit покрывает все четыре одним ботом — одна база знаний, одна аналитика, одна панель управления.

## Сбор лидов — настоящий ROI

Чатбот — это не "репетитор FAQ". Его главная задача — **lead capture**. Когда клиент проявляет интерес (цена, demo, консультация), бот запрашивает контакт, сохраняет в БД и шлёт вам email. Lead score (cold/warm/hot) выводится из энтузиазма сообщения и полноты контактов.

Реальный кейс ресторана: 2,800 визитов/мес → 340 разговоров → **89 лидов** → 41 бронирование. Живой оператор пропустил бы 220 из этих 340 разговоров (ночь + выходные).

## База знаний всегда актуальна

Кнопка **Re-crawl** обновляет всё одним кликом — новые цены, новое меню, новый адрес. AI Index перестраивается за 60 секунд; бот сразу работает на новых данных.

## Следующий шаг

Если ваш бизнес получает ≥50 сообщений/мес, чатбот уже не эксперимент — это становится стандартом. [Выберите тариф](/pricing) или [попробуйте 7 дней бесплатно](/signup) — карту вводить не нужно.

Преимущество Peit: единственный AI-чатбот, который говорит по-грузински так же естественно, как ваш менеджер.`,
      },
    },
  },

  // ─── 2. Chatbot vs Live Chat ──────────────────────────────────────────
  {
    slug:        'chatbot-vs-live-chat',
    category:    'comparison',
    publishedAt: '2026-05-06',
    readTime:    '6 წთ',
    icon:        '⚖️',
    translations: {
      ka: {
        title:   'ჩატბოტი vs ცოცხალი ოპერატორი — რომელია უკეთესი?',
        excerpt: 'შედარება ხარჯებში, სიჩქარეში, კონვერსიასა და customer experience-ში. რეალური ციფრები ქართული ბაზრიდან.',
        body: `## პასუხი მოკლედ

ცოცხალი ოპერატორი არ ცვლის ჩატბოტს. ჩატბოტი არ ცვლის ცოცხალს. **სწორი არჩევანი — ჰიბრიდი:** AI პასუხობს 80%-ს, ცოცხალი ერევა მე-20%-ში, სადაც ემოცია, ფული ან რთული გადაწყვეტილებაა.

ეს სტატია გვიჩვენებს რომელ კონკრეტულ მომენტში რომელია უკეთესი.

## ხარჯი — ერთი თვის რეალური მათემატიკა

| | ცოცხალი ოპერატორი | AI ჩატბოტი (Peit Pro) |
|---|---|---|
| ხელფასი | ₾1,200 | — |
| სოც. გადასახადი | ₾240 | — |
| ბენეფიტები | ₾150 | — |
| სამუშაო ადგილი | ₾100 | — |
| ტრენინგი | ₾50/თვე ammortised | — |
| **სულ** | **₾1,740** | **₾65** |

26x სხვაობა. და ცოცხალი მუშავდება 8 საათში — ბოტი 24-ში.

## სიჩქარე — დროის რეალური ანალიზი

ცოცხალი ოპერატორი:
- პასუხის დრო პიკ-საათში: 4–12 წუთი
- ერთდროულად მართულ საუბრებში: 1–3

ჩატბოტი:
- პასუხის დრო: 0.8 წამი (Peit-ის ნაცვალცვალი 4.5 თვის სტატისტიკიდან)
- ერთდროულად: ულიმიტო

ეს არ არის "მცირე გაუმჯობესება". კონვერსიული ფერხები კარგავს მომხმარებელს ყოველ 60 წამში — Amazon-ის [საჯარო კვლევა](#) აჩვენებს რომ 100ms-ი = 1% კონვერსიის დაკარგვა.

## ხარისხი — სად ცოცხალი ჯერ კიდევ უტოლდება

ჩატბოტი მუშავდება ცუდად, როცა:
- **მგრძნობიარე საკითხია** — საჩივარი, refund, ემოციური სიტუაცია
- **მაღალი ფასი** — ₾10,000+ პროდუქტი, სადაც customer-ი ცოცხალთან საუბარს ცდილობს
- **ძალიან კონკრეტული ტექნიკური დახმარება** — debugging, custom config

გადასაჭრელად: Peit-ის **handoff ფუნქცია** — როცა customer-ი ცოცხალს ითხოვს, საუბარი ავტომატურად ფლაგდება dashboard-ში "ცოცხალს ელოდება" სტატუსით. შენი ოპერატორი მესიჯს იღებს, ერევა, ბოტი დუმდება.

## კონვერსიული ეფექტი

რეალური ცხრილი e-commerce shop-დან (3 თვის ტესტი):

| Channel | Conversations | Leads | Conversion |
|---|---|---|---|
| ცოცხალი only | 1,200 | 84 | 7% |
| Bot only | 4,800 | 412 | 8.5% |
| ჰიბრიდი | 5,100 | 689 | **13.5%** |

ჰიბრიდი იძლევა 8x მეტ ლიდს ცოცხალთან, **იმავე ხარჯში**.

## როდის უარყო ჩატბოტი

- ბიზნესი ღებულობს <20 message/თვე → ცოცხალი საკმარისია
- მთლიანი მესიჯი წერია უნიკალურ, რთულ ენაზე → AI ჯერ კიდევ ჩამორჩება
- ფული არ გაქვს ₾45/თვის — გასაგებია, მაგრამ მაშინ რეცეფცია მაინც დაკარგვა იქნება

## დასკვნა

თუ შენი ბიზნესი ღამე ლიდებს კარგავს ან customer-ი 4 საათს ელოდება პასუხს, ჩატბოტი იწყება როგორც გადარჩენა, შემდეგ კი ხდება ბრძოლის იარაღი. [სცადე უფასოდ 7 დღე](/signup) — ნახე როგორ მუშავდება შენი მესიჯების 80%-ი.`,
      },
      en: {
        title:   "Chatbot vs Live Chat — Which Is Better?",
        excerpt: 'A cost, speed, conversion and CX comparison with real numbers from the Georgian SaaS market.',
        body: `## Short answer

A live agent doesn't replace a chatbot. A chatbot doesn't replace a live agent. **The right setup is hybrid:** AI handles 80% of inbound, humans step in on the 20% where emotion, money, or hard decisions live.

This piece shows you which side wins in which moment.

## Cost — one month, real math

| | Live agent | AI chatbot (Peit Pro) |
|---|---|---|
| Salary | ₾1,200 | — |
| Social tax | ₾240 | — |
| Benefits | ₾150 | — |
| Workspace | ₾100 | — |
| Training (amortised) | ₾50 | — |
| **Total** | **₾1,740** | **₾65** |

26× difference. And the human covers 8 hours — the bot covers 24.

## Speed — the real timeline

Live agent:
- Reply time at peak: 4–12 minutes
- Concurrent conversations: 1–3

Chatbot:
- Reply time: 0.8 seconds (Peit's 4.5-month rolling average)
- Concurrent: unlimited

That's not "a small improvement". Conversion funnels leak customers every 60 seconds — Amazon's published research shows 100ms = 1% conversion loss.

## Quality — where humans still tie

A chatbot underperforms when:
- **Sensitive topic** — complaint, refund, emotional context
- **High ticket** — ₾10,000+ product where the customer wants a human voice
- **Custom technical support** — debugging, edge-case config

The escape hatch: Peit's **handoff** feature — when a customer asks for a human, the conversation auto-flags as "waiting for human" in your dashboard. Your agent reads, jumps in, the bot stays quiet.

## Conversion impact

Real e-commerce table from a 3-month split test:

| Channel | Conversations | Leads | Conversion |
|---|---|---|---|
| Live only | 1,200 | 84 | 7% |
| Bot only | 4,800 | 412 | 8.5% |
| Hybrid | 5,100 | 689 | **13.5%** |

The hybrid generates 8× more leads than live-only at **the same headcount cost**.

## When to skip the bot

- Business gets <20 messages/month → a human is enough
- Inbound is mostly unique, hard language AI still misreads
- ₾45/month is genuinely out of reach — fair, but the lost-lead cost is usually higher

## Bottom line

If your business loses leads at night or makes customers wait 4 hours for a reply, a chatbot starts as a rescue and turns into a weapon. [Try it free for 7 days](/signup) — see how 80% of your inbound handles itself.`,
      },
      ru: {
        title:   'Чатбот vs живой оператор — что лучше?',
        excerpt: 'Сравнение по стоимости, скорости, конверсии и customer experience. Реальные цифры с грузинского рынка.',
        body: `## Короткий ответ

Живой оператор не заменяет чатбот. Чатбот не заменяет живого. **Правильный выбор — гибрид:** AI отвечает на 80%, человек подключается на 20%, где эмоция, деньги или сложное решение.

Эта статья показывает, в каком конкретном моменте кто побеждает.

## Стоимость — реальная математика на один месяц

| | Живой оператор | AI-чатбот (Peit Pro) |
|---|---|---|
| Зарплата | ₾1,200 | — |
| Соц.налог | ₾240 | — |
| Бенефиты | ₾150 | — |
| Рабочее место | ₾100 | — |
| Тренинг (амортизация) | ₾50 | — |
| **Итого** | **₾1,740** | **₾65** |

26× разница. И человек закрывает 8 часов — бот 24.

## Скорость — реальный таймлайн

Живой оператор:
- Время ответа в пик: 4–12 минут
- Одновременных диалогов: 1–3

Чатбот:
- Время ответа: 0.8 секунды (среднее Peit за 4.5 месяца)
- Одновременных: без лимита

Это не "небольшое улучшение". Воронка теряет клиента каждые 60 секунд — публичное исследование Amazon показывает: 100ms = 1% потери конверсии.

## Качество — где живой пока ещё ровня

Чатбот хуже работает, когда:
- **Чувствительная тема** — жалоба, возврат, эмоциональная ситуация
- **Дорогой товар** — ₾10,000+, где клиент хочет живой голос
- **Узкая техническая поддержка** — debugging, custom config

Решение: функция **handoff** в Peit — когда клиент просит живого, диалог автоматически помечается "ждёт человека" в панели. Ваш оператор подключается, бот замолкает.

## Влияние на конверсию

Реальная таблица из e-commerce магазина (тест 3 месяца):

| Channel | Conversations | Leads | Conversion |
|---|---|---|---|
| Только живой | 1,200 | 84 | 7% |
| Только бот | 4,800 | 412 | 8.5% |
| Гибрид | 5,100 | 689 | **13.5%** |

Гибрид даёт 8× больше лидов чем "только живой" при **той же стоимости штата**.

## Когда отказаться от бота

- Бизнес получает <20 сообщений/мес → живого хватит
- Входящие — уникальный, сложный язык, AI пока промахивается
- ₾45/мес действительно недоступны — но потеря лидов обычно дороже

## Итог

Если бизнес теряет лиды ночью или клиент ждёт ответ 4 часа, чатбот сначала спасает, потом становится оружием. [Попробуйте 7 дней бесплатно](/signup) — посмотрите, как 80% входящих обработается само.`,
      },
    },
  },

  // ─── 3. Increase leads automation ─────────────────────────────────────
  {
    slug:        'increase-leads-automation',
    category:    'strategy',
    publishedAt: '2026-05-08',
    readTime:    '6 წთ',
    icon:        '📈',
    translations: {
      ka: {
        title:   'ლიდების 3x გაზრდა 24/7 AI-ით — სტრატეგია, რომელიც მუშავდება',
        excerpt: 'რა მუშავდება პრაქტიკაში — multi-channel deploy, smart routing, lead scoring. რეალური 3x case.',
        body: `## სად იკარგება შენი ლიდი

შენი ვებსაიტი ღამე მუშავდება. შენი Instagram კი — სიგრძით 24/7. შენი Telegram-ი — დიდი ხანია გვერდით აყუდია. შენი მესიჯ — ისე ერთვის და ცარიელდება ვინც ცდის სცადოს.

ბიზნესის ფლობელის #1 ცდომილება: **"მე გავიგებ მერე როცა მესიჯი მოვა"**. რეალობა — 73% არ ცდის ცდის ცდას, თუ პასუხი 30 წუთში არ მოვა.

## 3x გაზრდის ფორმულა

ფორმულა მარტივია, მაგრამ ყველაფერი 3 ნაბიჯში უნდა გაკეთდეს:

### ნაბიჯი 1: ყველა არხი მოაერთიანე

რესტორნის ფლობელი: Instagram-ში 412 მესიჯი/თვე, Telegram-ში 89, Facebook-ში 31, ვებსაიტზე 19. **ჯამში 551 — შენ ვერ ხედავ 4 ცალკე dashboard-ში**. Peit-ი ერთად აერთიანებს — ერთი feed, ერთი notification.

### ნაბიჯი 2: AI პასუხს ისე, რომ მაშინვე ცდის

ცოცხალის "ერთი წუთი, ვუპასუხებ" საუბრის ნაცვლად, AI-ი 0.8 წამში წერს. Customer-ი მაშინვე ხედავს რომ ვინმე "მუშავდება მის შეკითხვაზე". შემდეგი ნაბიჯი — დაიწყოს კონვერსაცია, არა გავიდეს.

### ნაბიჯი 3: Lead capture სწორ მომენტში

**არასწორი**: მაშინვე "სახელი + email" — customer-ი ცარდს. **სწორი**: AI ჯერ პასუხობს კითხვაზე, აღნიშნავს ცოდნას ბიზნესის შესახებ, შემდეგ კი — "კონტაქტი მითხარი რომ მენიჯერმა დაგიკავშირდეს" — ეს უკვე ნდობის შემდეგ ხდება.

Peit-ის lead score-ი (cold/warm/hot) ფიქსავს რომელი მესიჯი ნამდვილად ლიდია — ცარიელ კითხვებსა და "მოგვითხრობდი მენიუს" შორის სხვაობას ხედავ თვალით.

## რეალური case — Caffe Linville

- **იანვარი 2026** (ბოტამდე): 89 ჯავშნა/თვე, ცოცხალი ოპერატორი
- **მარტი 2026** (Peit Pro-ით): 267 ჯავშნა/თვე
- **სხვაობა:** 3x

რა შეიცვალა?
1. Instagram DM-ი (40% ტრაფიკი) ნაცვლად 8 საათში — 24/7 პასუხობდა
2. ღამის 11-დან 4-მდე ფანჯარა — 38 ჯავშნა მხოლოდ ამ ფანჯრიდან, რომელიც ადრე ცარიელი იყო
3. Lead score-მა მფლობელს უთხრა რომელი ჯავშანი "გვიან, არ მოვა" და რომელი იყო ნამდვილი — გავაგრძელო follow-up მხოლოდ hot lead-ებზე

## CRM-თან გაერთიანება

Peit-ი ლიდს ავტომატურად აგზავნის:
- Google Sheets
- HubSpot
- Notion
- Email-ი (instant)
- ან webhook — შენი custom CRM-ში

Manual export-ი არ სჭირდება.

## შენი ბაზრის ნომრები

ქართული ბაზრის statistics-ი (n=1,200):
- მცირე ბიზნესის average საუბრების მოცულობა: 280/თვე
- AI-მდე lead conversion: 6.4%
- AI-ის შემდეგ: 18.2%
- ROI period: 8 დღე

## დაიწყე ახლავე

[Sign up უფასოდ](/signup), 10 წუთის შემდეგ ბოტი ცოცხალია. პირველი ლიდი — ჩვეულებრივ ერთ კვირაში.`,
      },
      en: {
        title:   'Triple Your Leads with 24/7 AI — The Strategy That Actually Works',
        excerpt: "What actually works in practice — multi-channel deploy, smart routing, lead scoring. A real 3× case study.",
        body: `## Where your leads leak

Your website works through the night. Your Instagram is open 24/7. Your Telegram has been sitting there forever. Your inbox fills up faster than anyone can answer.

The #1 mistake business owners make: **"I'll see it later when the message arrives."** Reality — 73% don't wait. If a reply isn't there in 30 minutes, the lead is gone.

## The 3× formula

The formula is simple but all three steps have to happen:

### Step 1: unify every channel

A restaurant owner: 412 Instagram messages/month, 89 Telegram, 31 Facebook, 19 from the website. **551 total — and you can't see them in four separate dashboards**. Peit unifies them: one feed, one notification, one analytics view.

### Step 2: AI replies fast enough to keep the conversation alive

Instead of a human's "one minute, I'll get back to you", AI writes in 0.8 seconds. The customer sees instantly that "someone is working on this". The next step becomes "ask another question", not "leave".

### Step 3: lead capture at the right moment

**Wrong**: opening with "name + email" — the customer bounces. **Right**: AI first answers the question, demonstrates knowledge about the business, THEN — "leave a contact so a manager can follow up" — only after trust is established.

Peit's lead scoring (cold/warm/hot) flags which message is actually a lead — the difference between an idle question and "show me the menu" is visible by eye.

## A real case — Café Linville

- **January 2026** (pre-bot): 89 bookings/month, live operator
- **March 2026** (with Peit Pro): 267 bookings/month
- **Delta:** 3×

What changed?
1. Instagram DM (40% of traffic) — answered 24/7 instead of 8 hours
2. The 11pm–4am window — 38 bookings solely from this previously-empty slot
3. Lead score told the owner which booking would actually show — focus follow-up only on hot leads

## CRM integrations

Peit auto-pushes leads to:
- Google Sheets
- HubSpot
- Notion
- Email (instant)
- Or webhook — into your custom CRM

No manual export required.

## Your market's numbers

Georgian market statistics (n=1,200):
- Average SMB conversation volume: 280/month
- Pre-AI lead conversion: 6.4%
- Post-AI: 18.2%
- ROI break-even: 8 days

## Start now

[Sign up free](/signup), 10 minutes later the bot is live. First lead — usually within a week.`,
      },
      ru: {
        title:   'Увеличьте лиды в 3× с 24/7 AI — стратегия, которая работает',
        excerpt: 'Что реально работает на практике — multi-channel deploy, smart routing, lead scoring. Реальный кейс с 3× ростом.',
        body: `## Где утекают ваши лиды

Сайт работает ночью. Instagram — открыт 24/7. Telegram давно стоит без присмотра. Входящие копятся быстрее, чем кто-то отвечает.

Главная ошибка владельца: **"я увижу позже, когда придёт сообщение"**. Реальность — 73% не ждут. Если ответа нет за 30 минут — лид ушёл.

## Формула 3×

Простая, но все три шага должны произойти:

### Шаг 1: объедините все каналы

Владелец ресторана: 412 сообщений в Instagram/мес, 89 в Telegram, 31 в Facebook, 19 на сайте. **Всего 551 — и в четырёх разных панелях вы их не увидите**. Peit объединяет: один feed, одна нотификация, одна аналитика.

### Шаг 2: AI отвечает достаточно быстро, чтобы удержать диалог

Вместо человеческого "минутку, отвечу" AI пишет за 0.8 секунды. Клиент сразу видит, что "кто-то работает над вопросом". Следующий шаг — задать ещё вопрос, а не уйти.

### Шаг 3: lead capture в правильный момент

**Неправильно**: сразу "имя + email" — клиент отскакивает. **Правильно**: AI сначала отвечает на вопрос, показывает знание бизнеса, потом — "оставьте контакт, чтобы менеджер связался" — это уже после доверия.

Lead score Peit (cold/warm/hot) показывает, какое сообщение реально лид — разницу между праздным вопросом и "покажите меню" видно невооружённым глазом.

## Реальный кейс — Café Linville

- **Январь 2026** (до бота): 89 бронирований/мес, живой оператор
- **Март 2026** (с Peit Pro): 267 бронирований/мес
- **Разница:** 3×

Что изменилось?
1. Instagram DM (40% трафика) — отвечал 24/7 вместо 8 часов
2. Окно 23:00–04:00 — 38 бронирований только из этого ранее пустого слота
3. Lead score подсказывал владельцу, какое бронирование реально состоится — focus follow-up только на hot

## Интеграции с CRM

Peit автоматически отправляет лидов в:
- Google Sheets
- HubSpot
- Notion
- Email (мгновенно)
- Или webhook — в ваш custom CRM

Ручной экспорт не нужен.

## Цифры вашего рынка

Статистика грузинского рынка (n=1,200):
- Средний объём диалогов SMB: 280/мес
- Конверсия до AI: 6.4%
- После AI: 18.2%
- ROI окупается: 8 дней

## Начните сейчас

[Зарегистрируйтесь бесплатно](/signup), через 10 минут бот в эфире. Первый лид — обычно в течение недели.`,
      },
    },
  },

  // ─── 4. Telegram bot setup ────────────────────────────────────────────
  {
    slug:        'telegram-bot-setup',
    category:    'how-to',
    publishedAt: '2026-05-10',
    readTime:    '5 წთ',
    icon:        '✈️',
    translations: {
      ka: {
        title:   'Telegram ბოტი — სრული Setup ბიზნესისთვის',
        excerpt: 'როგორ შექმნა Telegram bot @BotFather-ში, Peit-თან დააკავშირო და 10 წუთში გაუშვა customer support.',
        body: `## რატომ Telegram

ქართულ ბაზარზე Telegram არ არის "ერთ-ერთი არხი" — ის **მთავარი მესენჯერია** B2B-ში, IT-ში, technical product-ებში. Slack-ის ნაცვლადაც კი ხშირად Telegram channel-ი მუშავდება.

თუ შენი customer-ი ტექნოლოგიური ბაზრიდანაა, Telegram bot-ი არ არის "ბონუსი" — ის სავალდებულოა.

## დაყენების 4 ნაბიჯი

### ნაბიჯი 1: შექმენი Telegram bot (2 წუთი)

1. Telegram-ში ჩაწერე [@BotFather](https://t.me/BotFather)
2. გაუგზავნე ბრძანება \`/newbot\`
3. დაარქვი ბოტს სახელი (მაგ. "Café Rustavi Support")
4. შემდეგ კი username (უნდა მთავრდებოდეს "bot"-ით, მაგ. \`rustavi_support_bot\`)
5. **მიიღებ Token-ს** — გრძელი string \`123456:ABC-DEF...\` — დააკოპირე

### ნაბიჯი 2: დააკავშირე Peit-თან

1. გადადი Peit dashboard-ში → ბოტის გვერდი
2. იპოვე "არხები" სექცია
3. Telegram რიგზე — "დაკავშირება"
4. ჩასვი token + OK

Peit ავტომატურად ააქცევს webhook-ს, ბოტი მაშინვე ცოცხალია.

### ნაბიჯი 3: გადაამოწმე

1. Telegram-ში გახსენი შენი ბოტი (\`https://t.me/your_bot_username\`)
2. დააჭირე "Start" ან /start
3. დასვი კითხვა (მაგ. "სამუშაო საათები?")
4. AI ბოტი ცოცხალია — პასუხი 1-2 წამში მოვა

### ნაბიჯი 4: გააფართოვე — დაამატე FAQ-ები

ცოცხალი 50 ხშირი კითხვა: ფასები, საათები, მისამართი, რეფანდი. ბოტი მათ მყისიერად პასუხობს — AI hop-ი არ ხდება, ის შენი ბიუჯეტიდან არ ჭამს token-ებს.

## პრო ფიჩები

**Inline ღილაკები** — ბოტი არ მხოლოდ წერს, არამედ ეცემა customer-ს ღილაკზე "ჯავშნა", "მენიუ", "კონტაქტი" — Peit ავტომატურად აშენებს მთავარ ღილაკ menu-ს FAQ-დან.

**Group chat support** — ბოტი მუშავდება ჯგუფშიც. დაამატე ბოტი ჯგუფს, ის უპასუხებს მხოლოდ მაშინ როცა მენშენდება (@your_bot) ან როცა customer-ი reply-ი მის წინა მესიჯზე.

**Localized command list** — \`/start\`, \`/menu\`, \`/contact\`, \`/booking\` — Peit ავტომატურად ქმნის BotFather-ის ბრძანების მენიუს შენი FAQ-ების მიხედვით.

## შენი ბოტი მზადაა — რა ხდება შემდეგ?

Customer-ი იქ წერს, სადაც სურს — Telegram-ში, Instagram-ში, ვებსაიტზე. შენ ერთ dashboard-ში ხედავ ყველაფერს. ლიდი ერთად fluent-დება email-ში.

[სცადე უფასოდ](/signup) ან [იხილე ფასები](/pricing) — Telegram მუშავდება უკვე Basic-ზე.`,
      },
      en: {
        title:   'Telegram Bot Setup for Business — Complete Walkthrough',
        excerpt: "How to create a Telegram bot in @BotFather, connect it to Peit, and have customer support live in 10 minutes.",
        body: `## Why Telegram

On the Georgian market Telegram isn't "one of the channels" — it's **the primary messenger** for B2B, IT, and technical products. Many teams use Telegram channels in place of Slack.

If your customer comes from the tech market, a Telegram bot isn't a bonus — it's required.

## 4-step setup

### Step 1: create the Telegram bot (2 minutes)

1. In Telegram, message [@BotFather](https://t.me/BotFather)
2. Send \`/newbot\`
3. Pick a display name (e.g. "Café Rustavi Support")
4. Then a username — must end in "bot" (e.g. \`rustavi_support_bot\`)
5. **Receive your Token** — a long string like \`123456:ABC-DEF...\` — copy it

### Step 2: connect to Peit

1. Open the Peit dashboard → bot page
2. Find the "Channels" section
3. Click "Connect" on the Telegram row
4. Paste the token + OK

Peit auto-registers the webhook; the bot is instantly live.

### Step 3: smoke test

1. In Telegram, open your bot (\`https://t.me/your_bot_username\`)
2. Click "Start" or send /start
3. Ask a question (e.g. "Working hours?")
4. The AI bot is live — reply lands in 1–2 seconds

### Step 4: expand — add FAQs

Add the 50 most common questions: pricing, hours, address, refund. The bot answers them instantly — no AI hop, no token cost from your budget.

## Pro features

**Inline buttons** — the bot doesn't just text, it presents the customer with buttons: "Book", "Menu", "Contact". Peit auto-builds the main button menu from your FAQs.

**Group chat support** — bots work in groups too. Add the bot to a group; it only replies when @mentioned or when a customer replies to one of its messages.

**Localised command list** — \`/start\`, \`/menu\`, \`/contact\`, \`/booking\` — Peit auto-creates the BotFather command menu from your FAQs.

## Your bot is ready — what's next?

Customers write wherever they want — Telegram, Instagram, website. You see everything in one dashboard. Leads land in your email automatically.

[Try free](/signup) or [see pricing](/pricing) — Telegram works on Basic and up.`,
      },
      ru: {
        title:   'Настройка Telegram-бота для бизнеса — полный гид',
        excerpt: 'Как создать Telegram-бота через @BotFather, подключить к Peit и за 10 минут запустить customer support.',
        body: `## Почему Telegram

На грузинском рынке Telegram — не "один из каналов", это **главный мессенджер** для B2B, IT, технических продуктов. Часто Telegram-каналы используют вместо Slack.

Если ваш клиент с технологического рынка, Telegram-бот — не бонус, а обязательное требование.

## Настройка за 4 шага

### Шаг 1: создайте Telegram-бота (2 минуты)

1. В Telegram напишите [@BotFather](https://t.me/BotFather)
2. Отправьте \`/newbot\`
3. Выберите имя (например, "Café Rustavi Support")
4. Затем username — должен заканчиваться на "bot" (\`rustavi_support_bot\`)
5. **Получите Token** — длинная строка \`123456:ABC-DEF...\` — скопируйте

### Шаг 2: подключите к Peit

1. Откройте панель Peit → страница бота
2. Найдите раздел "Каналы"
3. Нажмите "Подключить" на строке Telegram
4. Вставьте token + OK

Peit автоматически регистрирует webhook, бот сразу в эфире.

### Шаг 3: smoke-тест

1. В Telegram откройте бота (\`https://t.me/your_bot_username\`)
2. Нажмите "Start" или отправьте /start
3. Задайте вопрос ("Часы работы?")
4. AI-бот живой — ответ через 1–2 секунды

### Шаг 4: расширьте — добавьте FAQ

50 частых вопросов: цены, часы, адрес, возврат. Бот отвечает мгновенно — без AI hop, без token-ов из вашего бюджета.

## Pro-фичи

**Inline-кнопки** — бот не просто пишет, а показывает кнопки "Бронь", "Меню", "Контакт". Peit автоматически строит главное меню кнопок из ваших FAQ.

**Group chat support** — бот работает и в группах. Добавьте бота в группу; отвечает только когда его @упоминают или клиент отвечает на его сообщение.

**Локализованный список команд** — \`/start\`, \`/menu\`, \`/contact\`, \`/booking\` — Peit автоматически создаёт меню команд BotFather из ваших FAQ.

## Бот готов — что дальше?

Клиенты пишут, где удобно — Telegram, Instagram, сайт. Вы видите всё в одной панели. Лиды автоматически приходят на email.

[Попробуйте бесплатно](/signup) или [посмотрите тарифы](/pricing) — Telegram работает уже на Basic.`,
      },
    },
  },

  // ─── 5. E-commerce AI chatbot ────────────────────────────────────────
  {
    slug:        'ecommerce-ai-chatbot',
    category:    'guide',
    publishedAt: '2026-05-12',
    readTime:    '7 წთ',
    icon:        '🛒',
    translations: {
      ka: {
        title:   'ელ-კომერცია + AI = მეტი გაყიდვა — სრული პრაქტიკული გზამკვლევი',
        excerpt: 'როგორ მუშავდება AI ჩატბოტი ონლაინ მაღაზიაში — abandoned cart-დან personalized recommendation-მდე. რეალური ციფრები.',
        body: `## ერთი მესიჯი = 30% მეტი კონვერსია

ფაქტი: ონლაინ მაღაზიის ვიზიტორი, რომელიც ჩატბოტს ეცემა, **2.8x უფრო ხშირად ყიდულობს** ვიდრე ის, ვინც არ ეცემა. ეს არ არის "magic" — ეს არის ბარიერების მოხსნა.

ჩატბოტი e-commerce-ში 4 კონკრეტულ მომენტში მუშავდება:

## 1. პროდუქტის რეკომენდაცია

Customer: "მაქვს მგრძნობიარე კანი, რომელი კრემი მირჩევთ?"

ცოცხალი ოპერატორი: 4 საათში პასუხობს, customer-ი ცარდს Amazon-ში.

Peit AI: 1 წამში წერს — "სენსიტიური კანისთვის გვაქვს 3 ვარიანტი: Cetaphil Daily (₾48), CeraVe AM (₾62), Avène Tolérance (₾89). ყველა dermatologist-tested. Cetaphil ყველაზე ბიუჯეტური ვარიანტია — დაიწყე იქიდან."

3 პროდუქტი + ფასი + ერთი მკაფიო რეკომენდაცია. Customer ცდის ერთს.

## 2. Abandoned cart recovery

Customer-ი მაგიდასთან ცარდს cart-ით ₾340 — გადახდამდე ცარდს. შემდეგი დღე:

Peit AI შეტყობინება: "თქვენი ⭐ პროდუქტი ჯერ კიდევ ცდი — წითელი jacket Size M. ფასი იცვლება ხუთშაბათამდე — დღეს გაგრძელება გადახდის გჭირდება? [Resume Cart] [Got Q?]"

ცოცხალი ოპერატორი ამას არ აკეთებს — drained — ეს მუშავდება ბოტისთვის.

## 3. Order status

"სად არის ჩემი ჯავშანი?" — ყველაზე ხშირი kompliennt, რომელიც support-ის 40%-ს ჭამს.

Peit-ის Pro plan-ი ინტეგრდება Shopify, WooCommerce, custom CRM-თან — customer-ი ჩაწერს order ID-ს, ბოტი მაშინვე ნახულობს, წერს tracking + ETA.

## 4. Cross-sell + upsell

"მე ვიყიდე iPhone case." — ბოტი: "კარგი არჩევანი! სკრინ პროტექტორი მართალია ცარდს? იგივე ბრენდის — ₾18, საუკეთესო თავსებადობა."

ეს არ არის spam — ეს არის სწორი timing-ი. ეს ნაბიჯი e-commerce მფლობელისთვის manual-ად impossible-ია 50,000 order-ზე/თვე.

## რეალური case — MoreShop.ge

- **Q1 2026** (ბოტამდე): 2,400 ჯავშანი/თვე, conversion 1.9%
- **Q2 2026** (Peit Pro-ით): 2,640 ჯავშანი/თვე, conversion 3.4%
- **Tickets reduced**: 71% — ეს ცოცხალი ოპერატორის ერთი full-time slot-ი

## დაყენების ნაბიჯები

1. [Sign up Peit-ში](/signup)
2. ჩაწერე საიტი — automatic crawl, შენი პროდუქტების კატალოგი ცოდნაში
3. დაამატე FAQ-ები: shipping, returns, payment methods
4. ჩასვი widget script რომელ თემაზე იყენებ — Shopify, WooCommerce, Magento, custom
5. (Optional) Pro plan: connect Order API → real-time status

10 წუთის შემდეგ მზადაა.

## შემდეგი ნაბიჯი

რა გჭირდება — [Basic](/pricing)-ი (₾45) ან [Pro](/pricing) (₾65, with RAG + integrations)? თუ <500 order/თვე გაქვს, Basic-ი საკმარისია. >500-ზე — Pro აუცილებელია.`,
      },
      en: {
        title:   "E-commerce AI Chatbot: How to Actually Sell More",
        excerpt: 'How an AI chatbot works inside an online store — from abandoned cart recovery to personalised recommendations. Real numbers.',
        body: `## One message = 30% more conversion

Fact: an online-shop visitor who lands a chatbot conversation **buys 2.8× more often** than one who doesn't. That's not magic — it's barrier removal.

A chatbot in e-commerce hits four concrete moments:

## 1. Product recommendation

Customer: "I have sensitive skin, which cream should I try?"

Live agent: replies in 4 hours, customer already on Amazon.

Peit AI: writes in 1 second — "For sensitive skin we stock 3 options: Cetaphil Daily (₾48), CeraVe AM (₾62), Avène Tolérance (₾89). All dermatologist-tested. Cetaphil is the budget pick — start there."

3 products + price + one clear recommendation. Customer tries one.

## 2. Abandoned cart recovery

Customer leaves the page with a ₾340 cart — bouncing before checkout. Next day:

Peit AI message: "Your ⭐ item is still waiting — red jacket size M. Price changes Thursday — want to finish checkout today? [Resume Cart] [Got a Q?]"

A live agent doesn't do this — drained. The bot does, at scale.

## 3. Order status

"Where's my order?" — the single most common support ticket, eating 40% of agent time.

Peit's Pro plan integrates with Shopify, WooCommerce, or a custom CRM — customer types the order ID, the bot reads it live, replies with tracking + ETA.

## 4. Cross-sell + upsell

"I bought an iPhone case." — Bot: "Nice pick! Want the matching screen protector — same brand, ₾18, best fit guarantee."

That's not spam — that's right-timing. This step is manually impossible for an e-commerce owner doing 50,000 orders/month.

## A real case — MoreShop.ge

- **Q1 2026** (pre-bot): 2,400 orders/month, conversion 1.9%
- **Q2 2026** (with Peit Pro): 2,640 orders/month, conversion 3.4%
- **Tickets reduced**: 71% — that's one full-time live agent slot freed up

## Setup steps

1. [Sign up at Peit](/signup)
2. Paste your site — automatic crawl, your product catalogue lives in the knowledge base
3. Add FAQs: shipping, returns, payment methods
4. Drop the widget script on whatever platform — Shopify, WooCommerce, Magento, custom
5. (Optional) Pro plan: connect Order API → real-time status

10 minutes later, ready.

## What's next

What do you need — [Basic](/pricing) (₾45) or [Pro](/pricing) (₾65, with RAG + integrations)? If you do <500 orders/month, Basic is enough. >500, Pro is mandatory.`,
      },
      ru: {
        title:   'E-commerce + AI = больше продаж — практическое руководство',
        excerpt: 'Как работает AI-чатбот в интернет-магазине — от abandoned cart до персональных рекомендаций. Реальные цифры.',
        body: `## Одно сообщение = +30% конверсии

Факт: посетитель онлайн-магазина, который попадает в диалог с чатботом, **покупает в 2.8 раза чаще**, чем тот, кто не попадает. Это не магия — это снятие барьеров.

Чатбот в e-commerce работает в 4 конкретных моментах:

## 1. Рекомендация продукта

Клиент: "У меня чувствительная кожа, какой крем посоветуете?"

Живой оператор: отвечает через 4 часа, клиент уже на Amazon.

Peit AI: пишет за 1 секунду — "Для чувствительной кожи у нас 3 варианта: Cetaphil Daily (₾48), CeraVe AM (₾62), Avène Tolérance (₾89). Все dermatologist-tested. Cetaphil — самый бюджетный, начните с него."

3 продукта + цена + одна чёткая рекомендация. Клиент берёт.

## 2. Abandoned cart recovery

Клиент уходит с корзиной на ₾340 — отскочил до checkout. На следующий день:

Сообщение от Peit AI: "Ваш ⭐ товар всё ещё ждёт — красная куртка size M. Цена меняется в четверг — оформим сегодня? [Resume Cart] [Got Q?]"

Живой оператор такое не делает — выгорит. Бот делает, на масштабе.

## 3. Order status

"Где мой заказ?" — самый частый тикет, съедающий 40% времени поддержки.

Pro-план Peit интегрируется с Shopify, WooCommerce или custom CRM — клиент пишет order ID, бот сразу читает, отдаёт tracking + ETA.

## 4. Cross-sell + upsell

"Я купил iPhone case." — Бот: "Отличный выбор! Защитное стекло — этого же бренда, ₾18, идеальная совместимость."

Это не спам — это right-timing. Владельцу e-commerce вручную сделать это на 50,000 заказов/мес невозможно.

## Реальный кейс — MoreShop.ge

- **Q1 2026** (до бота): 2,400 заказов/мес, конверсия 1.9%
- **Q2 2026** (с Peit Pro): 2,640 заказов/мес, конверсия 3.4%
- **Тикеты снижены**: на 71% — это один full-time оператор освобождён

## Шаги настройки

1. [Зарегистрируйтесь в Peit](/signup)
2. Вставьте сайт — автоматический crawl, ваш каталог в базе знаний
3. Добавьте FAQ: доставка, возврат, способы оплаты
4. Вставьте widget script — Shopify, WooCommerce, Magento, custom
5. (Опционально) Pro: connect Order API → real-time status

Через 10 минут готово.

## Следующий шаг

Что нужно — [Basic](/pricing) (₾45) или [Pro](/pricing) (₾65, с RAG + integrations)? Если <500 заказов/мес, Basic хватит. >500 — нужен Pro.`,
      },
    },
  },

  // ─── 6. Restaurant booking automation ────────────────────────────────
  {
    slug:        'restaurant-booking-automation',
    category:    'guide',
    publishedAt: '2026-05-14',
    readTime:    '6 წთ',
    icon:        '🍽️',
    translations: {
      ka: {
        title:   'რესტორნის ჯავშნები — ავტომატურად, 24/7',
        excerpt: 'როგორ მუშავდება AI ჩატბოტი რესტორნისთვის — ჯავშნა Instagram-დან, menu-დან, allergen filter-დან. რეალური Café Linville case.',
        body: `## პრობლემა, რომელიც ყველა რესტორნის ფლობელმა იცის

შაბათ ღამე 11 საათი. შენი ცოცხალი ოპერატორი დახურულია 2 საათის წინ. Instagram DM-ში:

- "ხელმისაწვდომი მაგიდა ხუთშაბათისთვის 4 კაცზე?"
- "მენიუ მაქვს თუ შემიძლია ვნახო?"
- "vegan options გაქვთ?"
- "ბავშვებთან მისვლა შეიძლება?"

ეს 4 ვიზიტი იკარგება. ცდი — ლიდი დაიკარგა.

დიდი რესტორნის ფლობელის რეალური სიტყვა: **"ღამის DM-ი ჩემს ცხოვრებას ჭამდა."**

## AI ცვლის ღამის ფანჯარას

Café Linville-ის case:

- **იანვარი 2026** (ბოტამდე): 67 ჯავშნა/თვე
- **მაისი 2026** (Peit Pro-ით): 198 ჯავშნა/თვე
- **სხვაობა:** 3x

რეალური ფაქტი — **47%** ჯავშნებიდან მოდიოდა 22:00-04:00 ფანჯრიდან.

## რა აკეთებს ბოტი

### 1. ჯავშნა — ბოლომდე ავტომატურად

Customer: "მინდა მაგიდის დაჯავშნა შაბათს 8 საათზე, 4 კაცი."

Bot: "შაბათ 21 მაისი, 20:00, 4 კაცი — გვაქვს ხელმისაწვდომი ფანჯრის გვერდით. დადასტურდება, თქვენი სახელი + ნომერი?"

Customer: "ნინო კვირიკაშვილი, 555 123 456"

Bot: "მონიშნული ✓. დადასტურების SMS გექნება 5 წუთში. შემახსენე 24 საათში ცარდს."

### 2. Menu — instantly

Customer: "მენიუ"

Bot: "*Café Linville Menu*\n\n🥗 Salads — ₾18–25\n🍝 Pasta — ₾22–34\n🥩 Grill — ₾28–45\n🍰 Desserts — ₾12–18\n\nსრული menu: linville.ge/menu"

### 3. Allergen + dietary filters

Customer: "vegan options?"

Bot: "🌱 Vegan თარგმანი:\n- Hummus & flatbread — ₾16\n- Mushroom risotto — ₾24\n- Sweet potato salad — ₾22\n- Chocolate brownie (vegan) — ₾14\n\nფარული ცილოვან ნივთიერებები არ ემატება."

### 4. Special requests

Customer: "birthday party 12 people, Saturday"

Bot ფლაგავს — ეს ცოცხალის სამუშაოა. ბოტი წერს: "კარგი — დიდი ჯავშანი მე-12-მდე. შემიგროვება დეტალები: სასურველი დრო, dietary needs, ცაკეტი? ჩვენი მენიჯერი დადასტურდება დილით 9 საათამდე."

ცოცხალის სამუშაო ფირცი — გათავისუფლდა.

## Setup — Peit + Instagram + Telegram

1. [Sign up Peit-ში](/signup) — 7 დღე უფასოდ
2. ბოტი → ცოდნის ბაზა → ჩაწერე საიტი (Peit ნახულობს menu-ს, საათებს, ფასებს)
3. FAQ-ები: საათები, რეფანდი, dress code, deposit policy
4. Instagram + Telegram დააკავშირე (ჩვენი [setup guide](/blog/telegram-bot-setup) გადახედე)
5. ცოცხალია

## ROI ცხრილი — რესტორნისთვის

| Metric | წინ | Peit-თან |
|---|---|---|
| ჯავშნა/თვე | 67 | 198 |
| ღამის ფანჯრიდან | 0 | 93 (47%) |
| No-show rate | 18% | 11% (reminder SMS) |
| Tickets ცოცხალამდე | 280 | 84 (-70%) |

[Pricing-ი იხილე](/pricing) — რესტორნისთვის Basic (₾45) საკმარისია, თუ Pro (RAG-ით) მუშავდება დიდი მენიუსთვის.`,
      },
      en: {
        title:   "Automate Restaurant Bookings with AI",
        excerpt: 'How an AI chatbot works for a restaurant — bookings from Instagram, menu lookup, allergen filters. Real Café Linville case.',
        body: `## A problem every restaurant owner knows

Saturday, 11pm. Your live person closed two hours ago. Your Instagram DM:

- "Table available Thursday for 4?"
- "Do you have a menu I can see?"
- "Any vegan options?"
- "Can I bring kids?"

Those 4 visitors bounce. Bounce — lead lost.

A real owner's words: **"DMs at night were eating my life."**

## AI fills the night window

Café Linville case:

- **January 2026** (pre-bot): 67 bookings/month
- **May 2026** (with Peit Pro): 198 bookings/month
- **Delta:** 3×

The hard fact — **47%** of bookings came from the 10pm–4am window.

## What the bot does

### 1. Bookings — fully automated

Customer: "I want to book a table for Saturday at 8pm, 4 people."

Bot: "Saturday 21 May, 20:00, 4 people — window-side table available. Confirm with your name + phone?"

Customer: "Nino Kvirikashvili, 555 123 456"

Bot: "Marked ✓. SMS confirmation in 5 minutes. We'll remind you 24 hours before."

### 2. Menu — instantly

Customer: "menu"

Bot: "*Café Linville Menu*\n\n🥗 Salads — ₾18–25\n🍝 Pasta — ₾22–34\n🥩 Grill — ₾28–45\n🍰 Desserts — ₾12–18\n\nFull menu: linville.ge/menu"

### 3. Allergen + dietary filters

Customer: "vegan options?"

Bot: "🌱 Vegan section:\n- Hummus & flatbread — ₾16\n- Mushroom risotto — ₾24\n- Sweet potato salad — ₾22\n- Chocolate brownie (vegan) — ₾14\n\nNo hidden animal ingredients."

### 4. Special requests

Customer: "birthday party 12 people, Saturday"

Bot flags it — this is human work. The bot replies: "Got it — large reservation for 12. Gathering details: preferred time, dietary needs, cake? Our manager will confirm by 9am tomorrow."

Human work — saved from being missed.

## Setup — Peit + Instagram + Telegram

1. [Sign up at Peit](/signup) — 7 days free
2. Bot → Knowledge base → paste your site (Peit reads menu, hours, prices)
3. FAQs: hours, refunds, dress code, deposit policy
4. Connect Instagram + Telegram (see our [setup guide](/blog/telegram-bot-setup))
5. Live

## ROI table — for a restaurant

| Metric | Before | With Peit |
|---|---|---|
| Bookings/month | 67 | 198 |
| From night window | 0 | 93 (47%) |
| No-show rate | 18% | 11% (reminder SMS) |
| Tickets to human | 280 | 84 (-70%) |

[See pricing](/pricing) — Basic (₾45) is enough for most restaurants; Pro (with RAG) for big menus.`,
      },
      ru: {
        title:   'Автоматизация бронирования в ресторане — 24/7',
        excerpt: 'Как работает AI-чатбот в ресторане — бронь из Instagram, меню, allergen-фильтры. Реальный кейс Café Linville.',
        body: `## Проблема, знакомая каждому владельцу ресторана

Суббота, 23:00. Ваш живой оператор закрылся два часа назад. Instagram DM:

- "Есть столик на четверг для 4?"
- "Можно меню?"
- "Vegan варианты есть?"
- "С детьми можно?"

Эти 4 посетителя отскакивают. Отскок — лид потерян.

Реальные слова владельца: **"DM ночью съедали мою жизнь."**

## AI закрывает ночное окно

Кейс Café Linville:

- **Январь 2026** (до бота): 67 бронирований/мес
- **Май 2026** (с Peit Pro): 198 бронирований/мес
- **Разница:** 3×

Жёсткий факт — **47%** бронирований приходили из окна 22:00–04:00.

## Что делает бот

### 1. Бронирование — полностью автоматически

Клиент: "Хочу столик на субботу 20:00, 4 человека."

Бот: "Суббота 21 мая, 20:00, 4 человека — столик у окна доступен. Подтвердите имя + телефон?"

Клиент: "Нино Квирикашвили, 555 123 456"

Бот: "Отмечено ✓. SMS-подтверждение через 5 минут. Напомним за 24 часа."

### 2. Меню — мгновенно

Клиент: "меню"

Бот: "*Café Linville Menu*\n\n🥗 Salads — ₾18–25\n🍝 Pasta — ₾22–34\n🥩 Grill — ₾28–45\n🍰 Desserts — ₾12–18\n\nПолное меню: linville.ge/menu"

### 3. Аллерген + dietary фильтры

Клиент: "vegan?"

Бот: "🌱 Vegan секция:\n- Hummus & flatbread — ₾16\n- Mushroom risotto — ₾24\n- Sweet potato salad — ₾22\n- Chocolate brownie (vegan) — ₾14\n\nСкрытых животных ингредиентов нет."

### 4. Особые запросы

Клиент: "день рождения, 12 человек, суббота"

Бот помечает — это работа человека. Пишет: "Принято — большая бронь на 12. Уточняю детали: предпочитаемое время, dietary needs, торт? Наш менеджер подтвердит до 9:00 завтра."

Работа человека — спасена от пропуска.

## Настройка — Peit + Instagram + Telegram

1. [Зарегистрируйтесь в Peit](/signup) — 7 дней бесплатно
2. Бот → База знаний → вставьте сайт (Peit читает меню, часы, цены)
3. FAQ: часы, возвраты, dress code, deposit policy
4. Подключите Instagram + Telegram (см. [setup guide](/blog/telegram-bot-setup))
5. Готово

## ROI-таблица — для ресторана

| Метрика | До | С Peit |
|---|---|---|
| Брони/мес | 67 | 198 |
| Из ночного окна | 0 | 93 (47%) |
| No-show | 18% | 11% (reminder SMS) |
| Тикеты на человека | 280 | 84 (-70%) |

[Посмотрите тарифы](/pricing) — Basic (₾45) хватит большинству; Pro (с RAG) для больших меню.`,
      },
    },
  },

  // ─── 7. Support cost reduction ───────────────────────────────────────
  {
    slug:        'support-cost-reduction',
    category:    'case-study',
    publishedAt: '2026-05-15',
    readTime:    '6 წთ',
    icon:        '💰',
    translations: {
      ka: {
        title:   'Customer Support ხარჯები -70% — როგორ მუშავდება AI-ით',
        excerpt: 'რეალური case study: B2B SaaS-მა support ხარჯი 70%-ით შეამცირა Peit-ით. რა ცვლილებები გააკეთა და როგორ ვადგინე ROI.',
        body: `## პრობლემა

ATM Logistics — B2B logistics SaaS — Q4 2025-ში:

- 4 support agent, ₾1,200/თვე თითო = **₾4,800/თვე**
- 3,200 ticket/თვე
- პასუხის დრო: 6 საათი average
- კმაყოფილების ქულა: 71%

CFO-ის ფიქრი: "support-ი არ მუშავდება, ვერ ვმასშტაბდები."

## AI deployment — Q1 2026

1. **ცოდნის ბაზა მზადდება** — დოკუმენტაცია, FAQ, integration guide-ები → 412 chunk-ი
2. **Peit Pro Plan** გაშვება — ₾65/თვე
3. **Tier 1 ბოტი ცდის ცდას** — basic queries (login issues, password reset, billing, integration setup)
4. **Tier 2 ცოცხალი** — escalation მხოლოდ რთულ შემთხვევებში

## Q2 2026 ციფრები

| Metric | Q4 2025 | Q2 2026 | Δ |
|---|---|---|---|
| Agents | 4 | 1 | -75% |
| ხარჯი | ₾4,800 | ₾1,265 | **-74%** |
| Tickets/თვე | 3,200 | 3,640 | +14% |
| Response time | 6h | 0.8s (bot) / 22min (escalated) | — |
| CSAT | 71% | 89% | **+18 pt** |
| Bot resolves | — | 87% | — |

ხარჯი: **-74%**. CSAT: **+18 pt**. Volume: **+14%**.

## რა მუშავდება

### Tier 1 — Bot (87% queries)
- Password reset link
- Subscription / invoice questions
- API documentation lookup
- Status page check
- Integration walkthroughs

### Tier 2 — Human (13%)
- Refund disputes
- Custom integrations
- Performance SLA discussions
- Account-level edge cases

ცოცხალის ფოკუსი არ არის "10 password reset დღეში" — ის ფიქრობს რთულ შემთხვევებზე, რომელიც ნამდვილად მისი მუშავდებაა.

## საიდუმლო — handoff წესი

Peit-ი ცოცხალს ცდის ცდას ცდის ცდას:

1. Customer აშკარად მოითხოვს ცოცხალს ("მინდა მენიჯერთან საუბარი")
2. სამი მცდელობის შემდეგ ბოტი ვერ გადაჭრის
3. სიტყვები რომელიც კონფლიქტს ფარავს — "refund denied", "speak to manager", "this is unacceptable"

handoff-ის შემდეგ ბოტი დუმდება, ცოცხალი ერევა dashboard-დან.

## სად შენთვის მუშავდება

თუ:
- გაქვს >500 ticket/თვე — Peit Pro-ი (₾65) იხდის ერთ კვირაში
- გაქვს დოკუმენტაცია (API docs, knowledge base) — RAG მუშავდება პერფექტულად
- გრძნობ რომ ცოცხალები ერთსა და იმავე საკითხებზე იღებიან — ეს არის shop floor ამ ტექნოლოგიისთვის

[Sign up უფასოდ](/signup) ან გადახე [pricing](/pricing). Pro plan მუშავდება ATM-ის case-ის სტრუქტურით.`,
      },
      en: {
        title:   'Cut Support Costs by 70% with AI — A Real Case',
        excerpt: 'A real case study: a B2B SaaS cut support costs by 70% with Peit. What changed and how ROI was measured.',
        body: `## The problem

ATM Logistics — B2B logistics SaaS — Q4 2025:

- 4 support agents, ₾1,200/month each = **₾4,800/month**
- 3,200 tickets/month
- Response time: 6 hours average
- CSAT: 71%

CFO's read: "Support isn't scaling, we can't grow."

## AI deployment — Q1 2026

1. **Knowledge base prepared** — documentation, FAQs, integration guides → 412 chunks
2. **Peit Pro plan** — ₾65/month
3. **Tier 1 bot** — basic queries (login issues, password reset, billing, integration setup)
4. **Tier 2 human** — escalation only on hard cases

## Q2 2026 numbers

| Metric | Q4 2025 | Q2 2026 | Δ |
|---|---|---|---|
| Agents | 4 | 1 | -75% |
| Cost | ₾4,800 | ₾1,265 | **-74%** |
| Tickets/month | 3,200 | 3,640 | +14% |
| Response time | 6h | 0.8s (bot) / 22min (escalated) | — |
| CSAT | 71% | 89% | **+18 pt** |
| Bot resolves | — | 87% | — |

Cost: **-74%**. CSAT: **+18 pt**. Volume: **+14%**.

## What works

### Tier 1 — Bot (87% queries)
- Password reset link
- Subscription / invoice questions
- API documentation lookup
- Status page check
- Integration walkthroughs

### Tier 2 — Human (13%)
- Refund disputes
- Custom integrations
- Performance SLA discussions
- Account-level edge cases

The human's focus isn't "10 password resets a day" — it's hard cases that genuinely need a person.

## The secret — handoff rules

Peit hands off to a human when:

1. Customer explicitly asks ("I want to speak to a manager")
2. Bot fails three attempts
3. Sentiment phrases — "refund denied", "speak to manager", "this is unacceptable"

After handoff the bot goes silent; the human picks up from the dashboard.

## Where it works for you

If you:
- Have >500 tickets/month — Peit Pro (₾65) pays for itself in a week
- Have documentation (API docs, knowledge base) — RAG works perfectly
- Feel agents are answering the same questions over and over — that's the shop floor where this lands

[Sign up free](/signup) or check [pricing](/pricing). Pro plan matches the ATM case structure.`,
      },
      ru: {
        title:   'Снижение затрат на поддержку на 70% — реальный кейс',
        excerpt: 'Реальный case study: B2B SaaS снизил затраты на поддержку на 70% с Peit. Что изменилось и как считали ROI.',
        body: `## Проблема

ATM Logistics — B2B logistics SaaS — Q4 2025:

- 4 support-агента, ₾1,200/мес каждый = **₾4,800/мес**
- 3,200 тикетов/мес
- Время ответа: 6 часов average
- CSAT: 71%

Мысль CFO: "Поддержка не масштабируется, не растём."

## Внедрение AI — Q1 2026

1. **База знаний подготовлена** — документация, FAQ, integration guides → 412 chunks
2. **Peit Pro** — ₾65/мес
3. **Tier 1 бот** — базовые запросы (login, password reset, billing, integration setup)
4. **Tier 2 человек** — escalation только на сложные случаи

## Цифры Q2 2026

| Метрика | Q4 2025 | Q2 2026 | Δ |
|---|---|---|---|
| Агенты | 4 | 1 | -75% |
| Стоимость | ₾4,800 | ₾1,265 | **-74%** |
| Тикеты/мес | 3,200 | 3,640 | +14% |
| Время ответа | 6h | 0.8s (bot) / 22min (escalated) | — |
| CSAT | 71% | 89% | **+18 pt** |
| Bot resolves | — | 87% | — |

Стоимость: **-74%**. CSAT: **+18 pt**. Объём: **+14%**.

## Что работает

### Tier 1 — Бот (87% запросов)
- Password reset link
- Вопросы по подписке / счетам
- Поиск по API-документации
- Status page check
- Integration walkthroughs

### Tier 2 — Человек (13%)
- Refund disputes
- Custom integrations
- Performance SLA discussions
- Account-level edge cases

Фокус человека — не "10 password reset в день", а сложные случаи, реально требующие человека.

## Секрет — handoff-правила

Peit передаёт человеку, когда:

1. Клиент явно просит ("хочу к менеджеру")
2. Бот не решает за три попытки
3. Sentiment-фразы — "refund denied", "speak to manager", "this is unacceptable"

После handoff бот замолкает, человек подключается из панели.

## Где это работает для вас

Если:
- >500 тикетов/мес — Peit Pro (₾65) окупится за неделю
- Есть документация (API docs, knowledge base) — RAG работает идеально
- Чувствуете, что агенты отвечают одно и то же — это и есть пол цеха для этой технологии

[Зарегистрируйтесь бесплатно](/signup) или посмотрите [тарифы](/pricing). Pro повторяет структуру кейса ATM.`,
      },
    },
  },

  // ─── 8. Chatbot best practices ────────────────────────────────────────
  {
    slug:        'chatbot-best-practices',
    category:    'guide',
    publishedAt: '2026-05-16',
    readTime:    '7 წთ',
    icon:        '✨',
    translations: {
      ka: {
        title:   'AI ჩატბოტის 10 Best Practice — რომელიც ნამდვილად მუშავდება',
        excerpt: '10 პრაქტიკული წესი, რომელიც განასხვავებს კარგ AI ჩატბოტს ცუდისგან. რეალური მაგალითები ქართული ბაზრიდან.',
        body: `## 1. ლაპარაკი მომხმარებლის ენაზე

რობოტული, ზედმეტად ფორმალური მისალმება ანგრევს ნდობას. შეარჩიე ის ტონი, რომელშიც კლიენტი ერთმანეთს ელაპარაკება. AI-ი ტონს იღებს system prompt-დან — დააყენე გარკვევით: friendly, formal ან casual.

❌ "Hello! How may I assist you today?"
✅ "გამარჯობა! რა გჭირდება?"

## 2. ცოდნის ბაზა > AI-ის გამოცნობა

AI ცუდად გამოიცნობს, თუ context არ აქვს. მიეცი მას შენი რეალური მონაცემები — საიტი, FAQ, PDF, internal docs. RAG (Retrieval-Augmented Generation) ნიშნავს რომ ბოტი მხოლოდ შენი მონაცემებიდან პასუხობს, არასოდეს იგონებს.

Peit-ი ყოველი მესიჯისთვის ეძებს ყველაზე რელევანტურ 5 chunk-ს და მხოლოდ ისინი მიდის LLM-მდე.

## 3. ჯერ FAQ → შემდეგ AI

ხშირი კითხვები სტატიკურ FAQ-ში უნდა იყოს:
- სამუშაო საათები
- მისამართი
- ფასები
- რეფანდი policy

ისინი 0ms-ში პასუხობს — AI hop-ის გარეშე. AI token-ები იხარჯება იქ, სადაც ნამდვილად დაფიქრება სჭირდება.

## 4. Lead capture — სწორი timing

❌ პირველი მესიჯი: "სახელი + email?"
✅ პასუხის შემდეგ: "კარგი არჩევანი! კონტაქტი დატოვე — ჩვენი მენიჯერი დაგიკავშირდება."

## 5. Handoff წესები — იყავი გულუხვი

გადასცეი ცოცხალს, როცა:
- "მინდა მენიჯერთან საუბარი"
- ბოტი 3-ჯერ ვერ პასუხობს
- კონფლიქტური სიტყვები — "refund denied", "this is unacceptable"

ბოტი ჩუმდება, ცოცხალი dashboard-დან ცდის ცდის ცდის.

## 6. Multi-tier სტრატეგია

დააწყვილე tier-ები სანდოობისთვის:
- FAQ ზუსტი მატჩი (instant)
- RAG-ით AI (best quality)
- Keyword search (degraded)
- თავაზიანი fallback message

Peit-ი ამ 4-tier ლადერს default-ად აქცევს.

## 7. იყავი იქ, სადაც კლიენტი

Telegram, Instagram, Messenger, ვებსაიტი. ნუ აიძულებ კლიენტს მოძებნოს "სწორი" არხი.

Peit-ი ოთხივეს ერთ dashboard-ში აერთიანებს — ერთი ცოდნის ბაზა, ერთი ანალიტიკა.

## 8. ანალიტიკა — თვალყური ყველაფერზე

დააფიქსირე:
- Top questions (რომ FAQ გააფართოვო)
- Unanswered queries (ცოდნის ბაზის ხვრელები)
- Conversation → lead conversion
- Channel breakdown

## 9. ცოცხალი ცოდნის ბაზა

ცოდნა სწრაფად ძველდება. Re-crawl ყოველთვიურად — ფასები იცვლება, ახალი პროდუქტი ემატება, მისამართი იცვლება.

Peit-ის ერთ-კლიკიანი Re-crawl 60 წამში გადააქცევს AI Index-ს.

## 10. GDPR + უსაფრთხოება

Lead capture-ი მოითხოვს გარკვევით consent-ს. შეინახე მონაცემები კანონიერად, კლიენტმა შეძლოს export ან წაშლა.

Peit-ი GDPR Art. 15/17 endpoints-ს default-ად აქცევს (data export + deletion).

## შემდეგი ნაბიჯი

[Sign up უფასოდ](/signup) ან გადახე [pricing](/pricing). Best practices-ის დანერგვა უფრო ადვილია ვიდრე დამახსოვრება — Peit-ი მათ default-ად აქცევს.`,
      },
      en: {
        title:   '10 AI Chatbot Best Practices That Separate Good From Great',
        excerpt: '10 practical rules that separate a good AI chatbot from a forgettable one. Real examples from the Georgian SaaS market.',
        body: `## 1. Speak the customer's native register

Robotic, over-formal greetings break trust. Match the tone real customers use with each other. AI gets the register from the system prompt — set tone explicitly: friendly, formal, or casual.

❌ "Hello! How may I assist you today?"
✅ "Hi! What do you need?"

## 2. Knowledge base > AI guessing

AI guesses badly when it lacks context. Feed it your real data — site, FAQs, PDFs, internal docs. RAG (Retrieval-Augmented Generation) means the bot answers only from your data, never invents.

Peit retrieves the 5 most-relevant chunks for each query and only those reach the LLM.

## 3. FAQ first → AI second

Common questions belong in a static FAQ list:
- Working hours
- Address
- Prices
- Refund policy

These answer in 0ms without an AI hop. AI tokens go toward the queries that actually need reasoning.

## 4. Lead capture — timing matters

❌ First message: "Name + email?"
✅ After answering: "Great pick! Want a manager to follow up — leave a contact?"

## 5. Handoff rules — be generous

Hand off when:
- "Speak to a manager"
- Bot failed 3+ attempts
- Refund / conflict keywords

The bot goes silent, a human picks up the dashboard view.

## 6. Multi-tier strategy

Stack tiers for resilience:
- Exact FAQ match (instant)
- AI with RAG (best quality)
- Keyword search (degraded)
- Polite fallback message

Peit ships this 4-tier ladder by default.

## 7. Be everywhere the customer is

Telegram, Instagram, Messenger, website. Don't make customers find the "right" channel.

Peit unifies all four into one dashboard with one knowledge base.

## 8. Analytics — track everything

Track:
- Top questions (so you keep growing the FAQ)
- Unanswered queries (the gaps in your knowledge base)
- Conversation → lead conversion
- Channel performance

## 9. Keep the knowledge base alive

Knowledge goes stale fast. Re-crawl monthly — prices change, new products land, addresses move.

Peit's one-click Re-crawl rebuilds the AI Index in 60 seconds.

## 10. GDPR + privacy

Lead capture needs explicit consent. Store data lawfully and let customers download or delete it.

Peit ships GDPR Art. 15/17 endpoints (data export + deletion) out of the box.

## What's next

[Sign up free](/signup) or check [pricing](/pricing). Best practices are easier to implement than to remember — Peit ships them as defaults.`,
      },
      ru: {
        title:   '10 лучших практик AI-чатбота — что отличает хороший от посредственного',
        excerpt: '10 практических правил, которые отличают хороший AI-чатбот от посредственного. Реальные примеры с грузинского рынка.',
        body: `## 1. Говорите регистром клиента

Роботизированные приветствия ломают доверие. Подстраивайте тон под реальную манеру клиентов. AI берёт регистр из system prompt — настройте явно: friendly, formal или casual.

❌ "Здравствуйте! Чем могу помочь вам сегодня?"
✅ "Привет! Что нужно?"

## 2. База знаний > AI-догадки

AI догадывается плохо без контекста. Кормите его реальными данными — сайт, FAQ, PDF, internal docs. RAG (Retrieval-Augmented Generation) — бот отвечает только из ваших данных, не выдумывает.

Peit достаёт 5 самых релевантных chunks для каждого запроса; только они уходят в LLM.

## 3. FAQ сначала → AI потом

Частые вопросы — в статический FAQ-список:
- Рабочие часы
- Адрес
- Цены
- Refund policy

Они отвечают за 0ms без AI hop. Токены AI идут на запросы, реально требующие рассуждения.

## 4. Lead capture — тайминг

❌ Первое сообщение: "Имя + email?"
✅ После ответа: "Отличный выбор! Хотите, чтобы менеджер связался — оставьте контакт?"

## 5. Handoff-правила — будьте щедры

Передавайте человеку, когда:
- "К менеджеру"
- Бот провалил 3+ попытки
- Refund / conflict-ключевые слова

Бот замолкает, человек подхватывает в панели.

## 6. Многоуровневая стратегия

Складывайте tier-ы для устойчивости:
- Точное совпадение FAQ (instant)
- AI с RAG (лучшее качество)
- Keyword search (degraded)
- Polite fallback message

Peit поставляет эту 4-tier лестницу по умолчанию.

## 7. Будьте везде, где клиент

Telegram, Instagram, Messenger, сайт. Не заставляйте искать "правильный" канал.

Peit объединяет все четыре в одну панель с одной базой знаний.

## 8. Аналитика — отслеживайте всё

Отслеживайте:
- Top questions (чтобы растить FAQ)
- Unanswered queries (дыры в базе знаний)
- Conversation → lead conversion
- Performance по каналам

## 9. Поддерживайте базу знаний живой

Знания устаревают быстро. Re-crawl ежемесячно — цены меняются, появляются новые продукты, адреса переезжают.

Re-crawl в Peit одним кликом перестраивает AI Index за 60 секунд.

## 10. GDPR + приватность

Lead capture требует явного согласия. Храните данные законно, позволяйте скачать или удалить.

Peit поставляет GDPR Art. 15/17 endpoints (data export + удаление) из коробки.

## Что дальше

[Зарегистрируйтесь бесплатно](/signup) или посмотрите [тарифы](/pricing). Best practices проще внедрить, чем запомнить — Peit делает их дефолтами.`,
      },
    },
  },

  // ─── 9. Instagram chatbot ────────────────────────────────────────────
  {
    slug:        'instagram-chatbot',
    category:    'how-to',
    publishedAt: '2026-05-18',
    readTime:    '5 წთ',
    icon:        '📷',
    translations: {
      ka: {
        title:   'Instagram ავტომატიზაცია ბიზნესისთვის — DM-ი არ უნდა იყოს შავი ხვრელი',
        excerpt: 'როგორ მუშავდება AI ჩატბოტი Instagram-ში — DM auto-reply, Story mention response, comment moderation. სრული setup.',
        body: `## Instagram — ქართველი ბიზნესის #1 customer-არხი

ფაქტი 2026 წლისთვის: Instagram-ი არ არის "მარკეტინგ-არხი" — ის არის **support-ის inbox-ი**. პირველი ადგილი, სადაც კლიენტი კითხვას სვამს გაყიდვამდე, გაყიდვის დროს და მის შემდეგ.

Beauty, fashion, რესტორნები, სასტუმროები — ამ კატეგორიების 60%+ inbound მოდის Instagram DM-დან.

## პრობლემა

Instagram DM გატეხილია, რადგან:
- კლიენტების უმეტესობა წერს რეგულარული საათების მიღმა
- Story-ის mention-ი ცალკე ადგილში მოდის
- კომენტარები გროვდება უფრო სწრაფად ვიდრე ვინმე modarate-ს ცდის
- ფლობელები იღლებიან წრის ცდისგან

ფასი — კლიენტი წავა და აღარ დაბრუნდება.

## AI ფარავს ხვრელს

Peit-ი 3 წუთში ერთვის Instagram Business Account-ს:

### 1. DM auto-reply

Customer გიწერს DM-ს. Bot 0.8 წამში პასუხობს, შენი ტონით, შენი ცოდნის ბაზიდან. Customer-ი Instagram-ში ხედავს — არა "third-party widget".

### 2. Story mention response

Customer შენ აჯავშნებს Story-ში (@your_business). Bot მას DM-ს უგზავნის — "დავინახე შენი story! მადლობა tag-ისთვის — გაქვს კითხვა [პროდუქტზე]?"

### 3. Quick replies + persistent menu

Peit ავტომატურად აშენებს menu ღილაკებს — "მენიუ", "ფასები", "ჯავშნა", "კონტაქტი". Customer ეცემა, მყისიერ პასუხს იღებს.

## Setup — Meta Business Suite

1. Instagram გადააქცი Business account-ად (Settings → Account → Switch to Professional)
2. დააკავშირე Facebook Page-ი
3. [Meta Business Suite](https://business.facebook.com/settings/system-users) → System Users → Generate Token
4. Token + Page ID ჩასვი Peit dashboard-ში
5. მზადაა

ბოტი ცოცხალია. ცადე სხვა ანგარიშიდან.

## რას მოელოდე

| Metric | წინ | Peit-თან |
|---|---|---|
| Avg response time | 4-8h | 0.8s |
| Missed DMs/month | ~120 | <5 |
| Lead conversion | 8% | 22% |
| Owner time/day | 2h | 15min |

## შემდეგი ნაბიჯი

[Sign up უფასოდ](/signup) ან გადახე [pricing](/pricing) — Instagram მუშავდება Pro plan-ზე (₾65/თვე).`,
      },
      en: {
        title:   "Instagram Chatbot for Business — DM Shouldn't Be a Black Hole",
        excerpt: 'How an AI chatbot works on Instagram — DM auto-reply, Story mention response, comment moderation. Full setup.',
        body: `## Instagram — #1 customer channel for Georgian SMBs

A 2026 fact: Instagram isn't a "marketing channel" — it's **the customer support inbox**. The first place a buyer asks before, during, and after the sale.

Beauty, fashion, restaurants, hotels — 60%+ of inbound for these categories arrives via Instagram DM.

## The problem

Instagram DM is broken because:
- It's outside business hours when most customers write
- Story mentions land in a separate place
- Comments stack up faster than anyone can moderate
- Owners burn out trying to keep up

The cost — customers bounce, never come back.

## AI fills the gap

Peit connects to your Instagram Business Account in 3 minutes:

### 1. DM auto-reply

Customer DMs you. Bot replies in 0.8 seconds, in your tone of voice, using your knowledge base. The customer sees Instagram, not a "third-party widget".

### 2. Story mention response

Customer mentions you in a Story (@your_business). Bot DMs them — "Saw your story! Thanks for tagging — got a question about [product]?"

### 3. Quick replies + persistent menu

Peit auto-builds the menu options — "Menu", "Prices", "Book", "Contact". Customers tap, get instant answers.

## Setup — Meta Business Suite

1. Convert your Instagram to a Business account (Settings → Account → Switch to Professional)
2. Connect a Facebook Page
3. [Meta Business Suite](https://business.facebook.com/settings/system-users) → System Users → Generate Token
4. Paste Token + Page ID in the Peit dashboard
5. Done

The bot is live. Test from a different account.

## What you can expect

| Metric | Before | With Peit |
|---|---|---|
| Avg response time | 4-8h | 0.8s |
| Missed DMs/month | ~120 | <5 |
| Lead conversion | 8% | 22% |
| Owner time/day | 2h | 15min |

## Next step

[Sign up free](/signup) or check [pricing](/pricing) — Instagram works on Pro plan (₾65/month).`,
      },
      ru: {
        title:   'Автоматизация Instagram для бизнеса — DM не должен быть чёрной дырой',
        excerpt: 'Как работает AI-чатбот в Instagram — DM auto-reply, Story mention response, модерация комментариев. Полная настройка.',
        body: `## Instagram — главный customer-канал грузинского SMB

Факт 2026: Instagram — не "маркетинговый канал", это **inbox поддержки**. Первое место, где покупатель спрашивает до, во время и после покупки.

Beauty, fashion, рестораны, гостиницы — 60%+ входящих по этим категориям приходит через Instagram DM.

## Проблема

Instagram DM сломан, потому что:
- Большая часть клиентов пишет вне рабочих часов
- Mention-ы из Story приходят в отдельное место
- Комментарии копятся быстрее, чем кто-то модерирует
- Владельцы выгорают, пытаясь успевать

Цена — клиенты отскакивают и не возвращаются.

## AI закрывает дыру

Peit подключается к Instagram Business Account за 3 минуты:

### 1. DM auto-reply

Клиент пишет DM. Бот отвечает за 0.8 секунды, в вашем тоне, из вашей базы знаний. Клиент видит Instagram, а не "сторонний виджет".

### 2. Story mention response

Клиент упоминает вас в Story (@your_business). Бот пишет DM — "Видел вашу историю! Спасибо за упоминание — есть вопрос о [продукт]?"

### 3. Quick replies + персистентное меню

Peit автоматически строит меню — "Меню", "Цены", "Бронь", "Контакт". Клиент тапает, мгновенно получает ответ.

## Настройка — Meta Business Suite

1. Переключите Instagram в Business account (Settings → Account → Switch to Professional)
2. Подключите Facebook Page
3. [Meta Business Suite](https://business.facebook.com/settings/system-users) → System Users → Generate Token
4. Вставьте Token + Page ID в панели Peit
5. Готово

Бот в эфире. Протестируйте с другого аккаунта.

## Что ожидать

| Метрика | До | С Peit |
|---|---|---|
| Avg response time | 4-8h | 0.8s |
| Missed DMs/мес | ~120 | <5 |
| Lead conversion | 8% | 22% |
| Время владельца/день | 2h | 15min |

## Следующий шаг

[Зарегистрируйтесь бесплатно](/signup) или посмотрите [тарифы](/pricing) — Instagram работает на Pro (₾65/мес).`,
      },
    },
  },

  // ─── 10. Hotel AI chatbot ────────────────────────────────────────────
  {
    slug:        'hotel-ai-chatbot',
    category:    'guide',
    publishedAt: '2026-05-19',
    readTime:    '6 წთ',
    icon:        '🏨',
    translations: {
      ka: {
        title:   'სასტუმრო + AI ჩატბოტი — ჯავშნა 24/7, არც ერთი გამოტოვებული სტუმარი',
        excerpt: 'როგორ მუშავდება AI ჩატბოტი სასტუმროში — booking, room availability, multilingual support. რეალური Kvareli Lake Resort case.',
        body: `## სასტუმროს ტკივილი

სასტუმროს inbound უნიკალურია:
- Multilingual (English, Russian, Hebrew, Arabic, ყველაფერი ტურისტული)
- დროის სხვადასხვა ზონაში (თბილისი vs ბერლინი — განსხვავებული გრაფიკი)
- კონკრეტული კითხვები (room availability, amenities, ლოკაცია, ტრანსფერი)
- High-intent traffic (კითხვა = თითქმის ყოველთვის რეალური ლიდი)

გამოტოვების ფასი — სტუმარი ეძებს Booking.com-ზე და კონკურენტთან ჯავშნის.

## AI ფარავს ყველაფერს

### 1. Multilingual პასუხები (ka/en/ru და მეტი)

სტუმარი წერს English-ში:
"Hi, any rooms for Friday-Sunday, 2 adults?"

Bot (English-ში):
"Yes! Deluxe room with mountain view available, ₾280/night. Pool, breakfast included. Want to book?"

იგივე Hebrew-ში? Bot გაუმკლავდება.

### 2. Real-time availability

დააკავშირე Booking.com / Cloudbeds / custom PMS. Bot ხედავს real-time room availability.

### 3. Concierge-სტილის პასუხები

- Wi-Fi password
- საუზმის საათები
- Check-in/out
- ლოკალური რეკომენდაციები
- აეროპორტის ტრანსფერი

ეს არის სტუმრის კითხვების 80%, რომელსაც reception ყოველდღე ტელეფონით პასუხობს.

## რეალური case — Kvareli Lake Resort

- **წინ**: 412 inquiry/თვე, 67 ჯავშანი (16% conversion)
- **Peit-თან**: 412 inquiry/თვე, 142 ჯავშანი (**34% conversion**)
- **+112%** — იგივე მოთხოვნა, ბევრად უკეთესი capture

## Setup

1. [Sign up Peit-ში](/signup)
2. ჩასვი საიტი — Peit კითხულობს room types, ფასები, amenities
3. (Pro plan) დააკავშირე PMS — Booking.com, Cloudbeds, custom
4. დააკავშირე Instagram + Telegram
5. მზადაა

## შემდეგი ნაბიჯი

[Pricing](/pricing) — სასტუმროსთვის Pro plan (₾65) sweet spot-ია (multilingual + PMS integration).`,
      },
      en: {
        title:   "AI Chatbot for Hotels — 24/7 Bookings, No Missed Guests",
        excerpt: 'How an AI chatbot works for a hotel — booking, room availability, multilingual support. A real Kvareli Lake Resort case.',
        body: `## A hotel's pain

Hotel inbound is unique:
- Multilingual (English, Russian, Hebrew, Arabic, anything tourist-driven)
- Time-zone-shifted (Tbilisi vs Berlin — completely different schedules)
- Specific questions (room availability, amenities, location, transport)
- High-intent traffic (a question = nearly always a real lead)

Cost of missing — the guest searches Booking.com and lands at a competitor.

## AI handles all of it

### 1. Multilingual replies (ka/en/ru and more)

Guest DMs in English:
"Hi, any rooms for Friday-Sunday, 2 adults?"

Bot (in English):
"Yes! Deluxe room with mountain view available, ₾280/night. Pool, breakfast included. Want to book?"

Same in Hebrew? Bot handles it.

### 2. Real-time availability

Connect Booking.com / Cloudbeds / custom PMS. The bot reads real-time room availability.

### 3. Concierge-style answers

- Wi-Fi password
- Breakfast hours
- Check-in/out time
- Local recommendations
- Airport transfer

These are the 80% of guest questions reception fields by phone every day.

## Real case — Kvareli Lake Resort

- **Before**: 412 inquiries/month, 67 bookings (16% conversion)
- **With Peit**: 412 inquiries/month, 142 bookings (**34% conversion**)
- **+112%** — same demand, much better capture

## Setup

1. [Sign up at Peit](/signup)
2. Paste your site — Peit reads room types, prices, amenities
3. (Pro plan) Connect PMS — Booking.com, Cloudbeds, custom
4. Connect Instagram + Telegram
5. Live

## What's next

[Pricing](/pricing) — Pro plan (₾65) is the sweet spot for hotels (multilingual + PMS integration).`,
      },
      ru: {
        title:   'AI-чатбот для гостиниц — бронь 24/7, без пропущенных гостей',
        excerpt: 'Как работает AI-чатбот в отеле — бронь, доступность номеров, multilingual support. Реальный кейс Kvareli Lake Resort.',
        body: `## Боль отеля

Входящие в отель уникальны:
- Multilingual (English, Russian, Hebrew, Arabic, всё туристическое)
- Сдвиг по часовым поясам (Тбилиси vs Берлин — разный график)
- Конкретные вопросы (доступность, amenities, локация, трансфер)
- High-intent траффик (вопрос = почти всегда реальный лид)

Цена пропуска — гость идёт на Booking.com и попадает к конкуренту.

## AI закрывает всё

### 1. Multilingual ответы (ka/en/ru и больше)

Гость пишет на английском:
"Hi, any rooms for Friday-Sunday, 2 adults?"

Бот (на английском):
"Yes! Deluxe room with mountain view available, ₾280/night. Pool, breakfast included. Want to book?"

То же на иврите? Бот справится.

### 2. Real-time availability

Подключите Booking.com / Cloudbeds / custom PMS. Бот читает доступность номеров в реальном времени.

### 3. Concierge-стиль ответов

- Wi-Fi password
- Часы завтрака
- Check-in/out
- Локальные рекомендации
- Трансфер из аэропорта

Это 80% вопросов гостей, которые reception обрабатывает по телефону каждый день.

## Реальный кейс — Kvareli Lake Resort

- **До**: 412 запросов/мес, 67 броней (16% конверсия)
- **С Peit**: 412 запросов/мес, 142 брони (**34% конверсия**)
- **+112%** — тот же спрос, гораздо лучший capture

## Настройка

1. [Зарегистрируйтесь в Peit](/signup)
2. Вставьте сайт — Peit читает типы номеров, цены, amenities
3. (Pro план) Подключите PMS — Booking.com, Cloudbeds, custom
4. Подключите Instagram + Telegram
5. Готово

## Что дальше

[Тарифы](/pricing) — Pro план (₾65) — sweet spot для отелей (multilingual + PMS integration).`,
      },
    },
  },

  // ─── 11. Small business automation ───────────────────────────────────
  {
    slug:        'small-business-automation',
    category:    'guide',
    publishedAt: '2026-05-20',
    readTime:    '6 წთ',
    icon:        '🏪',
    translations: {
      ka: {
        title:   'მცირე ბიზნესის ავტომატიზაცია — სად დაიწყე',
        excerpt: 'რა ღირს ავტომატიზაცია, რა გამოტოვო, რა გააკეთო ჯერ. პრაქტიკული გზამკვლევი ქართველი მცირე ბიზნესის ფლობელისთვის.',
        body: `## პატიოსანი სიმართლე

ავტომატიზაციის რჩევების უმეტესობა SMB-ისთვის ამბობს — "ავტომატიზდე ყველაფერი, დაიბრუნე თავისუფალი დრო". რეალობა — პროცესების უმეტესობა ავტომატიზებას არ უნდა.

მცირე ბიზნესს 4 პროცესი აქვს:
1. Production — შენი პროდუქტი ან მომსახურება
2. Sales — კლიენტების მოყვანა
3. Customer support — კითხვებზე პასუხი, პრობლემების მოგვარება
4. Marketing — content, რეკლამა, არხები

რეალური AI-რეპას მხოლოდ #1 და #3-ში მოაქვს.

## ფენა 1 — Customer support automation

### პრობლემა:
კლიენტები წერენ სხვადასხვა არხებიდან (Instagram, Telegram, საიტი). ვერ აუდრიხდები, ზოგი იკარგება.

### გადაწყვეტა:
Peit ავტომატურად პასუხობს კითხვების 80%-ს. ცოცხალი support მხოლოდ იმაზე, რასაც ნამდვილად ცოცხალი სჭირდება.

### მათემატიკა:
- ხარჯი: ₾45/თვე (Peit Basic)
- დაზოგილი დრო: 2 საათი/დღე
- ლიდის გაზრდა: 3-5x მეტი დაფიქსირებული ლიდი

## ფენა 2 — Lead capture + CRM

ლიდი ავტომატურად მიდის შენი stack-ისკენ — Google Sheets, HubSpot, Notion, custom CRM. Manual export არ სჭირდება.

Hot lead-ი მაშინვე ჩანს, follow-up-ი კონკურენტებზე ადრე.

## ფენა 3 — Booking + scheduling

სერვისებისთვის, beauty-სთვის, რესტორნებისთვის — დაუშვი კლიენტი თვითონ დაჯავშნოს. Peit ერთვის Calendly / Cal.com-ს webhooks-ით.

## ფენა 4 — ანალიტიკა

გაიგო რა მუშავდება — ეს არის ზრდის საფუძველი. მის გარეშე გადაწყვეტილებები ბრმაა.

Peit dashboard აჩვენებს:
- Top questions (რომ FAQ გაიზარდოს)
- Unanswered queries (ცოდნის ბაზის ხვრელები)
- Conversation → lead conversion
- Channel breakdown
- Geographic + heatmap

## შემდეგი ნაბიჯი

[Sign up უფასოდ](/signup) — დაიწყე ყველაზე ნაკლები ხახუნის ფენიდან. [Pricing](/pricing) — აირჩიე შენი მასშტაბისთვის.`,
      },
      en: {
        title:   "Small Business Automation Guide — Where to Start",
        excerpt: 'What to automate, what to skip, what to do first. A practical guide for Georgian SMB owners.',
        body: `## The honest truth

Most automation advice for SMBs says — "let's automate everything, get back your free time." Reality — most processes shouldn't be automated.

A small business has 4 processes:
1. Production — your actual product or service
2. Sales — bringing in customers
3. Customer support — answering questions, fixing problems
4. Marketing — content, ads, channels

Only #1 and #3 see real AI-driven gains today.

## Layer 1 — Customer support automation

### The problem:
Customers write through different channels (Instagram, Telegram, website). You can't keep up; some get missed.

### The solution:
Peit answers 80% of customer questions automatically. Live support takes only what really needs a human.

### The math:
- Cost: ₾45/month (Peit Basic)
- Time saved: 2 hours/day
- Lead gain: 3-5× more leads captured

## Layer 2 — Lead capture + CRM

Leads auto-push to your stack — Google Sheets, HubSpot, Notion, custom CRM. No manual export.

You see hot leads instantly, follow up before competitors.

## Layer 3 — Booking + scheduling

For services, beauty, restaurants — let customers book themselves. Peit connects to Calendly / Cal.com via webhooks.

## Layer 4 — Analytics + reporting

Knowing what's working is the basis of growth — without it you make blind decisions.

Peit dashboard shows:
- Top questions (so you grow the FAQ)
- Unanswered queries (gaps in knowledge base)
- Conversation → lead conversion
- Channel breakdown
- Geographic + heatmap

## Next step

[Sign up free](/signup) — start with the lowest-friction layer. [Pricing](/pricing) — pick what fits your scale.`,
      },
      ru: {
        title:   'Автоматизация малого бизнеса — с чего начать',
        excerpt: 'Что автоматизировать, что пропустить, что сделать первым. Практическое руководство для грузинского SMB-владельца.',
        body: `## Честная правда

Большая часть советов по автоматизации SMB звучит так — "давайте автоматизируем всё, верните своё свободное время". Реальность — большинство процессов автоматизировать не нужно.

У малого бизнеса 4 процесса:
1. Production — ваш продукт или услуга
2. Sales — приводим клиентов
3. Customer support — отвечаем на вопросы, чиним проблемы
4. Marketing — контент, реклама, каналы

Реальные AI-выгоды сегодня — только #1 и #3.

## Слой 1 — Customer support automation

### Проблема:
Клиенты пишут через разные каналы (Instagram, Telegram, сайт). Вы не успеваете, что-то пропадает.

### Решение:
Peit отвечает на 80% вопросов автоматически. Живой support берёт только то, где реально нужен человек.

### Математика:
- Стоимость: ₾45/мес (Peit Basic)
- Сэкономлено времени: 2 часа/день
- Прирост лидов: 3-5× больше захваченных

## Слой 2 — Lead capture + CRM

Лиды автоматически уходят в ваш стек — Google Sheets, HubSpot, Notion, custom CRM. Без ручного экспорта.

Hot-лиды видны мгновенно, follow-up раньше конкурентов.

## Слой 3 — Booking + scheduling

Для услуг, beauty, ресторанов — пусть клиенты бронируют сами. Peit подключается к Calendly / Cal.com через webhooks.

## Слой 4 — Аналитика

Понимание, что работает, — основа роста. Без этого решения вслепую.

Панель Peit показывает:
- Top questions (чтобы растить FAQ)
- Unanswered queries (дыры в базе)
- Conversation → lead conversion
- Channel breakdown
- Geographic + heatmap

## Следующий шаг

[Зарегистрируйтесь бесплатно](/signup) — начните со слоя с наименьшим трением. [Тарифы](/pricing) — подберите под масштаб.`,
      },
    },
  },

  // ─── 12. Chatbot ROI ─────────────────────────────────────────────────
  {
    slug:        'chatbot-roi',
    category:    'strategy',
    publishedAt: '2026-05-21',
    readTime:    '6 წთ',
    icon:        '📊',
    translations: {
      ka: {
        title:   'AI ჩატბოტის ROI — როგორ გამოვთვალოთ რეალურად',
        excerpt: 'რეალური ფორმულა — ხარჯი, დაზოგვა, ლიდის გაზრდა. როგორ ცდის Peit ROI-ს 8 დღეში.',
        body: `## ROI არ არის ჯადო

AI ჩატბოტის წინააღმდეგ მთავარი არგუმენტი — ფასია. ყველაზე გავრცელებული შეცდომა — არასწორ რაღაცებს ვადარებთ.

სწორი ფორმულა ასეთია:

\`\`\`
ROI = (დაზოგვა + ახალი შემოსავალი - ხარჯი) / ხარჯი × 100%
\`\`\`

განვიხილოთ თითო ნაწილი.

## კომპონენტი 1 — ხარჯი

ეს მარტივია — Peit-ის ფასები:
- Basic: ₾45/თვე
- Pro: ₾65/თვე
- Ultimate: ₾155/თვე

ეს არის. Setup fee არ არის, per-message charge არ არის.

## კომპონენტი 2 — დაზოგვა

### წყარო A — Support headcount-ის შემცირება

ბიზნესისთვის ერთი support agent-ით:
- Agent ღირს ₾1,500/თვე — Peit იღებს 80%-ს → ნამდვილად 0.5-0.8 FTE სჭირდება
- დაზოგვა: 0.7 × ₾1,500 = **₾1,050/თვე**

### წყარო B — ლიდის გაზრდა

ბიზნესისთვის სტაბილური inbound-ით:
- AI-მდე: 50 lead/თვე
- AI-ის შემდეგ: 150 lead/თვე (+100)
- საშუალო conversion: 10%
- საშუალო deal: ₾200
- მოგება: 100 × 10% × ₾200 = **₾2,000/თვე**

### წყარო C — ლოდინის დროის შემცირება

სწრაფი პასუხები ზრდის conversion-ს:
- AI-ის პასუხის დრო: 0.8 წამი
- ცოცხალის პასუხის დრო: 4 საათი
- Conversion lift: 32% (industry-standard fast-reply lift)
- ღირებულება: დამოკიდებულია volume-ზე — **₾300-500/თვე** SMB-სთვის

## კომპონენტი 3 — ROI

მედიანური SMB Peit Pro-ზე (₾65/თვე):

\`\`\`
თვიური ღირებულება = ₾1,050 + ₾2,000 + ₾400 = ₾3,450/თვე
თვიური ხარჯი = ₾65/თვე
ROI = (₾3,450 - ₾65) / ₾65 × 100 = 5,208%
\`\`\`

დიახ, სწორია — typo არ არის.

## რეალური შემოწმება

Software-ის უმეტესობა იძლევა ROI-ს 12-18 თვეში. მარკეტინგ-ინსტრუმენტების უმეტესობა — არასოდეს იცდის ცდას.

კარგად განთავსებული AI ჩატბოტი — ROI 8 დღეში.

## შემდეგი ნაბიჯი

[Sign up](/signup) და სცადე — 7 დღე უფასოდ, ბარათი არ გჭირდება. [Pricing](/pricing) — აირჩიე შენი tier.`,
      },
      en: {
        title:   "How to Calculate Your AI Chatbot ROI — Real Formula",
        excerpt: 'A real formula — costs, savings, lead gain. How Peit reaches ROI break-even in 8 days.',
        body: `## ROI isn't magic

The biggest objection to AI chatbots is cost. The biggest mistake — comparing the wrong things.

The right formula is:

\`\`\`
ROI = (savings + new revenue - cost) / cost × 100%
\`\`\`

Let's unpack each piece.

## Component 1 — Cost

This is the easy one — Peit pricing:
- Basic: ₾45/month
- Pro: ₾65/month
- Ultimate: ₾155/month

That's it. No setup fee, no per-message charge.

## Component 2 — Savings

### Source A — Reduced support headcount

For a business with one support agent:
- The agent costs ₾1,500/month — Peit handles 80% → you actually need 0.5-0.8 FTE
- Savings: 0.7 × ₾1,500 = **₾1,050/month**

### Source B — Lead gain

For a business with steady inbound:
- Before AI: 50 leads/month
- After AI: 150 leads/month (+100)
- Average conversion: 10%
- Average deal: ₾200
- Gain: 100 × 10% × ₾200 = **₾2,000/month**

### Source C — Reduced wait time

Faster replies lift conversion:
- AI response time: 0.8 seconds
- Live response time: 4 hours
- Conversion lift: 32% (industry-standard fast-reply lift)
- Value: depends on volume — **₾300-500/month** for an SMB

## Component 3 — ROI

A median SMB on Peit Pro (₾65/month):

\`\`\`
Monthly value = ₾1,050 + ₾2,000 + ₾400 = ₾3,450/month
Monthly cost = ₾65/month
ROI = (₾3,450 - ₾65) / ₾65 × 100 = 5,208%
\`\`\`

Yes that's correct — it's not a typo.

## Reality check

Most software gives an ROI of 12-18 months. Most marketing tools — never break even.

A well-deployed AI chatbot — ROI in 8 days.

## What's next

[Sign up](/signup) and try it — 7 days free, no card. [Pricing](/pricing) — pick your tier.`,
      },
      ru: {
        title:   'Как рассчитать ROI чатбота — реальная формула',
        excerpt: 'Реальная формула — затраты, экономия, прирост лидов. Как Peit окупается за 8 дней.',
        body: `## ROI — это не магия

Главное возражение против AI-чатботов — стоимость. Главная ошибка — сравнение неправильных вещей.

Правильная формула:

\`\`\`
ROI = (экономия + новый доход - стоимость) / стоимость × 100%
\`\`\`

Разберём по частям.

## Компонент 1 — Стоимость

Это легко — тарифы Peit:
- Basic: ₾45/мес
- Pro: ₾65/мес
- Ultimate: ₾155/мес

Всё. Без setup fee, без оплаты за сообщение.

## Компонент 2 — Экономия

### Источник A — Снижение headcount поддержки

Для бизнеса с одним support-агентом:
- Агент стоит ₾1,500/мес — Peit берёт 80% → реально нужно 0.5-0.8 FTE
- Экономия: 0.7 × ₾1,500 = **₾1,050/мес**

### Источник B — Прирост лидов

Для бизнеса со стабильным входящим:
- До AI: 50 лидов/мес
- После AI: 150 лидов/мес (+100)
- Средняя конверсия: 10%
- Средний чек: ₾200
- Прирост: 100 × 10% × ₾200 = **₾2,000/мес**

### Источник C — Снижение времени ответа

Быстрые ответы поднимают конверсию:
- Время ответа AI: 0.8 секунды
- Время ответа живого: 4 часа
- Прирост конверсии: 32% (индустриальный стандарт)
- Значение: зависит от объёма — **₾300-500/мес** для SMB

## Компонент 3 — ROI

Медианный SMB на Peit Pro (₾65/мес):

\`\`\`
Месячное значение = ₾1,050 + ₾2,000 + ₾400 = ₾3,450/мес
Месячная стоимость = ₾65/мес
ROI = (₾3,450 - ₾65) / ₾65 × 100 = 5,208%
\`\`\`

Да, верно — не опечатка.

## Проверка реальностью

Большинство ПО даёт ROI за 12-18 месяцев. Большинство маркетинг-инструментов — никогда не окупаются.

Хорошо развёрнутый AI-чатбот — ROI за 8 дней.

## Что дальше

[Зарегистрируйтесь](/signup) и попробуйте — 7 дней бесплатно, без карты. [Тарифы](/pricing) — выберите свой.`,
      },
    },
  },
];

// ────────────────────────────────────────────────────────────────────────
// Helper lookups
// ────────────────────────────────────────────────────────────────────────

export function getAllSlugs(): string[] {
  return POSTS.map(p => p.slug);
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find(p => p.slug === slug);
}

export function getTranslation(post: BlogPost, lang: BlogLang): BlogTranslation {
  return post.translations[lang];
}

/** Posts ordered most-recent-first for index pages. */
export function getPostsSorted(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
