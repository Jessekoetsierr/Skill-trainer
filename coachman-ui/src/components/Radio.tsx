import { useId, useState, type ReactNode } from "react";
import { cx } from "../utils/cx";

export type RadioOption = { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean };

export type RadioGroupProps = {
  /** Groepsnaam (legend), in --text-label-stijl. */
  label?: ReactNode;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
  className?: string;
};

/** Eén keuze uit een paar zichtbare opties. Native radio's: pijltjestoetsen werken vanzelf. */
export function RadioGroup({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  orientation = "vertical",
  disabled,
  className,
}: RadioGroupProps) {
  const autoName = useId();
  const groupName = name ?? autoName;
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;

  return (
    <fieldset disabled={disabled} className={cx("min-w-0", disabled && "opacity-50", className)}>
      {label && <legend className="mb-s-2 text-label uppercase text-muted">{label}</legend>}
      <div className={cx(orientation === "horizontal" ? "flex flex-wrap gap-x-s-5" : "grid")}>
        {options.map((o) => {
          const id = `${groupName}-${o.value}`;
          return (
            <label
              key={o.value}
              htmlFor={id}
              className={cx(
                "inline-flex min-h-hit cursor-pointer items-start gap-s-3 py-s-2 md:min-h-0",
                o.disabled && "pointer-events-none opacity-50",
              )}
            >
              <span className="relative mt-[0.15em] flex size-s-5 shrink-0 items-center justify-center md:size-[1.125rem]">
                <input
                  id={id}
                  type="radio"
                  name={groupName}
                  value={o.value}
                  checked={current === o.value}
                  disabled={o.disabled}
                  onChange={() => {
                    if (value === undefined) setInner(o.value);
                    onValueChange?.(o.value);
                  }}
                  aria-describedby={o.description ? `${id}-desc` : undefined}
                  className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-full border border-muted bg-surface outline-none transition-[border-color,box-shadow] duration-fast ease hover:border-ink checked:border-accent checked:animate-glow-pulse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
                <span
                  aria-hidden
                  className="pointer-events-none relative size-[45%] scale-0 rounded-full bg-accent transition-transform duration-fast ease peer-checked:scale-100"
                />
              </span>
              <span className="grid min-w-0 gap-s-1">
                <span className="text-body leading-snug text-ink">{o.label}</span>
                {o.description && (
                  <span id={`${id}-desc`} className="text-small text-muted">
                    {o.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
