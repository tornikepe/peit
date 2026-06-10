'use client';

import { useState } from 'react';
import { Cloud, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useBots } from '@/context/BotsContext';
import { useLanguage } from '@/context/LanguageContext';

export default function MigrationBanner() {
  const { hasLocalToMigrate, migrating, migrateLocalToCloud, mode } = useBots();
  const en = useLanguage().lang === 'en';
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (mode !== 'cloud' || !hasLocalToMigrate || dismissed) return null;

  async function run() {
    setError(null);
    try {
      const r = await migrateLocalToCloud();
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : (en ? 'Migration failed' : 'მიგრაცია ვერ მოხერხდა'));
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 mb-6 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-emerald-300 font-semibold text-sm">{en ? 'Migration complete' : 'მიგრაცია დასრულდა'}</p>
          <p className="text-gray-400 text-xs mt-0.5">
            {result.imported} {en ? 'bots moved to the cloud' : 'ბოტი წარმატებით გადაიტანე ღრუბელზე'}
            {result.failed > 0 && ` · ${result.failed} ${en ? 'failed' : 'ვერ გადავიდა'}`}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/10 to-purple-600/5 p-4 mb-6 flex items-start gap-3">
      <Cloud className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-white font-semibold text-sm">{en ? 'Bots saved in this browser were found' : 'ბრაუზერში შენახული ბოტები გამოვლინდა'}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          {en ? 'Move them to the cloud — then you can access them from any device.' : 'გადაიტანე ღრუბელზე — შემდეგ ნებისმიერი მოწყობილობიდან გექნება წვდომა.'}
        </p>
        {error && (
          <p className="flex items-center gap-1.5 text-red-400 text-xs mt-2">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={run}
          disabled={migrating}
          className="btn-primary inline-flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {migrating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {en ? 'Moving...' : 'გადატანა...'}
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5" />
              {en ? 'Move' : 'გადატანა'}
            </>
          )}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-white transition-colors p-1.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
