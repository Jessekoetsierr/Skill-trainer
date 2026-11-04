import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cx } from "../utils/cx";

/** Ids voor label, uitleg en fout van één veld. */
export function fieldIds(id: string) {
  return { hint: `${id}-hint`, error: `${id}-error` };
}

export function describedBy(id: string, hint?: ReactNode, error?: ReactNode) {
  const ids = fieldIds(id);
  return [error ? ids.error : null, hint ? ids.hint : null].filter(Boolean).join(" ") || undefined;
}

/** Label boven, uitleg of fout onder — gedeeld door Input, Textarea, Select en Combobox. */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const ids = fieldIds(id);
  return (
    <div className={cx("grid min-w-0 content-start gap-s-1", className)}>
      {label && (
        <label htmlFor={id} className="text-label uppercase text-muted">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={ids.error} className="flex items-center gap-s-1 text-small text-danger [&_svg]:size-[1em] [&_svg]:shrink-0">
          <CircleAlert aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={ids.hint} className="text-small text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Rand/vlak van een invoerveld, in alle staten. */
export const fieldBox = (error?: unknown, disabled?: boolean) =>
  cx(
    "rounded-sm border bg-surface-2 transition-[border-color,box-shadow] duration-fast ease",
    "focus-within:border-accent focus-within:ring-1 focus-within:ring-accent",
    error ? "border-danger" : "border-line hover:border-muted",
    disabled && "pointer-events-none opacity-50",
  );
