// Legal-page content (Terms, Privacy, GDPR DPA, Cookies) in KA/EN/RU.
// Kept separate from i18n.ts so the main bundle isn't bloated with long-form
// text. LegalPage component pulls the doc for the current language.

import type { Lang } from './i18n';

/** Sections are rendered as <h2> + body. Body items are either paragraphs,
 *  unordered lists, or ordered lists. */
export type LegalBlock =
  | { kind: 'p';  text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] };

export interface LegalSection {
  /** anchor id used for in-page navigation */
  id:    string;
  title: string;
  body:  LegalBlock[];
}

export interface LegalDoc {
  /** Long-form page title — also used as <h1>. */
  title:         string;
  /** Short subtitle / one-liner. */
  subtitle:      string;
  /** ISO date — last updated. */
  effectiveDate: string;
  /** TOC label e.g. "შინაარსი" */
  tocLabel:      string;
  /** Intro paragraphs above the TOC. */
  intro:         LegalBlock[];
  sections:      LegalSection[];
  /** Closing call-out (e.g. "Questions? email legal@peit.ge"). */
  contact:       string;
}

export type LegalSlug = 'terms' | 'privacy' | 'gdpr' | 'cookies';

const EFFECTIVE_DATE = '2026-05-16';
const COMPANY        = 'Peit';
const CONTACT_EMAIL  = 'legal@peit.ge';
const SUPPORT_EMAIL  = 'info@peit.ge';

// ─── Georgian ──────────────────────────────────────────────────────────────

const terms_ka: LegalDoc = {
  title:    'სერვისის წესები და პირობები',
  subtitle: `${COMPANY}-ის გამოყენების სამართლებრივი ხელშეკრულება.`,
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'შინაარსი',
  intro: [
    { kind: 'p', text: `წინამდებარე წესები არეგულირებს თქვენი მიერ Peit-ის (შემდგომში — „სერვისი") გამოყენებას. Peit არის AI ჩატბოტი პლატფორმა მცირე და საშუალო ბიზნესისთვის, რომელიც ვებსაიტებზე, Telegram-სა და Instagram-ში ემსახურება მომხმარებლებს და აგროვებს ლიდებს.` },
    { kind: 'p', text: `სერვისზე რეგისტრაციით ან გადახდით თქვენ ეთანხმებით ამ წესებს. თუ არ ეთანხმებით, არ გამოიყენოთ სერვისი.` },
  ],
  sections: [
    {
      id: 'service',
      title: '1. სერვისის აღწერა',
      body: [
        { kind: 'p', text: `Peit გთავაზობთ SaaS პლატფორმას, რომელიც გაძლევთ AI ჩატბოტის შექმნის, ვებსაიტზე ჩასმის, ლიდების შეგროვების და მართვის შესაძლებლობას.` },
        { kind: 'p', text: `სერვისი მიეწოდება "as is" საფუძველზე და შესაძლოა შეიცვალოს, განახლდეს ან შეწყდეს ნებისმიერ დროს.` },
      ],
    },
    {
      id: 'account',
      title: '2. ანგარიში და უსაფრთხოება',
      body: [
        { kind: 'p', text: `სერვისის გამოსაყენებლად საჭიროა ანგარიშის შექმნა. ანგარიშის უსაფრთხოებაზე პასუხისმგებელი ხართ თქვენ — სანდო პაროლი დააყენეთ და არავის გაუზიაროთ.` },
        { kind: 'p', text: `უნდა იყოთ მინიმუმ 18 წლის ან წარმოადგენდეთ რეგისტრირებულ ბიზნესს. ცრუ მონაცემების მიწოდება სერვისის შეწყვეტის საფუძველი ხდება.` },
      ],
    },
    {
      id: 'trial-payment',
      title: '3. ფასი, ტრიალი და გადახდა',
      body: [
        { kind: 'p', text: `ახალ მომხმარებლებს ეძლევათ 7-დღიანი უფასო ტრიალი. ტრიალის ბოლოს ანგარიში ავტომატურად გადადის ფასიან პლანზე, თუ არ გააუქმეთ.` },
        { kind: 'p', text: `გადახდები მუშავდება Lemon Squeezy-ის მეშვეობით (Merchant of Record). ფასები გამოცხადებულია ვებსაიტზე და შეიძლება შეიცვალოს — ცვლილებები ძალაში შედის შემდეგი ბილინგ-პერიოდიდან.` },
        { kind: 'p', text: `გადასახადები (VAT) ემატება ფასს თქვენი იურისდიქციის შესაბამისად.` },
      ],
    },
    {
      id: 'cancellation',
      title: '4. გაუქმება და დაბრუნება',
      body: [
        { kind: 'p', text: `გაუქმება შესაძლებელია ნებისმიერ დროს dashboard-იდან. გაუქმების შემთხვევაში სერვისი ხელმისაწვდომი იქნება ბილინგ-პერიოდის ბოლომდე.` },
        { kind: 'p', text: `უკვე გადახდილი თანხები არ ბრუნდება, გარდა მოქმედი კანონმდებლობით დადგენილი შემთხვევებისა.` },
      ],
    },
    {
      id: 'acceptable-use',
      title: '5. დაშვებული გამოყენება',
      body: [
        { kind: 'p', text: `თქვენ თანხმდებით, რომ არ გამოიყენებთ სერვისს:` },
        { kind: 'ul', items: [
          'უკანონო, თაღლითური ან ბოროტი მიზნებისთვის',
          'სპამის, შანტაჟის, ცილისწამების ან ძალადობრივი კონტენტის გასავრცელებლად',
          'მესამე პირების უფლებების დასარღვევად (საავტორო, კერძო ცხოვრება, ბრენდი)',
          'სერვისის ინფრასტრუქტურის გასატესტად, hack-ისთვის ან გადასატვირთად',
          'AI მოდელის ექსტრაქციის ან კონკურენტული პროდუქტის შესაქმნელად',
        ]},
        { kind: 'p', text: `წესების დარღვევა იწვევს ანგარიშის დაუყოვნებლივ შეჩერებას, ხშირ შემთხვევაში — გადახდილი თანხის დაბრუნების გარეშე.` },
      ],
    },
    {
      id: 'customer-data',
      title: '6. თქვენი მონაცემები და კონტენტი',
      body: [
        { kind: 'p', text: `თქვენ ფლობთ ყველა მონაცემს, რომელსაც ატვირთავთ ან ჩვენი ბოტი აგროვებს თქვენი სახელით — FAQ, ცოდნის ბაზა, საუბრები, ლიდები.` },
        { kind: 'p', text: `თქვენი ნებართვის საფუძველზე ვამუშავებთ ამ მონაცემებს მხოლოდ სერვისის მისაწოდებლად. დეტალები იხილეთ ${`Privacy Policy`}-სა და DPA-ში.` },
      ],
    },
    {
      id: 'ip',
      title: '7. ინტელექტუალური საკუთრება',
      body: [
        { kind: 'p', text: `Peit-ის პლატფორმის კოდი, ბრენდი, დიზაინი და ალგორითმები არის ${COMPANY}-ის საკუთრება. სერვისის გამოყენება არ გადმოგცემთ რაიმე საკუთრების უფლებას, გარდა შეზღუდული ლიცენზიისა — ბიზნეს მიზნებისთვის გამოყენების.` },
      ],
    },
    {
      id: 'warranty',
      title: '8. გარანტიების უარყოფა',
      body: [
        { kind: 'p', text: `სერვისი მიწოდებულია "as is" და "as available" საფუძველზე. არ ვიძლევით გარანტიას უწყვეტი მუშაობის, ხარვეზებისგან თავისუფლების ან კონკრეტული მიზნისთვის ვარგისობის შესახებ.` },
        { kind: 'p', text: `AI პასუხები შეიძლება იყოს არასწორი ან არასრული. სერვისი დამხმარე ხელსაწყოა — საბოლოო პასუხისმგებლობა მომხმარებლის წინაშე ეკისრება თქვენ.` },
      ],
    },
    {
      id: 'liability',
      title: '9. პასუხისმგებლობის შეზღუდვა',
      body: [
        { kind: 'p', text: `მოქმედი კანონმდებლობით დაშვებული მაქსიმალური ფარგლების ფარგლებში, ${COMPANY}-ის პასუხისმგებლობა შემოიფარგლება თქვენ მიერ წინა 12 თვის განმავლობაში გადახდილი თანხით.` },
        { kind: 'p', text: `არანაირ ვითარებაში არ ვართ პასუხისმგებელი მიუღებელ მოგებაზე, ბიზნესის შეფერხებაზე ან მონაცემთა დაკარგვის შემთხვევაში მიყენებულ ზიანზე.` },
      ],
    },
    {
      id: 'modifications',
      title: '10. ცვლილებები',
      body: [
        { kind: 'p', text: `ვიტოვებთ უფლებას, შევცვალოთ ეს წესები. არსებითი ცვლილებების შესახებ შეგატყობინებთ email-ით ან dashboard-ში მინიმუმ 14 დღით ადრე. სერვისის გაგრძელება ცვლილებებზე თანხმობას ნიშნავს.` },
      ],
    },
    {
      id: 'law',
      title: '11. მმართველი კანონი და დავები',
      body: [
        { kind: 'p', text: `ეს წესები რეგულირდება საქართველოს კანონმდებლობით. დავები განიხილება ქალაქ თბილისის სასამართლოებში, თუ კანონი სხვაგვარად არ მოითხოვს.` },
      ],
    },
    {
      id: 'contact',
      title: '12. კონტაქტი',
      body: [
        { kind: 'p', text: `კითხვები? დაგვიკავშირდით: ${CONTACT_EMAIL}` },
      ],
    },
  ],
  contact: `კითხვები წესების შესახებ? — ${CONTACT_EMAIL}`,
};

