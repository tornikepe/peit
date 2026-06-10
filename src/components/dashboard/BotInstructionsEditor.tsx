'use client';

// Free-form instructions the business owner writes to tailor the bot to their
// business. Saved to the bot (PATCH /api/bots/[id]) on blur; injected as the
// highest-priority block of the bot's system prompt.

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, Check, Loader2 } from 'lucide-react';

export default function BotInstructionsEditor({ botId, initial }: { botId: string; initial: string }) {
  const en = useLanguage().lang === 'en';
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  async function save() {
    if (value === saved) return;
    setStatus('saving');
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ instructions: value }),
      });
      if (res.ok) { setSaved(value); setStatus('done'); setTimeout(() => setStatus('idle'), 1600); }
      else setStatus('idle');
    } catch { setStatus('idle'); }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-blue-300" />
        <h2 className="text-white font-semibold">{en ? 'Bot instructions' : 'ბოტის ინსტრუქციები'}</h2>
        {status === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />}
        {status === 'done' && (
          <span className="text-xs text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> {en ? 'Saved' : 'შენახულია'}</span>
        )}
      </div>
      <p className="text-gray-500 text-xs mb-3 leading-relaxed">
        {en
          ? 'Tell the bot what to do for your business — it follows these instructions with the highest priority. E.g.: \u201calways offer the free trial\u201d, \u201cget a phone number before quoting prices\u201d, \u201cnever mention competitors\u201d, \u201cworking hours 10:00\u201323:00\u201d.'
          : 'აუხსენი ბოტს, რა უნდა აკეთოს შენი ბიზნესისთვის — ის ამ ინსტრუქციებს ყველაზე მაღალი პრიორიტეტით დაიცავს. მაგ: «ყოველთვის შესთავაზე უფასო ტრიალი», «ფასებამდე აიღე ტელეფონის ნომერი», «არასდროს ახსენო კონკურენტები», «მუშაობის საათები 10:00–23:00».'}
      </p>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        rows={6}
        maxLength={4000}
        placeholder={en ? 'E.g.: We are a restaurant in Tbilisi. Always offer the menu and table booking. Delivery within 40 minutes. Payment by card or on site.' : 'მაგ: ჩვენ ვართ რესტორანი თბილისში. ყოველთვის შესთავაზე მენიუ და მაგიდის ჯავშანი. მიტანა 40 წუთამდე. გადახდა ბარათით ან ადგილზე.'}
        className="w-full bg-[#13131f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/60 resize-y"
      />
      <div className="text-right text-[11px] text-gray-600 mt-1">{value.length}/4000</div>
    </div>
  );
}
