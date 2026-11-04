import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../utils/cx";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary = accent (max. één per scherm), secondary = rand, ghost, danger. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Toont een spinner, blokkeert klikken en zet aria-busy. */
  loading?: boolean;
  /** Icoon vóór de tekst (bijv. <Plus />). */
  iconStart?: ReactNode;
  /** Icoon na de tekst. */
  iconEnd?: ReactNode;
  /** Volle breedte. */
  block?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

const base = [
  "relative inline-flex select-none items-center justify-center gap-s-2 whitespace-nowrap",
  "rounded-md border font-medium",
  "transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease",
  "active:translate-y-px",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&_svg]:shrink-0",
].join(" ");

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover disabled:border-line disabled:bg-surface-2 disabled:text-faint disabled:opacity-100",
  secondary: "border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "border-transparent bg-transparent text-ink hover:bg-surface-2",
  danger: "border-danger bg-transparent text-danger hover:bg-danger-soft",
};

/** Mobiel altijd ≥ 44px raakvlak; vanaf md de eigen hoogte. */
export const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-hit px-s-3 text-small md:min-h-0 md:h-control-sm [&_svg]:size-[calc(var(--icon-ui)*0.8)]",
  md: "min-h-hit px-s-4 text-small md:min-h-0 md:h-control-md [&_svg]:size-icon-ui",
  lg: "min-h-control-lg px-s-5 text-body [&_svg]:size-icon-ui",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  iconStart,
  iconEnd,
  block,
  disabled,
  type = "button",
  className,
  children,
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(base, buttonVariants[variant], buttonSizes[size], block && "w-full", className)}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
      <span className={cx("inline-flex items-center gap-s-2", loading && "invisible")}>
        {iconStart}
        {children}
        {iconEnd}
      </span>
    </button>
  );
}
