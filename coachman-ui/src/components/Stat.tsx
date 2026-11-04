import type { ReactNode } from "react";
import { cx } from "../utils/cx";

export type StatProps = {
  label: ReactNode;
  /** Waarde — wordt in mono met tabular-nums gezet. */
  value: ReactNode;
  /** Eenheid achter de waarde (bijv. "kg", "%"). */
  unit?: ReactNode;
  /** Verandering, bijv. { value: "+4,2%", direction: "up" }. */
  delta?: {
    value: ReactNode;
    direction: "up" | "down" | "flat";
    /** Is omhoog goed? Standaard ja. Zet op false voor bijv. rusthartslag of kosten. */
    upIsGood?: boolean;
  };
  /** Optionele sparkline (oudste eerst). */
  sparkline?: number[];
  /** Context onder de waarde, bijv. "afgelopen 7 dagen". */
  caption?: ReactNode;
  className?: string;
};

export function Stat({ label, value, unit, delta, sparkline, caption, className }: StatProps) {
  const good =
    delta && delta.direction !== "flat"
      ? (delta.direction === "up") === (delta.upIsGood ?? true)
      : null;
  const arrow = delta?.direction === "up" ? "↑" : delta?.direction === "down" ? "↓" : "→";
  const directionText =
    delta?.direction === "up" ? "gestegen" : delta?.direction === "down" ? "gedaald" : "gelijk";

  return (
    <div className={cx("grid min-w-0 gap-s-2", className)}>
      <p className="text-label uppercase text-muted">{label}</p>
      <div className="flex flex-wrap items-end justify-between gap-s-3">
        <p className="min-w-0 animate-night-enter whitespace-nowrap font-mono text-h1 font-medium leading-none tabular-nums tracking-night text-ink">
          {value}
          {unit && <span className="ml-s-1 text-small font-normal text-muted">{unit}</span>}
        </p>
        {sparkline && sparkline.length > 1 && <Sparkline data={sparkline} />}
      </div>
      {(delta || caption) && (
        <p className="flex flex-wrap items-baseline gap-x-s-2 text-small">
          {delta && (
            <span
              className={cx(
                "font-mono text-mono tabular-nums",
                good === null ? "text-muted" : good ? "text-success" : "text-danger",
              )}
            >
              <span aria-hidden>{arrow} </span>
              <span className="sr-only">{directionText}: </span>
              {delta.value}
            </span>
          )}
          {caption && <span className="text-faint">{caption}</span>}
        </p>
      )}
    </div>
  );
}

/** Kleine lijn, volgt de tekstkleur; laatste punt als stip. */
function Sparkline({ data }: { data: number[] }) {
  const w = 80;
  const h = 28;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => [
    pad + (i / (data.length - 1)) * (w - pad * 2),
    pad + (1 - (d - min) / span) * (h - pad * 2),
  ]);
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-s-6 w-auto shrink-0 text-muted"
      aria-hidden
    >
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill="var(--text)" />
    </svg>
  );
}
