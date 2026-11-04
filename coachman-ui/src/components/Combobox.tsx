import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cx } from "../utils/cx";
import { Field, describedBy, fieldBox } from "./Field";

export type ComboboxOption = { value: string; label: string; hint?: string; disabled?: boolean };

export type ComboboxProps = {
  options: ComboboxOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  emptyText?: string;
  /** Wissen-knop als er een waarde is (standaard aan). */
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
};

/** Enkelvoudige keuze met zoeken (§3). Toetsenbord: ↑↓, Enter, Esc. */
export function Combobox({
  options,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  label,
  hint,
  error,
  placeholder = "Zoek of kies",
  emptyText = "Niets gevonden.",
  clearable = true,
  disabled,
  id,
  name,
  className,
}: ComboboxProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const listId = `${fieldId}-list`;
  const [inner, setInner] = useState<string | null>(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const selected = options.find((o) => o.value === value) ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options
      .filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => Number(!a.label.toLowerCase().startsWith(q)) - Number(!b.label.toLowerCase().startsWith(q)));
  }, [options, query]);

  const choose = (v: string | null) => {
    if (valueProp === undefined) setInner(v);
    onValueChange?.(v);
    setOpen(false);
    setQuery("");
  };

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    const i = results.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
  };

  // Sluiten bij klik buiten
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const move = (delta: number) => {
    if (!results.length) return;
    let i = active;
    for (let n = 0; n < results.length; n++) {
      i = (i + delta + results.length) % results.length;
      if (!results[i].disabled) break;
    }
    setActive(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openList();
      else move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openList();
      else move(-1);
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      const o = results[active];
      if (o && !o.disabled) choose(o.value);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    } else if (e.key === "Tab") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} className={className}>
      <div ref={wrap} className="relative">
        <div className={cx(fieldBox(error, disabled), "flex min-h-hit items-center gap-s-1 pl-s-3 pr-s-1 md:min-h-control-md")}>
          <input
            ref={input}
            id={fieldId}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(fieldId, hint, error)}
            autoComplete="off"
            disabled={disabled}
            value={open ? query : (selected?.label ?? "")}
            placeholder={open && selected ? selected.label : placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              if (!open) setOpen(true);
            }}
            onFocus={openList}
            onClick={openList}
            onKeyDown={onKeyDown}
            className="w-full min-w-0 flex-1 self-stretch bg-transparent text-body text-ink outline-none placeholder:text-faint"
          />
          {clearable && selected && !disabled && (
            <button
              type="button"
              aria-label="Wissen"
              onClick={() => {
                choose(null);
                input.current?.focus();
              }}
              className="flex size-control-sm shrink-0 items-center justify-center rounded-sm text-faint transition-colors duration-fast hover:text-ink [&_svg]:size-s-4"
            >
              <X aria-hidden />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-label={open ? "Lijst sluiten" : "Lijst openen"}
            onClick={() => (open ? setOpen(false) : (input.current?.focus(), openList()))}
            className="flex size-control-sm shrink-0 items-center justify-center rounded-sm text-faint [&_svg]:size-[calc(var(--icon-ui)*0.85)]"
          >
            <ChevronDown aria-hidden className={cx("transition-transform duration-fast", open && "rotate-180")} />
          </button>
        </div>
        {name && <input type="hidden" name={name} value={value ?? ""} />}

        {open && (
          <ul
            ref={list}
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-[calc(100%+var(--s-1))] z-50 max-h-[16rem] overflow-y-auto rounded-md border border-line bg-surface p-s-1 shadow-2 animate-fade-in"
          >
            {results.length === 0 && <li className="px-s-3 py-s-3 text-small text-faint">{emptyText}</li>}
            {results.map((o, i) => {
              const isSel = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled || undefined}
                  onPointerMove={() => !o.disabled && setActive(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => !o.disabled && choose(o.value)}
                  className={cx(
                    "flex min-h-hit cursor-pointer items-center gap-s-2 rounded-sm px-s-3 text-small md:min-h-control-sm",
                    i === active ? "bg-surface-2 text-ink" : "text-muted",
                    o.disabled && "cursor-default opacity-50",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="shrink-0 font-mono text-mono text-faint">{o.hint}</span>}
                  <Check aria-hidden className={cx("size-s-4 shrink-0", isSel ? "text-accent" : "invisible")} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Field>
  );
}