const privacy_ka: LegalDoc = {
  title:    'კონფიდენციალურობის პოლიტიკა',
  subtitle: 'როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს მონაცემებს.',
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'შინაარსი',
  intro: [
    { kind: 'p', text: `${COMPANY} (შემდგომში — "ჩვენ") პატივს სცემს თქვენს კონფიდენციალურობას. ეს დოკუმენტი ხსნის, რა მონაცემებს ვაგროვებთ, რატომ და როგორ ვუვლით.` },
    { kind: 'p', text: `მოქმედებს ვებსაიტ peit.ge-ის, dashboard-ის და ნებისმიერ მომხმარებლის საიტზე ჩასმული ჩატ ვიჯეტისთვის.` },
  ],
  sections: [
    {
      id: 'controller',
      title: '1. მონაცემთა მაკონტროლირებელი',
      body: [
        { kind: 'p', text: `${COMPANY}, რეგისტრირებული საქართველოში. დაკავშირება: ${CONTACT_EMAIL}.` },
        { kind: 'p', text: `ბოტის ვიზიტორების მონაცემებზე ჩვენ ვართ პროცესორი, ხოლო თქვენ — Peit-ის მომხმარებელი — კონტროლერი (იხ. GDPR DPA).` },
      ],
    },
    {
      id: 'data-collected',
      title: '2. რა მონაცემებს ვაგროვებთ',
      body: [
        { kind: 'p', text: `ანგარიშის შექმნისას:` },
        { kind: 'ul', items: [
          'სახელი, email',
          'პროფილის სურათი (Clerk-ის გავლით — არჩევითი)',
          'IP მისამართი და გადახდის მონაცემები (Lemon Squeezy-ით, ბარათის ნომერი ჩვენთან არ ინახება)',
        ]},
        { kind: 'p', text: `სერვისის გამოყენებისას:` },
        { kind: 'ul', items: [
          'თქვენ მიერ შექმნილი ბოტების კონფიგურაცია, FAQ, ცოდნის ბაზა',
          'ვიზიტორების საუბრები (კითხვა + ბოტის პასუხი)',
          'ლიდები, რომელთა შეგროვებაც თქვენი ბოტი ახდენს',
          'ანალიტიკის მონაცემები (გვერდის URL, ბრაუზერი)',
        ]},
      ],
    },
    {
      id: 'purposes',
      title: '3. რატომ ვაგროვებთ',
      body: [
        { kind: 'ul', items: [
          'სერვისის მისაწოდებლად (კონტრაქტის შესრულება)',
          'ბილინგისთვის და ანგარიშის მართვისთვის',
          'უსაფრთხოებისთვის და ცრუ ქმედებების აღმოსაჩენად',
          'პროდუქტის გასაუმჯობესებლად (ანონიმიზებული ანალიტიკა)',
          'სამართლებრივი ვალდებულებების შესასრულებლად',
        ]},
      ],
    },
    {
      id: 'legal-basis',
      title: '4. სამართლებრივი საფუძველი (GDPR Art. 6)',
      body: [
        { kind: 'ul', items: [
          'ხელშეკრულების შესრულება — სერვისის მიწოდებისთვის',
          'თქვენი თანხმობა — მარკეტინგული email, ანალიტიკის cookie',
          'სამართლებრივი ვალდებულება — ფინანსური ანგარიშგება, საგადასახადო',
          'ლეგიტიმური ინტერესი — სერვისის უსაფრთხოება, თაღლითობასთან ბრძოლა',
        ]},
      ],
    },
    {
      id: 'sharing',
      title: '5. გაზიარება მესამე მხარეებთან',
      body: [
        { kind: 'p', text: `ჩვენ არ ვყიდით თქვენს მონაცემებს. ვუზიარებთ მხოლოდ ჩვენს სუბ-პროცესორებს, რომლებიც გვაწვდიან ინფრასტრუქტურულ მომსახურებას:` },
        { kind: 'ul', items: [
          'Clerk (USA) — ავტორიზაცია და ანგარიშის მართვა',
          'Vercel (USA/EU) — hosting და CDN',
          'Lemon Squeezy (USA) — გადახდები, Merchant of Record',
          'Anthropic (USA) — Claude AI მოდელი',
          'Voyage AI (USA) — embedding მოდელი',
          'Resend (USA/EU) — ტრანზაქციული email',
          'Supabase / Postgres (EU) — მონაცემთა ბაზა',
        ]},
        { kind: 'p', text: `ყველა მესამე მხარე ვალდებულია იცავდეს GDPR-ის სტანდარტებს — Standard Contractual Clauses-ის გავლით.` },
      ],
    },
    {
      id: 'retention',
      title: '6. შენახვის ვადა',
      body: [
        { kind: 'ul', items: [
          'ანგარიშის მონაცემები: ანგარიშის სიცოცხლის ხანგრძლივობით + 90 დღე',
          'ბილინგის ჩანაწერები: 7 წელი (საქართველოს საგადასახადო კოდექსი)',
          'საუბრები და ლიდები: მითითებული თქვენ მიერ retention პოლიტიკის შესაბამისად, ნაგულისხმევია 12 თვე',
          'ლოგი ფაილები: 30 დღე',
        ]},
        { kind: 'p', text: `ანგარიშის წაშლის შემდეგ თქვენი მონაცემები წაიშლება 30 დღეში (backup-ში — 90 დღემდე).` },
      ],
    },
    {
      id: 'rights',
      title: '7. თქვენი უფლებები (GDPR Art. 15–22)',
      body: [
        { kind: 'ul', items: [
          'წვდომა — მოითხოვეთ თქვენი მონაცემები (dashboard → Settings → Export)',
          'შესწორება — განაახლეთ მცდარი მონაცემები',
          'წაშლა ("Right to be forgotten") — dashboard-იდან ან email-ით',
          'დამუშავების შეზღუდვა',
          'მონაცემთა გადატანა (CSV / JSON ექსპორტი)',
          'წინააღმდეგობა (ანალიტიკის ან მარკეტინგის წინააღმდეგ)',
          'თანხმობის გაუქმება ნებისმიერ დროს',
        ]},
        { kind: 'p', text: `უფლების გამოყენებისთვის: ${CONTACT_EMAIL}. პასუხს მოგცემთ 30 დღეში.` },
      ],
    },
    {
      id: 'security',
      title: '8. უსაფრთხოება',
      body: [
        { kind: 'p', text: `ვიყენებთ ინდუსტრიის სტანდარტებს: TLS 1.3, encrypted at rest, role-based access control. პერსონალური მონაცემები ცალკე ცხრილებშია, წვდომა — მხოლოდ აუცილებლობის შემთხვევაში.` },
      ],
    },
    {
      id: 'children',
      title: '9. ბავშვები',
      body: [
        { kind: 'p', text: `სერვისი არ არის გათვლილი 16 წლამდე ბავშვებზე. თუ აღმოვაჩენთ, რომ შეგვაგროვებინა ბავშვის მონაცემები, წავშლით დაუყოვნებლივ.` },
      ],
    },
    {
      id: 'changes',
      title: '10. ცვლილებები',
      body: [
        { kind: 'p', text: `პოლიტიკის ცვლილებების შესახებ შეგატყობინებთ email-ით ან dashboard-ში. ბოლო განახლება ნაჩვენებია გვერდის თავში.` },
      ],
    },
    {
      id: 'contact',
      title: '11. კონტაქტი და ზედამხედველი ორგანო',
      body: [
        { kind: 'p', text: `${CONTACT_EMAIL} — მონაცემთა დაცვის ოფიცერი.` },
        { kind: 'p', text: `საქართველოს მონაცემთა დაცვის სამსახური: personaldata.ge` },
        { kind: 'p', text: `EU-ში მცხოვრებთათვის — თქვენი ქვეყნის DPA-ში საჩივრის უფლება გაქვთ.` },
      ],
    },
  ],
  contact: `კონფიდენციალურობის შესახებ კითხვა? — ${CONTACT_EMAIL}`,
};

