import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { cx } from "../utils/cx";

export type Command = {
  id: string;
  label: string;
  /** Groepskop, bijv. "Navigatie" of "Acties". */
  group?: string;
  icon?: ReactNode;
  /** Sneltoets ter info, bijv. "G V". */
  shortcut?: string;
  /** Extra zoekwoorden. */
  keywords?: string[];
  /** Korte uitleg rechts of onder het label. */
  hint?: string;
  onRun: () => void;
};

export type CommandBarProps = {
  commands: Command[];
  /** Gecontroleerd openen/sluiten; laat weg voor intern beheer. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  /** ⌘K / Ctrl+K (standaard aan). */
  hotkey?: boolean;
  /** Swipe omlaag vanaf de bovenkant op touch (standaard aan). */
  swipe?: boolean;
  /**
   * Vrije vraag als geen commando past (later: Jarvis). Toont dan een regel
   * "Vraag: …" die bij Enter deze functie aanroept.
   */
  onQuery?: (query: string) => void;
  queryLabel?: string;
  emptyText?: string;
};

/** Eenvoudige score: prefix > woordbegin > bevat > losse letters op volgorde. */
function score(cmd: Command, q: string) {
  if (!q) return 1;
  const hay = [cmd.label, cmd.group ?? "", ...(cmd.keywords ?? [])].join(" ").toLowerCase();
  const label = cmd.label.toLowerCase();
  if (label.startsWith(q)) return 100;
  if (label.split(/\s+/).some((w) => w.startsWith(q))) return 80;
  if (hay.includes(q)) return 60;
  let i = 0;
  for (const ch of hay) if (ch === q[i]) i++;
  return i === q.length ? 20 : 0;
}

/**
 * ⌘K / swipe-down zoek- en actiebalk (§4). Zelfde look in alle tools.
 */
