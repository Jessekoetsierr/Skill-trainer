import { useId, type ReactNode, type Ref, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../utils/cx";
import { Field, describedBy, fieldBox } from "./Field";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: SelectOption[];
  /** Lege eerste optie, bijv. "Kies…". */
  placeholder?: string;
  wrapperClassName?: string;
  ref?: Ref<HTMLSelectElement>;
};

/**
 * Enkelvoudige keuze op basis van het native <select>: op mobiel de vertrouwde
 * keuzelijst van het systeem. Voor zoeken in een lange lijst: Combobox.
 */
export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  id,
  disabled,
  className,
  wrapperClassName,
  ref,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <div className={cx(fieldBox(error, disabled), "relative")}>
        <select
          ref={ref}
          id={fieldId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, hint, error)}
          className={cx(
            "block min-h-[calc(var(--hit-min)-2px)] w-full cursor-pointer appearance-none bg-transparent pl-s-3 pr-s-7 text-body text-ink outline-none md:min-h-[calc(var(--control-md)-2px)]",
            className,
          )}
          {...rest}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-s-3 top-1/2 size-[calc(var(--icon-ui)*0.85)] -translate-y-1/2 text-faint"
        />
      </div>
    </Field>
  );
}
