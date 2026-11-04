import type { ReactNode } from "react";
import { cx } from "../utils/cx";

export type DividerProps = {
  /** Label in de lijn, in --text-label-stijl. */
  label?: ReactNode;
  /** Positie van het label. */
  align?: "start" | "center";
  orientation?: "horizontal" | "vertical";
  className?: string;
};

/** 1px lijn in --line, optioneel met label. */
export function Divider({ label, align = "start", orientation = "horizontal", className }: DividerProps) {
  if (orientation === "vertical") {
    return <span role="separator" aria-orientation="vertical" className={cx("w-px self-stretch bg-line", className)} />;
  }
  if (!label) return <hr className={cx("border-0 border-t border-line", className)} />;
  return (
    <div role="separator" className={cx("flex items-center gap-s-3", className)}>
      {align === "center" && <span aria-hidden className="h-px flex-1 bg-line" />}
      <span className="shrink-0 text-label uppercase text-faint">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}
