import type { ReactNode } from "react";
import { cx } from "../utils/cx";
import { formatDayLabel } from "../utils/format";

export type DayHeaderProps = {
  /** De dag; standaard vandaag. Wordt "DINSDAG 3 NOVEMBER". */
  date?: Date;
  /** Of een eigen label in plaats van de datum. */
  label?: ReactNode;
  /** Paginatitel, in het display-font. */
  title: ReactNode;
  /** Kleine status rechts, bijv. "3/5" — wordt in mono gezet. */
  status?: ReactNode;
  /** Extra inhoud rechts (bijv. een IconButton), naast de status. */
  actions?: ReactNode;
  /** Regel onder de titel. */
  description?: ReactNode;
  /** h1 (standaard) of h2 als er al een paginatitel is (bijv. per dag in een LogPage). */
  level?: 1 | 2;
  size?: "display" | "h1";
  className?: string;
};

/**
 * De kop van elke dag/pagina (§4). Herkenbaar in elke tool.
 * In nacht krijgt de titel een fractie meer letterspacing en een lichte fade-in.
 */
export function DayHeader({
  date,
  label,
  title,
  status,
  actions,
  description,
  level = 1,
  size = "h1",
  className,
}: DayHeaderProps) {
  const H = level === 1 ? "h1" : "h2";
  const d = date ?? new Date();
  return (
    <header className={cx("flex items-end justify-between gap-s-4", className)}>
      <div className="grid min-w-0 gap-s-1">
        {label ?? (
          <time dateTime={d.toISOString().slice(0, 10)} className="text-label uppercase text-muted">
            {formatDayLabel(d)}
          </time>
        )}
        <H
          className={cx(
            "font-display font-semibold text-ink animate-night-enter",
            size === "display"
              ? "text-display uppercase [letter-spacing:calc(var(--text-display-ls)+var(--display-ls-extra))]"
              : "text-h1 tracking-night",
          )}
        >
          {title}
        </H>
        {description && <p className="max-w-read text-body text-muted">{description}</p>}
      </div>
      {(status != null || actions) && (
        <div className="flex shrink-0 items-center gap-s-3 pb-[0.3em]">
          {status != null && (
            <span className="font-mono text-mono tabular-nums text-muted">{status}</span>
          )}
          {actions}
        </div>
      )}
    </header>
  );
}