export function CommandBar({
  commands,
  open: openProp,
  onOpenChange,
  placeholder = "Zoek of typ een opdracht",
  hotkey = true,
  swipe = true,
  onQuery,
  queryLabel = "Vraag",
  emptyText = "Niets gevonden.",
}: CommandBarProps) {
  const [inner, setInner] = useState(false);
  const open = openProp ?? inner;
  const setOpen = useCallback(
    (v: boolean) => {
      if (openProp === undefined) setInner(v);
      onOpenChange?.(v);
    },
    [openProp, onOpenChange],
  );

  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  /* --- openen/sluiten --- */
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      setQuery("");
      setActive(0);
      el.showModal();
      requestAnimationFrame(() => input.current?.focus());
    } else if (!open && el.open) el.close();
  }, [open]);

  /* --- ⌘K / Ctrl+K --- */
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, open, setOpen]);

  /* --- swipe omlaag bovenaan de pagina --- */
  useEffect(() => {
    if (!swipe) return;
    let start: { x: number; y: number } | null = null;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = window.scrollY <= 0 && e.touches.length === 1 && t.clientY < window.innerHeight / 3 ? { x: t.clientX, y: t.clientY } : null;
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0];
      const dy = t.clientY - start.y;
      const dx = Math.abs(t.clientX - start.x);
      if (dy > 72 && dx < dy / 2) {
        start = null;
        setOpen(true);
      }
    };
    const onEnd = () => (start = null);
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [swipe, setOpen]);

  /* --- filteren en groeperen --- */
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    const scored = commands
      .map((c, i) => ({ c, s: score(c, q), i }))
      .filter((r) => r.s > 0)
      .sort((a, b) => (q ? b.s - a.s || a.i - b.i : a.i - b.i))
      .map((r) => r.c);
    if (q) return scored; // bij zoeken: op relevantie, zonder groepen
    const groups = new Map<string, Command[]>();
    for (const c of scored) {
      const g = c.group ?? "";
      groups.set(g, [...(groups.get(g) ?? []), c]);
    }
    return [...groups.values()].flat();
  }, [commands, q]);

  const showQuery = !!onQuery && q.length > 0;
  const total = results.length + (showQuery ? 1 : 0);

  useEffect(() => setActive(0), [q]);

  // actieve optie in beeld houden
  useEffect(() => {
    list.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (index: number) => {
    if (index < results.length) {
      setOpen(false);
      results[index].onRun();
    } else if (showQuery) {
      setOpen(false);
      onQuery!(query.trim());
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (total ? (a + 1) % total : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (total ? (a - 1 + total) % total : 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(Math.max(0, total - 1));
    } else if (e.key === "Enter" && total) {
      e.preventDefault();
      run(active);
    }
  };

  const optionId = (i: number) => `${id}-opt-${i}`;
  let lastGroup: string | undefined;

  return (
    <dialog
      ref={dialog}
      aria-label="Opdrachten"
      onClose={() => open && setOpen(false)}
      onCancel={(e) => {
        e.preventDefault();
        setOpen(false);
      }}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      className={cx(
        "m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-ink",
        "backdrop:bg-backdrop backdrop:backdrop-blur backdrop:animate-fade-in",
        "open:flex flex-col items-center px-s-3 pt-[max(var(--s-3),env(safe-area-inset-top))] md:px-s-4 md:pt-[15vh]",
      )}
    >
      <div
        className={cx(
          "flex max-h-[70dvh] w-full max-w-[40rem] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-2",
          "animate-toast-in-top motion-reduce:animate-fade-in",
        )}
      >
        <div className="flex items-center gap-s-3 border-b border-line px-s-4 [&_svg]:size-icon-ui">
          <Search aria-hidden className="shrink-0 text-faint" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-expanded
            aria-controls={`${id}-list`}
            aria-activedescendant={total ? optionId(active) : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            className="h-control-lg min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-faint"
          />
          <kbd className="hidden shrink-0 rounded-sm border border-line px-s-1 font-mono text-mono text-faint md:inline">
            esc
          </kbd>
        </div>

        <div ref={list} id={`${id}-list`} role="listbox" aria-label="Resultaten" className="overflow-y-auto p-s-2">
          {results.map((c, i) => {
            const heading = !q && c.group && c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <div key={c.id}>
                {heading && (
                  <p role="presentation" className="px-s-3 pb-s-1 pt-s-3 text-label uppercase text-faint first:pt-s-1">
                    {heading}
                  </p>
                )}
                <div
                  id={optionId(i)}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(i)}
                  className={cx(
                    "flex min-h-hit cursor-pointer items-center gap-s-3 rounded-md px-s-3 md:min-h-control-md",
                    "[&_svg]:size-icon-ui [&_svg]:shrink-0",
                    i === active ? "bg-surface-2 text-ink" : "text-muted",
                  )}
                >
                  {c.icon && <span className={i === active ? "text-ink" : "text-faint"}>{c.icon}</span>}
                  <span className="min-w-0 flex-1 truncate text-small font-medium">{c.label}</span>
                  {c.hint && <span className="hidden truncate text-small text-faint sm:inline">{c.hint}</span>}
                  {c.shortcut && (
                    <kbd className="hidden shrink-0 font-mono text-mono text-faint md:inline">{c.shortcut}</kbd>
                  )}
                </div>
              </div>
            );
          })}

          {showQuery && (
            <div
              id={optionId(results.length)}
              data-index={results.length}
              role="option"
              aria-selected={active === results.length}
              onMouseMove={() => setActive(results.length)}
              onClick={() => run(results.length)}
              className={cx(
                "mt-s-1 flex min-h-hit cursor-pointer items-center gap-s-3 rounded-md border-t border-line px-s-3 md:min-h-control-md",
                active === results.length ? "bg-surface-2 text-ink" : "text-muted",
              )}
            >
              <span className="text-label uppercase text-faint">{queryLabel}</span>
              <span className="min-w-0 flex-1 truncate text-small">{query.trim()}</span>
              <CornerDownLeft aria-hidden className="size-s-4 text-faint" />
            </div>
          )}

          {total === 0 && <p className="px-s-3 py-s-5 text-center text-small text-faint">{emptyText}</p>}
        </div>

        <div className="hidden items-center gap-s-4 border-t border-line px-s-4 py-s-2 font-mono text-mono text-faint md:flex">
          <span>↑↓ kiezen</span>
          <span>↵ uitvoeren</span>
          <span>⌘K sluiten</span>
        </div>
      </div>
    </dialog>
  );
}
