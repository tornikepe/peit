// Tiny markdown subset for chat replies — no external deps.
// Supports: **bold**, *italic*, `code`, [link](url), bullet lists, line breaks.
// Output is React nodes (safe — never sets dangerouslySetInnerHTML).

import type { ReactNode } from 'react';

function escapeChildren(text: string): (string | ReactNode)[] {
  // Walk a single line and emit React nodes for inline tokens.
  const out: (string | ReactNode)[] = [];
  let key = 0;

  // Pattern order matters: code → link → bold → italic
  // We do them sequentially via a single regex with alternation.
  const re = /(`[^`\n]+`)|(\[[^\]]+\]\(https?:\/\/[^)]+\))|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)/g;

  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));

    const token = m[0];
    if (token.startsWith('`')) {
      out.push(
        <code key={key++} className="px-1.5 py-0.5 bg-white/10 rounded text-[12px] font-mono">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/.exec(token);
      if (linkMatch) {
        out.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
            style={{ color: 'currentColor' }}
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        out.push(token);
      }
    } else if (token.startsWith('**')) {
      out.push(<strong key={key++} className="font-semibold">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      out.push(<em key={key++} className="italic">{token.slice(1, -1)}</em>);
    }

    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Render a chat-message string with a small markdown subset.
 * Handles paragraphs separated by blank lines, bullet lists (lines
 * starting with • or -), and inline tokens.
 */
export function renderMd(text: string): ReactNode {
  const trimmed = text.replace(/\r/g, '').trim();
  if (!trimmed) return null;

  const blocks = trimmed.split(/\n{2,}/);

  return blocks.map((block, bi) => {
    const lines = block.split('\n');

    // Bullet list?
    const isList = lines.every(l => /^\s*[•\-*]\s+/.test(l));
    if (isList && lines.length > 1) {
      return (
        <ul key={bi} className="list-disc pl-5 space-y-1 my-0.5">
          {lines.map((l, li) => (
            <li key={li}>{escapeChildren(l.replace(/^\s*[•\-*]\s+/, ''))}</li>
          ))}
        </ul>
      );
    }

    // Regular paragraph: each \n becomes a soft break
    return (
      <p key={bi} className={bi > 0 ? 'mt-2' : ''}>
        {lines.map((l, li) => (
          <span key={li}>
            {escapeChildren(l)}
            {li < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}
