import { useId, type ReactNode } from "react";
import { cx } from "../utils/cx";

export type ProgressProps = {
  /** Huidige waarde; laat weg voor onbepaalde voortgang (alleen bar). */
  value?: number;
  max?: number;
  variant?: "bar" | "ring";
  label?: ReactNode;
  /** Toon de waarde (bijv. "3/5" of "60%"). Standaard: percentage. */
  valueLabel?: ReactNode | false;
  /** Ring-diameter: sm = --s-7, md = --s-8. */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Accent-vulling op een --line-track. Bij 100% krijgt de vulling in nacht de accent-gloed.
 */
export function Progress({
  value,
  max = 100,
  variant = "bar",
  label,
  valueLabel,
  size = "md",
  className,
}: ProgressProps) {
  const id = useId();
  const indeterminate = value == null;
  const pct = indeterminate ? 0 : Math.max(0, Math.min(1, value / max));
  const done = pct >= 1;
  const shown =
    valueLabel === false ? null : (valueLabel ?? (indeterminate ? null : `${Math.round(pct * 100)}%`));

  const aria = {
    role: "progressbar" as const,
    "aria-labelledby": label ? `${id}-label` : undefined,
    "aria-valuemin": 0,
    "aria-valuemax": max,
    "aria-valuenow": indeterminate ? undefined : value,
    "aria-valuetext": typeof shown === "string" ? shown : undefined,
  };

  if (variant === "ring") {
    const r = 15.5;
    const c = 2 * Math.PI * r;
    return (
      <div className={cx("inline-flex items-center gap-s-3", className)}>
        <div
          {...aria}
          className={cx("relative shrink-0", size === "sm" ? "size-s-7" : "size-s-8")}
        >
          <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r={r} fill="none" stroke="var(--line)" strokeWidth="2" />
            <circle
              cx="18"
              cy="18"
              r={r}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
              className="transition-[stroke-dashoffset] duration-slow ease"
              style={done ? { filter: "var(--accent-glow-filter)" } : undefined}
            />
          </svg>
          {shown != null && (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-mono tabular-nums text-ink">
              {shown}
            </span>
          )}
        </div>
        {label && (
          <span id={`${id}-label`} className="text-small text-muted">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cx("grid gap-s-2", className)}>
      {(label || shown != null) && (
        <div className="flex items-baseline justify-between gap-s-3">
          {label ? (
            <span id={`${id}-label`} className="text-small text-muted">
              {label}
            </span>
          ) : (
            <span />
          )}
          {shown != null && <span className="font-mono text-mono tabular-nums text-ink">{shown}</span>}
        </div>
      )}
      <div {...aria} className={cx("relative h-s-1 rounded-full bg-line", indeterminate && "overflow-hidden")}>
        <div
          className={cx(
            "absolute inset-y-0 left-0 rounded-full bg-accent",
            indeterminate
              ? "w-1/3 animate-indeterminate motion-reduce:animate-none motion-reduce:w-full motion-reduce:opacity-40"
              : "transition-[width] duration-slow ease",
            done && "shadow-glow",
          )}
          style={indeterminate ? undefined : { width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
