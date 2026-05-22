'use client';

/**
 * PR-N2: lightweight toast notification system for the review canvas.
 *
 * Why custom instead of react-toastify / sonner: no new dependency,
 * design system controlled, tightly integrated with our action keys
 * (so a "Diagnosing X…" progress toast can be replaced by the same-keyed
 * success toast, not stacked).
 *
 * Architecture:
 *   <ToastProvider>...</ToastProvider>       // mount at canvas root
 *     const toast = useToast();
 *     toast.success('Marked X intentional');
 *     toast.progress('diagnose:X', 'Diagnosing X…');  // replaceable by key
 *     toast.success('Diagnosed X', { key: 'diagnose:X', action: {...} });
 *
 * Rules:
 *   - Max 3 visible (oldest auto-drops)
 *   - Auto-dismiss 5s default; -1 = sticky
 *   - Hover OR focus pauses timer
 *   - Same `key` replaces existing toast (no stacking)
 *   - Optional action button (label + onClick)
 *   - Click toast body to dismiss
 *   - Bottom-right position, z-[10000] (above QaFixModal's 9999)
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'progress' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
  testid?: string;
}

export interface ToastOptions {
  /** Replaces existing toast with the same key (no stacking). */
  key?: string;
  /** ms to auto-dismiss. -1 = sticky. Default 5000. */
  duration?: number;
  /** Optional next-step action button. */
  action?: ToastAction;
  /** For e2e — overrides the default per-variant testid. */
  testid?: string;
}

interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  key?: string;
  duration: number;
  action?: ToastAction;
  testid?: string;
  createdAt: number;
}

interface ToastApi {
  success: (msg: string, opts?: ToastOptions) => void;
  progress: (key: string, msg: string, opts?: Omit<ToastOptions, 'key' | 'duration'>) => void;
  warning: (msg: string, opts?: ToastOptions) => void;
  error: (msg: string, opts?: ToastOptions) => void;
  dismiss: (id: string) => void;
  dismissByKey: (key: string) => void;
  clear: () => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const MAX_VISIBLE = 3;
const DEFAULT_DURATION_MS = 5000;
const STICKY = -1;

let _idCounter = 0;
function nextId() {
  _idCounter += 1;
  return `toast-${Date.now()}-${_idCounter}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pausedRef = useRef<Set<string>>(new Set());

  const startTimer = useCallback((toast: Toast) => {
    if (toast.duration === STICKY) return;
    // Clear existing if any (replace)
    const existing = timersRef.current.get(toast.id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      timersRef.current.delete(toast.id);
    }, toast.duration);
    timersRef.current.set(toast.id, timer);
  }, []);

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) { clearTimeout(t); timersRef.current.delete(id); }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissByKey = useCallback((key: string) => {
    setToasts((prev) => {
      const toRemove = prev.filter((t) => t.key === key);
      for (const t of toRemove) {
        const timer = timersRef.current.get(t.id);
        if (timer) { clearTimeout(timer); timersRef.current.delete(t.id); }
      }
      return prev.filter((t) => t.key !== key);
    });
  }, []);

  const clear = useCallback(() => {
    for (const [, t] of timersRef.current) clearTimeout(t);
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const push = useCallback((variant: ToastVariant, message: string, opts?: ToastOptions) => {
    const id = nextId();
    const duration = opts?.duration ?? DEFAULT_DURATION_MS;
    const toast: Toast = {
      id,
      variant,
      message,
      key: opts?.key,
      duration,
      action: opts?.action,
      testid: opts?.testid,
      createdAt: Date.now(),
    };
    setToasts((prev) => {
      // Drop any existing toast with the same key (replace semantics)
      let next = opts?.key ? prev.filter((t) => t.key !== opts.key) : prev;
      // Cap at MAX_VISIBLE — oldest drops
      if (next.length >= MAX_VISIBLE) next = next.slice(next.length - (MAX_VISIBLE - 1));
      // Clear any timers we're dropping (manual diff for browser compat)
      const keepIds = new Set(next.map((t) => t.id));
      for (const t of prev) {
        if (!keepIds.has(t.id)) {
          const tm = timersRef.current.get(t.id);
          if (tm) { clearTimeout(tm); timersRef.current.delete(t.id); }
        }
      }
      return [...next, toast];
    });
    if (duration !== STICKY) startTimer(toast);
  }, [startTimer]);

  const api = useMemo<ToastApi>(() => ({
    success: (msg, opts) => push('success', msg, opts),
    progress: (key, msg, opts) => push('progress', msg, { ...opts, key, duration: STICKY }),
    warning: (msg, opts) => push('warning', msg, opts),
    error: (msg, opts) => push('error', msg, { duration: STICKY, ...opts }),
    dismiss, dismissByKey, clear,
  }), [push, dismiss, dismissByKey, clear]);

  // Pause/resume on hover/focus
  const pauseToast = useCallback((id: string) => {
    pausedRef.current.add(id);
    const t = timersRef.current.get(id);
    if (t) { clearTimeout(t); timersRef.current.delete(id); }
  }, []);
  const resumeToast = useCallback((id: string) => {
    pausedRef.current.delete(id);
    const t = toasts.find((x) => x.id === id);
    if (t && t.duration !== STICKY) startTimer(t);
  }, [toasts, startTimer]);

  // Cleanup on unmount
  useEffect(() => () => {
    for (const [, t] of timersRef.current) clearTimeout(t);
    timersRef.current.clear();
  }, []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} onPause={pauseToast} onResume={resumeToast} />
    </ToastCtx.Provider>
  );
}

function variantStyles(v: ToastVariant): { container: string; icon: string } {
  switch (v) {
    case 'success': return {
      container: 'border-emerald-500/40 bg-emerald-950/95 text-emerald-100',
      icon: '✅',
    };
    case 'progress': return {
      container: 'border-cyan-500/40 bg-cyan-950/95 text-cyan-100',
      icon: '⏳',
    };
    case 'warning': return {
      container: 'border-amber-500/40 bg-amber-950/95 text-amber-100',
      icon: '⚠️',
    };
    case 'error': return {
      container: 'border-red-500/40 bg-red-950/95 text-red-100',
      icon: '❌',
    };
  }
}

function ToastViewport({
  toasts, onDismiss, onPause, onResume,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none"
      data-testid="toast-viewport"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const styles = variantStyles(t.variant);
        return (
          <div
            key={t.id}
            data-testid={t.testid ?? `toast-${t.variant}`}
            data-toast-key={t.key ?? ''}
            className={`pointer-events-auto max-w-[360px] rounded-lg border px-3 py-2.5 shadow-2xl ${styles.container}`}
            onMouseEnter={() => onPause(t.id)}
            onMouseLeave={() => onResume(t.id)}
            onFocus={() => onPause(t.id)}
            onBlur={() => onResume(t.id)}
            tabIndex={0}
          >
            <div className="flex items-start gap-2">
              <span className="text-[14px] leading-none mt-0.5 flex-shrink-0" aria-hidden>
                {t.variant === 'progress' ? (
                  <span className="inline-block w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : styles.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] leading-snug">{t.message}</div>
                {t.action && (
                  <button
                    type="button"
                    onClick={() => { t.action!.onClick(); onDismiss(t.id); }}
                    data-testid={t.action.testid ?? `toast-action-${t.variant}`}
                    className="mt-2 text-[11px] font-semibold underline decoration-dotted underline-offset-2 hover:opacity-80"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="text-[14px] leading-none opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
                aria-label="Dismiss"
              >×</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