const gdpr_ka: LegalDoc = {
  title:    'GDPR — მონაცემთა დამუშავების ხელშეკრულება (DPA)',
  subtitle: 'Peit-ის როლი თქვენი მომხმარებლების მონაცემთა დამუშავებაში.',
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'შინაარსი',
  intro: [
    { kind: 'p', text: `ეს DPA ავსებს თქვენი Peit-ის გამოყენების ხელშეკრულებას და განსაზღვრავს, როგორ ვამუშავებთ თქვენი ბოტის ვიზიტორების (ლიდები, ჩატ-მონაცემები) მონაცემებს თქვენი სახელით.` },
    { kind: 'p', text: `Peit-ის გამოყენებით ეთანხმებით ამ DPA-ს ხელშეკრულების ნაწილად.` },
  ],
  sections: [
    {
      id: 'roles',
      title: '1. როლები',
      body: [
        { kind: 'p', text: `თქვენ ხართ კონტროლერი თქვენი ვიზიტორების მონაცემებზე (GDPR Art. 4(7)). ${COMPANY} მოქმედებს თქვენი სახელით როგორც პროცესორი (Art. 4(8)).` },
      ],
    },
    {
      id: 'scope',
      title: '2. დამუშავების ფარგლები',
      body: [
        { kind: 'p', text: `ხასიათი და მიზანი: AI ჩატბოტი მომსახურება — ვიზიტორების კითხვებზე პასუხი, ლიდების შეგროვება, ანალიტიკა.` },
        { kind: 'p', text: `ხანგრძლივობა: ხელშეკრულების მოქმედების მთელი პერიოდი + 30 დღე წაშლისთვის.` },
        { kind: 'p', text: `მონაცემთა კატეგორიები: სახელი, email, ტელეფონი, IP, ჩატის ჩანაწერები, ვიზიტის მეტამონაცემები.` },
        { kind: 'p', text: `მონაცემთა სუბიექტები: თქვენი ვებსაიტის და ჩატის ვიზიტორები.` },
      ],
    },
    {
      id: 'instructions',
      title: '3. ჩვენი ვალდებულებები',
      body: [
        { kind: 'ul', items: [
          'მონაცემთა დამუშავება მხოლოდ თქვენი ინსტრუქციით',
          'პერსონალის კონფიდენციალურობის ხელშეკრულებები',
          'ტექნიკური და ორგანიზაციული უსაფრთხოების ღონისძიებები (Art. 32)',
          'სუბ-პროცესორების მიერ თანაბარი დონის უსაფრთხოების უზრუნველყოფა',
          'მონაცემთა სუბიექტების უფლებებში დახმარება',
          'მონაცემთა დარღვევის შესახებ შეტყობინება 72 საათში',
          'მონაცემთა წაშლა ან დაბრუნება ხელშეკრულების შეწყვეტისას',
        ]},
      ],
    },
    {
      id: 'your-obligations',
      title: '4. თქვენი ვალდებულებები',
      body: [
        { kind: 'ul', items: [
          'სამართლებრივი საფუძველი ვიზიტორების მონაცემთა შეგროვებაზე',
          'საკუთარი privacy policy და cookie consent ვიზიტორებისთვის',
          'მონაცემთა შემცირების პრინციპის დაცვა',
          'მონაცემთა სუბიექტების მოთხოვნებზე ვადებში პასუხი',
        ]},
      ],
    },
    {
      id: 'subprocessors',
      title: '5. სუბ-პროცესორები',
      body: [
        { kind: 'p', text: `ჩვენ ვიყენებთ შემდეგ სუბ-პროცესორებს მონაცემთა დასამუშავებლად:` },
        { kind: 'ul', items: [
          'Clerk (Authentication, USA)',
          'Vercel (Hosting & CDN, USA/EU)',
          'Lemon Squeezy (Payments, USA)',
          'Anthropic (Claude AI, USA)',
          'Voyage AI (Embeddings, USA)',
          'Resend (Transactional email, USA/EU)',
          'Postgres provider (Database, EU)',
        ]},
        { kind: 'p', text: `ახალი სუბ-პროცესორის შესახებ შეგატყობინებთ მინიმუმ 30 დღით ადრე და გექნებათ წინააღმდეგობის უფლება.` },
      ],
    },
    {
      id: 'security',
      title: '6. უსაფრთხოების ღონისძიებები',
      body: [
        { kind: 'ul', items: [
          'TLS 1.3 ტრანზიტში, AES-256 encrypted at rest',
          'Role-based access control, MFA თანამშრომლებისთვის',
          'რეგულარული უსაფრთხოების აუდიტი',
          'ცალკე ლოგინგი წვდომებზე',
          'მუდმივი backup და disaster recovery (RPO ≤ 24 საათი)',
        ]},
      ],
    },
    {
      id: 'breach',
      title: '7. დარღვევის შეტყობინება',
      body: [
        { kind: 'p', text: `მონაცემთა დარღვევის შემთხვევაში შეგატყობინებთ აღმოჩენიდან 72 საათში, აღწერით: ხასიათი, ზიანი, მითითებული ღონისძიებები.` },
      ],
    },
    {
      id: 'audit',
      title: '8. აუდიტი',
      body: [
        { kind: 'p', text: `უფლება გაქვთ, წელიწადში ერთხელ, წინასწარი 30-დღიანი წერილობითი შეტყობინებით მოითხოვოთ ჩვენი GDPR-ის შესაბამისობის დადასტურება — SOC 2 / ISO 27001 ანგარიშების სახით ან წერილობითი კითხვარით.` },
      ],
    },
    {
      id: 'transfers',
      title: '9. საერთაშორისო გადაცემები',
      body: [
        { kind: 'p', text: `EU-ის ფარგლებს გარეთ მონაცემთა გადაცემა ხდება Standard Contractual Clauses (SCC) საფუძველზე ან ადეკვატურობის გადაწყვეტილებით.` },
      ],
    },
    {
      id: 'termination',
      title: '10. შეწყვეტა',
      body: [
        { kind: 'p', text: `ხელშეკრულების შეწყვეტისას თქვენი ვიზიტორების მონაცემები წაიშლება 30 დღეში, თუ კანონი არ მოითხოვს მათ შენახვას.` },
      ],
    },
    {
      id: 'contact',
      title: '11. კონტაქტი',
      body: [
        { kind: 'p', text: `DPA ან GDPR-თან დაკავშირებული კითხვები: ${CONTACT_EMAIL}` },
      ],
    },
  ],
  contact: `GDPR DPA შესახებ კითხვა? — ${CONTACT_EMAIL}`,
};

