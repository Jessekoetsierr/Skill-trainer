import type { MouseEvent, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cx } from "../utils/cx";
import { DayHeader } from "../signature/DayHeader";

export type DetailMeta = { label: ReactNode; value: ReactNode };

export type DetailPageProps = {
  title: ReactNode;
  /** Klein label boven de titel (bijv. "TRAINING"); standaard de datum. */
  label?: ReactNode;
  date?: Date;
  /** Status rechts in de kop (mono). */
  status?: ReactNode;
  /** Terug-link boven de kop. */
  back?: { label: string; href?: string; onClick?: () => void };
  /** Metadata in mono, als regels label → waarde. */
  meta?: DetailMeta[];
  /** Acties onderaan; op mobiel plakken ze boven de onderbalk. */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/**
 * DetailPage (§5): titel, metadata in mono, inhoud, acties onderaan
 * (sticky op mobiel). Leesbreedte 720px.
 */
export function DetailPage({ title, label, date, status, back, meta, actions, children, className }: DetailPageProps) {
  return (
    <div className={cx("mx-auto grid w-full max-w-read gap-s-6", className)}>
      {back && (
        <a
          href={back.href ?? "#"}
          onClick={(e: MouseEvent) => {
            if (back.onClick) {
              e.preventDefault();
              back.onClick();
            }
          }}
          className="-mb-s-3 -ml-s-1 inline-flex min-h-hit items-center gap-s-1 justify-self-start rounded-sm pr-s-2 text-small text-muted transition-colors duration-fast hover:text-ink md:min-h-0 [&_svg]:size-s-4"
        >
          <ChevronLeft aria-hidden />
          {back.label}
        </a>
      )}

      <DayHeader
        title={title}
        date={date}
        label={label ? <span className="text-label uppercase text-muted">{label}</span> : undefined}
        status={status}
      />

      {meta && meta.length > 0 && (
        <dl className="grid grid-cols-1 border-y border-line sm:grid-cols-2">
          {meta.map((m, i) => (
            <div
              key={i}
              className="flex items-baseline justify-between gap-s-4 border-b border-line py-s-3 last:border-b-0 sm:odd:pr-s-5 sm:even:pl-s-5 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
            >
              <dt className="text-small text-muted">{m.label}</dt>
              <dd className="text-right font-mono text-mono tabular-nums text-ink">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {children && <div className="min-w-0">{children}</div>}

      {actions && (
        <div
          className={cx(
            // mobiel: plakt boven de onderbalk van de AppShell
            "sticky bottom-[calc(var(--bottombar-h)+env(safe-area-inset-bottom))] z-20 -mx-s-4 border-t border-line bg-bg px-s-4 py-s-3",
            "md:static md:mx-0 md:border-0 md:bg-transparent md:p-0",
          )}
        >
          <div className="flex flex-col-reverse gap-s-2 sm:flex-row sm:justify-end">{actions}</div>
        </div>
      )}
    </div>
  );
}
