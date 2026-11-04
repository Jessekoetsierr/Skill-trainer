import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "../utils/cx";
import { IconButton } from "./IconButton";
import { cssDuration } from "../utils/duration";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Acties onderaan (bijv. Annuleren + Opslaan). */
  footer?: ReactNode;
  /**
   * auto = gecentreerd op desktop, bottom-sheet op mobiel (standaard)
   * center = altijd gecentreerd · sheet = altijd bottom-sheet
   */
  variant?: "auto" | "center" | "sheet";
  /** Breedte van de gecentreerde variant. */
  size?: "sm" | "md" | "lg";
  /** Sluiten via klik op de achtergrond (standaard aan). */
  dismissible?: boolean;
  className?: string;
  children?: ReactNode;
};

const widths = { sm: "md:max-w-[26rem]", md: "md:max-w-[34rem]", lg: "md:max-w-read" };

/**
 * Modal / Sheet op basis van het native <dialog>: focus-trap, Escape en inert
 * achtergrond komen gratis. Wordt niet geportald, zodat het de data-mode van
 * zijn plek in de boom erft.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  variant = "auto",
  size = "md",
  dismissible = true,
  className,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [closing, setClosing] = useState(false);

  // open → showModal; dicht → korte uit-animatie, daarna close()
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setClosing(false);
      el.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && el.open) {
      setClosing(true);
      const dur = cssDuration("--dur-fast", 120, el);
      const t = setTimeout(() => {
        el.close();
        setClosing(false);
        document.documentElement.style.overflow = "";
      }, dur);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
    },
    [],
  );

  const sheet = variant === "sheet";
  const auto = variant === "auto";

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
      data-closing={closing || undefined}
      className={cx(
        // reset van de browser-stijl
        "m-0 max-h-none max-w-none bg-transparent p-0 text-ink",
        "backdrop:bg-backdrop backdrop:backdrop-blur",
        "open:flex h-dvh w-screen overflow-hidden",
        "data-[closing]:opacity-0 transition-opacity duration-fast ease",
        "backdrop:animate-fade-in",
        sheet ? "items-end justify-center" : auto ? "items-end justify-center md:items-center" : "items-center justify-center p-s-4",
        auto && "md:p-s-4",
      )}
    >
      <div
        className={cx(
          "relative flex max-h-[90dvh] w-full flex-col border border-line bg-surface shadow-2",
          sheet || auto
            ? "rounded-t-lg pb-[env(safe-area-inset-bottom)] animate-sheet-in motion-reduce:animate-fade-in"
            : "rounded-lg animate-pop-in motion-reduce:animate-fade-in",
          auto && "md:rounded-lg md:pb-0 md:animate-pop-in",
          !sheet && widths[size],
          sheet && "md:max-w-read",
          className,
        )}
      >
        {(sheet || auto) && (
          <span
            aria-hidden
            className={cx("mx-auto mt-s-2 h-s-1 w-s-7 shrink-0 rounded-full bg-line", auto && "md:hidden")}
          />
        )}
        <header className="flex items-start justify-between gap-s-4 px-s-5 pb-s-2 pt-s-4 md:pt-s-5">
          <div className="grid min-w-0 gap-s-1">
            <h2 id={`${id}-title`} className="text-h3 text-ink">
              {title}
            </h2>
            {description && (
              <p id={`${id}-desc`} className="text-small text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton
            aria-label="Sluiten"
            icon={<X />}
            size="sm"
            onClick={onClose}
            className="-mr-s-2 -mt-s-1"
          />
        </header>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-s-5 py-s-3">{children}</div>}
        {footer && (
          <footer className="flex flex-col-reverse gap-s-2 border-t border-line px-s-5 py-s-4 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

/** Alias: altijd als bottom-sheet. */
export function Sheet(props: Omit<ModalProps, "variant">) {
  return <Modal {...props} variant="sheet" />;
}
