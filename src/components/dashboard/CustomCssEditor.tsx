'use client';

// Feature #10: textarea + live iframe preview for the widget's owner-CSS.
// Typing is debounced 500ms before we postMessage into the iframe so we
// don't flood it with re-injections per keystroke.

import { useEffect, useRef, useState } from 'react';
import { Code2, Loader2, Check, Eye } from 'lucide-react';

interface Props {
  botId: string;
  value: string;
  onSave: (next: string) => Promise<void>;
}

const SCAFFOLD = `/* Available scope classes — target these to skin the widget.
   .peit-widget       — outer container
   .peit-chat-bubble  — every message bubble
   .peit-input        — text input
   .peit-send-button  — send button
   .peit-header       — chat header */
`;

const MAX = 8192;

export default function CustomCssEditor({ botId, value, onSave }: Props) {
  const [draft, setDraft]   = useState(value);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Re-sync the local buffer when the upstream value flips identity
  // (React 19 derived-state pattern, not setState-in-effect).
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  // Debounced postMessage → live preview.
  useEffect(() => {
    const t = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { source: 'peit-widget-host', type: 'preview-css', css: draft },
        '*',
      );
    }, 500);
    return () => clearTimeout(t);
  }, [draft]);

  const dirty = draft !== value;

  async function save() {
    setSaving(true);
    try {
      await onSave(draft);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } finally { setSaving(false); }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Code2 className="w-4 h-4 text-violet-400" />
        <h2 className="text-white font-semibold">სტილი (Custom CSS)</h2>
      </div>
      <p className="text-gray-500 text-xs mb-4 leading-relaxed">
        ჩაიწერება ვიჯეტში. <code className="text-gray-400">@import</code>, <code className="text-gray-400">url()</code> და <code className="text-gray-400">expression()</code> სერვერზე ფილტრდება.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            maxLength={MAX}
            spellCheck={false}
            onChange={e => setDraft(e.target.value)}
            placeholder={SCAFFOLD}
            className="w-full h-80 bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-gray-100 placeholder:text-gray-600 outline-none focus:border-violet-500/40 resize-y"
          />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">{draft.length} / {MAX}</span>
            <div className="flex-1" />
            {dirty && (
              <button
                type="button"
                onClick={() => setDraft(value)}
                disabled={saving}
                className="text-xs text-gray-400 hover:text-white px-2 py-1"
              >
                გაუქმება
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving
                ? <><Loader2 className="w-3 h-3 animate-spin" /> შენახვა...</>
                : savedAt
                  ? <><Check className="w-3 h-3" /> შენახულია</>
                  : 'შენახვა'}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Eye className="w-3 h-3" /> ცოცხალი წინასწარი ხედი
          </div>
          <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-black h-80">
            <iframe
              ref={iframeRef}
              src={`/widget/${botId}?preview=1`}
              title="Widget preview"
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
