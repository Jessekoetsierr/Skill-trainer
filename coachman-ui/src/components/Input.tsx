import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { CircleAlert, Eye, EyeOff, Search } from "lucide-react";
import { cx } from "../utils/cx";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> & {
  /** Label boven het veld, in --text-label-stijl. */
  label?: ReactNode;
  /** Uitleg onder het veld. */
  hint?: ReactNode;
  /** Foutmelding: rode rand + tekst met icoon (nooit alleen kleur). */
  error?: ReactNode;
  /** Inhoud links in het veld (icoon of tekst, bijv. "€"). */
  prefix?: ReactNode;
  /** Inhoud rechts in het veld (bijv. "kg"). */
  suffix?: ReactNode;
  type?: "text" | "number" | "password" | "search" | "email" | "tel" | "url" | "time" | "date";
  /** Klassen voor de buitenste wrapper. */
  wrapperClassName?: string;
  ref?: Ref<HTMLInputElement>;
};

export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  type = "text",
  id,
  disabled,
  className,
  wrapperClassName,
  ref,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const [reveal, setReveal] = useState(false);

  const isPassword = type === "password";
  const isNumber = type === "number" || type === "time" || type === "date";
  const start = prefix ?? (type === "search" ? <Search aria-hidden /> : null);

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  return (
    <div className={cx("grid min-w-0 content-start gap-s-1", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-label uppercase text-muted">
          {label}
        </label>
      )}
      <div
        className={cx(
          "flex min-h-hit items-center gap-s-2 rounded-sm border bg-surface-2 px-s-3 md:min-h-control-md",
          "transition-[border-color,box-shadow] duration-fast ease",
          "focus-within:border-accent focus-within:ring-1 focus-within:ring-accent",
          error ? "border-danger" : "border-line hover:border-muted",
          disabled && "pointer-events-none opacity-50",
          "[&_svg]:size-[calc(var(--icon-ui)*0.85)] [&_svg]:shrink-0",
        )}
      >
        {start && <span className="flex items-center text-faint">{start}</span>}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && reveal ? "text" : type}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          inputMode={type === "number" ? "decimal" : undefined}
          className={cx(
            "w-full min-w-0 flex-1 self-stretch bg-transparent py-0 text-body text-ink outline-none placeholder:text-faint",
            "[&::-webkit-search-cancel-button]:hidden",
            isNumber && "font-mono tabular-nums",
            className,
          )}
          {...rest}
        />
        {suffix && <span className="flex items-center text-small text-muted">{suffix}</span>}
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
            aria-pressed={reveal}
            className="-mr-s-2 flex size-hit items-center justify-center rounded-sm text-faint transition-colors duration-fast hover:text-ink md:size-control-sm"
          >
            {reveal ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </button>
        )}
      </div>
      {error ? (
        <p id={errorId} className="flex items-center gap-s-1 text-small text-danger [&_svg]:size-[1em] [&_svg]:shrink-0">
          <CircleAlert aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-small text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
