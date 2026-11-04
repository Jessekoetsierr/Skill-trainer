import type { CSSProperties } from "react";
import { cx } from "../utils/cx";

export type SkeletonProps = {
  /** line = tekstregel, block = vlak (bijv. kaart), circle = avatar. */
  variant?: "line" | "block" | "circle";
  /** Aantal regels (alleen line); de laatste is korter. */
  lines?: number;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  className?: string;
};

const shimmer = [
  "bg-surface-2 motion-safe:animate-shimmer",
  "[background-image:linear-gradient(90deg,transparent_0%,var(--line)_50%,transparent_100%)]",
  "[background-size:200%_100%] [background-repeat:no-repeat]",
].join(" ");

/** Laadplaatshouder met zachte shimmer; uit bij reduced motion. */
export function Skeleton({ variant = "line", lines = 1, width, height, className }: SkeletonProps) {
  if (variant === "line") {
    return (
      <span aria-hidden className={cx("grid gap-s-2", className)} style={{ width }}>
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={cx("block h-[0.8em] rounded-sm", shimmer)}
            style={{ width: lines > 1 && i === lines - 1 ? "60%" : "100%", height }}
          />
        ))}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cx("block", shimmer, variant === "circle" ? "rounded-full" : "rounded-md", className)}
      style={{
        width: width ?? (variant === "circle" ? "var(--s-7)" : "100%"),
        height: height ?? (variant === "circle" ? "var(--s-7)" : "var(--s-8)"),
      }}
    />
  );
}
