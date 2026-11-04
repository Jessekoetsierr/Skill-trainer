import type { HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "../utils/cx";

export type TagTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: TagTone;
  /** Kleine stip vóór de tekst. */
  dot?: boolean;
  icon?: ReactNode;
  /** Maakt de tag verwijderbaar (toont een ×-knop). */
  onRemove?: () => void;
  removeLabel?: string;
};

const tones: Record<TagTone, string> = {
  neutral: "border-line bg-surface-2 text-muted",
  accent: "border-transparent bg-accent-soft text-accent",
  success: "border-transparent bg-success-soft text-success",
  warning: "border-transparent bg-warning-soft text-warning",
  danger: "border-transparent bg-danger-soft text-danger",
  info: "border-transparent bg-info-soft text-info",
};

/** Tag / Badge: --r-sm, --text-label. */
export function Tag({
  tone = "neutral",
  dot,
  icon,
  onRemove,
  removeLabel = "Verwijderen",
  className,
  children,
  ...rest
}: TagProps) {
  return (
    <span
      className={cx(
        "inline-flex h-s-5 max-w-full items-center gap-s-1 whitespace-nowrap rounded-sm border px-s-2 text-label uppercase",
        "[&_svg]:size-[1.1em] [&_svg]:shrink-0",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span aria-hidden className="size-[0.5em] shrink-0 rounded-full bg-current" />}
      {icon}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${removeLabel}: ${typeof children === "string" ? children : ""}`.trim()}
          className="-mr-s-1 inline-flex items-center justify-center rounded-sm opacity-70 transition-opacity duration-fast hover:opacity-100"
        >
          <X aria-hidden />
        </button>
      )}
    </span>
  );
}

/** Alias: zelfde component, voor tellers en statussen. */
export const Badge = Tag;
export type BadgeProps = TagProps;
