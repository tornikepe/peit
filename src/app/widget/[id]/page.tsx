'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import {
  Bot as BotIcon, Send, X, Mail, Phone, User as UserIcon,
  Loader2, AlertCircle, Sparkles, Check, RefreshCw,
  ThumbsUp, ThumbsDown, Mic, Paperclip, FileText,
} from 'lucide-react';
import { renderMd } from '@/lib/md-mini';

type Lang = 'ka' | 'en' | 'ru';

interface QuickReplyPill {
  label: string;
  action: 'message' | 'url' | 'flow';
  value: string;
}

interface FlowStep {
  id:         string;
  type:       'message' | 'input' | 'button';
  text:       string;
  variable?:  string;
  options?:   Array<{ label: string; value: string; nextStepId?: string }>;
  nextStepId?: string;
}

interface PublicBot {
  id: string;
  name: string;
  brandColor: string;
  languages: Lang[];
  primaryLang: Lang;
  greeting: Partial<Record<Lang, string>>;
  leadCapture: { enabled: boolean; fields: ('name' | 'email' | 'phone')[] };
  quickReplies: QuickReplyPill[];
  customCss: string;
  /** A/B greeting variant selected server-side for this session (Feature #6). */
  abGreeting: { id: string; message: string } | null;
  /** First active multi-step flow (Feature #1). */
  activeFlow: { id: string; name: string; steps: FlowStep[] } | null;
  suggestions: string[];
}

/** A file the visitor attached to a message (Feature #3). */
interface ChatAttachment {
  url: string;
  pathname: string;
  filename: string;
  mimeType: string;
  kind: 'image' | 'document';
  /** Local object URL for image thumbnails (private blob isn't viewable). */
  previewUrl?: string;
}

interface Msg {
  id: string;
  from: 'user' | 'bot';
  text: string;
  source?: 'faq' | 'knowledge' | 'fallback';
  timestamp: number;
  status?: 'sending' | 'sent' | 'failed';
  /** Server-side messages.id, set after the SSE `done` frame. Required to
   *  submit thumbs-up/down — null until the stream completes. */
  serverId?: string | null;
  /** Visitor's vote on this message. Hides the thumbs row once set. */
  feedback?: 'positive' | 'negative' | null;
  /** Files attached to this (user) message. */
  attachments?: ChatAttachment[];
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
  feedbackUp:    string;
  feedbackDown:  string;
  feedbackThanks: string;
  listenStart:   string;
  listenStop:    string;
  listening:     string;
  attachFile:    string;
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
    feedbackUp:   'სასარგებლო პასუხი',
    feedbackDown: 'უსარგებლო პასუხი',
    feedbackThanks: 'მადლობა გამოხმაურებისთვის',
    listenStart:  'ხმოვანი შეტყობინება',
    listenStop:   'შეჩერება',
    listening:    'მისმენთ...',
    attachFile:   'ფაილის მიმაგრება',
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
    feedbackUp:   'Helpful answer',
    feedbackDown: 'Not helpful',
    feedbackThanks: 'Thanks for the feedback',
    listenStart:  'Voice message',
    listenStop:   'Stop',
    listening:    'Listening...',
    attachFile:   'Attach file',
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
    feedbackUp:   'Полезный ответ',
    feedbackDown: 'Бесполезный ответ',
    feedbackThanks: 'Спасибо за отзыв',
    listenStart:  'Голосовое сообщение',
    listenStop:   'Стоп',
    listening:    'Слушаю...',
    attachFile:   'Прикрепить файл',
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
  /** Pending file attachments (Feature #3) — uploaded, awaiting send. */
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  /** Indices of quick-reply pills the visitor has already clicked this session. */
  const [usedQuickReplies, setUsedQuickReplies] = useState<Set<number>>(new Set());
  /** Voice input (Feature #4) — true while the SpeechRecognition session is live. */
  const [listening, setListening] = useState(false);
  /** Browser support is checked once on mount; on mismatch we hide the mic button. */
  const [voiceSupported, setVoiceSupported] = useState(false);
  /** A/B greeting variant (Feature #6) — held so impression/conversion calls
   *  bind to the right variantId for this session. */
  const [abVariantId, setAbVariantId] = useState<string | null>(null);
  const [abImpressionSent, setAbImpressionSent] = useState(false);
  const [abConversionSent, setAbConversionSent] = useState(false);
  /** Multi-step flow runner state (Feature #1). flowStepId === null means
   *  the flow finished or never started, and AI takes over. */
  const [flowStepId, setFlowStepId] = useState<string | null>(null);
  const [flowVars, setFlowVars] = useState<Record<string, string>>({});

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
        // Older bots predate quick_replies / custom_css — default for safety.
        if (!Array.isArray(b.quickReplies)) b.quickReplies = [];
        if (typeof b.customCss !== 'string')  b.customCss = '';
        if (b.abGreeting === undefined)       b.abGreeting = null;
        if (b.activeFlow === undefined)       b.activeFlow = null;
        // Russian was removed product-wide. Older bots may still have 'ru' in
        // their stored config — drop it so the widget never offers a Russian
        // flag, and fall the primary language back to a supported one.
        if (Array.isArray(b.languages)) {
          b.languages = b.languages.filter(l => l !== 'ru');
          if (b.languages.length === 0) b.languages = ['ka'];
        }
        if (b.primaryLang === 'ru') b.primaryLang = b.languages[0] ?? 'ka';
        setBot(b);
        if (b.abGreeting) setAbVariantId(b.abGreeting.id);
        // Start the flow on first load — only when there's no restored
        // transcript so we don't replay the script on every visit.
        const restoredForFlow = loadMsgs(b.id, queryRef.current.vid);
        if (b.activeFlow && b.activeFlow.steps.length > 0 && restoredForFlow.length === 0) {
          setFlowStepId(b.activeFlow.steps[0].id);
        }
        setActiveLang(b.primaryLang);

