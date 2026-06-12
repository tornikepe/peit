'use client';

// Homepage auth modal (replyory-style): the sign-in / sign-up forms open in a
// centered card over a blurred page — no separate auth pages. Any component
// can call useAuthModal().open('signin' | 'signup').

import { createContext, useCallback, useContext, useEffect, useState, Suspense, type ReactNode } from 'react';
import { X } from 'lucide-react';
import Logo from '@/components/Logo';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

type Mode = 'signin' | 'signup';

const AuthModalContext = createContext<{
  open: (mode: Mode) => void;
  close: () => void;
}>({ open: () => {}, close: () => {} });

export function useAuthModal() {
  return useContext(AuthModalContext);
}

export default function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);

  const open  = useCallback((m: Mode) => setMode(m), []);
  const close = useCallback(() => setMode(null), []);

  // Esc closes the modal.
  useEffect(() => {
    if (!mode) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [mode, close]);

  return (
    <AuthModalContext.Provider value={{ open, close }}>
      {children}

      {mode && (
        <div
          className="fixed inset-0 z-[95] flex items-start sm:items-center justify-center overflow-y-auto px-4 py-8"
          role="dialog"
          aria-modal="true"
        >
          {/* Blurred scrim over the page — replyory-style. */}
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-md"
            onClick={close}
            aria-hidden
          />

          <div className="relative w-full max-w-[420px] my-auto">
            <div className="rounded-2xl border border-white/[0.1] bg-[#0d0d1a]/95 backdrop-blur-xl shadow-2xl shadow-black/60 p-7 sm:p-8">
              <button
                type="button"
                onClick={close}
                aria-label="close"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex justify-center mb-6">
                <Logo size="md" href={null} />
              </div>

              {/* SignUpForm reads ?plan from the URL → needs Suspense. */}
              <Suspense fallback={null}>
                {mode === 'signin'
                  ? <SignInForm onSwitch={() => setMode('signup')} onDone={close} />
                  : <SignUpForm onSwitch={() => setMode('signin')} onDone={close} />}
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}
