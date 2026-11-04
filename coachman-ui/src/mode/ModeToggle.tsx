import { useRef, type KeyboardEvent } from "react";
import { useMode } from "./useMode";
import type { ModePreference } from "./store";

const OPTIONS: { value: ModePreference; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "day", label: "Dag" },
  { value: "night", label: "Nacht" },
];

export type ModeToggleProps = {
  className?: string;
  /** Toegankelijke naam van de groep. */
  label?: string;
};

/**
 * Auto / Dag / Nacht — segmented control (radiogroep).
 * Pijltjestoetsen wisselen, de keuze wordt per apparaat opgeslagen.
 */
export function ModeToggle({ className = "", label = "Weergave" }: ModeToggleProps) {
  const { preference, setPreference } = useMode();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    let next: number;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % OPTIONS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (index - 1 + OPTIONS.length) % OPTIONS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = OPTIONS.length - 1;
    else return;
    e.preventDefault();
    setPreference(OPTIONS[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex items-center gap-s-1 rounded-md border border-line bg-surface-2 p-s-1 ${className}`}
    >
      {OPTIONS.map((opt, i) => {
        const active = preference === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setPreference(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={[
              "min-h-hit min-w-hit rounded-sm px-s-3 text-small font-medium",
              "md:min-h-0 md:py-s-1",
              "transition-colors duration-fast ease",
              active
                ? "bg-surface text-ink shadow-1 ring-1 ring-inset ring-line"
                : "text-muted hover:text-ink",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