        // Restore prior conversation if visitor had one
        const vid = queryRef.current.vid;
        const restored = loadMsgs(b.id, vid);
        if (restored.length > 0) {
          setMsgs(restored);
          if (queryRef.current.convo) setConversationId(queryRef.current.convo);
        } else {
          // Fresh greeting — A/B variant when present (Feature #6) overrides
          // the static localized greeting. Fire an impression so the
          // dashboard sees the variant landed.
          const greet = b.abGreeting?.message
            || b.greeting[b.primaryLang]
            || 'Hi! 👋';
          if (b.abGreeting && !abImpressionSent) {
            void fetch(`/api/widget/${b.id}/ab`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ variantId: b.abGreeting.id, event: 'impression' }),
            }).catch(() => undefined);
            setAbImpressionSent(true);
          }
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
    // Mount-once effect. Adding abImpressionSent / bot here would re-fetch
    // the config every time we flip a flag below — that's wrong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ─── Persist messages locally ───────────────────────────────────────────
  useEffect(() => {
    if (bot && queryRef.current.vid && msgs.length > 0) {
      saveMsgs(bot.id, queryRef.current.vid, msgs);
    }
    // We only need bot.id here, not the full object reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Live CSS preview from the dashboard editor (Feature #10). Strips the
      // same dangerous constructs the server would strip — we don't trust the
      // parent frame even when it's our own dashboard, since other tabs on
      // the same origin can also postMessage.
      if (e.data.type === 'preview-css' && typeof e.data.css === 'string') {
        const safe = String(e.data.css).slice(0, 8192)
          .replace(/@import\b[^;]*;?/gi, '')
          .replace(/url\s*\([^)]*\)/gi, '')
          .replace(/expression\s*\([^)]*\)/gi, '')
          .replace(/<\/?\s*style[^>]*>/gi, '')
          .replace(/<\s*script[^>]*>/gi, '');
        setBot(b => b ? { ...b, customCss: safe } : b);
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
  // ─── Multi-step flow runner (Feature #1) ────────────────────────────────
  // Walks bot.activeFlow.steps. 'message' steps render and auto-advance;
  // 'input' steps wait for the visitor to type a reply (we intercept send()
  // to capture it into flowVars); 'button' steps render pill options that
  // both record a value AND branch to a chosen nextStepId. Reaching the end
  // hands control back to the AI engine.
  const advanceFlow = useCallback((fromId: string, override?: string | undefined) => {
    if (!bot?.activeFlow) return;
    const steps = bot.activeFlow.steps;
    const idx = steps.findIndex(s => s.id === fromId);
    if (idx < 0) { setFlowStepId(null); return; }
    const current = steps[idx];
    const nextId = override
      ?? current.nextStepId
      ?? steps[idx + 1]?.id
      ?? null;
    if (!nextId) {
      // End of flow → submit collected variables as a lead, then free-chat.
      const vars = flowVars;
      if (bot.leadCapture.enabled && (vars.name || vars.email || vars.phone)) {
        void fetch(`/api/widget/${id}/lead`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name:    vars.name,
            email:   vars.email,
            phone:   vars.phone,
            message: vars.message,
            gdprConsent: true,
            visitorId:   queryRef.current.vid,
            conversationId,
          }),
        }).catch(() => undefined);
      }
      setFlowStepId(null);
      return;
    }
    setFlowStepId(nextId);
  }, [bot, flowVars, conversationId, id]);

  // Render the current step's text and auto-advance message steps. The
  // renderedStepsRef guard makes the effect idempotent — without it,
  // React 19 Strict Mode (which mounts → effect → cleanup → effect on
  // dev) appends each flow message twice.
  const renderedStepsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!bot?.activeFlow || !flowStepId) return;
    if (renderedStepsRef.current.has(flowStepId)) return;
    const step = bot.activeFlow.steps.find(s => s.id === flowStepId);
    if (!step) return;
    renderedStepsRef.current.add(flowStepId);
    // Driving the chat list IS the side effect this hook exists for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMsgs(prev => [...prev, {
      id: newMsgId(), from: 'bot', text: step.text, timestamp: Date.now(),
    }]);
    if (step.type === 'message') {
      const t = setTimeout(() => advanceFlow(step.id), 600);
      return () => clearTimeout(t);
    }
  }, [bot, flowStepId, advanceFlow]);

  const currentFlowStep: FlowStep | null = (bot?.activeFlow && flowStepId)
    ? (bot.activeFlow.steps.find(s => s.id === flowStepId) ?? null)
    : null;
  const inFlow = !!currentFlowStep;

  // Safety: a button step authored with zero options would leave the
  // visitor with nothing to click. Auto-advance past it so the flow never
  // deadlocks on a misconfiguration the editor accidentally allowed.
  useEffect(() => {
    if (currentFlowStep
      && currentFlowStep.type === 'button'
      && (!currentFlowStep.options || currentFlowStep.options.length === 0)) {
      // advanceFlow calls setFlowStepId — that IS this effect's purpose.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      advanceFlow(currentFlowStep.id);
    }
  }, [currentFlowStep, advanceFlow]);

  // ─── Voice input (Feature #4) ───────────────────────────────────────────
  // Web Speech API: feature-detect on mount, hide the mic button entirely
  // when unsupported (the brief calls for graceful degradation, not a
  // disabled stub). The recognition instance is held in a ref so a re-render
  // doesn't restart the session.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const autoSubmitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Browser support detection. Done in an effect (not a lazy useState
  // initializer) so the server render and the first client render agree
  // — flipping to true on mount avoids a hydration mismatch warning when
  // the page is server-rendered before we know about window.SpeechRecognition.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (w.SpeechRecognition || w.webkitSpeechRecognition) setVoiceSupported(true);
  }, []);

  const localeForVoice = (l: Lang): string =>
    l === 'ka' ? 'ka-GE' : l === 'ru' ? 'ru-RU' : 'en-US';

  function toggleVoice() {
    if (!voiceSupported || sending) return;

    if (listening) {
      try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { setVoiceSupported(false); return; }

    const rec = new Ctor();
    rec.lang = localeForVoice(activeLang);
    rec.interimResults = true;
    rec.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
      // Auto-submit 1.5s after the last result frame (treat as end-of-speech).
      if (autoSubmitTimer.current) clearTimeout(autoSubmitTimer.current);
      autoSubmitTimer.current = setTimeout(() => {
        try { rec.stop(); } catch { /* noop */ }
        if (transcript.trim()) send(transcript);
      }, 1500);
    };
    rec.onerror = () => { setListening(false); };
    rec.onend   = () => {
      setListening(false);
      if (autoSubmitTimer.current) {
        clearTimeout(autoSubmitTimer.current);
        autoSubmitTimer.current = null;
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch (e) {
      console.warn('[widget] mic start failed:', e);
      setListening(false);
    }
  }

  // Cleanup on unmount — never leave a recognition session running.
  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    if (autoSubmitTimer.current) clearTimeout(autoSubmitTimer.current);
  }, []);

  // ─── Submit thumbs feedback (Feature #7) ────────────────────────────────
  // Optimistic: stamp the message immediately so the buttons disappear,
  // then POST. On failure we roll back so the visitor can retry.
  const submitFeedback = useCallback(async (
    localId: string,
    serverId: string,
    feedback: 'positive' | 'negative',
  ) => {
    setMsgs(prev => prev.map(m => m.id === localId ? { ...m, feedback } : m));
    try {
      const res = await fetch(`/api/widget/${id}/feedback`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ messageId: serverId, feedback }),
      });
      if (!res.ok) throw new Error('bad_status');
    } catch (e) {
      console.warn('[widget] feedback POST failed:', e);
      setMsgs(prev => prev.map(m => m.id === localId ? { ...m, feedback: null } : m));
    }
  }, [id]);

  // ─── File attachments (Feature #3) ──────────────────────────────────────
  const MAX_FILE = 10 * 1024 * 1024;
  async function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (e.target) e.target.value = ''; // allow re-picking the same file
    if (files.length === 0 || uploading) return;
    setUploading(true);
    for (const file of files.slice(0, 4)) {
      if (file.size > MAX_FILE) {
        setMsgs(prev => [...prev, { id: newMsgId(), from: 'bot', text: `⚠ ${file.name}: max 10MB`, source: 'fallback', timestamp: Date.now() }]);
        continue;
      }
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`/api/widget/${id}/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setMsgs(prev => [...prev, { id: newMsgId(), from: 'bot', text: `⚠ ${file.name}: ${data.error || 'upload failed'}`, source: 'fallback', timestamp: Date.now() }]);
          continue;
        }
        const att: ChatAttachment = {
          ...data.attachment,
          previewUrl: data.attachment.kind === 'image' ? URL.createObjectURL(file) : undefined,
        };
        setAttachments(prev => [...prev, att]);
      } catch {
        setMsgs(prev => [...prev, { id: newMsgId(), from: 'bot', text: `⚠ ${file.name}: network error`, source: 'fallback', timestamp: Date.now() }]);
      }
    }
    setUploading(false);
  }
  function removeAttachment(idx: number) {
    setAttachments(prev => {
      const a = prev[idx];
      if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    const outgoing = attachments;
    // Allow sending a file on its own (no text).
    if ((!text && outgoing.length === 0) || !bot || sending) return;

    // If we're inside an 'input' step of an active flow (Feature #1), the
    // visitor's reply feeds the flow variable instead of the AI engine.
    if (currentFlowStep && currentFlowStep.type === 'input') {
      setInput('');
      setMsgs(prev => [...prev, {
        id: newMsgId(), from: 'user', text, timestamp: Date.now(), status: 'sent',
      }]);
      if (currentFlowStep.variable) {
        setFlowVars(v => ({ ...v, [currentFlowStep.variable!]: text }));
      }
      advanceFlow(currentFlowStep.id);
      return;
    }

    const userMsg: Msg = {
      id: newMsgId(), from: 'user', text, timestamp: Date.now(), status: 'sending',
      attachments: outgoing.length ? outgoing : undefined,
    };
    const botMsgId = newMsgId();
    const botMsg: Msg = {
      id: botMsgId, from: 'bot', text: '', timestamp: Date.now(),
    };
    setInput('');
    setAttachments([]);
    setSending(true);
    setMsgs(prev => [...prev, userMsg, botMsg]);

    // A/B conversion fires once per session, on the very first user message
    // after we've recorded an impression (Feature #6).
    if (abVariantId && abImpressionSent && !abConversionSent) {
      void fetch(`/api/widget/${id}/ab`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ variantId: abVariantId, event: 'conversion' }),
      }).catch(() => undefined);
      setAbConversionSent(true);
    }

    const payload = JSON.stringify({
      text,
      lang: activeLang,
      conversationId,
      visitorId: queryRef.current.vid,
      pageUrl:   queryRef.current.page,
      pageTitle: queryRef.current.title,
      // Strip the local-only previewUrl before sending to the server.
      attachments: outgoing.map(({ url, pathname, filename, mimeType, kind }) =>
        ({ url, pathname, filename, mimeType, kind })),
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

          let evt: {
            type: string; conversationId?: string; text?: string;
            source?: Msg['source']; messageId?: string | null;
          };
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
              m.id === botMsgId
                ? { ...m, source: evt.source ?? m.source, serverId: evt.messageId ?? null }
                : m,
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
  }, [
    input, bot, sending, id, activeLang, conversationId, isVisible, unread,
    // Flow runner + A/B impression state — without these, send() captures
    // stale values from the closure and the conversion fires with the wrong
    // variant or the flow input handoff misses a step transition.
    currentFlowStep, advanceFlow,
    abVariantId, abImpressionSent, abConversionSent,
    attachments,
  ]);

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
    <div className="peit-widget h-screen w-screen flex flex-col bg-[#0d0d1a] text-white overflow-hidden">
      {/* Owner-authored CSS — sanitized server-side (Feature #10). The
          .peit-widget class above is the documented scope; rules outside
          that selector are still allowed but only this iframe's DOM is in
          range, so the blast radius is the widget itself. */}
      {bot.customCss && (
        <style
          // suppressHydrationWarning because the SSR HTML doesn't have the
          // dynamic config yet; the client mount injects it the first time.
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: bot.customCss }}
        />
      )}

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

              <div className="max-w-[78%] flex flex-col items-start gap-1.5">
                {/* Attachments (Feature #3) — image thumbnails / file chips */}
                {m.attachments && m.attachments.length > 0 && (
                  <div className={`flex flex-col gap-1.5 ${m.from === 'user' ? 'self-end items-end' : ''}`}>
                    {m.attachments.map((a, ai) => (
                      a.kind === 'image' && a.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={ai} src={a.previewUrl} alt={a.filename}
                          className="max-w-[180px] max-h-[180px] rounded-xl border border-white/10 object-cover" />
                      ) : (
                        <div key={ai} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-gray-200 max-w-[200px]">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{a.filename}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}
                {(m.text || m.from === 'bot') && (
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
                )}

                {/* Status / source indicators */}
                {m.from === 'user' && m.status === 'failed' && (
                  <button
                    onClick={() => retryMsg(m.id)}
                    className="text-[10px] mt-1 text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> {ui.retry}
                  </button>
                )}

                {/* Thumbs-up/down feedback (Feature #7).
                    Shown only on completed bot messages with a server id and
                    no prior vote. After voting we replace with a small
                    confirmation so the visitor sees their click landed. */}
                {m.from === 'bot' && m.serverId && (
                  m.feedback
                    ? (
                      <div className="text-[10px] mt-1 text-gray-500 flex items-center gap-1">
                        {m.feedback === 'positive'
                          ? <><ThumbsUp className="w-2.5 h-2.5" /> {ui.feedbackThanks}</>
                          : <><ThumbsDown className="w-2.5 h-2.5" /> {ui.feedbackThanks}</>}
                      </div>
                    )
                    : (
                      <div className="mt-1 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => submitFeedback(m.id, m.serverId!, 'positive')}
                          className="p-1 rounded hover:bg-white/[0.06] text-gray-500 hover:text-emerald-400 transition-colors"
                          aria-label={ui.feedbackUp}
                          title={ui.feedbackUp}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => submitFeedback(m.id, m.serverId!, 'negative')}
                          className="p-1 rounded hover:bg-white/[0.06] text-gray-500 hover:text-rose-400 transition-colors"
                          aria-label={ui.feedbackDown}
                          title={ui.feedbackDown}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )
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

      {/* Flow button-step options (Feature #1) — shown only when the current
          step is type='button'. Clicking commits the label as a user message
          and branches via the option's nextStepId. */}
      {currentFlowStep && currentFlowStep.type === 'button' && currentFlowStep.options && (
        <div className="px-3 pb-2 shrink-0 flex flex-wrap gap-1.5">
          {currentFlowStep.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setMsgs(prev => [...prev, {
                  id: newMsgId(), from: 'user', text: opt.label,
                  timestamp: Date.now(), status: 'sent',
                }]);
                if (currentFlowStep.variable) {
                  setFlowVars(v => ({ ...v, [currentFlowStep.variable!]: opt.value }));
                }
                advanceFlow(currentFlowStep.id, opt.nextStepId);
              }}
              className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-[1.02] active:scale-95"
              style={{
                borderColor: `${color}40`,
                color: color,
                background: `${color}10`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Quick replies — bot-owner-configured pill buttons. Each pill is
          consumed once: on click we record its index in usedQuickReplies and
          hide it. For action='message' we feed the label into send() so the
          chat shows what the visitor "picked" verbatim. */}
      {bot.quickReplies.length > 0 && !sending && !inFlow && (
        <div className="px-3 pb-2 shrink-0 flex flex-wrap gap-1.5">
          {bot.quickReplies.map((qr, i) => {
            if (usedQuickReplies.has(i)) return null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setUsedQuickReplies(prev => {
                    const next = new Set(prev);
                    next.add(i);
                    return next;
                  });
                  if (qr.action === 'message') {
                    send(qr.value);
                  } else if (qr.action === 'url') {
                    // Echo the label as a user message so the click is
                    // visible in the transcript, then open the link.
                    setMsgs(prev => [...prev, {
                      id: newMsgId(), from: 'user', text: qr.label,
                      timestamp: Date.now(), status: 'sent',
                    }]);
                    try { window.open(qr.value, '_blank', 'noopener,noreferrer'); }
                    catch { /* popup blocked — visitor can re-click */ }
                  } else if (qr.action === 'flow') {
                    // Flow runner ships in Feature #1. For now we just send
                    // the label so the visitor sees something happened.
                    send(qr.label);
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  borderColor: `${color}40`,
                  color: color,
                  background: `${color}10`,
                }}
              >
                {qr.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Pending attachments preview (Feature #3) */}
      {(attachments.length > 0 || uploading) && (
        <div className="px-3 pt-2 shrink-0 flex flex-wrap gap-2 border-t border-white/[0.06] bg-white/[0.02]">
          {attachments.map((a, i) => (
            <div key={i} className="relative group">
              {a.kind === 'image' && a.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.previewUrl} alt={a.filename} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
              ) : (
                <div className="h-12 px-2.5 flex items-center gap-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] text-gray-200 max-w-[120px]">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{a.filename}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-900 border border-white/20 text-gray-300 hover:text-white flex items-center justify-center"
                aria-label="remove"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="w-12 h-12 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/[0.06] p-3 flex items-end gap-2 shrink-0 bg-white/[0.02]">
        {/* Hidden file input + paperclip (Feature #3) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.docx,image/*"
          multiple
          onChange={onFilePick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploading}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 shrink-0 hover:scale-105 active:scale-95 border border-white/[0.08] text-gray-300 hover:text-white"
          aria-label={ui.attachFile}
          title={ui.attachFile}
        >
          <Paperclip className="w-3.5 h-3.5" />
        </button>

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
          placeholder={listening ? ui.listening : ui.placeholder}
          disabled={sending}
          className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl px-3.5 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40 disabled:opacity-60 resize-none max-h-[120px]"
          style={{ minHeight: '36px' }}
        />

        {/* Mic — hidden when browser SpeechRecognition missing (Feature #4) */}
        {voiceSupported && (
          <button
            onClick={toggleVoice}
            disabled={sending}
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 shrink-0 hover:scale-105 active:scale-95 border border-white/[0.08]"
            style={{
              background: listening ? `${color}33` : 'transparent',
            }}
            aria-label={listening ? ui.listenStop : ui.listenStart}
            title={listening ? ui.listenStop : ui.listenStart}
          >
            {listening
              ? <>
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: `${color}55` }}
                  />
                  <Mic className="w-3.5 h-3.5 text-white relative z-10" />
                </>
              : <Mic className="w-3.5 h-3.5 text-gray-300" />}
          </button>
        )}

        <button
          onClick={() => send()}
          disabled={(!input.trim() && attachments.length === 0) || sending || uploading}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 shrink-0 hover:scale-105 active:scale-95"
          style={{ background: color, boxShadow: (input.trim() || attachments.length) ? `0 2px 8px ${color}55` : 'none' }}
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
