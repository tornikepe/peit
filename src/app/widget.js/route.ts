// GET /widget.js
// The loader script that customers paste into their site's HTML.
// Vanilla JS — no React, no framework. ~5KB minified.
//
//   <script src="https://peit.ge/widget.js" data-bot-id="xxx"></script>

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin; // e.g. https://peit.ge

  const script = buildWidgetScript(origin);

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
  // The whole script is one IIFE so it can't pollute the host page's globals.
  // Two parts:
  //   1. Launcher button — a <div> with shadow root in the bottom-right corner
  //   2. Iframe panel — opens above the launcher when clicked
  return `(function(){
"use strict";

// ─── 0. Single-instance guard ──────────────────────────────────────────────
if (window.__peit_loaded__) return;
window.__peit_loaded__ = true;

// ─── 1. Read script attributes ─────────────────────────────────────────────
var scripts = document.getElementsByTagName('script');
var current = document.currentScript;
if (!current) {
  for (var i = scripts.length - 1; i >= 0; i--) {
    if (scripts[i].src && scripts[i].src.indexOf('/widget.js') !== -1) {
      current = scripts[i]; break;
    }
  }
}
if (!current) { console.warn('[Peit] could not detect script tag'); return; }

var BOT_ID = current.getAttribute('data-bot-id');
if (!BOT_ID) { console.warn('[Peit] missing data-bot-id'); return; }

var BRAND_COLOR = current.getAttribute('data-color') || '#7c3aed';
var POSITION    = (current.getAttribute('data-position') || 'right').toLowerCase();
var ORIGIN      = ${JSON.stringify(origin)};

// ─── 2. Mount host element ─────────────────────────────────────────────────
var host = document.createElement('div');
host.id = 'peit-widget-host';
host.setAttribute('data-peit-bot-id', BOT_ID);
document.documentElement.appendChild(host);
var shadow = host.attachShadow ? host.attachShadow({ mode: 'closed' }) : host;

// ─── 3. Inject styles ──────────────────────────────────────────────────────
var POS_STYLE = POSITION === 'left' ? 'left:24px;right:auto;' : 'right:24px;left:auto;';
var styleEl = document.createElement('style');
styleEl.textContent =
  ':host{all:initial;}' +
  '*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;}' +
  '.wrap{position:fixed;bottom:24px;' + POS_STYLE + 'z-index:2147483647;display:flex;flex-direction:column;align-items:flex-end;gap:12px;}' +
  '.launcher{width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;background:' + BRAND_COLOR + ';color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.18),0 2px 4px rgba(0,0,0,.12);transition:transform .2s ease,box-shadow .2s ease;-webkit-tap-highlight-color:transparent;position:relative;}' +
  '.launcher:hover{transform:scale(1.06);box-shadow:0 12px 28px rgba(0,0,0,.22),0 4px 8px rgba(0,0,0,.14);}' +
  '.launcher svg{width:26px;height:26px;}' +
  '.dot{position:absolute;top:6px;right:6px;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid ' + BRAND_COLOR + ';animation:pulse 2s infinite;}' +
  '@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.6;}}' +
  '.panel{width:380px;height:600px;max-height:calc(100vh - 120px);max-width:calc(100vw - 32px);background:#0d0d1a;border-radius:18px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,.32),0 8px 16px rgba(0,0,0,.18);transform:translateY(20px) scale(.96);opacity:0;pointer-events:none;transition:transform .25s cubic-bezier(.34,1.56,.64,1),opacity .2s ease;display:flex;flex-direction:column;}' +
  '.panel.open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto;}' +
  '.panel iframe{flex:1;border:0;width:100%;height:100%;background:#0d0d1a;}' +
  '.badge{position:absolute;top:-4px;left:-4px;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff;}' +
  '@media (max-width: 480px){.panel{width:calc(100vw - 24px);height:calc(100vh - 100px);bottom:80px;}}';
shadow.appendChild(styleEl);

// ─── 4. Build DOM ──────────────────────────────────────────────────────────
var wrap = document.createElement('div');
wrap.className = 'wrap';

var panel = document.createElement('div');
panel.className = 'panel';

var iframe = document.createElement('iframe');
iframe.title = 'Peit chat';
iframe.allow = 'clipboard-write';
// Lazy-load the iframe — only set src on first open
panel.appendChild(iframe);

var launcher = document.createElement('button');
launcher.className = 'launcher';
launcher.setAttribute('aria-label', 'Open chat');
launcher.innerHTML =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
  '</svg>' +
  '<span class="dot"></span>';

wrap.appendChild(panel);
wrap.appendChild(launcher);
shadow.appendChild(wrap);

// ─── 5. Behavior ───────────────────────────────────────────────────────────
var open = false;
var loaded = false;

function setOpen(next) {
  open = next;
  if (open) {
    if (!loaded) {
      iframe.src = ORIGIN + '/widget/' + encodeURIComponent(BOT_ID);
      loaded = true;
    }
    panel.classList.add('open');
    launcher.style.display = 'none';
  } else {
    panel.classList.remove('open');
    launcher.style.display = 'flex';
  }
}

launcher.addEventListener('click', function() { setOpen(!open); });

// ─── 6. postMessage from iframe ────────────────────────────────────────────
window.addEventListener('message', function(e) {
  if (!e.data || e.data.source !== 'peit-widget') return;
  if (e.data.type === 'close') setOpen(false);
  if (e.data.type === 'open')  setOpen(true);
});

// ─── 7. Public API on window.Peit ──────────────────────────────────────────
window.Peit = {
  open:   function() { setOpen(true);  },
  close:  function() { setOpen(false); },
  toggle: function() { setOpen(!open); },
};

})();
`;
}
