import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../utils/cx";

export type TooltipProps = {
  /** Korte tekst; geen interactieve inhoud. */
  content: ReactNode;
  /** Eén element dat focus kan krijgen (meestal een knop). */
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: "top" | "bottom";
  /** Vertraging bij hover in ms. */
  delay?: number;
  className?: string;
};

/**
 * Korte uitleg bij hover en focus (§3). Escape sluit. Op touch: niet tonen —
 * zet belangrijke informatie nooit alleen in een tooltip.
 */
export function Tooltip({ content, children, side = "top", delay = 400, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = (wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), wait);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const trigger = isValidElement(children)
    ? cloneElement(children, {
        "aria-describedby": [children.props["aria-describedby"], open ? id : null].filter(Boolean).join(" ") || undefined,
      })
    : children;

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={(e) => e.pointerType === "mouse" && show(delay)}
      onPointerLeave={hide}
      onFocus={(e) => (e.target as HTMLElement).matches(":focus-visible") && show(0)}
      onBlur={hide}
    >
      {trigger}
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cx(
            "pointer-events-none absolute left-1/2 z-50 w-max max-w-[16rem] -translate-x-1/2 rounded-sm bg-ink px-s-2 py-s-1 text-small text-bg shadow-2 animate-fade-in",
            side === "top" ? "bottom-[calc(100%+var(--s-2))]" : "top-[calc(100%+var(--s-2))]",
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
