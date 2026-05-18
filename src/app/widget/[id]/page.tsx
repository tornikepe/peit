'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import {
  Bot as BotIcon, Send, X, Mail, Phone, User as UserIcon,
  Loader2, AlertCircle, Sparkles, Check, RefreshCw,
} from 'lucide-react';
import { renderMd } from '@/lib/md-mini';

type Lang = 'ka' | 'en' | 'ru';

interface PublicBot {
  id: string;
  name: string;
  brandColor: string;
  languages: Lang[];
  primaryLang: Lang;
  greeting: Partial<Record<Lang, string>>;
  leadCapture: { enabled: boolean; fields: ('name' | 'email' | 'phone')[] };
  suggestions: string[];
}

interface Msg {
  id: string;
  from: 'user' | 'bot';
  text: string;
  source?: 'faq' | 'knowledge' | 'fallback';
  timestamp: number;
  status?: 'sending' | 'sent' | 'failed';
}

const I18N: Record<Lang, {
  online:        string;
  placeholder:   string;
  send:          string;
  poweredBy:     string;
  leadIntro:     string;
  leadName:      string;
  leadEmail:     string;
  leadPhone:     string;
  leadMessage:   string;
  leadSubmit:    string;
  leadSkip:      string;
  leadThanks:    string;
  leaveContact:  string;
  gdprLabel:     string;
  gdprRequired:  string;
  errorLoad:     string;
  errorSend:     string;
  errorInvalidPhone: string;
  errorRateLimited: string;
  retry:         string;
  morningHi:     string;
  afternoonHi:   string;
  eveningHi:     string;
  startConvo:    string;
  newChat:       string;
}> = {
  ka: {
    online:       'ონლაინ',
    placeholder:  'შეტყობინება...',
    send:         'გაგზავნა',
    poweredBy:    'Powered by Peit',
    leadIntro:    'დატოვე კონტაქტი — გიპასუხებთ მალე.',
    leadName:     'სახელი',
    leadEmail:    'ელ-ფოსტა',
    leadPhone:    'ტელეფონი',
    leadMessage:  'შეტყობინება (არჩევითი)',
    leadSubmit:   'გაგზავნა',
    leadSkip:     'მოგვიანებით',
    leadThanks:   'მადლობა! ჩვენი გუნდი მალე დაგიკავშირდება.',
    leaveContact: 'კონტაქტის დატოვება',
    gdprLabel:    'ვეთანხმები ჩემი მონაცემების დამუშავებას ამ ბიზნესთან კონტაქტისთვის',
    gdprRequired: 'მონაცემთა დამუშავებაზე თანხმობა აუცილებელია',
    errorLoad:    'ჩატის ჩატვირთვა ვერ მოხერხდა.',
    errorSend:    'ვერ გავგზავნე. ცადე ისევ.',
    errorInvalidPhone: 'ნომრის ფორმატი არასწორია',
    errorRateLimited: 'ძალიან ბევრი მცდელობა — სცადე 10 წუთში ისევ',
    retry:        'სცადე ისევ',
    morningHi:    'დილა მშვიდობისა',
    afternoonHi:  'გამარჯობა',
    eveningHi:    'საღამო მშვიდობისა',
    startConvo:   'დასვი კითხვა ან აირჩიე ქვემოთ',
    newChat:      'ახალი ჩატი',
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
    leadSubmit:   'Send',
    leadSkip:     'Maybe later',
    leadThanks:   'Thanks! Our team will reach out shortly.',
    leaveContact: 'Leave contact',
    gdprLabel:    'I consent to my data being processed so this business can contact me',
    gdprRequired: 'Consent is required',
    errorLoad:    'Failed to load chat.',
    errorSend:    'Couldn\'t send. Try again.',
    errorRateLimited: 'Too many attempts — try again in 10 minutes',
    errorInvalidPhone: 'Invalid phone format',
    retry:        'Retry',
    morningHi:    'Good morning',
    afternoonHi:  'Hi there',
    eveningHi:    'Good evening',
    startConvo:   'Ask a question or pick one below',
    newChat:      'New chat',
  },
  ru: {
    online:       'Онлайн',
    placeholder:  'Сообщение...',
    send:         'Отправить',
    poweredBy:    'Powered by Peit',
    leadIntro:    'Оставьте контакт — скоро ответим.',
    leadName:     'Имя',
    leadEmail:    'Эл. почта',
    leadPhone:    'Телефон',
    leadMessage:  'Сообщение (необязательно)',
    leadSubmit:   'Отправить',
    leadSkip:     'Позже',
    leadThanks:   'Спасибо! Команда скоро свяжется с вами.',
    leaveContact: 'Оставить контакт',
    gdprLabel:    'Я согласен на обработку моих данных, чтобы этот бизнес связался со мной',
    gdprRequired: 'Согласие обязательно',
    errorLoad:    'Не удалось загрузить чат.',
    errorSend:    'Не удалось отправить. Попробуйте снова.',
    errorRateLimited: 'Слишком много попыток — попробуйте через 10 минут',
    errorInvalidPhone: 'Неверный формат телефона',
    retry:        'Повторить',
    morningHi:    'Доброе утро',
    afternoonHi:  'Здравствуйте',
    eveningHi:    'Добрый вечер',
    startConvo:   'Задайте вопрос или выберите снизу',
    newChat:      'Новый чат',
  },
};

