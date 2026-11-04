import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cx } from "../utils/cx";

export type ToastTone = "info" | "success" | "danger";

export type ToastOptions = {
  title: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  /** ms; 0 = blijft staan tot gesloten. Standaard 5000 (danger: 8000). */
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastItem = ToastOptions & { id: number };

type ToastApi = {
  toast: (opts: ToastOptions) => number;
  dismiss: (id: number) => void;
};

const Ctx = createContext<ToastApi | null>(null);

/** toast({ title, tone }) — moet binnen <ToastProvider> worden aangeroepen. */
export function useToast(): ToastApi {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast() moet binnen <ToastProvider> staan.");
  return c;
}

let nextId = 1;

/**
 * Houdt toasts bij en tekent ze rechtsonder (desktop) of boven (mobiel).
 * De viewport staat binnen de provider in de DOM, dus toasts erven data-mode.
 */
export function ToastProvider({ children, max = 3 }: { children: ReactNode; max?: number }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = nextId++;
      setItems((list) => [...list, { ...opts, id }].slice(-max));
      return id;
    },
    [max],
  );

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        className={cx(
          "pointer-events-none fixed z-50 flex flex-col gap-s-2",
          "inset-x-s-4 top-[max(var(--s-4),env(safe-area-inset-top))]",
          "md:inset-x-auto md:bottom-s-5 md:right-s-5 md:top-auto md:w-[24rem] md:flex-col-reverse",
        )}
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
      {/* Aparte live-regio's: beleefd voor info/succes, direct voor fouten */}
    </Ctx.Provider>
  );
}

const icons: Record<ToastTone, ReactNode> = {
  info: <Info aria-hidden />,
  success: <CircleCheck aria-hidden />,
  danger: <CircleAlert aria-hidden />,
};

const toneText: Record<ToastTone, string> = {
  info: "text-info",
  success: "text-success",
  danger: "text-danger",
};

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const tone = item.tone ?? "info";
  const duration = item.duration ?? (tone === "danger" ? 8000 : 5000);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!duration || paused) return;
    startedAt.current = Date.now();
    const t = setTimeout(onDismiss, remaining.current);
    return () => {
      clearTimeout(t);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [duration, paused, onDismiss]);

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      aria-live={tone === "danger" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cx(
        "pointer-events-auto flex items-start gap-s-3 rounded-md border border-line bg-surface p-s-4 shadow-2",
        "animate-toast-in-top md:animate-toast-in motion-reduce:animate-fade-in md:motion-reduce:animate-fade-in",
      )}
    >
      <span className={cx("mt-px shrink-0 [&_svg]:size-icon-ui", toneText[tone])}>{icons[tone]}</span>
      <div className="grid min-w-0 flex-1 gap-s-1">
        <p className="text-small font-medium text-ink">{item.title}</p>
        {item.description && <p className="text-small text-muted">{item.description}</p>}
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action!.onClick();
              onDismiss();
            }}
            className="mt-s-1 justify-self-start rounded-sm text-small font-medium text-ink underline decoration-line underline-offset-4 transition-colors duration-fast hover:decoration-current"
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Melding sluiten"
        className="-m-s-1 flex size-control-sm shrink-0 items-center justify-center rounded-sm text-faint transition-colors duration-fast hover:text-ink [&_svg]:size-[calc(var(--icon-ui)*0.8)]"
      >
        <X aria-hidden />
      </button>
    </div>
  );
}
