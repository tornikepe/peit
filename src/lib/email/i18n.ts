// All email copy in KA / EN / RU. Keep strings short and direct — emails
// get glanced, not read.

export type EmailLang = 'ka' | 'en' | 'ru';

const SUPPORTED: ReadonlySet<EmailLang> = new Set<EmailLang>(['ka', 'en', 'ru']);

/** Coerce any string into a supported email language, falling back to KA. */
export function normalizeLang(raw: string | null | undefined): EmailLang {
  if (raw && SUPPORTED.has(raw as EmailLang)) return raw as EmailLang;
  return 'ka';
}

// ─── Shared layout copy ────────────────────────────────────────────────────

export const layoutCopy: Record<EmailLang, {
  poweredBy:        string;
  footerTagline:    string;
  unsubscribe:      string;
  unsubscribeAll:   string;
  preferencesLink:  string;
  view_in_browser:  string;
  copyright:        string;
}> = {
  ka: {
    poweredBy:       'Peit — AI ჩატბოტი ქართული ბიზნესისთვის',
    footerTagline:   'AI ასისტენტი 24/7 — ლიდები აღარ იკარგება.',
    unsubscribe:     'შეტყობინებიდან ამოწერა',
    unsubscribeAll:  'ყველა email-დან ამოწერა',
    preferencesLink: 'Email არჩევანების მართვა',
    view_in_browser: 'ნახე ბრაუზერში',
    copyright:       '© 2026 Peit. ყველა უფლება დაცულია.',
  },
  en: {
    poweredBy:       'Peit — AI chatbot for Georgian businesses',
    footerTagline:   'Your 24/7 AI assistant — never miss a lead.',
    unsubscribe:     'Unsubscribe from these emails',
    unsubscribeAll:  'Unsubscribe from all emails',
    preferencesLink: 'Manage email preferences',
    view_in_browser: 'View in browser',
    copyright:       '© 2026 Peit. All rights reserved.',
  },
  ru: {
    poweredBy:       'Peit — AI чат-бот для грузинских бизнесов',
    footerTagline:   'AI ассистент 24/7 — ни один лид не теряется.',
    unsubscribe:     'Отписаться от этих писем',
    unsubscribeAll:  'Отписаться от всех писем',
    preferencesLink: 'Управление email-настройками',
    view_in_browser: 'Открыть в браузере',
    copyright:       '© 2026 Peit. Все права защищены.',
  },
};

// ─── Welcome email ─────────────────────────────────────────────────────────

export const welcomeCopy: Record<EmailLang, {
  subject:    string;
  preheader:  string;
  heading:    string;
  greeting:   (name: string) => string;
  intro:      string;
  steps:      [string, string, string];
  cta:        string;
  helpText:   string;
  signOff:    string;
}> = {
  ka: {
    subject:    'მოგესალმებით Peit-ში! 🎉',
    preheader:  'შენი AI ჩატბოტი 10 წუთში მუშავი იქნება — სანამდე გვაჩვენებ როგორ.',
    heading:    'მოგესალმებით Peit-ში 👋',
    greeting:   n => `გამარჯობა${n ? ', ' + n : ''}!`,
    intro:      'მზად ვართ, რომ შენი AI ჩატბოტი ცოცხალი იყოს 24/7 — კლიენტებს უპასუხებს, ლიდებს შეაგროვებს და გაყიდვებს დაგიდევს ნებისმიერ დროს. დაიწყე 3 ნაბიჯში:',
    steps: [
      'შექმენი შენი პირველი ბოტი — ჩასვი საიტის URL, AI თვითონ ისწავლის შენი ბიზნესის შესახებ.',
      'ჩასვი ერთი ხაზიანი widget script შენი ვებსაიტის HEAD-ში. WordPress, Shopify, Wix — ყველგან მუშავს.',
      'უყურე, როგორ აგროვებს ლიდებს Dashboard-ში — email-ით შეგატყობინებთ ცხელ ლიდებზე.',
    ],
    cta:        'Dashboard-ზე გადასვლა',
    helpText:   'კითხვები? უპასუხე ამ email-ს ან მოგვწერე info@peit.ge-ზე — ვუპასუხებთ 24 საათში.',
    signOff:    'წარმატებები,\nPeit-ის გუნდი',
  },
  en: {
    subject:    'Welcome to Peit! 🎉',
    preheader:  'Your AI chatbot will be live in 10 minutes — here\'s how.',
    heading:    'Welcome to Peit 👋',
    greeting:   n => `Hi${n ? ' ' + n : ''}!`,
    intro:      'We\'re ready to get your AI chatbot live 24/7 — answering customers, capturing leads, and driving sales around the clock. Get started in 3 steps:',
    steps: [
      'Create your first bot — paste your website URL and the AI will learn your business automatically.',
      'Drop the one-line widget script into your site\'s HEAD. Works on WordPress, Shopify, Wix, and anywhere else.',
      'Watch leads roll in on your Dashboard — we\'ll email you whenever a hot lead comes in.',
    ],
    cta:        'Go to Dashboard',
    helpText:   'Questions? Reply to this email or write to info@peit.ge — we respond within 24 hours.',
    signOff:    'Cheers,\nThe Peit team',
  },
  ru: {
    subject:    'Добро пожаловать в Peit! 🎉',
    preheader:  'Ваш AI чат-бот будет готов за 10 минут — вот как.',
    heading:    'Добро пожаловать в Peit 👋',
    greeting:   n => `Привет${n ? ', ' + n : ''}!`,
    intro:      'Мы готовы запустить вашего AI чат-бота 24/7 — он будет отвечать клиентам, собирать лиды и помогать с продажами в любое время. Начните за 3 шага:',
    steps: [
      'Создайте первого бота — вставьте URL сайта, AI сам изучит ваш бизнес.',
      'Вставьте одну строку widget-скрипта в HEAD сайта. Работает на WordPress, Shopify, Wix — везде.',
      'Смотрите, как поступают лиды в Dashboard — мы пришлём письмо при каждом горячем лиде.',
    ],
    cta:        'Перейти в Dashboard',
    helpText:   'Вопросы? Ответьте на это письмо или напишите на info@peit.ge — отвечаем в течение 24 часов.',
    signOff:    'Удачи,\nКоманда Peit',
  },
};