const cookies_ka: LegalDoc = {
  title:    'Cookie პოლიტიკა',
  subtitle: 'რომელ cookie-ს ვიყენებთ და როგორ მართოთ ისინი.',
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'შინაარსი',
  intro: [
    { kind: 'p', text: `Cookie არის პატარა ფაილი, რომელიც ბრაუზერი ინახავს. ვიყენებთ მათ თქვენი გამოცდილების გასაუმჯობესებლად და სერვისის უსაფრთხოებისთვის.` },
  ],
  sections: [
    {
      id: 'types',
      title: '1. რომელ cookie-ს ვიყენებთ',
      body: [
        { kind: 'p', text: `**აუცილებელი (Strictly Necessary)** — სერვისის მუშაობისთვის. გათიშვა შეუძლებელია:` },
        { kind: 'ul', items: [
          '`__clerk_*` — ავტორიზაცია (Clerk)',
          '`peit-lang` — ენის არჩევანი',
          '`peit_cookie_consent` — თქვენი cookie არჩევანი',
        ]},
        { kind: 'p', text: `**ფუნქციური (Functional)** — გამოცდილების გასაუმჯობესებლად:` },
        { kind: 'ul', items: [
          '`peit_v1_*` — ჩატ ვიჯეტის visitor ID, საუბრის ID',
        ]},
        { kind: 'p', text: `**ანალიტიკა** — ვებსაიტის ანონიმური სტატისტიკისთვის (აქტიურდება მხოლოდ თქვენი თანხმობით).` },
      ],
    },
    {
      id: 'third-party',
      title: '2. მესამე მხარის cookie',
      body: [
        { kind: 'p', text: `ჩვენი სერვისები იყენებენ:` },
        { kind: 'ul', items: [
          'Clerk — ავტორიზაცია (აუცილებელი)',
          'Vercel — hosting analytics (აუცილებელი)',
          'Lemon Squeezy — checkout (გადახდის დროს)',
        ]},
      ],
    },
    {
      id: 'manage',
      title: '3. cookie-ს მართვა',
      body: [
        { kind: 'p', text: `თქვენი არჩევანის შეცვლა შეგიძლიათ ნებისმიერ დროს — გვერდის ბოლოში "Cookie Preferences" ბმულით.` },
        { kind: 'p', text: `ბრაუზერში cookie-ს გათიშვა შესაძლებელია პარამეტრებიდან. შენიშვნა: აუცილებელი cookie-ს გათიშვა გამოიწვევს სერვისის შეუძლებლობას.` },
      ],
    },
    {
      id: 'changes',
      title: '4. ცვლილებები',
      body: [
        { kind: 'p', text: `ცვლილებების შესახებ შეტყობინებას მიიღებთ banner-ით ან email-ით.` },
      ],
    },
    {
      id: 'contact',
      title: '5. კონტაქტი',
      body: [
        { kind: 'p', text: `კითხვები: ${SUPPORT_EMAIL}` },
      ],
    },
  ],
  contact: `cookie-ს შესახებ კითხვა? — ${SUPPORT_EMAIL}`,
};

// ─── English ───────────────────────────────────────────────────────────────

const terms_en: LegalDoc = {
  title:    'Terms of Service',
  subtitle: `Legal agreement for using ${COMPANY}.`,
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'Contents',
  intro: [
    { kind: 'p', text: `These Terms govern your use of ${COMPANY} (the "Service") — an AI chatbot platform for small and medium businesses. It serves visitors and collects leads on websites, Telegram and Instagram.` },
    { kind: 'p', text: `By signing up or paying for the Service, you agree to these Terms. If you don't agree, don't use the Service.` },
  ],
  sections: [
    { id: 'service',        title: '1. Service Description', body: [
      { kind: 'p', text: `${COMPANY} provides a SaaS platform for creating AI chatbots, embedding them on websites, capturing leads and managing conversations.` },
      { kind: 'p', text: `The Service is provided "as is" and may change, be updated or discontinued at any time.` },
    ]},
    { id: 'account',        title: '2. Account & Security', body: [
      { kind: 'p', text: `Creating an account is required. You are responsible for the security of your account credentials.` },
      { kind: 'p', text: `You must be at least 18 years old or represent a registered business. Providing false information may result in account termination.` },
    ]},
    { id: 'trial-payment',  title: '3. Pricing, Trial and Payment', body: [
      { kind: 'p', text: `New users get a 7-day free trial. At trial end, your account is converted to a paid plan unless cancelled.` },
      { kind: 'p', text: `Payments are processed by Lemon Squeezy (Merchant of Record). Prices are listed on the website and may change — changes apply from the next billing period.` },
      { kind: 'p', text: `Applicable taxes (VAT) are added based on your jurisdiction.` },
    ]},
    { id: 'cancellation',   title: '4. Cancellation & Refund', body: [
      { kind: 'p', text: `You may cancel anytime from the dashboard. The Service remains available until the end of the current billing period.` },
      { kind: 'p', text: `Paid amounts are non-refundable except where required by law.` },
    ]},
    { id: 'acceptable-use', title: '5. Acceptable Use', body: [
      { kind: 'p', text: `You agree not to use the Service for:` },
      { kind: 'ul', items: [
        'Illegal, fraudulent or harmful purposes',
        'Spam, harassment, defamation, or violent content',
        'Infringing third-party rights (copyright, privacy, trademarks)',
        'Probing, hacking, or overloading our infrastructure',
        'Extracting AI models or building competing products',
      ]},
      { kind: 'p', text: `Violations result in immediate suspension, typically without refund.` },
    ]},
    { id: 'customer-data',  title: '6. Your Data and Content', body: [
      { kind: 'p', text: `You own all the content you upload or that our bot collects on your behalf — FAQs, knowledge base, conversations, leads.` },
      { kind: 'p', text: `You authorise us to process this data solely to provide the Service. See the Privacy Policy and DPA for details.` },
    ]},
    { id: 'ip',             title: '7. Intellectual Property', body: [
      { kind: 'p', text: `Peit's platform code, brand, design and algorithms are owned by ${COMPANY}. Use of the Service does not transfer ownership beyond a limited license to use the Service for your business.` },
    ]},
    { id: 'warranty',       title: '8. Disclaimers', body: [
      { kind: 'p', text: `The Service is provided "as is" and "as available". We do not warrant uninterrupted operation, error-free performance, or fitness for a particular purpose.` },
      { kind: 'p', text: `AI responses may be inaccurate or incomplete. The Service is an assistive tool — you remain responsible to your end users.` },
    ]},
    { id: 'liability',      title: '9. Limitation of Liability', body: [
      { kind: 'p', text: `To the maximum extent permitted by law, ${COMPANY}'s liability is limited to the amounts paid by you in the previous 12 months.` },
      { kind: 'p', text: `In no event are we liable for lost profits, business interruption, or damages arising from data loss.` },
    ]},
    { id: 'modifications',  title: '10. Changes', body: [
      { kind: 'p', text: `We may modify these Terms. We will notify you of material changes by email or in the dashboard at least 14 days in advance. Continued use means acceptance.` },
    ]},
    { id: 'law',            title: '11. Governing Law and Disputes', body: [
      { kind: 'p', text: `These Terms are governed by the laws of Georgia. Disputes will be resolved in the courts of Tbilisi unless mandatory law requires otherwise.` },
    ]},
    { id: 'contact',        title: '12. Contact', body: [
      { kind: 'p', text: `Questions? Reach us at ${CONTACT_EMAIL}` },
    ]},
  ],
  contact: `Questions about Terms? — ${CONTACT_EMAIL}`,
};

