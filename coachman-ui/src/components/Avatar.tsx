import { useState } from "react";
import { cx } from "../utils/cx";

export type AvatarProps = {
  /** Naam: levert de initialen en de alt-tekst. */
  name: string;
  /** Foto; valt terug op initialen als hij niet laadt. */
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "size-s-6 text-[0.6875rem]",
  md: "size-[2.5rem] text-small",
  lg: "size-s-8 text-h3",
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Initialen of foto, rond (--r-full). */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-surface-2 font-medium tracking-label text-muted ring-1 ring-inset ring-line",
        sizes[size],
        className,
      )}
    >
      {showImg ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