// ─── Lead notification ─────────────────────────────────────────────────────

export const leadCopy: Record<EmailLang, {
  scoreLabel: Record<'cold' | 'warm' | 'hot', string>;
  subjectFn:  (params: { score: string; lead: string; botName: string }) => string;
  preheader:  (score: string) => string;
  badge:      (score: string) => string;
  heading:    string;
  fields: { name: string; email: string; phone: string; message: string };
  cta:        string;
  metaSeenAt: (when: string) => string;
  metaBot:    (botName: string) => string;
  viewBot:    string;
}> = {
  ka: {
    scoreLabel: { cold: 'ცივი', warm: 'თბილი', hot: 'ცხელი' },
    subjectFn:  ({ score, lead, botName }) => `[${botName}] ახალი ${score} ლიდი — ${lead}`,
    preheader:  score => `${score} ლიდი გელოდება პასუხს.`,
    badge:      score => `${score} ლიდი`,
    heading:    'გელოდება პასუხი',
    fields: { name: 'სახელი', email: 'Email', phone: 'ტელეფონი', message: 'შეტყობინება' },
    cta:        'დაშბორდზე გადასვლა',
    metaSeenAt: when => `ლიდი მიღებულია ${when} (Tbilisi)`,
    metaBot:    name => `ბოტი: ${name}`,
    viewBot:    'ნახე ბოტი',
  },
  en: {
    scoreLabel: { cold: 'Cold', warm: 'Warm', hot: 'Hot' },
    subjectFn:  ({ score, lead, botName }) => `[${botName}] New ${score.toLowerCase()} lead — ${lead}`,
    preheader:  score => `${score} lead waiting for a reply.`,
    badge:      score => `${score} lead`,
    heading:    'A new lead is waiting',
    fields: { name: 'Name', email: 'Email', phone: 'Phone', message: 'Message' },
    cta:        'Open Dashboard',
    metaSeenAt: when => `Received ${when} (Tbilisi time)`,
    metaBot:    name => `Bot: ${name}`,
    viewBot:    'View bot',
  },
  ru: {
    scoreLabel: { cold: 'холодный', warm: 'тёплый', hot: 'горячий' },
    subjectFn:  ({ score, lead, botName }) => `[${botName}] Новый ${score} лид — ${lead}`,
    preheader:  score => `${score} лид ждёт ответа.`,
    badge:      score => `${score} лид`,
    heading:    'Новый лид ждёт ответа',
    fields: { name: 'Имя', email: 'Email', phone: 'Телефон', message: 'Сообщение' },
    cta:        'Открыть Dashboard',
    metaSeenAt: when => `Получен ${when} (Тбилиси)`,
    metaBot:    name => `Бот: ${name}`,
    viewBot:    'Открыть бота',
  },
};