const privacy_en: LegalDoc = {
  title:    'Privacy Policy',
  subtitle: 'How we collect, use and protect your data.',
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'Contents',
  intro: [
    { kind: 'p', text: `${COMPANY} ("we") respects your privacy. This document explains what data we collect, why and how we handle it.` },
    { kind: 'p', text: `It applies to peit.ge, the dashboard, and the chat widget embedded on customer websites.` },
  ],
  sections: [
    { id: 'controller', title: '1. Data Controller', body: [
      { kind: 'p', text: `${COMPANY}, registered in Georgia. Contact: ${CONTACT_EMAIL}.` },
      { kind: 'p', text: `For bot-visitor data we are a processor; you — the Peit customer — are the controller (see GDPR DPA).` },
    ]},
    { id: 'data-collected', title: '2. Data We Collect', body: [
      { kind: 'p', text: `Account creation:` },
      { kind: 'ul', items: [
        'Name, email',
        'Profile picture (via Clerk — optional)',
        'IP address and billing data (via Lemon Squeezy; card numbers are not stored by us)',
      ]},
      { kind: 'p', text: `Service usage:` },
      { kind: 'ul', items: [
        'Bot configuration, FAQs, knowledge base',
        'Visitor conversations (query + bot reply)',
        'Leads collected by your bot',
        'Analytics data (page URL, browser)',
      ]},
    ]},
    { id: 'purposes', title: '3. Why We Collect', body: [
      { kind: 'ul', items: [
        'To provide the Service (contract performance)',
        'Billing and account management',
        'Security and fraud detection',
        'Product improvement (anonymised analytics)',
        'Legal compliance',
      ]},
    ]},
    { id: 'legal-basis', title: '4. Legal Basis (GDPR Art. 6)', body: [
      { kind: 'ul', items: [
        'Contract performance — to deliver the Service',
        'Your consent — marketing email, analytics cookies',
        'Legal obligation — tax records, accounting',
        'Legitimate interest — security, fraud prevention',
      ]},
    ]},
    { id: 'sharing', title: '5. Third-Party Sharing', body: [
      { kind: 'p', text: `We do not sell your data. We share only with our sub-processors for infrastructure:` },
      { kind: 'ul', items: [
        'Clerk (USA) — authentication and account management',
        'Vercel (USA/EU) — hosting and CDN',
        'Lemon Squeezy (USA) — payments, Merchant of Record',
        'Anthropic (USA) — Claude AI model',
        'Voyage AI (USA) — embedding model',
        'Resend (USA/EU) — transactional email',
        'Supabase / Postgres (EU) — database',
      ]},
      { kind: 'p', text: `All third parties are bound by Standard Contractual Clauses to GDPR standards.` },
    ]},
    { id: 'retention', title: '6. Retention', body: [
      { kind: 'ul', items: [
        'Account data: lifetime of account + 90 days',
        'Billing records: 7 years (Georgian tax code)',
        'Conversations and leads: per your retention policy, default 12 months',
        'Log files: 30 days',
      ]},
      { kind: 'p', text: `Upon account deletion, your data is removed within 30 days (up to 90 days in backups).` },
    ]},
    { id: 'rights', title: '7. Your Rights (GDPR Art. 15–22)', body: [
      { kind: 'ul', items: [
        'Access — request your data (dashboard → Settings → Export)',
        'Rectification — update incorrect data',
        'Erasure ("Right to be forgotten")',
        'Restriction of processing',
        'Data portability (CSV / JSON export)',
        'Object (against analytics or marketing)',
        'Withdraw consent at any time',
      ]},
      { kind: 'p', text: `To exercise: ${CONTACT_EMAIL}. We respond within 30 days.` },
    ]},
    { id: 'security', title: '8. Security', body: [
      { kind: 'p', text: `Industry standards: TLS 1.3, encrypted at rest, role-based access control. Personal data is segregated; access on a need-to-know basis.` },
    ]},
    { id: 'children', title: '9. Children', body: [
      { kind: 'p', text: `The Service is not intended for children under 16. If we discover such data was collected, we will delete it immediately.` },
    ]},
    { id: 'changes', title: '10. Changes', body: [
      { kind: 'p', text: `We will notify you of policy changes by email or in the dashboard. The "last updated" date is shown at the top.` },
    ]},
    { id: 'contact', title: '11. Contact and Supervisory Authority', body: [
      { kind: 'p', text: `${CONTACT_EMAIL} — Data Protection Officer.` },
      { kind: 'p', text: `Georgian Data Protection Service: personaldata.ge` },
      { kind: 'p', text: `EU residents — you have the right to lodge a complaint with your local DPA.` },
    ]},
  ],
  contact: `Privacy question? — ${CONTACT_EMAIL}`,
};

