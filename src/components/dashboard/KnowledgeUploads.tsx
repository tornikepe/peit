'use client';

// Feature #9: upload PDF / DOCX / TXT documents as bot knowledge.
// Renders an upload button + the existing-uploads list with delete.

import { useEffect, useRef, useState } from 'react';
import { Upload, FileText, Trash2, Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';

interface UploadRow {
  filename:   string;
  blobUrl:    string | null;
  chunkCount: number;
  uploadedAt: string | null;
}

const ACCEPT = '.pdf,.docx,.txt';

export default function KnowledgeUploads({ botId }: { botId: string }) {
  const [items, setItems]     = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [ok, setOk]           = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      const res  = await fetch(`/api/bots/${botId}/knowledge/uploads`);
      const data = await res.json();
      if (res.ok && data.ok) setItems(data.uploads);
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, [botId]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null); setOk(null); setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/bots/${botId}/knowledge/uploads`, {
        method: 'POST',
        body:   form,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.message || data.error || 'UPLOAD_FAILED');
      } else {
        setOk(`✓ ${data.filename} · ${data.chunkCount} chunk${data.embedded ? ` · 🧠 ${data.embedded} embedded` : ''}`);
        await refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'network');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      setTimeout(() => { setOk(null); setErr(null); }, 6000);
    }
  }

  async function remove(filename: string) {
    setItems(prev => prev.filter(x => x.filename !== filename));
    await fetch(`/api/bots/${botId}/knowledge/uploads`, {
      method:  'DELETE',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ filename }),
    });
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-emerald-400" />
        <h2 className="text-white font-semibold">დოკუმენტები</h2>
      </div>
      <p className="text-gray-500 text-xs mb-4 leading-relaxed">
        ატვირთე PDF, DOCX ან TXT (max 10 MB). სისტემა ამოიღებს ტექსტს, დაყოფს ნაწილებად და დააინდექსებს AI-სთვის.
      </p>

      <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/25 transition-colors cursor-pointer disabled:opacity-50">
        {uploading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> ვამუშავებ...</>
          : <><Upload className="w-4 h-4" /> ფაილის ატვირთვა</>}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onPick}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {ok && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
          <Check className="w-3 h-3" /> {ok}
        </div>
      )}
      {err && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-3 h-3" /> {err}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
        {!loading && items.length === 0 && (
          <p className="text-xs text-gray-600 italic">ჯერ ფაილები არ გაქვს ატვირთული.</p>
        )}
        {items.map(it => (
          <div
            key={it.filename}
            className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
          >
            <FileText className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-100 truncate">{it.filename}</p>
              <p className="text-[11px] text-gray-500">
                {it.chunkCount} chunk
                {it.uploadedAt && ` · ${new Date(it.uploadedAt).toLocaleDateString('ka-GE', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}`}
              </p>
            </div>
            {it.blobUrl && (
              <a
                href={it.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
                title="ნახე ფაილი"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={() => remove(it.filename)}
              className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10"
              title="წაშლა"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
