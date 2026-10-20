import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'pop' | 'celebrate';

interface ConfirmOptions {
  title: string;
  message?: string;
  ok: string;
  danger?: boolean;
}

interface FeedbackApi {
  toast: (message: string, kind?: ToastKind) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const api = useContext(FeedbackContext);
  if (!api) throw new Error('FeedbackProvider がありません');
  return api;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; kind: ToastKind } | null>(null);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const timer = useRef<number>();

  const showToast = useCallback((message: string, kind: ToastKind = 'pop') => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind });
    timer.current = window.setTimeout(() => setToast(null), kind === 'celebrate' ? 3200 : 2200);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    dialog?.resolve(ok);
    setDialog(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast: showToast, confirm }}>
      {children}
      {toast && (
        <div key={toast.id} className={`toast toast-${toast.kind}`} role="status">
          {toast.kind === 'celebrate' && (
            <div className="hearts" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} style={{ left: `${8 + i * 12}%`, animationDelay: `${(i % 4) * 0.12}s` }}>
                  ♥
                </span>
              ))}
            </div>
          )}
          {toast.message}
        </div>
      )}
      {dialog && (
        <div className="backdrop" onClick={() => close(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={dialog.title} onClick={(e) => e.stopPropagation()}>
            <h2>{dialog.title}</h2>
            {dialog.message && <p className="muted">{dialog.message}</p>}
            <div className="sheet-actions">
              <button className="btn btn-ghost" onClick={() => close(false)}>
                やめる
              </button>
              <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>
                {dialog.ok}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