const gdpr_en: LegalDoc = {
  title:    'GDPR — Data Processing Agreement (DPA)',
  subtitle: `Peit's role in processing your end-users' data.`,
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'Contents',
  intro: [
    { kind: 'p', text: `This DPA supplements your Peit service agreement and defines how we process your bot visitors' data (leads, chat logs) on your behalf.` },
    { kind: 'p', text: `By using Peit you accept this DPA as part of the agreement.` },
  ],
  sections: [
    { id: 'roles', title: '1. Roles', body: [
      { kind: 'p', text: `You are the controller of your visitors' data (GDPR Art. 4(7)). ${COMPANY} acts as processor on your behalf (Art. 4(8)).` },
    ]},
    { id: 'scope', title: '2. Scope of Processing', body: [
      { kind: 'p', text: `Nature & purpose: AI chatbot service — answering visitor questions, lead capture, analytics.` },
      { kind: 'p', text: `Duration: for the term of the service agreement + 30 days for deletion.` },
      { kind: 'p', text: `Data categories: name, email, phone, IP, chat logs, visit metadata.` },
      { kind: 'p', text: `Data subjects: visitors of your website and chat.` },
    ]},
    { id: 'instructions', title: '3. Our Obligations', body: [
      { kind: 'ul', items: [
        'Process data only on your documented instructions',
        'Confidentiality agreements with personnel',
        'Technical and organisational security measures (Art. 32)',
        'Equivalent security standards from sub-processors',
        'Assistance with data subject rights',
        'Breach notification within 72 hours',
        'Deletion or return of data on termination',
      ]},
    ]},
    { id: 'your-obligations', title: '4. Your Obligations', body: [
      { kind: 'ul', items: [
        'Lawful basis for collecting visitor data',
        'Your own privacy policy and cookie consent for visitors',
        'Adherence to data minimisation',
        'Timely response to data subject requests',
      ]},
    ]},
    { id: 'subprocessors', title: '5. Sub-Processors', body: [
      { kind: 'p', text: `We use the following sub-processors:` },
      { kind: 'ul', items: [
        'Clerk (Authentication, USA)',
        'Vercel (Hosting & CDN, USA/EU)',
        'Lemon Squeezy (Payments, USA)',
        'Anthropic (Claude AI, USA)',
        'Voyage AI (Embeddings, USA)',
        'Resend (Transactional email, USA/EU)',
        'Postgres provider (Database, EU)',
      ]},
      { kind: 'p', text: `We will notify you 30 days in advance of any new sub-processor and you may object.` },
    ]},
    { id: 'security', title: '6. Security Measures', body: [
      { kind: 'ul', items: [
        'TLS 1.3 in transit, AES-256 at rest',
        'Role-based access control, staff MFA',
        'Regular security audits',
        'Separate access logging',
        'Continuous backups and disaster recovery (RPO ≤ 24h)',
      ]},
    ]},
    { id: 'breach', title: '7. Breach Notification', body: [
      { kind: 'p', text: `In case of a data breach we will notify you within 72 hours of discovery, describing nature, impact and mitigation steps.` },
    ]},
    { id: 'audit', title: '8. Audit', body: [
      { kind: 'p', text: `Once per year, with 30 days written notice, you may request evidence of our GDPR compliance — via SOC 2 / ISO 27001 reports or a written questionnaire.` },
    ]},
    { id: 'transfers', title: '9. International Transfers', body: [
      { kind: 'p', text: `Transfers outside the EU rely on Standard Contractual Clauses (SCC) or adequacy decisions.` },
    ]},
    { id: 'termination', title: '10. Termination', body: [
      { kind: 'p', text: `Upon termination, your visitors' data will be deleted within 30 days unless retention is legally required.` },
    ]},
    { id: 'contact', title: '11. Contact', body: [
      { kind: 'p', text: `DPA or GDPR questions: ${CONTACT_EMAIL}` },
    ]},
  ],
  contact: `GDPR DPA question? — ${CONTACT_EMAIL}`,
};

const cookies_en: LegalDoc = {
  title:    'Cookie Policy',
  subtitle: 'Which cookies we use and how to manage them.',
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'Contents',
  intro: [
    { kind: 'p', text: `Cookies are small files stored by your browser. We use them to improve your experience and secure the Service.` },
  ],
  sections: [
    { id: 'types', title: '1. Cookies We Use', body: [
      { kind: 'p', text: `**Strictly necessary** — required for the Service. Cannot be disabled:` },
      { kind: 'ul', items: [
        '`__clerk_*` — authentication (Clerk)',
        '`peit-lang` — language preference',
        '`peit_cookie_consent` — your cookie choice',
      ]},
      { kind: 'p', text: `**Functional** — improve your experience:` },
      { kind: 'ul', items: [
        '`peit_v1_*` — chat widget visitor ID, conversation ID',
      ]},
      { kind: 'p', text: `**Analytics** — anonymous website statistics (only enabled with your consent).` },
    ]},
    { id: 'third-party', title: '2. Third-Party Cookies', body: [
      { kind: 'p', text: `Our services use:` },
      { kind: 'ul', items: [
        'Clerk — authentication (necessary)',
        'Vercel — hosting analytics (necessary)',
        'Lemon Squeezy — checkout (at payment time)',
      ]},
    ]},
    { id: 'manage', title: '3. Managing Cookies', body: [
      { kind: 'p', text: `You can change your choice anytime via the "Cookie Preferences" link in the footer.` },
      { kind: 'p', text: `You can also disable cookies in your browser settings. Note: disabling strictly necessary cookies will break the Service.` },
    ]},
    { id: 'changes', title: '4. Changes', body: [
      { kind: 'p', text: `Changes will be communicated via banner or email.` },
    ]},
    { id: 'contact', title: '5. Contact', body: [
      { kind: 'p', text: `Questions: ${SUPPORT_EMAIL}` },
    ]},
  ],
  contact: `Cookie question? — ${SUPPORT_EMAIL}`,
};

// ─── Russian ───────────────────────────────────────────────────────────────

const terms_ru: LegalDoc = {
  title:    'Условия сервиса',
  subtitle: `Юридическое соглашение об использовании ${COMPANY}.`,
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'Содержание',
  intro: [
    { kind: 'p', text: `Настоящие Условия регулируют ваше использование сервиса ${COMPANY} ("Сервис") — AI-платформы чат-ботов для малого и среднего бизнеса. Сервис обслуживает посетителей и собирает лиды на сайтах, в Telegram и Instagram.` },
    { kind: 'p', text: `Регистрируясь или оплачивая Сервис, вы соглашаетесь с этими Условиями. Если не согласны — не используйте Сервис.` },
  ],
  sections: [
    { id: 'service',        title: '1. Описание сервиса', body: [
      { kind: 'p', text: `${COMPANY} предоставляет SaaS-платформу для создания AI чат-ботов, их размещения на сайтах, сбора лидов и управления диалогами.` },
      { kind: 'p', text: `Сервис предоставляется "как есть" и может изменяться, обновляться или прекращаться в любой момент.` },
    ]},
    { id: 'account',        title: '2. Аккаунт и безопасность', body: [
      { kind: 'p', text: `Для использования Сервиса требуется создание аккаунта. Вы отвечаете за безопасность своих учётных данных.` },
      { kind: 'p', text: `Вам должно быть не менее 18 лет либо вы представляете зарегистрированный бизнес. Предоставление ложных данных может привести к прекращению аккаунта.` },
    ]},
    { id: 'trial-payment',  title: '3. Цены, триал и оплата', body: [
      { kind: 'p', text: `Новые пользователи получают 7-дневный бесплатный триал. В конце триала аккаунт переходит на платный план, если не отменён.` },
      { kind: 'p', text: `Оплата проводится через Lemon Squeezy (Merchant of Record). Цены опубликованы на сайте и могут изменяться — изменения вступают в силу со следующего платежного периода.` },
      { kind: 'p', text: `Налоги (VAT) добавляются согласно вашей юрисдикции.` },
    ]},
    { id: 'cancellation',   title: '4. Отмена и возврат', body: [
      { kind: 'p', text: `Отмена возможна в любое время из dashboard. Сервис останется доступным до конца текущего периода.` },
      { kind: 'p', text: `Уплаченные суммы не возвращаются, за исключением случаев, предусмотренных законом.` },
    ]},
    { id: 'acceptable-use', title: '5. Допустимое использование', body: [
      { kind: 'p', text: `Вы соглашаетесь не использовать Сервис для:` },
      { kind: 'ul', items: [
        'Незаконных, мошеннических или вредоносных целей',
        'Спама, преследования, клеветы или насильственного контента',
        'Нарушения прав третьих лиц (авторских, приватных, торговых)',
        'Тестирования, взлома или перегрузки инфраструктуры',
        'Извлечения AI моделей или создания конкурирующих продуктов',
      ]},
      { kind: 'p', text: `Нарушения приводят к немедленной приостановке, обычно без возврата средств.` },
    ]},
    { id: 'customer-data',  title: '6. Ваши данные и контент', body: [
      { kind: 'p', text: `Вы владеете всем контентом, который загружаете или который наш бот собирает от вашего имени — FAQ, база знаний, разговоры, лиды.` },
      { kind: 'p', text: `Вы разрешаете нам обрабатывать эти данные только для предоставления Сервиса. Подробности — в Privacy Policy и DPA.` },
    ]},
    { id: 'ip',             title: '7. Интеллектуальная собственность', body: [
      { kind: 'p', text: `Код, бренд, дизайн и алгоритмы платформы ${COMPANY} принадлежат компании. Использование Сервиса не передаёт права собственности, кроме ограниченной лицензии на использование для вашего бизнеса.` },
    ]},
    { id: 'warranty',       title: '8. Отказ от гарантий', body: [
      { kind: 'p', text: `Сервис предоставляется "как есть" и "по доступности". Мы не гарантируем непрерывную работу, отсутствие ошибок или соответствие конкретным целям.` },
      { kind: 'p', text: `Ответы AI могут быть неточными или неполными. Сервис — вспомогательный инструмент, ответственность перед конечными пользователями остаётся за вами.` },
    ]},
    { id: 'liability',      title: '9. Ограничение ответственности', body: [
      { kind: 'p', text: `В максимальной степени, разрешённой законом, ответственность ${COMPANY} ограничена суммами, уплаченными вами за предыдущие 12 месяцев.` },
      { kind: 'p', text: `Ни при каких обстоятельствах мы не несём ответственности за упущенную прибыль, простой бизнеса или ущерб от потери данных.` },
    ]},
    { id: 'modifications',  title: '10. Изменения', body: [
      { kind: 'p', text: `Мы можем изменять эти Условия. О существенных изменениях вы будете уведомлены по email или в dashboard минимум за 14 дней. Продолжение использования означает согласие.` },
    ]},
    { id: 'law',            title: '11. Применимое право и споры', body: [
      { kind: 'p', text: `Условия регулируются законодательством Грузии. Споры рассматриваются в судах Тбилиси, если иное не предписано императивным законом.` },
    ]},
    { id: 'contact',        title: '12. Контакт', body: [
      { kind: 'p', text: `Вопросы? Свяжитесь: ${CONTACT_EMAIL}` },
    ]},
  ],
  contact: `Вопросы об Условиях? — ${CONTACT_EMAIL}`,
};