// ─── Trial reminder ────────────────────────────────────────────────────────

export const trialEndingCopy: Record<EmailLang, {
  subject:    (days: number) => string;
  preheader:  (days: number) => string;
  heading:    (days: number) => string;
  greeting:   (name: string) => string;
  body:       (days: number) => string;
  bullets:    string[];
  cta:        string;
  ctaSub:     string;
  helpText:   string;
}> = {
  ka: {
    subject:    d => `შენი Peit ტრიალი ${d} დღეში მთავრდება`,
    preheader:  d => `${d} დღე დარჩა — აარჩიე პლანი, რომ AI არ შეფერხდეს.`,
    heading:    d => `ტრიალი ${d} დღეში მთავრდება`,
    greeting:   n => `გამარჯობა${n ? ', ' + n : ''}!`,
    body:       d => `${d} დღეში შენი 7-დღიანი უფასო ტრიალი დასრულდება. რომ AI-მ უწყვეტად განაგრძოს მუშაობა — აარჩიე პლანი, რომელიც შენს ბიზნესს მოერგება:`,
    bullets: [
      'Basic — ₾45/თვე — 1,000 საუბარი, 1 ბოტი',
      'Pro — ₾65/თვე — 10,000 საუბარი, 5 ბოტი, Telegram',
      'Ultimate — ₾155/თვე — 100,000 საუბარი, Instagram + FB',
    ],
    cta:        'პლანის არჩევა',
    ctaSub:     'ერთი კლიკი — გადახდის გვერდი TBC Bank / Revolut / PayPal-ით',
    helpText:   'არ ხარ დარწმუნებული რომელი პლანი გჭირდება? უპასუხე ამ email-ს — ვუპასუხებთ 24 საათში.',
  },
  en: {
    subject:    d => `Your Peit trial ends in ${d} days`,
    preheader:  d => `${d} days left — pick a plan so your AI keeps running.`,
    heading:    d => `Trial ends in ${d} days`,
    greeting:   n => `Hi${n ? ' ' + n : ''}!`,
    body:       d => `Your 7-day free trial ends in ${d} days. To keep your AI assistant running uninterrupted, pick the plan that fits your business:`,
    bullets: [
      'Basic — ₾45/mo — 1,000 conversations, 1 bot',
      'Pro — ₾65/mo — 10,000 conversations, 5 bots, Telegram',
      'Ultimate — ₾155/mo — 100,000 conversations, Instagram + FB',
    ],
    cta:        'Pick your plan',
    ctaSub:     'One click — checkout via TBC Bank, Revolut, or PayPal',
    helpText:   'Not sure which plan you need? Reply to this email — we respond within 24 hours.',
  },
  ru: {
    subject:    d => `Ваш триал Peit заканчивается через ${d} дней`,
    preheader:  d => `Осталось ${d} дней — выберите план, чтобы AI продолжил работу.`,
    heading:    d => `Триал заканчивается через ${d} дней`,
    greeting:   n => `Привет${n ? ', ' + n : ''}!`,
    body:       d => `Ваш 7-дневный бесплатный триал заканчивается через ${d} дней. Чтобы AI ассистент продолжил работать без перерыва — выберите подходящий план:`,
    bullets: [
      'Basic — ₾45/мес — 1 000 сообщений, 1 бот',
      'Pro — ₾65/мес — 10 000 сообщений, 5 ботов, Telegram',
      'Ultimate — ₾155/мес — 100 000 сообщений, Instagram + FB',
    ],
    cta:        'Выбрать план',
    ctaSub:     'Один клик — оплата через TBC Bank, Revolut или PayPal',
    helpText:   'Не уверены какой план нужен? Ответьте на это письмо — отвечаем в течение 24 часов.',
  },
};

// ─── Trial ended ───────────────────────────────────────────────────────────

