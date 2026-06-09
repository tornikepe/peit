'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUp, ChevronRight } from 'lucide-react';
import MarketingNav from './landing/MarketingNav';
import MarketingFooter from './landing/MarketingFooter';
import { useLanguage } from '@/context/LanguageContext';
import {
  legalDocs, legalLabels, legalUpdatedLabel,
  type LegalDoc, type LegalSlug, type LegalBlock,
} from '@/lib/i18n-legal';

interface Props {
  slug: LegalSlug;
}

/** Tiny **bold** parser — only allowed transform in legal copy. Backticks
 *  render as inline <code>. Everything else stays as plain text so author
 *  intent is preserved and there's no XSS surface. */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Tokens: **bold**, `code`, or plain run.
  const regex = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(<strong key={`b-${key++}`} className="text-white font-semibold">{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      parts.push(
        <code key={`c-${key++}`} className="px-1.5 py-0.5 mx-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-xs text-violet-300 font-mono">
          {m[2]}
        </code>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === 'p') {
    return (
      <p className="text-gray-300 leading-relaxed mb-4 last:mb-0">
        {renderInline(block.text)}
      </p>
    );
  }
  if (block.kind === 'ul') {
    return (
      <ul className="mb-4 last:mb-0 flex flex-col gap-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-gray-300 leading-relaxed">
            <span className="mt-2 w-1 h-1 rounded-full bg-violet-400 shrink-0" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ol className="mb-4 last:mb-0 flex flex-col gap-2 list-decimal list-inside">
      {block.items.map((item, i) => (
        <li key={i} className="text-gray-300 leading-relaxed pl-1">
          {renderInline(item)}
        </li>
      ))}
    </ol>
  );
}

function formatDate(iso: string, lang: 'ka' | 'en' | 'ru'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const locale = lang === 'ka' ? 'ka-GE' : lang === 'ru' ? 'ru-RU' : 'en-US';
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function LegalPage({ slug }: Props) {
  const { lang } = useLanguage();
  const doc: LegalDoc = useMemo(() => legalDocs[slug][lang], [slug, lang]);

  // Sibling-doc cross-links at the bottom for discoverability.
  const otherDocs: LegalSlug[] = (['terms', 'privacy', 'gdpr', 'cookies'] as const)
    .filter(s => s !== slug);

  return (
    <div className="ms-root">
      <div className="bg-grid" />
      <MarketingNav />
      <main className="legal-body pt-28 pb-16 flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <header className="mb-12">
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-3">
              {legalLabels[slug][lang]}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              {doc.title}
            </h1>
            <p className="text-gray-400 leading-relaxed mb-4">{doc.subtitle}</p>
            <p className="text-xs text-gray-500">
              {legalUpdatedLabel[lang]}: <span className="text-gray-300">{formatDate(doc.effectiveDate, lang)}</span>
            </p>
          </header>

          {/* Intro */}
          {doc.intro.length > 0 && (
            <section className="mb-10 text-base">
              {doc.intro.map((b, i) => <Block key={i} block={b} />)}
            </section>
          )}

          {/* Table of contents */}
          <nav
            aria-label={doc.tocLabel}
            className="mb-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              {doc.tocLabel}
            </p>
            <ul className="flex flex-col gap-1.5">
              {doc.sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-violet-300 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-violet-400 transition-colors" />
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sections */}
          <div className="flex flex-col gap-12">
            {doc.sections.map(s => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-28"
              >
                <h2 className="text-xl font-bold text-white mb-4 tracking-tight">
                  {s.title}
                </h2>
                {s.body.map((b, i) => <Block key={i} block={b} />)}
              </section>
            ))}
          </div>

          {/* Contact callout */}
          <div className="mt-16 rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-5 text-center">
            <p className="text-gray-300 text-sm leading-relaxed">{doc.contact}</p>
          </div>

          {/* Other legal documents */}
          <div className="mt-12 pt-8 border-t border-white/[0.06]">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
              {lang === 'ka' ? 'სხვა დოკუმენტები' : lang === 'ru' ? 'Другие документы' : 'Related documents'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {otherDocs.map(s => (
                <Link
                  key={s}
                  href={`/${s}`}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 transition-colors"
                >
                  <span className="text-sm text-gray-300 group-hover:text-white">
                    {legalLabels[s][lang]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Back to top */}
          <div className="mt-10 flex justify-center">
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-300 transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              {lang === 'ka' ? 'ზევით' : lang === 'ru' ? 'Наверх' : 'Back to top'}
            </a>
          </div>

        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