const privacy_ru: LegalDoc = {
  title:    'Политика конфиденциальности',
  subtitle: 'Как мы собираем, используем и защищаем ваши данные.',
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'Содержание',
  intro: [
    { kind: 'p', text: `${COMPANY} ("мы") уважает вашу конфиденциальность. В этом документе описано, какие данные мы собираем, зачем и как с ними обращаемся.` },
    { kind: 'p', text: `Распространяется на peit.ge, dashboard и чат-виджет на сайтах клиентов.` },
  ],
  sections: [
    { id: 'controller', title: '1. Контролёр данных', body: [
      { kind: 'p', text: `${COMPANY}, зарегистрирован в Грузии. Контакт: ${CONTACT_EMAIL}.` },
      { kind: 'p', text: `В отношении данных посетителей бота мы — процессор, а вы (клиент Peit) — контролёр (см. GDPR DPA).` },
    ]},
    { id: 'data-collected', title: '2. Какие данные мы собираем', body: [
      { kind: 'p', text: `При создании аккаунта:` },
      { kind: 'ul', items: [
        'Имя, email',
        'Аватар (через Clerk — опционально)',
        'IP-адрес и платёжные данные (через Lemon Squeezy; номер карты у нас не хранится)',
      ]},
      { kind: 'p', text: `При использовании сервиса:` },
      { kind: 'ul', items: [
        'Конфигурация ботов, FAQ, база знаний',
        'Разговоры посетителей (запрос + ответ бота)',
        'Лиды, собранные ботом',
        'Аналитические данные (URL, браузер)',
      ]},
    ]},
    { id: 'purposes', title: '3. Зачем собираем', body: [
      { kind: 'ul', items: [
        'Для предоставления Сервиса (исполнение договора)',
        'Биллинг и управление аккаунтом',
        'Безопасность и защита от мошенничества',
        'Улучшение продукта (анонимная аналитика)',
        'Юридические обязательства',
      ]},
    ]},
    { id: 'legal-basis', title: '4. Правовая основа (GDPR ст. 6)', body: [
      { kind: 'ul', items: [
        'Исполнение договора — для предоставления Сервиса',
        'Ваше согласие — маркетинговые email, аналитические cookie',
        'Юридическая обязанность — налоговый учёт',
        'Законный интерес — безопасность, борьба с мошенничеством',
      ]},
    ]},
    { id: 'sharing', title: '5. Передача третьим сторонам', body: [
      { kind: 'p', text: `Мы не продаём ваши данные. Передаём только субпроцессорам для инфраструктуры:` },
      { kind: 'ul', items: [
        'Clerk (США) — аутентификация',
        'Vercel (США/ЕС) — hosting и CDN',
        'Lemon Squeezy (США) — платежи, Merchant of Record',
        'Anthropic (США) — Claude AI',
        'Voyage AI (США) — embedding',
        'Resend (США/ЕС) — транзакционная почта',
        'Supabase / Postgres (ЕС) — база данных',
      ]},
      { kind: 'p', text: `Все третьи стороны связаны Standard Contractual Clauses на уровне GDPR.` },
    ]},
    { id: 'retention', title: '6. Срок хранения', body: [
      { kind: 'ul', items: [
        'Данные аккаунта: срок аккаунта + 90 дней',
        'Платёжные записи: 7 лет (Налоговый кодекс Грузии)',
        'Разговоры и лиды: согласно вашей политике, по умолчанию 12 месяцев',
        'Логи: 30 дней',
      ]},
      { kind: 'p', text: `После удаления аккаунта данные удаляются в течение 30 дней (в backup — до 90 дней).` },
    ]},
    { id: 'rights', title: '7. Ваши права (GDPR ст. 15–22)', body: [
      { kind: 'ul', items: [
        'Доступ — запросить данные (dashboard → Settings → Export)',
        'Исправление — обновить неверные данные',
        'Удаление ("Право на забвение")',
        'Ограничение обработки',
        'Перенос данных (CSV / JSON экспорт)',
        'Возражение (против аналитики или маркетинга)',
        'Отзыв согласия в любое время',
      ]},
      { kind: 'p', text: `Запрос: ${CONTACT_EMAIL}. Ответ — в течение 30 дней.` },
    ]},
    { id: 'security', title: '8. Безопасность', body: [
      { kind: 'p', text: `Используем индустриальные стандарты: TLS 1.3, encrypted at rest, role-based access control. Персональные данные изолированы; доступ — только при необходимости.` },
    ]},
    { id: 'children', title: '9. Дети', body: [
      { kind: 'p', text: `Сервис не предназначен для детей до 16 лет. При обнаружении таких данных мы удалим их незамедлительно.` },
    ]},
    { id: 'changes', title: '10. Изменения', body: [
      { kind: 'p', text: `Об изменениях вы будете уведомлены по email или в dashboard. Дата последнего обновления указана в начале страницы.` },
    ]},
    { id: 'contact', title: '11. Контакт и надзорный орган', body: [
      { kind: 'p', text: `${CONTACT_EMAIL} — Data Protection Officer.` },
      { kind: 'p', text: `Служба защиты данных Грузии: personaldata.ge` },
      { kind: 'p', text: `Резиденты ЕС — у вас есть право подать жалобу в местный DPA.` },
    ]},
  ],
  contact: `Вопрос о конфиденциальности? — ${CONTACT_EMAIL}`,
};

