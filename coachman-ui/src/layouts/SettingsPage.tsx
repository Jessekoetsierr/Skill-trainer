import type { MouseEvent, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cx } from "../utils/cx";

export type SettingsPageProps = {
  /** Paginakop — een <DayHeader />. */
  header: ReactNode;
  children: ReactNode;
  className?: string;
};

/** SettingsPage (§5): groepen met --text-label kopjes, rijen met label links en control rechts. */
export function SettingsPage({ header, children, className }: SettingsPageProps) {
  return (
    <div className={cx("mx-auto grid w-full max-w-read gap-s-7", className)}>
      {header}
      {children}
    </div>
  );
}

export type SettingsGroupProps = {
  title: ReactNode;
  /** Uitleg onder de groep. */
  description?: ReactNode;
  children: ReactNode;
};

export function SettingsGroup({ title, description, children }: SettingsGroupProps) {
  return (
    <section>
      <h2 className="mb-s-2 text-label uppercase text-muted">{title}</h2>
      <div className="divide-y divide-line border-y border-line">{children}</div>
      {description && <p className="mt-s-2 text-small text-faint">{description}</p>}
    </section>
  );
}

export type SettingsRowProps = {
  label: ReactNode;
  description?: ReactNode;
  /** Control rechts (Switch, Select, Button, ModeToggle…). */
  control?: ReactNode;
  /** Waarde rechts als tekst (mono), bijv. "0.1.0" of "07:00". */
  value?: ReactNode;
  /** Maakt de hele rij een link naar een subpagina (met chevron). */
  href?: string;
  onClick?: () => void;
  /** Rode tekst, bijv. "Alle gegevens wissen". */
  danger?: boolean;
  /** Control onder het label in plaats van rechts (voor brede controls). */
  stack?: boolean;
};

export function SettingsRow({ label, description, control, value, href, onClick, danger, stack }: SettingsRowProps) {
  const text = (
    <span className="grid min-w-0 gap-s-1">
      <span className={cx("text-body leading-snug", danger ? "text-danger" : "text-ink")}>{label}</span>
      {description && <span className="text-small text-muted">{description}</span>}
    </span>
  );
  const right = (
    <>
      {value != null && <span className="font-mono text-mono tabular-nums text-muted">{value}</span>}
      {control}
    </>
  );

  if (href || onClick) {
    return (
      <a
        href={href ?? "#"}
        onClick={(e: MouseEvent) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        className="-mx-s-2 flex min-h-hit items-center justify-between gap-s-4 rounded-sm px-s-2 py-s-3 transition-colors duration-fast hover:bg-surface-2"
      >
        {text}
        <span className="flex shrink-0 items-center gap-s-2 text-faint [&_svg]:size-s-4">
          {right}
          <ChevronRight aria-hidden />
        </span>
      </a>
    );
  }

  return (
    <div
      className={cx(
        "flex min-h-hit gap-s-3 py-s-3",
        stack ? "flex-col" : "flex-wrap items-center justify-between",
      )}
    >
      {text}
      <div className={cx("flex items-center gap-s-2", !stack && "shrink-0")}>{right}</div>
    </div>
  );
}
