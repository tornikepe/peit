// GET /widget.js
// Public loader script. Customers paste this into their site:
//
//   <script src="https://peit.vercel.app/widget.js" data-bot-id="xxx" defer></script>
//
// Optional data-* attributes:
//   data-color="#14b8a6"        — overrides launcher color
//   data-position="left|right"  — corner position (default: right)
//   data-welcome-delay="6000"   — ms before welcome bubble pops (0 = disabled)
//   data-greeting="custom..."   — overrides greeting in welcome bubble

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const script = buildWidgetScript(url.origin);

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type':                'application/javascript; charset=utf-8',
      'Cache-Control':               'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function buildWidgetScript(origin: string): string {
  // Single IIFE so the host page's globals stay clean. The only injected
  // value is ORIGIN; everything else uses string concatenation to avoid
  // template-literal escaping headaches.
  return `(function(){
"use strict";

if (window.__peit_loaded__) return;
window.__peit_loaded__ = true;

// ─── 1. Detect script tag ──────────────────────────────────────────────────
var current = document.currentScript;
if (!current) {
  var ss = document.getElementsByTagName('script');
  for (var i = ss.length - 1; i >= 0; i--) {
    if (ss[i].src && ss[i].src.indexOf('/widget.js') !== -1) { current = ss[i]; break; }
  }
}
if (!current) { console.warn('[Peit] could not detect script tag'); return; }

var BOT_ID = current.getAttribute('data-bot-id');
if (!BOT_ID) { console.warn('[Peit] missing data-bot-id'); return; }

var BRAND_COLOR    = current.getAttribute('data-color') || '#14b8a6';
var POSITION       = (current.getAttribute('data-position') || 'right').toLowerCase();
var WELCOME_DELAY  = parseInt(current.getAttribute('data-welcome-delay') || '6000', 10);
var ORIGIN         = ${JSON.stringify(origin)};
var STORAGE_PREFIX = 'peit_v1_' + BOT_ID + '_';

// ─── 2. Visitor ID + state ─────────────────────────────────────────────────
function get(k){ try { return localStorage.getItem(STORAGE_PREFIX + k); } catch(_) { return null; } }
function set(k, v){ try { localStorage.setItem(STORAGE_PREFIX + k, v); } catch(_) {} }
function del(k){ try { localStorage.removeItem(STORAGE_PREFIX + k); } catch(_) {} }

function uuid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  if (window.crypto && window.crypto.getRandomValues) {
    var bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = [];
    for (var j = 0; j < 16; j++) {
      var x = bytes[j].toString(16);
      hex.push(x.length === 1 ? '0' + x : x);
    }
    return hex[0]+hex[1]+hex[2]+hex[3]+'-'+hex[4]+hex[5]+'-'+hex[6]+hex[7]+'-'+hex[8]+hex[9]+'-'+hex[10]+hex[11]+hex[12]+hex[13]+hex[14]+hex[15];
  }
  return 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

var visitorId = get('vid');
if (!visitorId) { visitorId = uuid(); set('vid', visitorId); }

var welcomeDismissed = get('welcome_dismissed') === '1';

// ─── 3. Mount host element + Shadow DOM ────────────────────────────────────
var host = document.createElement('div');
host.id = 'peit-widget-host';
host.setAttribute('data-peit-bot-id', BOT_ID);
document.documentElement.appendChild(host);
var shadow = host.attachShadow ? host.attachShadow({ mode: 'closed' }) : host;

// ─── 4. Inject styles ──────────────────────────────────────────────────────
var POS_SIDE = POSITION === 'left' ? 'left' : 'right';
var POS_CSS  = POS_SIDE + ':24px;';
var ARROW_SIDE = POS_SIDE;

var style = document.createElement('style');
style.textContent =
  ':host{all:initial;}' +
  '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;}' +

  '.wrap{position:fixed;bottom:24px;' + POS_CSS + 'z-index:2147483647;display:flex;flex-direction:column;align-items:' + (POS_SIDE === 'left' ? 'flex-start' : 'flex-end') + ';gap:12px;pointer-events:none;}' +
  '.wrap > *{pointer-events:auto;}' +

  '.launcher{width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:' + BRAND_COLOR + ';color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.18),0 2px 4px rgba(0,0,0,.12);transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s ease;-webkit-tap-highlight-color:transparent;position:relative;outline:0;}' +
  '.launcher:hover{transform:scale(1.06);box-shadow:0 12px 28px rgba(0,0,0,.22),0 4px 8px rgba(0,0,0,.14);}' +
  '.launcher:active{transform:scale(.94);}' +
  '.launcher:focus-visible{box-shadow:0 0 0 4px ' + BRAND_COLOR + '40;}' +
  '.launcher svg{width:26px;height:26px;transition:transform .3s cubic-bezier(.4,0,.2,1);}' +
  '.launcher .ico-close{position:absolute;opacity:0;transform:rotate(-90deg) scale(.6);}' +
  '.launcher.open .ico-chat{opacity:0;transform:rotate(90deg) scale(.6);}' +
  '.launcher.open .ico-close{opacity:1;transform:rotate(0) scale(1);}' +

  '.dot{position:absolute;top:6px;right:6px;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid ' + BRAND_COLOR + ';animation:peit-pulse 2.4s infinite;}' +
  '.launcher.open .dot{display:none;}' +

  '.badge{position:absolute;top:-4px;' + (POS_SIDE === 'left' ? 'right' : 'left') + ':-4px;min-width:22px;height:22px;border-radius:11px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 6px;border:2px solid #fff;box-shadow:0 2px 8px rgba(239,68,68,.4);animation:peit-bounce .35s cubic-bezier(.34,1.56,.64,1);}' +
  '.launcher.open .badge{display:none;}' +

  '@keyframes peit-pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.55;transform:scale(.85);}}' +
  '@keyframes peit-bounce{0%{transform:scale(0);}70%{transform:scale(1.18);}100%{transform:scale(1);}}' +
  '@keyframes peit-slide-up{0%{transform:translateY(8px);opacity:0;}100%{transform:translateY(0);opacity:1;}}' +
  '@keyframes peit-panel-in{0%{transform:translateY(20px) scale(.92);opacity:0;}60%{transform:translateY(-2px) scale(1.01);opacity:1;}100%{transform:translateY(0) scale(1);opacity:1;}}' +
  '@keyframes peit-panel-out{from{transform:translateY(0) scale(1);opacity:1;}to{transform:translateY(20px) scale(.96);opacity:0;}}' +

  '.welcome{background:#fff;color:#18181b;border-radius:18px;padding:14px 18px 14px 16px;max-width:280px;box-shadow:0 12px 32px rgba(0,0,0,.18),0 4px 8px rgba(0,0,0,.08);cursor:pointer;position:relative;animation:peit-slide-up .35s cubic-bezier(.34,1.56,.64,1);line-height:1.45;font-size:14px;border:1px solid rgba(0,0,0,.05);transition:transform .15s ease;}' +
  '.welcome:hover{transform:translateY(-2px);}' +
  '.welcome::after{content:"";position:absolute;bottom:-7px;' + ARROW_SIDE + ':24px;width:14px;height:14px;background:#fff;transform:rotate(45deg);border-' + ARROW_SIDE + ':1px solid rgba(0,0,0,.05);border-bottom:1px solid rgba(0,0,0,.05);}' +
  '.welcome-text{padding-right:16px;}' +
  '.welcome-from{font-weight:600;font-size:11px;color:#666;margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em;}' +
  '.welcome-close{position:absolute;top:8px;right:8px;width:20px;height:20px;border:0;background:rgba(0,0,0,.06);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#666;transition:background .15s,color .15s;}' +
  '.welcome-close:hover{background:rgba(0,0,0,.12);color:#000;}' +
  '.welcome-close svg{width:10px;height:10px;}' +

  '.panel{width:380px;height:600px;max-height:calc(100vh - 120px);max-width:calc(100vw - 32px);background:#0d0d1a;border-radius:18px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,.32),0 8px 16px rgba(0,0,0,.18);display:none;flex-direction:column;transform-origin:' + POS_SIDE + ' bottom;}' +
  '.panel.open{display:flex;animation:peit-panel-in .4s cubic-bezier(.34,1.56,.64,1);}' +
  '.panel.closing{animation:peit-panel-out .25s ease-in forwards;}' +
  '.panel iframe{flex:1;border:0;width:100%;height:100%;background:#0d0d1a;display:block;}' +

  '@media (max-width: 480px){' +
    '.wrap{' + POS_SIDE + ':12px !important;left:12px !important;right:12px !important;bottom:12px;align-items:' + (POS_SIDE === 'left' ? 'flex-start' : 'flex-end') + ';}' +
    '.panel{width:calc(100vw - 24px) !important;height:calc(100vh - 90px) !important;max-height:calc(100vh - 90px) !important;}' +
    '.welcome{max-width:calc(100vw - 100px);}' +
  '}';
shadow.appendChild(style);

// ─── 5. Build DOM ──────────────────────────────────────────────────────────
var wrap = document.createElement('div');
wrap.className = 'wrap';

var panel = document.createElement('div');
panel.className = 'panel';
panel.setAttribute('role', 'dialog');
panel.setAttribute('aria-label', 'Chat');

var iframe = document.createElement('iframe');
iframe.title = 'Peit chat';
iframe.allow = 'clipboard-write';
iframe.setAttribute('aria-label', 'Chat conversation');
panel.appendChild(iframe);

var launcher = document.createElement('button');
launcher.className = 'launcher';
launcher.setAttribute('aria-label', 'Open chat');
launcher.innerHTML =
  '<svg class="ico-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
  '<svg class="ico-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
  '<span class="dot"></span>';

wrap.appendChild(panel);
wrap.appendChild(launcher);
shadow.appendChild(wrap);

// ─── 6. Behavior ───────────────────────────────────────────────────────────
var open = false;
var loaded = false;
var welcomeEl = null;
var welcomeTimer = null;

function buildIframeUrl() {
  var params = new URLSearchParams();
  params.set('vid', visitorId);
  try {
    params.set('page', location.href.slice(0, 500));
    params.set('title', document.title.slice(0, 200));
  } catch(_) {}
  var saved = get('convo');
  if (saved) params.set('convo', saved);
  return ORIGIN + '/widget/' + encodeURIComponent(BOT_ID) + '?' + params.toString();
}

function setOpen(next) {
  if (next === open) return;
  open = next;
  if (open) {
    if (!loaded) {
      iframe.src = buildIframeUrl();
      loaded = true;
    }
    panel.classList.remove('closing');
    panel.classList.add('open');
    launcher.classList.add('open');
    launcher.setAttribute('aria-label', 'Close chat');
    hideWelcome();
    setUnread(0);
    notifyIframe('opened');
  } else {
    panel.classList.add('closing');
    setTimeout(function() {
      panel.classList.remove('open');
      panel.classList.remove('closing');
    }, 250);
    launcher.classList.remove('open');
    launcher.setAttribute('aria-label', 'Open chat');
    notifyIframe('closed');
  }
}

function notifyIframe(type) {
  if (loaded && iframe.contentWindow) {
    try { iframe.contentWindow.postMessage({ source: 'peit-widget-host', type: type }, '*'); } catch(_) {}
  }
}

function showWelcome(text, fromName) {
  if (welcomeEl || welcomeDismissed || open) return;
  welcomeEl = document.createElement('div');
  welcomeEl.className = 'welcome';
  welcomeEl.setAttribute('role', 'button');
  welcomeEl.setAttribute('aria-label', 'Open chat');

  var btn = document.createElement('button');
  btn.className = 'welcome-close';
  btn.setAttribute('aria-label', 'Dismiss');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    hideWelcome();
    welcomeDismissed = true;
    set('welcome_dismissed', '1');
  });

  var inner = document.createElement('div');
  inner.className = 'welcome-text';
  if (fromName) {
    var from = document.createElement('div');
    from.className = 'welcome-from';
    from.textContent = fromName;
    inner.appendChild(from);
  }
  var msg = document.createElement('div');
  msg.textContent = text;
  inner.appendChild(msg);

  welcomeEl.appendChild(btn);
  welcomeEl.appendChild(inner);
  welcomeEl.addEventListener('click', function() { setOpen(true); });

  wrap.insertBefore(welcomeEl, launcher);
}

function hideWelcome() {
  if (welcomeEl && welcomeEl.parentNode) welcomeEl.parentNode.removeChild(welcomeEl);
  welcomeEl = null;
  if (welcomeTimer) { clearTimeout(welcomeTimer); welcomeTimer = null; }
}

function setUnread(n) {
  var existing = launcher.querySelector('.badge');
  if (n > 0 && !open) {
    if (existing) {
      existing.textContent = n > 9 ? '9+' : String(n);
    } else {
      var badge = document.createElement('span');
      badge.className = 'badge';
      badge.setAttribute('aria-label', n + ' unread');
      badge.textContent = n > 9 ? '9+' : String(n);
      launcher.appendChild(badge);
    }
  } else if (existing) {
    existing.remove();
  }
}

launcher.addEventListener('click', function() { setOpen(!open); });

// Esc closes the panel
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && open) setOpen(false);
});

// ─── 7. iframe → host messages ─────────────────────────────────────────────
window.addEventListener('message', function(e) {
  if (!e.data || e.data.source !== 'peit-widget') return;
  switch (e.data.type) {
    case 'close':       setOpen(false); break;
    case 'open':        setOpen(true);  break;
    case 'unread':      if (typeof e.data.count === 'number') setUnread(e.data.count); break;
    case 'conversation':if (e.data.id) set('convo', e.data.id); break;
    case 'reset':       del('convo'); break;
    case 'ready':       /* iframe loaded */ break;
  }
});

// ─── 8. Welcome bubble (proactive, first visit only) ───────────────────────
if (WELCOME_DELAY > 0 && !welcomeDismissed && !get('welcome_shown')) {
  fetch(ORIGIN + '/api/widget/' + encodeURIComponent(BOT_ID) + '/config')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (!data || !data.ok || open) return;
      var b = data.bot;
      var override = current.getAttribute('data-greeting');
      var text = override || (b.greeting && (b.greeting[b.primaryLang] || b.greeting.ka || b.greeting.en)) || 'Hi! 👋 How can I help?';
      welcomeTimer = setTimeout(function() {
        if (!open) {
          showWelcome(text, b.name);
          set('welcome_shown', '1');
        }
      }, WELCOME_DELAY);
    })
    .catch(function(){});
}

// ─── 9. Public API ─────────────────────────────────────────────────────────
window.Peit = {
  open:    function() { setOpen(true);  },
  close:   function() { setOpen(false); },
  toggle:  function() { setOpen(!open); },
  reset:   function() {
    del('convo'); del('welcome_dismissed'); del('welcome_shown');
    if (loaded && iframe.contentWindow) {
      try { iframe.contentWindow.postMessage({ source: 'peit-widget-host', type: 'reset' }, '*'); } catch(_) {}
    }
  },
  isOpen:    function() { return open; },
  visitorId: visitorId,
  version:   '1.1.0',
};

})();
`;
}
