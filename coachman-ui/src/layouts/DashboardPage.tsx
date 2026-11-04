import type { ReactNode } from "react";
import { cx } from "../utils/cx";
import { Stat, type StatProps } from "../components/Stat";

export type DashboardPageProps = {
  /** Paginakop — een <DayHeader />. */
  header: ReactNode;
  /** Rij met kerncijfers bovenaan (2 kolommen op mobiel, tot 4 op desktop). */
  stats?: StatProps[];
  /** Grid van Cards. */
  children?: ReactNode;
  /** Kolommen van het kaartengrid op desktop. */
  columns?: 2 | 3;
  /** Feed onderaan (meestal een <Log>). */
  feed?: ReactNode;
  feedTitle?: ReactNode;
  /** Actie naast de feed-titel (bijv. "Alles bekijken"). */
  feedAction?: ReactNode;
  className?: string;
};

const cols = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-2 xl:grid-cols-3" };

/**
 * DashboardPage (§5): rij Stat-blokken → grid van Cards → LogEntry-feed.
 * Max breedte 1200px.
 */
export function DashboardPage({
  header,
  stats,
  children,
  columns = 3,
  feed,
  feedTitle = "Logboek",
  feedAction,
  className,
}: DashboardPageProps) {
  return (
    <div className={cx("mx-auto grid w-full max-w-dashboard gap-s-7", className)}>
      {header}

      {stats && stats.length > 0 && (
        <section aria-label="Kerncijfers">
          {/* Eén band met 1px scheidingen — leest als een regel in een logboek */}
          <div
            className={cx(
              "grid grid-cols-2 overflow-hidden rounded-md border border-line bg-surface shadow-1",
              stats.length >= 3 && "md:grid-cols-3",
              stats.length >= 4 && "lg:grid-cols-4",
            )}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className="-mb-px -mr-px min-w-0 border-b border-r border-line p-s-4 md:p-s-5"
              >
                <Stat {...s} />
              </div>
            ))}
          </div>
        </section>
      )}

      {children && <section className={cx("grid grid-cols-1 gap-s-4 md:grid-cols-2", cols[columns])}>{children}</section>}

      {feed && (
        <section aria-labelledby="cm-feed-title" className="max-w-read">
          <div className="mb-s-2 flex items-baseline justify-between gap-s-3 border-b border-line pb-s-2">
            <h2 id="cm-feed-title" className="text-label uppercase text-muted">
              {feedTitle}
            </h2>
            {feedAction}
          </div>
          {feed}
        </section>
      )}
    </div>
  );
}
