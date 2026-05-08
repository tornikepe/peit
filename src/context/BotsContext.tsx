'use client';

import {
  createContext, useContext, useEffect, useState, useCallback, useRef,
} from 'react';
import type { Bot } from '@/lib/bots';
import { loadBots, saveBots } from '@/lib/bots';
import {
  fetchMe, apiListBots, apiCreateBot, apiUpdateBot, apiDeleteBot,
  apiMigrateBots, ApiError,
} from '@/lib/api-client';

export type StorageMode = 'cloud' | 'local' | 'unknown';

interface BotsContextValue {
  bots: Bot[];
  loaded: boolean;
  mode: StorageMode;
  /** True when cloud is reachable AND localStorage still has unmigrated bots. */
  hasLocalToMigrate: boolean;
  migrating: boolean;
  refresh: () => Promise<void>;
  migrateLocalToCloud: () => Promise<{ imported: number; failed: number }>;
  getBot: (id: string) => Bot | undefined;
  addBot: (bot: Bot) => Promise<Bot>;
  updateBot: (id: string, patch: Partial<Bot>) => Promise<void>;
  deleteBot: (id: string) => Promise<void>;
}

const BotsContext = createContext<BotsContextValue | null>(null);

export function BotsProvider({ children }: { children: React.ReactNode }) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<StorageMode>('unknown');
  const [hasLocalToMigrate, setHasLocalToMigrate] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // Persist to localStorage whenever bots change in local mode
  const isLocalMode = useRef(false);
  isLocalMode.current = mode === 'local';
  useEffect(() => {
    if (loaded && isLocalMode.current) saveBots(bots);
  }, [bots, loaded]);

  // ── Init ──────────────────────────────────────────────────────────────────

  const detectAndLoad = useCallback(async () => {
    // Try cloud first
    try {
      const me = await fetchMe();
      if (me) {
        const cloudBots = await apiListBots();
        setBots(cloudBots);
        setMode('cloud');

        // Check if there are still unmigrated localStorage bots
        const local = loadBots();
        setHasLocalToMigrate(local.length > 0);

        setLoaded(true);
        return;
      }
    } catch (e) {
      // 503 = DB not configured, 401 = not signed in
      if (!(e instanceof ApiError) || (e.status !== 503 && e.status !== 401)) {
        console.error('[bots] cloud fetch failed:', e);
      }
    }

    // Fallback to localStorage
    setBots(loadBots());
    setMode('local');
    setHasLocalToMigrate(false);
    setLoaded(true);
  }, []);

  useEffect(() => { void detectAndLoad(); }, [detectAndLoad]);

  // ── Migration ────────────────────────────────────────────────────────────

  const migrateLocalToCloud = useCallback(async () => {
    setMigrating(true);
    try {
      const local = loadBots();
      if (local.length === 0) {
        setHasLocalToMigrate(false);
        return { imported: 0, failed: 0 };
      }
      const { imported, failed } = await apiMigrateBots(local);

      // On success: clear localStorage so we don't double-import
      if (failed.length === 0) {
        saveBots([]);
        setHasLocalToMigrate(false);
      }

      // Reload from cloud
      const cloudBots = await apiListBots();
      setBots(cloudBots);

      return { imported: imported.length, failed: failed.length };
    } finally {
      setMigrating(false);
    }
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (mode === 'cloud') {
      try {
        const cloudBots = await apiListBots();
        setBots(cloudBots);
      } catch (e) {
        console.error('[bots] refresh failed:', e);
      }
    } else {
      setBots(loadBots());
    }
  }, [mode]);

  const getBot = useCallback(
    (id: string) => bots.find(b => b.id === id),
    [bots],
  );

  const addBot = useCallback(async (bot: Bot): Promise<Bot> => {
    if (mode === 'cloud') {
      const { id: _id, createdAt: _c, updatedAt: _u, stats: _s, ...input } = bot;
      const created = await apiCreateBot(input);
      setBots(prev => [created, ...prev]);
      return created;
    }
    setBots(prev => [bot, ...prev]);
    return bot;
  }, [mode]);

  const updateBot = useCallback(async (id: string, patch: Partial<Bot>): Promise<void> => {
    if (mode === 'cloud') {
      try {
        const updated = await apiUpdateBot(id, patch);
        setBots(prev => prev.map(b => b.id === id ? updated : b));
      } catch (e) {
        // 404 → bot vanished server-side; re-sync silently and continue.
        if (e instanceof ApiError && e.status === 404) {
          console.warn('[bots] PATCH returned 404, re-syncing list', id);
          try { setBots(await apiListBots()); } catch { /* ignore */ }
          return;
        }
        throw e;
      }
      return;
    }
    setBots(prev =>
      prev.map(b =>
        b.id === id
          ? { ...b, ...patch, updatedAt: new Date().toISOString() }
          : b,
      ),
    );
  }, [mode]);

  const deleteBot = useCallback(async (id: string): Promise<void> => {
    if (mode === 'cloud') {
      try {
        await apiDeleteBot(id);
      } catch (e) {
        // 404 → bot is already gone server-side; just drop it from local state
        // and refresh to re-sync. Don't bubble the error since the desired
        // outcome (bot is gone) is achieved either way.
        if (e instanceof ApiError && e.status === 404) {
          console.warn('[bots] DELETE returned 404, removing from local state', id);
          setBots(prev => prev.filter(b => b.id !== id));
          try { setBots(await apiListBots()); } catch { /* ignore */ }
          return;
        }
        throw e;
      }
      setBots(prev => prev.filter(b => b.id !== id));
      return;
    }
    setBots(prev => prev.filter(b => b.id !== id));
  }, [mode]);

  return (
    <BotsContext.Provider value={{
      bots, loaded, mode, hasLocalToMigrate, migrating,
      refresh, migrateLocalToCloud,
      getBot, addBot, updateBot, deleteBot,
    }}>
      {children}
    </BotsContext.Provider>
  );
}

export function useBots() {
  const ctx = useContext(BotsContext);
  if (!ctx) throw new Error('useBots must be inside BotsProvider');
  return ctx;
}
