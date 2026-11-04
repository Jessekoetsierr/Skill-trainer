import { useId, useLayoutEffect, useRef, type ReactNode, type Ref, type TextareaHTMLAttributes } from "react";
import { cx } from "../utils/cx";
import { Field, describedBy, fieldBox } from "./Field";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Groeit mee met de tekst (standaard aan). */
  autoGrow?: boolean;
  /** Minimaal en maximaal aantal regels bij autoGrow. */
  minRows?: number;
  maxRows?: number;
  /** Toon "120/500" als maxLength is gezet. */
  showCount?: boolean;
  wrapperClassName?: string;
  ref?: Ref<HTMLTextAreaElement>;
};

/** Voor notities in het logboek. Groeit mee, label boven. */
export function Textarea({
  label,
  hint,
  error,
  autoGrow = true,
  minRows = 3,
  maxRows = 12,
  showCount,
  id,
  disabled,
  className,
  wrapperClassName,
  value,
  defaultValue,
  maxLength,
  onChange,
  ref,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const count = useRef<HTMLSpanElement>(null);

  const resize = () => {
    const el = inner.current;
    if (!el) return;
    if (count.current) count.current.textContent = `${el.value.length}/${maxLength}`;
    if (!autoGrow) return;
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 24;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    el.style.height = "auto";
    const h = Math.min(Math.max(el.scrollHeight, line * minRows + pad), line * maxRows + pad);
    el.style.height = `${h}px`;
    el.style.overflowY = el.scrollHeight > h ? "auto" : "hidden";
  };

  useLayoutEffect(resize, [value, autoGrow, minRows, maxRows]);

  const setRefs = (el: HTMLTextAreaElement | null) => {
    inner.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <div className={cx(fieldBox(error, disabled), "relative")}>
        <textarea
          ref={setRefs}
          id={fieldId}
          rows={minRows}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, hint, error)}
          onChange={(e) => {
            onChange?.(e);
            if (value === undefined) resize();
          }}
          className={cx(
            "block w-full resize-none bg-transparent px-s-3 py-s-2 text-body text-ink outline-none placeholder:text-faint",
            showCount && maxLength && "pb-s-5",
            className,
          )}
          {...rest}
        />
        {showCount && maxLength && (
          <span
            ref={count}
            aria-hidden
            className="pointer-events-none absolute bottom-s-1 right-s-3 font-mono text-mono tabular-nums text-faint"
          >
            {String(value ?? defaultValue ?? "").length}/{maxLength}
          </span>
        )}
      </div>
    </Field>
  );
}
