'use client';

// Client wrapper for the dashboard chrome — owns the mobile-drawer open-state
// and the dark/light theme. The theme is applied as `data-theme` on the
// `.dash-root` element; a scoped override sheet in globals.css repaints the
// dashboard's surfaces/text for light mode (search "Dashboard LIGHT theme").

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export type DashTheme = 'dark' | 'light';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<DashTheme>('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('peit-dash-theme');
      // Intentional: read persisted theme after mount (no SSR localStorage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch { /* no-op */ }
  }, []);

  const toggleTheme = () =>
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('peit-dash-theme', next); } catch { /* no-op */ }
      return next;
    });

  return (
    <div className="dash-root min-h-screen bg-[#07070f] flex" data-theme={theme}>
      {/* Ambient background — two soft radial glows + a faint dot grid so the
          canvas isn't flat black. Fixed and pointer-transparent; the sidebar
          and content column are `relative` so they paint above it. Light
          theme swaps the colors via globals.css (.dash-ambient override). */}
      <div className="dash-ambient" aria-hidden />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="relative flex-1 min-w-0 flex flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