const gdpr_ru: LegalDoc = {
  title:    'GDPR — Соглашение о обработке данных (DPA)',
  subtitle: `Роль Peit в обработке данных ваших клиентов.`,
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'Содержание',
  intro: [
    { kind: 'p', text: `Это DPA дополняет ваше соглашение с Peit и определяет, как мы обрабатываем данные посетителей вашего бота (лиды, чат-логи) от вашего имени.` },
    { kind: 'p', text: `Используя Peit, вы принимаете это DPA как часть соглашения.` },
  ],
  sections: [
    { id: 'roles', title: '1. Роли', body: [
      { kind: 'p', text: `Вы — контролёр данных ваших посетителей (GDPR ст. 4(7)). ${COMPANY} действует от вашего имени как процессор (ст. 4(8)).` },
    ]},
    { id: 'scope', title: '2. Сфера обработки', body: [
      { kind: 'p', text: `Природа и цель: сервис AI чат-бота — ответы на вопросы посетителей, сбор лидов, аналитика.` },
      { kind: 'p', text: `Срок: на всё время действия соглашения + 30 дней на удаление.` },
      { kind: 'p', text: `Категории данных: имя, email, телефон, IP, чат-логи, метаданные визита.` },
      { kind: 'p', text: `Субъекты данных: посетители вашего сайта и чата.` },
    ]},
    { id: 'instructions', title: '3. Наши обязательства', body: [
      { kind: 'ul', items: [
        'Обработка данных только по вашим документированным инструкциям',
        'Соглашения о конфиденциальности с персоналом',
        'Технические и организационные меры безопасности (ст. 32)',
        'Эквивалентные стандарты безопасности от субпроцессоров',
        'Помощь в реализации прав субъектов данных',
        'Уведомление о нарушении в течение 72 часов',
        'Удаление или возврат данных при расторжении',
      ]},
    ]},
    { id: 'your-obligations', title: '4. Ваши обязательства', body: [
      { kind: 'ul', items: [
        'Правовая основа для сбора данных посетителей',
        'Собственная privacy policy и согласие на cookie для посетителей',
        'Соблюдение принципа минимизации данных',
        'Своевременный ответ на запросы субъектов данных',
      ]},
    ]},
    { id: 'subprocessors', title: '5. Субпроцессоры', body: [
      { kind: 'p', text: `Мы используем следующих субпроцессоров:` },
      { kind: 'ul', items: [
        'Clerk (Аутентификация, США)',
        'Vercel (Hosting & CDN, США/ЕС)',
        'Lemon Squeezy (Платежи, США)',
        'Anthropic (Claude AI, США)',
        'Voyage AI (Embeddings, США)',
        'Resend (Транзакционная почта, США/ЕС)',
        'Postgres-провайдер (БД, ЕС)',
      ]},
      { kind: 'p', text: `О новом субпроцессоре мы уведомим за 30 дней, и у вас будет право на возражение.` },
    ]},
    { id: 'security', title: '6. Меры безопасности', body: [
      { kind: 'ul', items: [
        'TLS 1.3 при передаче, AES-256 в покое',
        'Role-based access control, MFA для персонала',
        'Регулярные аудиты безопасности',
        'Отдельное логирование доступа',
        'Непрерывные backup и disaster recovery (RPO ≤ 24ч)',
      ]},
    ]},
    { id: 'breach', title: '7. Уведомление о нарушении', body: [
      { kind: 'p', text: `В случае нарушения данных мы уведомим вас в течение 72 часов с момента обнаружения, описав природу, ущерб и меры реагирования.` },
    ]},
    { id: 'audit', title: '8. Аудит', body: [
      { kind: 'p', text: `Раз в год, с письменным уведомлением за 30 дней, вы можете запросить доказательства нашего соответствия GDPR — отчёты SOC 2 / ISO 27001 или письменный опросник.` },
    ]},
    { id: 'transfers', title: '9. Международные передачи', body: [
      { kind: 'p', text: `Передачи за пределы ЕС основаны на Standard Contractual Clauses (SCC) или решениях об адекватности.` },
    ]},
    { id: 'termination', title: '10. Расторжение', body: [
      { kind: 'p', text: `При расторжении данные посетителей удаляются в течение 30 дней, если хранение не требуется по закону.` },
    ]},
    { id: 'contact', title: '11. Контакт', body: [
      { kind: 'p', text: `Вопросы по DPA или GDPR: ${CONTACT_EMAIL}` },
    ]},
  ],
  contact: `Вопрос о GDPR DPA? — ${CONTACT_EMAIL}`,
};

const cookies_ru: LegalDoc = {
  title:    'Политика cookie',
  subtitle: 'Какие cookie мы используем и как ими управлять.',
  effectiveDate: EFFECTIVE_DATE,
  tocLabel: 'Содержание',
  intro: [
    { kind: 'p', text: `Cookie — это небольшие файлы, которые хранит ваш браузер. Мы используем их для улучшения опыта и безопасности Сервиса.` },
  ],
  sections: [
    { id: 'types', title: '1. Какие cookie используем', body: [
      { kind: 'p', text: `**Строго необходимые** — для работы Сервиса. Нельзя отключить:` },
      { kind: 'ul', items: [
        '`__clerk_*` — аутентификация (Clerk)',
        '`peit-lang` — выбор языка',
        '`peit_cookie_consent` — ваш выбор cookie',
      ]},
      { kind: 'p', text: `**Функциональные** — улучшают опыт:` },
      { kind: 'ul', items: [
        '`peit_v1_*` — visitor ID и conversation ID чат-виджета',
      ]},
      { kind: 'p', text: `**Аналитика** — анонимная статистика сайта (включается только с вашего согласия).` },
    ]},
    { id: 'third-party', title: '2. Cookie третьих сторон', body: [
      { kind: 'p', text: `Наши сервисы используют:` },
      { kind: 'ul', items: [
        'Clerk — аутентификация (необходимо)',
        'Vercel — hosting analytics (необходимо)',
        'Lemon Squeezy — checkout (на момент оплаты)',
      ]},
    ]},
    { id: 'manage', title: '3. Управление cookie', body: [
      { kind: 'p', text: `Изменить выбор можно в любое время через ссылку "Cookie Preferences" внизу страницы.` },
      { kind: 'p', text: `Также можно отключить cookie в настройках браузера. Внимание: отключение необходимых cookie сделает Сервис недоступным.` },
    ]},
    { id: 'changes', title: '4. Изменения', body: [
      { kind: 'p', text: `Об изменениях вы узнаете через баннер или email.` },
    ]},
    { id: 'contact', title: '5. Контакт', body: [
      { kind: 'p', text: `Вопросы: ${SUPPORT_EMAIL}` },
    ]},
  ],
  contact: `Вопрос о cookie? — ${SUPPORT_EMAIL}`,
};

// ─── Export ────────────────────────────────────────────────────────────────

export const legalDocs: Record<LegalSlug, Record<Lang, LegalDoc>> = {
  terms:   { ka: terms_ka,   en: terms_en,   ru: terms_ru   },
  privacy: { ka: privacy_ka, en: privacy_en, ru: privacy_ru },
  gdpr:    { ka: gdpr_ka,    en: gdpr_en,    ru: gdpr_ru    },
  cookies: { ka: cookies_ka, en: cookies_en, ru: cookies_ru },
};

/** Short labels per slug, used by Footer / nav. */
export const legalLabels: Record<LegalSlug, Record<Lang, string>> = {
  terms:   { ka: 'სერვისის წესები',         en: 'Terms of Service', ru: 'Условия сервиса' },
  privacy: { ka: 'კონფიდენციალურობა',         en: 'Privacy Policy',   ru: 'Конфиденциальность' },
  gdpr:    { ka: 'GDPR DPA',                  en: 'GDPR DPA',         ru: 'GDPR DPA' },
  cookies: { ka: 'Cookie პოლიტიკა',           en: 'Cookie Policy',    ru: 'Cookie' },
};

/** Localised "last updated" prefix. */
export const legalUpdatedLabel: Record<Lang, string> = {
  ka: 'ბოლო განახლება',
  en: 'Last updated',
  ru: 'Последнее обновление',
};