const LANG_FLAGS: Record<Lang, string> = { ka: '🇬🇪', en: '🇬🇧', ru: '🇷🇺' };

function getTimeOfDayKey(): 'morningHi' | 'afternoonHi' | 'eveningHi' {
  const h = new Date().getHours();
  if (h < 12) return 'morningHi';
  if (h < 18) return 'afternoonHi';
  return 'eveningHi';
}

// ─── Parent communication ─────────────────────────────────────────────────
function postToParent(type: string, data: Record<string, unknown> = {}) {
  try {
    window.parent.postMessage({ source: 'peit-widget', type, ...data }, '*');
  } catch { /* ignore */ }
}

// ─── Local persistence ────────────────────────────────────────────────────
function storageKey(botId: string, visitorId: string) {
  return `peit_msgs_${botId}_${visitorId}`;
}
function loadMsgs(botId: string, visitorId: string): Msg[] {
  try {
    const raw = localStorage.getItem(storageKey(botId, visitorId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Msg[];
    return Array.isArray(parsed) ? parsed.slice(-50) : [];
  } catch { return []; }
}
function saveMsgs(botId: string, visitorId: string, msgs: Msg[]) {
  try {
    localStorage.setItem(storageKey(botId, visitorId), JSON.stringify(msgs.slice(-50)));
  } catch { /* quota */ }
}

let msgIdCounter = 0;
function newMsgId() { return `m_${Date.now()}_${++msgIdCounter}`; }

export default function WidgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [bot, setBot]     = useState<PublicBot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeLang, setActiveLang] = useState<Lang>('ka');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadName, setLeadName]   = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMsg, setLeadMsg]     = useState('');
  const [leadGdpr, setLeadGdpr]   = useState(false); // GDPR consent — required
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Read URL params from launcher (visitor id, page url, prior conversation)
  const queryRef = useRef<{ vid: string; page: string; title: string; convo: string | null }>({
    vid: '', page: '', title: '', convo: null,
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    queryRef.current = {
      vid:   sp.get('vid')   || 'anon',
      page:  sp.get('page')  || '',
      title: sp.get('title') || '',
      convo: sp.get('convo'),
    };
  }, []);

  // ─── Load bot config ────────────────────────────────────────────────────
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

        // Restore prior conversation if visitor had one
        const vid = queryRef.current.vid;
        const restored = loadMsgs(b.id, vid);
        if (restored.length > 0) {
          setMsgs(restored);
          if (queryRef.current.convo) setConversationId(queryRef.current.convo);
        } else {
          // Fresh greeting — composed with time-of-day prefix
          const greet = b.greeting[b.primaryLang] || 'Hi! 👋';
          const greetMsg: Msg = {
            id: newMsgId(),
            from: 'bot',
            text: greet,
            timestamp: Date.now(),
          };
          setMsgs([greetMsg]);
        }
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : 'LOAD_FAILED');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // ─── Persist messages locally ───────────────────────────────────────────
  useEffect(() => {
    if (bot && queryRef.current.vid && msgs.length > 0) {
      saveMsgs(bot.id, queryRef.current.vid, msgs);
    }
  }, [msgs, bot?.id]);

  // ─── Reset when language changes ────────────────────────────────────────
  const switchLang = useCallback((next: Lang) => {
    if (next === activeLang || !bot) return;
    setActiveLang(next);
    const greet = bot.greeting[next] || bot.greeting[bot.primaryLang] || 'Hi! 👋';
    const greetMsg: Msg = { id: newMsgId(), from: 'bot', text: greet, timestamp: Date.now() };
    setMsgs([greetMsg]);
    setConversationId(null);
    saveMsgs(bot.id, queryRef.current.vid, [greetMsg]);
    postToParent('reset');
  }, [activeLang, bot]);

  // ─── Auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, sending]);

  // ─── Handle parent messages (visibility, reset) ─────────────────────────
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e.data || e.data.source !== 'peit-widget-host') return;
      if (e.data.type === 'opened') {
        setIsVisible(true);
        setUnread(0);
        postToParent('unread', { count: 0 });
        setTimeout(() => textareaRef.current?.focus(), 200);
      }
      if (e.data.type === 'closed') {
        setIsVisible(false);
      }
      if (e.data.type === 'reset') {
        if (bot) {
          const greet = bot.greeting[activeLang] || 'Hi! 👋';
          const greetMsg: Msg = { id: newMsgId(), from: 'bot', text: greet, timestamp: Date.now() };
          setMsgs([greetMsg]);
          setConversationId(null);
          saveMsgs(bot.id, queryRef.current.vid, [greetMsg]);
        }
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [bot, activeLang]);

  // ─── Notify parent we're ready ──────────────────────────────────────────
  useEffect(() => { postToParent('ready'); }, []);

  // ─── Notify parent when conversation ID is known ───────────────────────
  useEffect(() => {
    if (conversationId) postToParent('conversation', { id: conversationId });
  }, [conversationId]);

  // ─── Increment unread when bot replies & widget is hidden ───────────────
  useEffect(() => {
    if (!isVisible) {
      const lastBotMsg = [...msgs].reverse().find(m => m.from === 'bot');
      const lastUserMsg = [...msgs].reverse().find(m => m.from === 'user');
      if (lastBotMsg && lastUserMsg && lastBotMsg.timestamp > lastUserMsg.timestamp) {
        // Only count messages since hidden
      }
    }
  }, [msgs, isVisible]);

  // ─── Auto-resize textarea ───────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [input]);

  // ─── Send a message ─────────────────────────────────────────────────────
  // Posts to the SSE streaming endpoint and progressively updates the
  // in-flight bot message as deltas arrive. Falls back to a single-shot
  // POST to /message if streaming isn't usable (no fetch streams, etc).
  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || !bot || sending) return;

    const userMsg: Msg = {
      id: newMsgId(), from: 'user', text, timestamp: Date.now(), status: 'sending',
    };
    const botMsgId = newMsgId();
    const botMsg: Msg = {
      id: botMsgId, from: 'bot', text: '', timestamp: Date.now(),
    };
    setInput('');
    setSending(true);
    setMsgs(prev => [...prev, userMsg, botMsg]);

    const payload = JSON.stringify({
      text,
      lang: activeLang,
      conversationId,
      visitorId: queryRef.current.vid,
      pageUrl:   queryRef.current.page,
      pageTitle: queryRef.current.title,
    });

    let buffered = '';
    let gotAnyDelta = false;
    try {
      const res = await fetch(`/api/widget/${id}/stream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
      });
      if (!res.ok) {
        // Parse error JSON if present, otherwise throw a generic code
        let code = 'SEND_FAILED';
        try {
          const errBody = await res.json() as { error?: string };
          if (errBody?.error) code = errBody.error;
        } catch { /* not JSON — keep generic */ }
        throw new Error(code);
      }
      if (!res.body) throw new Error('NO_STREAM_BODY');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      // SSE frames are separated by a blank line. Parse "data: …" lines
      // and JSON-decode each frame's payload.
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        let sep: number;
        while ((sep = sseBuffer.indexOf('\n\n')) !== -1) {
          const frame = sseBuffer.slice(0, sep);
          sseBuffer = sseBuffer.slice(sep + 2);

          const dataLine = frame.split('\n').find(l => l.startsWith('data:'));
          if (!dataLine) continue;
          const raw = dataLine.slice(5).trim();
          if (!raw) continue;

          let evt: { type: string; conversationId?: string; text?: string; source?: Msg['source'] };
          try { evt = JSON.parse(raw); } catch { continue; }

          if (evt.type === 'start' && evt.conversationId) {
            setConversationId(evt.conversationId);
          } else if (evt.type === 'delta' && typeof evt.text === 'string') {
            gotAnyDelta = true;
            buffered += evt.text;
            setMsgs(prev => prev.map(m =>
              m.id === botMsgId ? { ...m, text: buffered } : m,
            ));
          } else if (evt.type === 'done') {
            setMsgs(prev => prev.map(m =>
              m.id === botMsgId ? { ...m, source: evt.source ?? m.source } : m,
            ));
          } else if (evt.type === 'error') {
            throw new Error('STREAM_ERROR');
          }
        }
      }

      if (!gotAnyDelta) throw new Error('EMPTY_STREAM');

      // Mark user message sent now that we got at least one delta back.
      setMsgs(prev => prev.map(m =>
        m.id === userMsg.id ? { ...m, status: 'sent' } : m,
      ));

      if (!isVisible) {
        const next = unread + 1;
        setUnread(next);
        postToParent('unread', { count: next });
      }
    } catch (e) {
      // Streaming failed — replace the empty bot msg with an error notice
      // and mark the user msg failed so the user can retry.
      setMsgs(prev => prev
        .filter(m => m.id !== botMsgId)
        .map(m => m.id === userMsg.id ? { ...m, status: 'failed' } : m));
      const code = e instanceof Error ? e.message : '';
      const errText = code === 'RATE_LIMITED'
        ? I18N[activeLang].errorRateLimited
        : I18N[activeLang].errorSend;
      const errMsg: Msg = {
        id: newMsgId(),
        from: 'bot',
        text: '⚠ ' + errText,
        source: 'fallback',
        timestamp: Date.now(),
      };
      setMsgs(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }, [input, bot, sending, id, activeLang, conversationId, isVisible, unread]);

  // ─── Retry a failed message ─────────────────────────────────────────────
  const retryMsg = useCallback((msgId: string) => {
    const failed = msgs.find(m => m.id === msgId);
    if (!failed) return;
    setMsgs(prev => prev.filter(m => m.id !== msgId));
    setTimeout(() => send(failed.text), 100);
  }, [msgs, send]);

  // ─── Submit lead ────────────────────────────────────────────────────────
  async function submitLead() {
    if (!bot) return;
    const ui = I18N[activeLang];
    if (!leadEmail.trim() && !leadPhone.trim()) {
      setLeadError(ui.leadEmail);
      return;
    }
    if (!leadGdpr) {
      setLeadError(ui.gdprRequired);
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
          gdprConsent:    true,
          gdprText:       ui.gdprLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        // Surface specific validation errors with translated copy.
        const code = data.error;
        if (code === 'INVALID_PHONE')          setLeadError(ui.errorInvalidPhone);
        else if (code === 'INVALID_EMAIL')     setLeadError(ui.leadEmail);
        else if (code === 'GDPR_CONSENT_REQUIRED') setLeadError(ui.gdprRequired);
        else if (code === 'RATE_LIMITED')      setLeadError(ui.errorRateLimited);
        else                                   setLeadError(ui.errorSend);
        return;
      }
      setLeadSubmitted(true);
      setLeadOpen(false);

      const thanksMsg: Msg = {
        id: newMsgId(),
        from: 'bot',
        text: ui.leadThanks,
        timestamp: Date.now(),
      };
      setMsgs(prev => [...prev, thanksMsg]);
    } catch (e) {
      setLeadError(e instanceof Error ? e.message : ui.errorSend);
    } finally {
      setLeadSubmitting(false);
    }
  }

  // ─── New chat ───────────────────────────────────────────────────────────
  function newChat() {
    if (!bot) return;
    const greet = bot.greeting[activeLang] || 'Hi! 👋';
    const greetMsg: Msg = { id: newMsgId(), from: 'bot', text: greet, timestamp: Date.now() };
    setMsgs([greetMsg]);
    setConversationId(null);
    setLeadSubmitted(false);
    saveMsgs(bot.id, queryRef.current.vid, [greetMsg]);
    postToParent('reset');
    textareaRef.current?.focus();
  }

  // ── Render error
  if (loadError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0d0d1a] text-white p-6">
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-gray-300 text-sm text-center mb-1">{I18N.ka.errorLoad}</p>
        <p className="text-gray-600 text-xs">{loadError}</p>
      </div>
    );
  }

  if (loading || !bot) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[#0d0d1a]">
        {/* Skeleton */}
        <div className="h-14 border-b border-white/[0.06] px-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-2.5 w-16 bg-white/[0.04] rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      </div>
    );
  }

  const ui = I18N[activeLang];
  const color = bot.brandColor;
  const isFresh = msgs.length <= 1;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d0d1a] text-white overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0 backdrop-blur-md"
        style={{ background: `linear-gradient(135deg, ${color}45, ${color}15 60%, transparent)` }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)`, boxShadow: `0 4px 12px ${color}55` }}
        >
          <BotIcon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{bot.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-400 text-xs">{ui.online}</span>
          </div>
        </div>

        {bot.languages.length > 1 && (
          <div className="flex items-center gap-0.5 bg-white/[0.05] border border-white/[0.08] rounded-lg p-0.5">
            {bot.languages.map(l => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all ${
                  activeLang === l ? 'bg-white/[0.12] text-white' : 'text-gray-500 hover:text-white'
                }`}
                title={l}
                aria-label={`Switch to ${l}`}
              >
                {LANG_FLAGS[l]}
              </button>
            ))}
          </div>
        )}

        {!isFresh && (
          <button
            onClick={newChat}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] transition-colors"
            title={ui.newChat}
            aria-label={ui.newChat}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => postToParent('close')}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0 scroll-smooth">
        {msgs.map((m, i) => {
          const showAvatar = m.from === 'bot' && (i === 0 || msgs[i - 1].from !== 'bot');
          return (
            <div
              key={m.id}
              className={`flex gap-2 message-in ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.from === 'bot' && (
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${showAvatar ? '' : 'invisible'}`}
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
                >
                  <BotIcon className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div className="max-w-[78%] flex flex-col items-start">
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                    m.from === 'user'
                      ? 'text-white rounded-br-sm self-end'
                      : 'bg-white/[0.07] text-gray-100 rounded-bl-sm border border-white/[0.04]'
                  } ${m.status === 'failed' ? 'opacity-70' : ''}`}
                  style={m.from === 'user' ? {
                    background: color,
                    boxShadow: `0 2px 8px ${color}33`,
                  } : undefined}
                >
                  {m.from === 'bot' ? renderMd(m.text) : m.text}
                </div>

                {/* Status / source indicators */}
                {m.from === 'user' && m.status === 'failed' && (
                  <button
                    onClick={() => retryMsg(m.id)}
                    className="text-[10px] mt-1 text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> {ui.retry}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-2 justify-start message-in">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
            >
              <BotIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/[0.07] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1 border border-white/[0.04]">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-typing" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-typing" style={{ animationDelay: '180ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-typing" style={{ animationDelay: '360ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions row (only at the start) */}
      {isFresh && bot.suggestions.length > 0 && !sending && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[11px] text-gray-500 mb-2 px-1">{ui.startConvo}</p>
          <div className="flex flex-wrap gap-1.5">
            {bot.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full border text-left transition-all hover:scale-[1.02]"
                style={{
                  borderColor: `${color}40`,
                  color: color,
                  background: `${color}10`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lead capture CTA */}
      {bot.leadCapture.enabled && !leadSubmitted && msgs.length >= 3 && !leadOpen && (
        <div className="px-4 pb-2 shrink-0">
          <button
            onClick={() => setLeadOpen(true)}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-white/[0.06] hover:border-white/[0.14] transition-colors"
          >
            <Mail className="w-3 h-3" />
            {ui.leaveContact}
          </button>
        </div>
      )}

      {leadSubmitted && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 py-1.5">
            <Check className="w-3 h-3" /> {ui.leadThanks.split('!')[0]}!
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/[0.06] p-3 flex items-end gap-2 shrink-0 bg-white/[0.02]">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={ui.placeholder}
          disabled={sending}
          className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl px-3.5 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40 disabled:opacity-60 resize-none max-h-[120px]"
          style={{ minHeight: '36px' }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 shrink-0 hover:scale-105 active:scale-95"
          style={{ background: color, boxShadow: input.trim() ? `0 2px 8px ${color}55` : 'none' }}
          aria-label={ui.send}
        >
          {sending
            ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            : <Send className="w-3.5 h-3.5 text-white" />
          }
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-white/[0.04] shrink-0">
        <a
          href="https://peit.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors block text-center"
        >
          ⚡ {ui.poweredBy}
        </a>
      </div>

      {/* Lead capture drawer (slides up over chat) */}
      {leadOpen && !leadSubmitted && (
        <LeadDrawer
          bot={bot}
          color={color}
          ui={ui}
          name={leadName} setName={setLeadName}
          email={leadEmail} setEmail={setLeadEmail}
          phone={leadPhone} setPhone={setLeadPhone}
          msg={leadMsg} setMsg={setLeadMsg}
          gdpr={leadGdpr} setGdpr={setLeadGdpr}
          submitting={leadSubmitting}
          error={leadError}
          onSubmit={submitLead}
          onClose={() => setLeadOpen(false)}
        />
      )}

      <style jsx global>{`
        @keyframes message-in {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .message-in { animation: message-in .22s cubic-bezier(.34,1.56,.64,1); }
        @keyframes typing {
          0%, 60%, 100% { transform: scale(.8); opacity: .5; }
          30%           { transform: scale(1.2); opacity: 1; }
        }
        .animate-typing { animation: typing 1.2s infinite ease-in-out; }
      `}</style>
    </div>
  );
}

// ─── Lead Drawer (inline, slides up) ──────────────────────────────────────
function LeadDrawer({
  bot, color, ui,
  name, setName, email, setEmail, phone, setPhone, msg, setMsg,
  gdpr, setGdpr,
  submitting, error, onSubmit, onClose,
}: {
  bot: PublicBot;
  color: string;
  ui: typeof I18N[Lang];
  name: string;  setName:  (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  msg: string;   setMsg:   (v: string) => void;
  gdpr: boolean; setGdpr:  (v: boolean) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const fields = bot.leadCapture.fields;
  const hasContact = email.trim() || phone.trim();
  const canSubmit = hasContact && gdpr;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#0d0d1a]/98 backdrop-blur-sm animate-drawer">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-violet-400" />
          <p className="text-white font-semibold text-sm">{ui.leaveContact}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
          aria-label="Close form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <p className="text-gray-400 text-xs leading-relaxed">{ui.leadIntro}</p>

        {fields.includes('name') && (
          <FormInput icon={<UserIcon className="w-3.5 h-3.5" />} value={name} onChange={setName} placeholder={ui.leadName} />
        )}
        {fields.includes('email') && (
          <FormInput icon={<Mail className="w-3.5 h-3.5" />} type="email" value={email} onChange={setEmail} placeholder={ui.leadEmail} />
        )}
        {fields.includes('phone') && (
          <FormInput icon={<Phone className="w-3.5 h-3.5" />} type="tel" value={phone} onChange={setPhone} placeholder={ui.leadPhone} />
        )}

        <textarea
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder={ui.leadMessage}
          rows={3}
          className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/50 resize-none"
        />

        {/* GDPR consent — required to submit */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none mt-1 group">
          <span className="relative shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={gdpr}
              onChange={e => setGdpr(e.target.checked)}
              className="peer sr-only"
              required
            />
            <span className="block w-4 h-4 rounded border border-white/15 bg-white/[0.05] peer-checked:bg-violet-600 peer-checked:border-violet-500 transition-colors" />
            <svg
              className="absolute top-0 left-0 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
              viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3"
            >
              <path d="M3 8 L6.5 11.5 L13 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-[11px] text-gray-400 leading-[1.45] group-hover:text-gray-300 transition-colors">
            {ui.gdprLabel}
          </span>
        </label>

        {error && (
          <p className="flex items-center gap-1 text-red-400 text-xs">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>

      <div className="border-t border-white/[0.06] p-3 flex gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
        >
          {ui.leadSkip}
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || !canSubmit}
          className="flex-1 inline-flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[.98]"
          style={{ background: color, boxShadow: `0 2px 8px ${color}55` }}
        >
          {submitting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Sparkles className="w-3.5 h-3.5" />
          }
          {ui.leadSubmit}
        </button>
      </div>

      <style jsx>{`
        @keyframes drawer { from { transform: translateY(20%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-drawer { animation: drawer .25s cubic-bezier(.34,1.56,.64,1); }
      `}</style>
    </div>
  );
}

function FormInput({
  icon, value, onChange, placeholder, type = 'text',
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/50"
      />
    </div>
  );
}
