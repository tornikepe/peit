'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Bot } from '@/lib/bots';
import { loadBots, saveBots } from '@/lib/bots';

interface BotsContextValue {
  bots: Bot[];
  loaded: boolean;
  getBot: (id: string) => Bot | undefined;
  addBot: (bot: Bot) => void;
  updateBot: (id: string, patch: Partial<Bot>) => void;
  deleteBot: (id: string) => void;
}

const BotsContext = createContext<BotsContextValue | null>(null);

export function BotsProvider({ children }: { children: React.ReactNode }) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBots(loadBots());
    setLoaded(true);
  }, []);

  // Persist on change (after initial load)
  useEffect(() => {
    if (loaded) saveBots(bots);
  }, [bots, loaded]);

  const getBot = useCallback(
    (id: string) => bots.find(b => b.id === id),
    [bots]
  );

  const addBot = useCallback((bot: Bot) => {
    setBots(prev => [bot, ...prev]);
  }, []);

  const updateBot = useCallback((id: string, patch: Partial<Bot>) => {
    setBots(prev =>
      prev.map(b =>
        b.id === id
          ? { ...b, ...patch, updatedAt: new Date().toISOString() }
          : b
      )
    );
  }, []);

  const deleteBot = useCallback((id: string) => {
    setBots(prev => prev.filter(b => b.id !== id));
  }, []);

  return (
    <BotsContext.Provider value={{ bots, loaded, getBot, addBot, updateBot, deleteBot }}>
      {children}
    </BotsContext.Provider>
  );
}

export function useBots() {
  const ctx = useContext(BotsContext);
  if (!ctx) throw new Error('useBots must be inside BotsProvider');
  return ctx;
}