export const trialEndedCopy: Record<EmailLang, {
  subject:    string;
  preheader:  string;
  heading:    string;
  greeting:   (name: string) => string;
  body:       string;
  bodyImpact: string;
  cta:        string;
  ctaSub:     string;
  helpText:   string;
}> = {
  ka: {
    subject:    'შენი Peit ტრიალი დასრულდა',
    preheader:  'AI-ი ჩაკეტილია — გაააქტიურე ერთი კლიკით.',
    heading:    'ტრიალი დასრულდა',
    greeting:   n => `გამარჯობა${n ? ', ' + n : ''},`,
    body:       'შენი 7-დღიანი ტრიალი დასრულდა და AI ჩატბოტი ამჟამად აღარ პასუხობს ვიზიტორებს.',
    bodyImpact: 'ყოველი წუთი AI-ის გარეშე = ლიდი, რომელიც კონკურენტთან მიდის. გააქტიურე ნებისმიერი პლანი ერთი კლიკით:',
    cta:        'პლანის გააქტიურება',
    ctaSub:     '7-დღიანი ფული უკან — გარანტირებული',
    helpText:   'არ მოგწონს Peit? უპასუხე და გვითხარი რა გვაკლია — შენი feedback-ი გვაუმჯობესებს.',
  },
  en: {
    subject:    'Your Peit trial has ended',
    preheader:  'Your AI is paused — reactivate in one click.',
    heading:    'Trial ended',
    greeting:   n => `Hi${n ? ' ' + n : ''},`,
    body:       'Your 7-day trial has ended and your AI chatbot is no longer responding to visitors.',
    bodyImpact: 'Every minute without AI = a lead going to a competitor. Activate any plan in one click:',
    cta:        'Activate a plan',
    ctaSub:     '7-day money-back guarantee',
    helpText:   'Peit not for you? Reply and tell us what\'s missing — your feedback shapes the roadmap.',
  },
  ru: {
    subject:    'Ваш триал Peit закончился',
    preheader:  'AI поставлен на паузу — активируйте в один клик.',
    heading:    'Триал закончился',
    greeting:   n => `Привет${n ? ', ' + n : ''},`,
    body:       'Ваш 7-дневный триал закончился, и AI чат-бот больше не отвечает посетителям.',
    bodyImpact: 'Каждая минута без AI = лид, уходящий к конкуренту. Активируйте любой план одним кликом:',
    cta:        'Активировать план',
    ctaSub:     '7-дневная гарантия возврата денег',
    helpText:   'Peit не подходит? Ответьте и расскажите чего не хватает — ваш отзыв формирует развитие.',
  },
};

// ─── Subscription receipt / cancelled ──────────────────────────────────────

