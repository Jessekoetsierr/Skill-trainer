import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "../utils/cx";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  label?: ReactNode;
  description?: ReactNode;
  /** Gedeeltelijk geselecteerd (streepje). */
  indeterminate?: boolean;
  /**
   * Voor taken/gewoontes: bij afvinken zakt het label een fractie in en kleurt naar
   * --text-muted (het Mark-gedrag uit §4).
   */
  completable?: boolean;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Native checkbox (visueel verborgen) + eigen vak. Bij aanvinken tekent een korte,
 * strakke streep zich in 180ms; in nacht een korte accent-gloed.
 * De volledige Mark-component volgt in stap 3 en hergebruikt dit gedrag.
 */
export function Checkbox({
  label,
  description,
  indeterminate = false,
  completable = false,
  id,
  className,
  disabled,
  ref,
  ...rest
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inner = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const setRefs = (el: HTMLInputElement | null) => {
    inner.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  return (
    <label
      htmlFor={inputId}
      className={cx(
        "group/cb inline-flex min-h-hit cursor-pointer items-start gap-s-3 py-s-2 md:min-h-0",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <span className="relative mt-[0.15em] flex size-s-5 shrink-0 items-center justify-center md:size-[1.125rem]">
        <input
          ref={setRefs}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          aria-describedby={description ? `${inputId}-desc` : undefined}
          className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-sm border border-muted bg-surface outline-none transition-[background-color,border-color,box-shadow,transform] duration-fast ease checked:border-accent checked:bg-accent checked:animate-glow-pulse indeterminate:border-accent indeterminate:bg-accent hover:border-ink checked:hover:border-accent-hover checked:hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
          {...rest}
        />
        {/* vinkje: tekent zich via stroke-dashoffset */}
        <svg
          viewBox="0 0 16 16"
          aria-hidden
          className="pointer-events-none relative size-[75%] text-on-accent opacity-0 peer-checked:opacity-100 peer-checked:[&>path]:[stroke-dashoffset:0] peer-indeterminate:hidden"
        >
          <path
            d="M3.5 8.5l3 3 6-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            className="[stroke-dasharray:1] [stroke-dashoffset:1] [transition:stroke-dashoffset_180ms_var(--ease)] motion-reduce:[transition:none]"
          />
        </svg>
        <span
          aria-hidden
          className="pointer-events-none absolute hidden h-0.5 w-1/2 rounded-full bg-on-accent peer-indeterminate:block"
        />
      </span>
      {(label || description) && (
        <span
          className={cx(
            "grid min-w-0 gap-s-1 transition-transform duration-base ease",
            completable &&
              "group-has-[:checked]/cb:translate-y-px motion-reduce:group-has-[:checked]/cb:translate-y-0",
          )}
        >
          {label && <span
              className={cx(
                "text-body leading-snug text-ink transition-colors duration-base ease",
                completable && "group-has-[:checked]/cb:text-muted",
              )}
            >
              {label}
            </span>}
          {description && (
            <span id={`${inputId}-desc`} className="text-small text-muted">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
