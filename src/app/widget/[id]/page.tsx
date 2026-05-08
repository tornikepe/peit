'use client';

import { use, useEffect, useRef, useState } from 'react';
import {
  Bot as BotIcon, Send, X, Mail, Phone, User as UserIcon,
  Loader2, AlertCircle, Sparkles, ChevronLeft, Check,
} from 'lucide-react';

type Lang = 'ka' | 'en' | 'ru';

interface PublicBot {
  id: string;
  name: string;
  brandColor: string;
  languages: Lang[];
  primaryLang: Lang;
  greeting: Partial<Record<Lang, string>>;
  leadCapture: { enabled: boolean; fields: ('name' | 'email' | 'phone')[] };
}

interface Msg {
  id: number;
  from: 'user' | 'bot';
  text: string;
}

const I18N: Record<Lang, {
  online: string;
  placeholder: string;
  send: string;
  poweredBy: string;
  leadIntro: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadMessage: string;
  leadSubmit: string;
  leadSkip: string;
  leadThanks: string;
  leaveContact: string;
  errorLoad: string;
  errorSend: string;
  retry: string;
}> = {
  ka: {
    online:       'ონლაინ',
    placeholder:  'შეტყობინება...',
    send:         'გაგზავნა',
    poweredBy:    'შექმნილია Peit-ით',
    leadIntro:    'დატოვე კონტაქტი — გიპასუხებთ მალე.',
    leadName:     'სახელი',
    leadEmail:    'ელ-ფოსტა',
    leadPhone:    'ტელეფონი',
    leadMessage:  'შეტყობინება (არჩევითი)',
    leadSubmit:   'გაგზავნა',
    leadSkip:     'მოგვიანებით',
    leadThanks:   'მადლობა! ჩვენი გუნდი მალე დაგიკავშირდება.',
    leaveContact: 'დატოვე კონტაქტი',
    errorLoad:    'ჩატის ჩატვირთვა ვერ მოხერხდა.',
    errorSend:    'გაგზავნა ვერ მოხერხდა. სცადე ისევ.',
    retry:        'სცადე ისევ',
  },
  en: {
    online:       'Online',
    placeholder:  'Type a message...',
    send:         'Send',
    poweredBy:    'Powered by Peit',
    leadIntro:    'Leave your contact — we\'ll get back to you soon.',
    leadName:     'Name',
    leadEmail:    'Email',
    leadPhone:    'Phone',
    leadMessage:  'Message (optional)',
    leadSubmit:   'Submit',
    leadSkip:     'Maybe later',
    leadThanks:   'Thanks! Our team will reach out shortly.',
    leaveContact: 'Leave contact',
    errorLoad:    'Failed to load chat.',
    errorSend:    'Couldn\'t send. Please try again.',
    retry:        'Retry',
  },
  ru: {
    online:       'Онлайн',
    placeholder:  'Сообщение...',
    send:         'Отправить',
    poweredBy:    'Сделано в Peit',
    leadIntro:    'Оставьте контакт — скоро ответим.',
    leadName:     'Имя',
    leadEmail:    'Эл. почта',
    leadPhone:    'Телефон',
    leadMessage:  'Сообщение (необязательно)',
    leadSubmit:   'Отправить',
    leadSkip:     'Позже',
    leadThanks:   'Спасибо! Команда скоро свяжется с вами.',
    leaveContact: 'Оставить контакт',
    errorLoad:    'Не удалось загрузить чат.',
    errorSend:    'Не удалось отправить. Попробуйте снова.',
    retry:        'Повторить',
  },
};

const LANG_FLAGS: Record<Lang, string> = { ka: '🇬🇪', en: '🇬🇧', ru: '🇷🇺' };

// ─── postMessage to parent ────────────────────────────────────────────────
function postToParent(type: string, data?: Record<string, unknown>) {
  try {
    window.parent.postMessage({ source: 'peit-widget', type, ...data }, '*');
  } catch { /* ignore */ }
}

