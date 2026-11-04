import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "../utils/cx";

export type CardVariant = "default" | "inset" | "interactive";

export type CardProps = HTMLAttributes<HTMLElement> & {
  /**
   * default = wit vlak met rand · inset = verzonken vlak ·
   * interactive = klikbaar, tilt een fractie op bij hover.
   */
  variant?: CardVariant;
  /** Element om te renderen, bijv. "article", "a" of "button". Standaard div (interactive: button). */
  as?: ElementType;
  /** Padding --s-5 (standaard) of geen (voor lijsten/tabellen tot de rand). */
  padding?: "default" | "none";
  href?: string;
  type?: "button" | "submit";
  children?: ReactNode;
};

const variants: Record<CardVariant, string> = {
  default: "border border-line bg-surface shadow-1",
  inset: "border border-line bg-surface-2",
  interactive: [
    "block w-full border border-line bg-surface text-left shadow-1",
    "transition-[transform,box-shadow,border-color,background-color] duration-base ease",
    "hover:-translate-y-px hover:shadow-2 hover:border-muted",
    "active:translate-y-0 active:shadow-1",
    "motion-reduce:hover:translate-y-0",
  ].join(" "),
};

export function Card({
  variant = "default",
  as,
  padding = "default",
  className,
  children,
  ...rest
}: CardProps) {
  const Comp: ElementType = as ?? (variant === "interactive" ? (rest.href ? "a" : "button") : "div");
  const extra = Comp === "button" && !rest.type ? { type: "button" } : {};
  return (
    <Comp
      className={cx("rounded-md text-ink", variants[variant], padding === "default" && "p-s-5", className)}
      {...extra}
      {...rest}
    >
      {children}
    </Comp>
  );
}
