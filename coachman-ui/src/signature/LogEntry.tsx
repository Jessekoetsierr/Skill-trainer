import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../utils/cx";
import { formatTime } from "../utils/format";

export type LogProps = HTMLAttributes<HTMLOListElement>;

/**
 * Container voor LogEntry's: achter elkaar vormen ze één doorlopende tijdlijn.
 * De lijn loopt van de eerste tot de laatste stip.
 */
export function Log({ className, children, ...rest }: LogProps) {
  return (
    <ol className={cx("cm-log grid", className)} {...rest}>
      {children}
    </ol>
  );
}

export type LogEntryProps = Omit<HTMLAttributes<HTMLLIElement>, "title"> & {
  /** Tijdstip; Date wordt "07:42". Een string wordt letterlijk getoond. */
  time?: Date | string;
  title: ReactNode;
  /** Optionele notitie onder de titel. */
  note?: ReactNode;
  /** Tags rechts of onder de notitie (bijv. <Tag>). */
  tags?: ReactNode;
  /** Meta rechts (bijv. "45 min", "€ 12,00") — in mono. */
  meta?: ReactNode;
  /** Belangrijk: accent-stip (met gloed in nacht). */
  important?: boolean;
  /** Voltooid/afgevinkt: titel in --text-muted. */
  done?: boolean;
  /** Eigen inhoud van de stip (bijv. een klein icoon). */
  marker?: ReactNode;
};

/**
 * De basisregel van alles (§4): tijd in mono links, een 1px lijn met stip,
 * rechts titel + notitie + tags.
 */
export function LogEntry({
  time,
  title,
  note,
  tags,
  meta,
  important,
  done,
  marker,
  className,
  children,
  ...rest
}: LogEntryProps) {
  const timeText = time instanceof Date ? formatTime(time) : time;
  return (
    <li
      className={cx(
        "cm-log-entry group/log relative grid grid-cols-[var(--s-8)_var(--s-5)_minmax(0,1fr)] gap-x-s-2",
        className,
      )}
      {...rest}
    >
      {/* Tijd */}
      <div className="pt-[calc(var(--s-3)+0.125em)] text-right">
        {timeText && (
          <time
            dateTime={time instanceof Date ? time.toISOString() : undefined}
            className="font-mono text-mono tabular-nums text-faint"
          >
            {timeText}
          </time>
        )}
      </div>

      {/* Rail: 1px lijn + stip */}
      <div aria-hidden className="relative flex justify-center">
        <span
          className={cx(
            "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line",
            // eerste en laatste: lijn alleen tot/vanaf de stip
            "group-first/log:top-[calc(var(--s-3)+0.6875em)] group-last/log:bottom-[calc(100%-var(--s-3)-0.6875em)]",
            "group-only/log:hidden",
          )}
        />
        {marker ? (
          <span className="relative mt-[calc(var(--s-3)+0.6875em-var(--s-2))] flex size-s-4 items-center justify-center rounded-full border border-line bg-surface text-muted [&_svg]:size-s-3">
            {marker}
          </span>
        ) : (
          <span
            className={cx(
              "relative mt-[calc(var(--s-3)+0.6875em-var(--s-1))] size-s-2 rounded-full",
              important ? "bg-accent shadow-glow" : done ? "bg-line" : "bg-faint",
            )}
          />
        )}
      </div>

      {/* Inhoud */}
      <div className="grid min-w-0 gap-s-1 pb-s-4 pt-s-3">
        <div className="flex items-baseline justify-between gap-s-3">
          <p
            className={cx(
              "min-w-0 text-body font-medium leading-snug transition-colors duration-base ease",
              done ? "text-muted" : "text-ink",
            )}
          >
            {title}
          </p>
          {meta != null && (
            <span className="shrink-0 font-mono text-mono tabular-nums text-muted">{meta}</span>
          )}
        </div>
        {note && <p className="text-small text-muted">{note}</p>}
        {tags && <div className="mt-s-1 flex flex-wrap gap-s-1">{tags}</div>}
        {children}
      </div>
    </li>
  );
}
