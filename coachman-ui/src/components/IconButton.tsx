import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../utils/cx";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** Verplicht: het icoon heeft geen tekst, dus de knop heeft een naam nodig. */
  "aria-label": string;
  icon: ReactNode;
  variant?: "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  ref?: Ref<HTMLButtonElement>;
};

const sizes = {
  sm: "size-hit md:size-control-sm [&_svg]:size-[calc(var(--icon-ui)*0.8)]",
  md: "size-hit md:size-control-md [&_svg]:size-icon-ui",
  lg: "size-control-lg [&_svg]:size-icon-nav",
};

export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  type = "button",
  className,
  ref,
  ...rest
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-md border",
        "transition-[background-color,color,transform] duration-fast ease active:translate-y-px",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "ghost"
          ? "border-transparent text-muted hover:bg-surface-2 hover:text-ink"
          : "border-line bg-surface text-ink hover:bg-surface-2",
        sizes[size],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
