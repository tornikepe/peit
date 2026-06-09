'use client';

// Free-form instructions the business owner writes to tailor the bot to their
// business. Saved to the bot (PATCH /api/bots/[id]) on blur; injected as the
// highest-priority block of the bot's system prompt.

import { useState } from 'react';
import { Sparkles, Check, Loader2 } from 'lucide-react';

export default function BotInstructionsEditor({ botId, initial }: { botId: string; initial: string }) {
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
        <h2 className="text-white font-semibold">ბოტის ინსტრუქციები</h2>
        {status === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />}
        {status === 'done' && (
          <span className="text-xs text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> შენახულია</span>
        )}
      </div>
      <p className="text-gray-500 text-xs mb-3 leading-relaxed">
        აუხსენი ბოტს, რა უნდა აკეთოს შენი ბიზნესისთვის — ის ამ ინსტრუქციებს ყველაზე მაღალი
        პრიორიტეტით დაიცავს. მაგ: «ყოველთვის შესთავაზე უფასო ტრიალი», «ფასებამდე აიღე ტელეფონის
        ნომერი», «არასდროს ახსენო კონკურენტები», «მუშაობის საათები 10:00–23:00».
      </p>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        rows={6}
        maxLength={4000}
        placeholder="მაგ: ჩვენ ვართ რესტორანი თბილისში. ყოველთვის შესთავაზე მენიუ და მაგიდის ჯავშანი. მიტანა 40 წუთამდე. გადახდა ბარათით ან ადგილზე."
        className="w-full bg-[#13131f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/60 resize-y"
      />
      <div className="text-right text-[11px] text-gray-600 mt-1">{value.length}/4000</div>
    </div>
  );
}
