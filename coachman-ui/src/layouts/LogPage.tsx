import { Fragment, type ReactNode } from "react";
import { cx } from "../utils/cx";
import { DayHeader } from "../signature/DayHeader";
import { Log, LogEntry, type LogEntryProps } from "../signature/LogEntry";
import { EmptyState } from "../components/EmptyState";

export type LogPageEntry = Omit<LogEntryProps, "time" | "key" | "id"> & {
  id: string | number;
  time: Date;
};

export type LogPageProps = {
  /** Paginakop — een <DayHeader /> (level 1). */
  header: ReactNode;
  entries: LogPageEntry[];
  /** Nieuwste dag bovenaan (standaard) of oudste. */
  order?: "newest" | "oldest";
  /** Status rechts in de dagkop; standaard het aantal regels. */
  dayStatus?: (day: Date, entries: LogPageEntry[]) => ReactNode;
  /** Eigen weergave van een regel (moet een <LogEntry> teruggeven); standaard <LogEntry {...entry} />. */
  renderEntry?: (entry: LogPageEntry) => ReactNode;
  /** Ruimte onder de paginakop, bijv. een invoerveld of filters. */
  toolbar?: ReactNode;
  /** Lege staat. */
  empty?: ReactNode;
  /** Dagkoppen blijven bovenaan plakken tijdens scrollen (standaard aan). */
  stickyDays?: boolean;
  className?: string;
};

const withoutId = ({ id: _id, ...rest }: LogPageEntry) => rest;
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function dayTitle(day: Date, now = new Date()) {
  const a = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((b - a) / 86_400_000);
  if (diff === 0) return "Vandaag";
  if (diff === 1) return "Gisteren";
  if (diff === -1) return "Morgen";
  const w = day.toLocaleDateString("nl-NL", { weekday: "long" });
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/**
 * LogPage (§5): doorlopende tijdlijn van LogEntry's, gegroepeerd per dag met DayHeader.
 * Leesbreedte 720px.
 */
export function LogPage({
  header,
  entries,
  order = "newest",
  dayStatus = (_, list) => `${list.length}`,
  renderEntry,
  toolbar,
  empty,
  stickyDays = true,
  className,
}: LogPageProps) {
  // groeperen per dag; binnen een dag altijd chronologisch (zoals een logboek)
  const sorted = [...entries].sort((a, b) => a.time.getTime() - b.time.getTime());
  const groups = new Map<string, { day: Date; list: LogPageEntry[] }>();
  for (const e of sorted) {
    const k = dayKey(e.time);
    if (!groups.has(k)) groups.set(k, { day: e.time, list: [] });
    groups.get(k)!.list.push(e);
  }
  const days = [...groups.values()];
  if (order === "newest") days.reverse();

  return (
    <div className={cx("mx-auto grid w-full max-w-read gap-s-6", className)}>
      {header}
      {toolbar}

      {days.length === 0
        ? (empty ?? (
            <EmptyState
              title="Nog niets gelogd"
              description="Regels verschijnen hier op tijdsvolgorde, per dag gegroepeerd."
            />
          ))
        : days.map(({ day, list }) => (
            <section key={dayKey(day)} aria-label={dayTitle(day)}>
              <div
                className={cx(
                  "border-b border-line bg-bg pb-s-3",
                  stickyDays && "sticky top-0 z-10 pt-[max(var(--s-3),env(safe-area-inset-top))]",
                )}
              >
                <DayHeader date={day} title={dayTitle(day)} status={dayStatus(day, list)} level={2} />
              </div>
              <Log className="pt-s-2">
                {list.map((e) =>
                  renderEntry ? (
                    <Fragment key={e.id}>{renderEntry(e)}</Fragment>
                  ) : (
                    <LogEntry key={e.id} {...withoutId(e)} />
                  ),
                )}
              </Log>
            </section>
          ))}
    </div>
  );
}
