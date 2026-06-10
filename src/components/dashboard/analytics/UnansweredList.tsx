// Unanswered questions — the bot dropped to the fallback tier or emitted
// a "I don't know" phrase. The owner can use this list to grow the FAQ
// or feed more knowledge into the bot.

import { AlertTriangle } from 'lucide-react';
import T from '@/components/T';
import type { UnansweredItem } from '@/lib/analytics';

interface Props { items: UnansweredItem[] }

export default function UnansweredList({ items }: Props) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-300" />
        <h3 className="text-white font-semibold"><T ka="უპასუხო კითხვები" en="Unanswered questions" /></h3>
      </div>
      <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
        <T ka="როცა ბოტმა ვერ იპოვა პასუხი — დაამატე ეს კითხვები FAQ-ში ან გააძლიერე knowledge base" en="When the bot couldn't find an answer — add these questions to your FAQ or strengthen the knowledge base" />
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="text-emerald-400 text-2xl mb-1">✓</div>
          <p className="text-xs text-gray-400"><T ka="ყველა კითხვაზე ბოტმა იპოვა პასუხი" en="The bot found an answer for every question" /></p>
          <p className="text-[10px] text-gray-600 mt-1"><T ka="ან ჯერ საუბრები არ ყოფილა" en="or there have been no conversations yet" /></p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {items.map((it, i) => (
            <li
              key={i}
              className="border border-white/[0.06] hover:border-white/10 rounded-lg p-3 text-sm bg-white/[0.02]"
            >
              <div className="text-gray-200 mb-1 line-clamp-2" title={it.question}>
                {it.question}
              </div>
              <div className="text-[11px] text-gray-500 line-clamp-1" title={it.botReply}>
                <T ka="ბოტი" en="Bot" />: {it.botReply}
              </div>
              <div className="text-[10px] text-gray-600 mt-1.5">
                {new Date(it.createdAt).toLocaleString('ka-GE', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
