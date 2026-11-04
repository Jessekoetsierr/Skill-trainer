import { useId, useState, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "../utils/cx";

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  /** Label links en switch rechts (instellingen-rij) of andersom. */
  labelPosition?: "start" | "end";
  ref?: Ref<HTMLButtonElement>;
};

/** Aan/uit. Track kleurt naar accent, in nacht met gloed. */
export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  labelPosition = "end",
  disabled,
  id,
  className,
  ref,
  ...rest
}: SwitchProps) {
  const autoId = useId();
  const switchId = id ?? autoId;
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;

  const toggle = () => {
    if (checked === undefined) setInner(!on);
    onCheckedChange?.(!on);
  };

  const control = (
    <button
      ref={ref}
      id={switchId}
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={label ? `${switchId}-label` : undefined}
      aria-describedby={description ? `${switchId}-desc` : undefined}
      disabled={disabled}
      onClick={toggle}
      className={cx(
        "group/sw relative inline-flex h-s-5 w-[2.5rem] shrink-0 items-center rounded-full border p-0.5",
        "transition-[background-color,border-color,box-shadow] duration-fast ease",
        "disabled:pointer-events-none disabled:opacity-50",
        // groter raakvlak zonder de vorm te vergroten
        "before:absolute before:-inset-x-s-1 before:-inset-y-[calc((var(--hit-min)-var(--s-5))/2)] before:content-[''] md:before:hidden",
        on ? "border-accent bg-accent shadow-glow" : "border-line bg-surface-2 hover:border-muted",
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={cx(
          "block size-[calc(var(--s-5)-6px)] rounded-full shadow-1 transition-transform duration-base ease",
          on ? "translate-x-[calc(2.5rem-var(--s-5))] bg-on-accent" : "translate-x-0 bg-muted",
        )}
      />
    </button>
  );

  if (!label && !description) return <span className={className}>{control}</span>;

  const text = (
    <span className="grid min-w-0 gap-s-1">
      {label && (
        <label id={`${switchId}-label`} htmlFor={switchId} className="cursor-pointer text-body leading-snug text-ink">
          {label}
        </label>
      )}
      {description && (
        <span id={`${switchId}-desc`} className="text-small text-muted">
          {description}
        </span>
      )}
    </span>
  );

  return (
    <div
      className={cx(
        "flex min-h-hit items-center gap-s-3 md:min-h-0",
        labelPosition === "start" && "justify-between",
        disabled && "opacity-50",
        className,
      )}
    >
      {labelPosition === "start" ? (
        <>
          {text}
          {control}
        </>
      ) : (
        <>
          {control}
          {text}
        </>
      )}
    </div>
  );
}
