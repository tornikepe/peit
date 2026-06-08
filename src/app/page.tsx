import { Suspense } from "react";
import MidnightLanding from "@/components/landing/MidnightLanding";
import AuthModalLauncher from "@/components/auth/AuthModalLauncher";
import JsonLd, { softwareApplicationSchema, faqPageSchema } from "@/components/JsonLd";
import { buildMetadata } from "@/lib/seo";
// Chat widget is heavy + interactive but never visible above the fold,
// so we lazy-load it. The wrapper component owns the `ssr: false`
// dynamic() call (Next 14+ doesn't allow that flag inside a Server
// Component) and shows a 60×60 placeholder until the bundle arrives.
import LazyChatWidget from "@/components/LazyChatWidget";

export const metadata = buildMetadata({
  title:       'Peit — AI ჩატბოტი ქართული ბიზნესისთვის · 7 დღე უფასოდ',
  description: 'AI ჩატბოტი, რომელიც პასუხობს კლიენტებს ქართულად 24/7, აგროვებს ლიდებს და ცვლის support-ის სპეციალისტს — ₾45-დან თვეში. 10 წუთის setup.',
  path:        '/',
  locale:      'ka',
  keywords:    [
    'AI ჩატბოტი', 'AI ასისტენტი', 'ბიზნეს ავტომატიზაცია', 'Georgia chatbot',
    'ქართული chatbot', 'ლიდების შეგროვება', 'Telegram bot', 'Instagram chatbot', 'Peit',
  ],
});

// Real Q&A from the homepage FAQ section — also used as FAQPage JSON-LD
// so Google can surface rich snippets right under the search result.
const FAQ_ITEMS = [
  { q: 'რა არის Peit?', a: 'Peit არის AI ჩატბოტი ქართული ბიზნესისთვის — პასუხობს ვებსაიტზე, Telegram-ში, Instagram-ში და Facebook Messenger-ში, აგროვებს ლიდებს და მუშავდება 24/7 ქართულად, ინგლისურად და რუსულად.' },
  { q: 'რამდენ ხანში დაყენდება?', a: '10 წუთი — სრულად ცოცხალი. ჩაწერ საიტის URL-ს, Peit ნახულობს გვერდებს, აშენებს ცოდნის ბაზას და ბოტი მაშინვე იწყებს მუშავდებას.' },
  { q: 'უფასო ტრიალი როგორ მუშავდება?', a: 'Basic plan-ის ახალი მომხმარებლები იღებენ 7-დღიან უფასო ტრიალს ყველა ფუნქციით. ბარათი არ გჭირდება. გაუქმება ნებისმიერ მომენტში dashboard-დან.' },
  { q: 'რომელ არხებზე მუშავდება?', a: 'ვებსაიტი (embeddable widget), Telegram, Instagram, Facebook Messenger — ერთიანი dashboard-დან, ერთი ცოდნის ბაზით.' },
  { q: 'მონაცემები სად ინახება?', a: 'Frankfurt-ის data-center-ში (GDPR-შესაბამისად) + თბილისის backup region. End-to-end ენკრიფცია. Enterprise plan-ზე — სრულად საქართველოს ტერიტორიაზე.' },
  { q: 'რა ფასი აქვს?', a: 'Basic ₾45/თვე, Pro ₾65/თვე, Ultimate ₾155/თვე. Pro-ი ყველაზე პოპულარულია — ჩატავს RAG retrieval-ს და Telegram+Instagram-ის ინტეგრაციას.' },
];

export default function Home() {
  return (
    <>
      {/* SoftwareApplication + FAQPage JSON-LD — both eligible for
          Google rich results. Organization is already in the root
          layout so we don't duplicate it here. */}
      <JsonLd data={[softwareApplicationSchema(), faqPageSchema(FAQ_ITEMS)]} />

      <MidnightLanding />
      <Suspense fallback={null}><AuthModalLauncher /></Suspense>
      <LazyChatWidget />
    </>
  );
}
