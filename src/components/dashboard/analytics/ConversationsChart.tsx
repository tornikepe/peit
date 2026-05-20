'use client';

// Inline SVG line chart for the conversations-per-day series. Built
// without a chart library because the alternative (Recharts) ships ~110kb
// gzipped for a single line chart — and we only need one. The chart
// auto-scales to the container width via 100% viewBox, draws axis grid
// lines, a smooth area fill, and a hover tooltip with the precise count.

import { useMemo, useState } from 'react';
import type { DayPoint, Channel } from '@/lib/analytics';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface Props {
  points: DayPoint[];
  /** Currently filtered channel (URL ?channel=...), or undefined for "all". */
  channel?: Channel;
}

const CHANNELS: { key: Channel | 'all'; label: string }[] = [
  { key: 'all',       label: 'ყველა' },
  { key: 'web',       label: 'Web widget' },
  { key: 'telegram',  label: 'Telegram' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook',  label: 'Facebook' },
];

const PADDING = { top: 16, right: 12, bottom: 28, left: 36 };
const VIEW_W  = 800;
const VIEW_H  = 240;

export default function ConversationsChart({ points, channel }: Props) {
  const router = useRouter();
  const path   = usePathname();
  const params = useSearchParams();
  const [hover, setHover] = useState<{ x: number; y: number; p: DayPoint } | null>(null);

  const { path: linePath, areaPath, maxY, ticksY, gridY } = useMemo(() => buildPaths(points), [points]);

  const total = points.reduce((s, p) => s + p.count, 0);
  const avg   = points.length > 0 ? Math.round(total / points.length) : 0;
  const hasData = total > 0;

  function setChannel(c: Channel | 'all') {
    const p = new URLSearchParams(params.toString());
    if (c === 'all') p.delete('channel');
    else p.set('channel', c);
    router.push(`${path}?${p.toString()}`);
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-semibold">საუბრების დინამიკა</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            სულ {total.toLocaleString('ka-GE')} · საშუალოდ {avg}/დღე
          </p>
        </div>
        <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5 overflow-x-auto">
          {CHANNELS.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => setChannel(c.key)}
              className={`px-2.5 py-1 text-[11px] rounded-md whitespace-nowrap transition-colors ${
                (channel ?? 'all') === c.key
                  ? 'bg-violet-500/90 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <EmptyChart />
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            className="w-full h-56"
            onMouseLeave={() => setHover(null)}
          >
            {/* Y gridlines */}
            {gridY.map((y, i) => (
              <line
                key={i}
                x1={PADDING.left}
                x2={VIEW_W - PADDING.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />
            ))}
            {/* Y labels */}
            {ticksY.map((t, i) => (
              <text
                key={i}
                x={PADDING.left - 6}
                y={t.y}
                fontSize={10}
                textAnchor="end"
                fill="rgba(255,255,255,0.35)"
                dominantBaseline="middle"
              >
                {t.label}
              </text>
            ))}
            {/* Area fill */}
            <path d={areaPath} fill="url(#convoGradient)" />
            {/* Line */}
            <path d={linePath} fill="none" stroke="#a78bfa" strokeWidth={2} strokeLinejoin="round" />
            {/* Hover dots */}
            {points.map((p, i) => {
              const cx = scaleX(i, points.length);
              const cy = scaleY(p.count, maxY);
              return (
                <circle
                  key={p.day}
                  cx={cx}
                  cy={cy}
                  r={hover?.p.day === p.day ? 4 : 2}
                  fill="#a78bfa"
                  className="cursor-pointer"
                  onMouseEnter={() => setHover({ x: cx, y: cy, p })}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}
            {/* X labels — every N-th to avoid crowding */}
            {xLabels(points).map(({ idx, label }) => {
              const x = scaleX(idx, points.length);
              return (
                <text
                  key={idx}
                  x={x}
                  y={VIEW_H - 6}
                  fontSize={10}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.35)"
                >
                  {label}
                </text>
              );
            })}
            <defs>
              <linearGradient id="convoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#a78bfa" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          {hover && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none bg-[#0d0d1a] border border-white/10 rounded-md px-2 py-1 text-[11px] text-white whitespace-nowrap"
              style={{ left: `${(hover.x / VIEW_W) * 100}%`, top: `${(hover.y / VIEW_H) * 100}%` }}
            >
              <div className="text-gray-400">{formatDayLabel(hover.p.day)}</div>
              <div className="font-medium">{hover.p.count} საუბარი</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-56 flex flex-col items-center justify-center text-gray-500">
      <div className="text-xs">მონაცემები ჯერ არ არის</div>
      <div className="text-[10px] mt-1 text-gray-600">
        გადააქცი ბოტი აქტიურად და დაელოდე პირველ საუბრებს
      </div>
    </div>
  );
}

// ─── geometry helpers ─────────────────────────────────────────────────────

function scaleX(i: number, total: number): number {
  if (total <= 1) return (VIEW_W - PADDING.left - PADDING.right) / 2 + PADDING.left;
  const span = VIEW_W - PADDING.left - PADDING.right;
  return PADDING.left + (i / (total - 1)) * span;
}

function scaleY(v: number, max: number): number {
  if (max <= 0) return VIEW_H - PADDING.bottom;
  const span = VIEW_H - PADDING.top - PADDING.bottom;
  return VIEW_H - PADDING.bottom - (v / max) * span;
}

interface BuiltPaths {
  path:    string;
  areaPath: string;
  maxY:    number;
  ticksY:  { y: number; label: string }[];
  gridY:   number[];
}

function buildPaths(points: DayPoint[]): BuiltPaths {
  if (points.length === 0) {
    return { path: '', areaPath: '', maxY: 0, ticksY: [], gridY: [] };
  }
  const max  = Math.max(...points.map(p => p.count), 1);
  // Round max up to a "nice" number for the y-axis (1, 2, 5, 10, 20, 50, ...)
  const nice = niceCeil(max);

  const cmds: string[] = [];
  points.forEach((p, i) => {
    const x = scaleX(i, points.length);
    const y = scaleY(p.count, nice);
    cmds.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  });
  const linePath = cmds.join(' ');

  // Close the area to the baseline
  const x0 = scaleX(0, points.length);
  const xN = scaleX(points.length - 1, points.length);
  const yBase = scaleY(0, nice);
  const areaPath = `${linePath} L ${xN.toFixed(1)} ${yBase.toFixed(1)} L ${x0.toFixed(1)} ${yBase.toFixed(1)} Z`;

  const ticksY: { y: number; label: string }[] = [];
  const gridY:  number[] = [];
  for (let i = 0; i <= 4; i++) {
    const v = (nice / 4) * i;
    const y = scaleY(v, nice);
    ticksY.push({ y, label: String(Math.round(v)) });
    gridY.push(y);
  }
  return { path: linePath, areaPath, maxY: nice, ticksY, gridY };
}

function niceCeil(n: number): number {
  if (n <= 5)   return 5;
  if (n <= 10)  return 10;
  if (n <= 20)  return 20;
  if (n <= 50)  return 50;
  if (n <= 100) return 100;
  // Round up to nearest power-of-10 step
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / pow) * pow;
}

function xLabels(points: DayPoint[]): { idx: number; label: string }[] {
  if (points.length === 0) return [];
  // Show ~5 labels max, evenly spaced.
  const target = 5;
  const step   = Math.max(1, Math.ceil(points.length / target));
  const out: { idx: number; label: string }[] = [];
  for (let i = 0; i < points.length; i += step) {
    out.push({ idx: i, label: shortDay(points[i].day) });
  }
  // Always include the last day so the right edge is labeled
  if (out[out.length - 1]?.idx !== points.length - 1) {
    out.push({ idx: points.length - 1, label: shortDay(points[points.length - 1].day) });
  }
  return out;
}

function shortDay(iso: string): string {
  // "2026-05-20" → "20/05"
  const [y, m, d] = iso.split('-');
  void y;
  return `${d}/${m}`;
}

function formatDayLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' });
  } catch { return iso; }
}
