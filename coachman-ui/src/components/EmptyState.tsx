import type { ReactNode } from "react";
import { cx } from "../utils/cx";

export type EmptyStateProps = {
  title: ReactNode;
  /** Korte uitleg: wat hoort hier en hoe komt het er. */
  description?: ReactNode;
  /** Eén actie, meestal een Button. */
  action?: ReactNode;
  /** Klein icoon boven de titel (optioneel, geen illustraties). */
  icon?: ReactNode;
  /** Met stippellijn-kader (standaard) of kaal. */
  framed?: boolean;
  className?: string;
};

/** Rustige lege staat (§3): titel, uitleg, actie. Geen illustraties. */
export function EmptyState({ title, description, action, icon, framed = true, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        "flex flex-col items-center px-s-5 py-s-7 text-center",
        framed && "rounded-md border border-dashed border-line",
        className,
      )}
    >
      {icon && <span className="mb-s-3 text-faint [&_svg]:size-icon-nav">{icon}</span>}
      <p className="text-h3 text-ink">{title}</p>
      {description && <p className="mt-s-1 max-w-[28rem] text-small text-muted">{description}</p>}
      {action && <div className="mt-s-5">{action}</div>}
    </div>
  );
}