export const subCopy: Record<EmailLang, {
  receipt: {
    subject:    (plan: string) => string;
    preheader:  string;
    heading:    string;
    greeting:   (name: string) => string;
    body:       (plan: string, until: string) => string;
    summary:    string;
    fields: { plan: string; status: string; nextBilling: string };
    cta:        string;
    helpText:   string;
  };
  cancelled: {
    subject:    string;
    preheader:  (until: string) => string;
    heading:    string;
    greeting:   (name: string) => string;
    body:       (until: string) => string;
    cta:        string;
    helpText:   string;
  };
  paymentFailed: {
    subject:    string;
    preheader:  string;
    heading:    string;
    greeting:   (name: string) => string;
    body:       string;
    cta:        string;
    helpText:   string;
  };
}> = {
  ka: {
    receipt: {
      subject:   plan => `[Peit] გადახდა მიღებულია — ${plan}`,
      preheader: 'შენი Peit გამოწერა აქტიურია — გმადლობთ!',
      heading:   'გადახდა მიღებულია',
      greeting:  n => `გამარჯობა${n ? ', ' + n : ''},`,
      body:      (plan, until) => `შენი ${plan} პლანი აქტიურია. შემდეგი გადახდა — ${until}.`,
      summary:   'შენი მონაცემები:',
      fields:    { plan: 'პლანი', status: 'სტატუსი', nextBilling: 'შემდეგი გადახდა' },
      cta:       'Dashboard-ზე გადასვლა',
      helpText:  'ჩვენი ანგარიში TBC Bank-ით / Revolut-ით / PayPal-ით ღია. invoice-ი Lemon Squeezy-დან ცალკე მოვა.',
    },
    cancelled: {
      subject:   '[Peit] შენი გამოწერა გაუქმდა',
      preheader: w => `წვდომა ხელმისაწვდომია ${w}-მდე.`,
      heading:   'გამოწერა გაუქმდა',
      greeting:  n => `გამარჯობა${n ? ', ' + n : ''},`,
      body:      until => `შენი Peit გამოწერა გაუქმდა. წვდომა გაგრძელდება ${until}-მდე, შემდეგ AI შეჩერდება.`,
      cta:       'გადახდის შენარჩუნება',
      helpText:  'გადაიფიქრე? ერთი კლიკი დაუბრუნებს ბილინგ-პერიოდს.',
    },
    paymentFailed: {
      subject:   '[Peit] გადახდა ვერ მოხდა — საჭიროა მოქმედება',
      preheader: 'ბარათი უარყვეს — განაახლე, რომ AI არ შეფერხდეს.',
      heading:   'გადახდის პრობლემა',
      greeting:  n => `გამარჯობა${n ? ', ' + n : ''},`,
      body:      'შენი გადახდის მცდელობა წარუმატებლად დასრულდა — შესაძლოა ვადაგასული ბარათი ან არასაკმარისი თანხა. AI პასუხების მუშაობა შეჩერებულია, სანამ არ მოგვარდება.',
      cta:       'გადახდის მეთოდის განახლება',
      helpText:  'Lemon Squeezy ავტომატურად კიდევ რამდენიმეჯერ შეეცდება, მაგრამ მანამდე ჯობია ხელით განაახლო.',
    },
  },
  en: {
    receipt: {
      subject:   plan => `[Peit] Payment received — ${plan}`,
      preheader: 'Your Peit subscription is active — thank you!',
      heading:   'Payment received',
      greeting:  n => `Hi${n ? ' ' + n : ''},`,
      body:      (plan, until) => `Your ${plan} plan is active. Next charge: ${until}.`,
      summary:   'Your details:',
      fields:    { plan: 'Plan', status: 'Status', nextBilling: 'Next billing' },
      cta:       'Go to Dashboard',
      helpText:  'A formal invoice from Lemon Squeezy will arrive separately. Payment methods: TBC Bank, Revolut, PayPal.',
    },
    cancelled: {
      subject:   '[Peit] Your subscription has been cancelled',
      preheader: u => `Access remains until ${u}.`,
      heading:   'Subscription cancelled',
      greeting:  n => `Hi${n ? ' ' + n : ''},`,
      body:      until => `Your Peit subscription is cancelled. Access continues until ${until}, then your AI will stop responding.`,
      cta:       'Keep my subscription',
      helpText:  'Change of heart? One click restores your billing.',
    },
    paymentFailed: {
      subject:   '[Peit] Payment failed — action needed',
      preheader: 'Card was declined — update to keep your AI running.',
      heading:   'Payment problem',
      greeting:  n => `Hi${n ? ' ' + n : ''},`,
      body:      'Your latest payment attempt failed — possibly an expired card or insufficient funds. AI responses are paused until this is resolved.',
      cta:       'Update payment method',
      helpText:  'Lemon Squeezy will retry automatically, but updating now restores access immediately.',
    },
  },
  ru: {
    receipt: {
      subject:   plan => `[Peit] Платёж получен — ${plan}`,
      preheader: 'Ваша подписка Peit активна — спасибо!',
      heading:   'Платёж получен',
      greeting:  n => `Привет${n ? ', ' + n : ''},`,
      body:      (plan, until) => `Ваш план ${plan} активен. Следующее списание: ${until}.`,
      summary:   'Детали:',
      fields:    { plan: 'План', status: 'Статус', nextBilling: 'Следующий платёж' },
      cta:       'Перейти в Dashboard',
      helpText:  'Официальный инвойс от Lemon Squeezy придёт отдельно. Способы оплаты: TBC Bank, Revolut, PayPal.',
    },
    cancelled: {
      subject:   '[Peit] Подписка отменена',
      preheader: u => `Доступ сохранится до ${u}.`,
      heading:   'Подписка отменена',
      greeting:  n => `Привет${n ? ', ' + n : ''},`,
      body:      until => `Ваша подписка Peit отменена. Доступ продлится до ${until}, затем AI перестанет отвечать.`,
      cta:       'Восстановить подписку',
      helpText:  'Передумали? Один клик восстановит ваш биллинг.',
    },
    paymentFailed: {
      subject:   '[Peit] Платёж не прошёл — нужно действие',
      preheader: 'Карта отклонена — обновите, чтобы AI продолжил работу.',
      heading:   'Проблема с оплатой',
      greeting:  n => `Привет${n ? ', ' + n : ''},`,
      body:      'Последний платёж не прошёл — возможно, истёк срок карты или недостаточно средств. Ответы AI приостановлены до решения.',
      cta:       'Обновить способ оплаты',
      helpText:  'Lemon Squeezy повторит попытку автоматически, но обновление сейчас восстановит доступ немедленно.',
    },
  },
};
