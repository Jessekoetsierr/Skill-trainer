import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../utils/cx";

export type MarkProps = HTMLAttributes<HTMLSpanElement> & {
  /** Voltooid. Bij de wissel naar true speelt de animatie. */
  done: boolean;
  /** Streep door de tekst (standaard aan). Uit = alleen inzakken + muted. */
  strike?: boolean;
  children: ReactNode;
};

/**
 * De afvink-animatie (§4). Bij voltooien tekent een korte, strakke streep zich (180ms),
 * het item zakt een fractie in en kleurt naar --text-muted; in nacht een korte
 * accent-gloed op de streep. Zelfde gedrag als het vinkje in Checkbox.
 *
 *   <Mark done={task.done}>Logboek bijwerken</Mark>
 */
export function Mark({ done, strike = true, className, children, ...rest }: MarkProps) {
  return (
    <span
      data-done={done || undefined}
      className={cx(
        "group/mark relative inline-block transition-[color,transform] duration-base ease",
        done ? "translate-y-px text-muted motion-reduce:translate-y-0" : "text-ink",
        className,
      )}
      {...rest}
    >
      {children}
      {strike && (
        <span
          aria-hidden
          className={cx(
            "pointer-events-none absolute left-0 right-0 top-[55%] h-px origin-left rounded-full bg-current",
            "[transition:transform_180ms_var(--ease)] motion-reduce:[transition:opacity_150ms_linear]",
            done
              ? "scale-x-100 animate-glow-pulse motion-reduce:opacity-100"
              : "scale-x-0 motion-reduce:scale-x-100 motion-reduce:opacity-0",
          )}
        />
      )}
      {done && <span className="sr-only"> (voltooid)</span>}
    </span>
  );
}