export default function WidgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [bot, setBot] = useState<PublicBot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeLang, setActiveLang] = useState<Lang>('ka');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [counter, setCounter] = useState(1);

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadName, setLeadName]   = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMsg, setLeadMsg]     = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load bot config
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/widget/${id}/config`);
        const data = await res.json();
        if (!alive) return;
        if (!res.ok || !data.ok) {
          setLoadError(data.error || 'LOAD_FAILED');
          return;
        }
        const b = data.bot as PublicBot;
        setBot(b);
        setActiveLang(b.primaryLang);
        const greet = b.greeting[b.primaryLang] || `Hi! I'm ${b.name}.`;
        setMsgs([{ id: 0, from: 'bot', text: greet }]);
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : 'LOAD_FAILED');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // ── Reset greeting when language changes
  useEffect(() => {
    if (!bot) return;
    const greet = bot.greeting[activeLang] || bot.greeting[bot.primaryLang] || '';
    setMsgs([{ id: counter, from: 'bot', text: greet }]);
    setCounter(c => c + 1);
    setConversationId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLang]);

  // ── Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, sending]);

  // ── Notify parent we're ready
  useEffect(() => {
    postToParent('ready');
  }, []);

  // ── Send a message
  async function send() {
    const text = input.trim();
    if (!text || !bot || sending) return;

    const uid = counter;
    setCounter(c => c + 2);
    setInput('');
    setSending(true);
    setSendError(null);
    setMsgs(prev => [...prev, { id: uid, from: 'user', text }]);

    try {
      const res = await fetch(`/api/widget/${id}/message`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, lang: activeLang, conversationId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'SEND_FAILED');
      setMsgs(prev => [...prev, { id: uid + 1, from: 'bot', text: data.reply }]);
      if (data.conversationId) setConversationId(data.conversationId);

      // After 2nd bot reply, prompt for lead capture if enabled
      if (
        bot.leadCapture.enabled &&
        !leadSubmitted &&
        msgs.filter(m => m.from === 'bot').length >= 1 &&
        Math.random() < 0.6
      ) {
        // Soft suggestion only — user opens form via the button
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'SEND_FAILED');
    } finally {
      setSending(false);
    }
  }

  // ── Submit lead
  async function submitLead() {
    if (!bot) return;
    const fields = bot.leadCapture.fields;
    const needsEmail = fields.includes('email');
    const needsPhone = fields.includes('phone');
    if (needsEmail && !leadEmail.trim() && !leadPhone.trim()) {
      setLeadError(I18N[activeLang].leadEmail);
      return;
    }

    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const res = await fetch(`/api/widget/${id}/lead`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name:           leadName.trim()  || undefined,
          email:          leadEmail.trim() || undefined,
          phone:          leadPhone.trim() || undefined,
          message:        leadMsg.trim()   || undefined,
          conversationId: conversationId   ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'LEAD_FAILED');
      setLeadSubmitted(true);
      setShowLeadForm(false);
      setMsgs(prev => [
        ...prev,
        { id: counter + 100, from: 'bot', text: I18N[activeLang].leadThanks },
      ]);
    } catch (e) {
      setLeadError(e instanceof Error ? e.message : 'LEAD_FAILED');
    } finally {
      setLeadSubmitting(false);
    }
  }

  // ── Render error state
  if (loadError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0d0d1a] text-white p-6">
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-gray-300 text-sm text-center">{I18N.ka.errorLoad}</p>
        <p className="text-gray-600 text-xs mt-1">{loadError}</p>
      </div>
    );
  }

  if (loading || !bot) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d0d1a]">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  const ui = I18N[activeLang];
  const color = bot.brandColor;

  // ── Lead capture form view
  if (showLeadForm && !leadSubmitted) {
    const fields = bot.leadCapture.fields;
    return (
      <div className="h-screen w-screen flex flex-col bg-[#0d0d1a] text-white">
        <header
          className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]"
          style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }}
        >
          <button
            onClick={() => setShowLeadForm(false)}
            className="text-gray-400 hover:text-white transition-colors p-1 -ml-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{ui.leaveContact}</p>
          </div>
          <button
            onClick={() => postToParent('close')}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          <p className="text-gray-400 text-sm mb-2">{ui.leadIntro}</p>

          {fields.includes('name') && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                type="text"
                value={leadName}
                onChange={e => setLeadName(e.target.value)}
                placeholder={ui.leadName}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/50"
              />
            </div>
          )}

          {fields.includes('email') && (
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                type="email"
                value={leadEmail}
                onChange={e => setLeadEmail(e.target.value)}
                placeholder={ui.leadEmail}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/50"
              />
            </div>
          )}

          {fields.includes('phone') && (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                type="tel"
                value={leadPhone}
                onChange={e => setLeadPhone(e.target.value)}
                placeholder={ui.leadPhone}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/50"
              />
            </div>
          )}

          <textarea
            value={leadMsg}
            onChange={e => setLeadMsg(e.target.value)}
            placeholder={ui.leadMessage}
            rows={3}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/50 resize-none"
          />

          {leadError && (
            <p className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" /> {leadError}
            </p>
          )}
        </div>

        <div className="border-t border-white/[0.06] p-3 flex gap-2">
          <button
            onClick={() => setShowLeadForm(false)}
            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
          >
            {ui.leadSkip}
          </button>
          <button
            onClick={submitLead}
            disabled={leadSubmitting || (!leadEmail.trim() && !leadPhone.trim())}
            className="flex-1 inline-flex items-center justify-center gap-2 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: color }}
          >
            {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {ui.leadSubmit}
          </button>
        </div>
      </div>
    );
  }

  // ── Main chat view
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d0d1a] text-white">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0"
        style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
        >
          <BotIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{bot.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-400 text-xs">{ui.online}</span>
          </div>
        </div>

        {/* Lang switcher (only if multi-lang) */}
        {bot.languages.length > 1 && (
          <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            {bot.languages.map(l => (
              <button
                key={l}
                onClick={() => setActiveLang(l)}
                className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all ${
                  activeLang === l ? 'bg-white/[0.1] text-white' : 'text-gray-500 hover:text-white'
                }`}
                title={l}
              >
                {LANG_FLAGS[l]}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => postToParent('close')}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
        {msgs.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.from === 'bot' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
              >
                <BotIcon className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.from === 'user' ? 'text-white rounded-br-sm' : 'bg-white/[0.07] text-gray-200 rounded-bl-sm'
              }`}
              style={m.from === 'user' ? { background: color } : undefined}
            >
              {m.text}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-2 justify-start">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
            >
              <BotIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/[0.07] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {sendError && (
          <div className="flex gap-2 justify-start">
            <div className="bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
              <p className="text-red-300 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {ui.errorSend}
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Lead capture CTA */}
      {bot.leadCapture.enabled && !leadSubmitted && msgs.length >= 3 && (
        <div className="px-4 pb-2 shrink-0">
          <button
            onClick={() => setShowLeadForm(true)}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-white/[0.06] transition-colors"
          >
            <Mail className="w-3 h-3" />
            {ui.leaveContact}
          </button>
        </div>
      )}

      {leadSubmitted && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 py-2">
            <Check className="w-3 h-3" />
            {ui.leadThanks.split('!')[0]}!
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/[0.06] p-3 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder={ui.placeholder}
          disabled={sending}
          className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40 disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
          style={{ background: color }}
          aria-label={ui.send}
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.04] shrink-0">
        <a
          href="https://peit.ge"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors block text-center"
        >
          {ui.poweredBy}
        </a>
      </div>
    </div>
  );
}
