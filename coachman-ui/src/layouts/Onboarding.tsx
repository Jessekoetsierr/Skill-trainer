import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cx } from "../utils/cx";
import { Button } from "../components/Button";

export type OnboardingStep = {
  id: string;
  /** De vraag of boodschap — groot, in het display-font. */
  title: ReactNode;
  description?: ReactNode;
  /** Invoer voor deze stap (één vraag per scherm). */
  content?: ReactNode;
  /** Volgende-knop pas actief als dit true is (standaard true). */
  canContinue?: boolean;
  /** Eigen tekst op de primaire knop. */
  continueLabel?: string;
  /** Toon "Overslaan" voor deze stap. */
  optional?: boolean;
};

export type OnboardingProps = {
  steps: OnboardingStep[];
  /** Gecontroleerde stap (index). */
  step?: number;
  onStepChange?: (step: number) => void;
  onComplete: () => void;
  /** "Later" rechtsboven; laat weg om te verbergen. */
  onExit?: () => void;
  /** Logo/woordmerk bovenaan; standaard "THE COACHMAN". */
  brand?: ReactNode;
  className?: string;
};

/**
 * Onboarding (§5): één vraag per scherm, grote display-titel, één primaire knop.
 * Schermvullend, buiten de AppShell.
 */
export function Onboarding({ steps, step: stepProp, onStepChange, onComplete, onExit, brand, className }: OnboardingProps) {
  const [inner, setInner] = useState(0);
  const index = Math.min(stepProp ?? inner, steps.length - 1);
  const step = steps[index];
  const last = index === steps.length - 1;
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const go = (i: number) => {
    if (stepProp === undefined) setInner(i);
    onStepChange?.(i);
  };
  const next = () => (last ? onComplete() : go(index + 1));

  // Focus naar de nieuwe vraag (niet bij het eerste scherm)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [index]);

  return (
    <div
      className={cx(
        "relative mx-auto flex min-h-dvh w-full max-w-read flex-col px-s-4 md:px-s-6",
        "pt-[max(var(--s-5),env(safe-area-inset-top))] pb-[max(var(--s-5),env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <header className="flex min-h-hit items-center justify-between gap-s-4">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="-ml-s-1 inline-flex min-h-hit items-center gap-s-1 rounded-sm pr-s-2 text-small text-muted transition-colors duration-fast hover:text-ink [&_svg]:size-s-4"
          >
            <ChevronLeft aria-hidden />
            Terug
          </button>
        ) : (
          (brand ?? <span className="font-display text-h3 font-semibold uppercase tracking-display">The Coachman</span>)
        )}
        <div className="flex items-center gap-s-4">
          <span className="font-mono text-mono tabular-nums text-faint" aria-label={`Stap ${index + 1} van ${steps.length}`}>
            {index + 1}/{steps.length}
          </span>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="min-h-hit rounded-sm text-small text-muted transition-colors duration-fast hover:text-ink"
            >
              Later
            </button>
          )}
        </div>
      </header>

      {/* Voortgang: 1px lijn, accent tot de huidige stap */}
      <div aria-hidden className="mt-s-3 flex gap-s-1">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={cx("h-px flex-1 transition-colors duration-base", i <= index ? "bg-accent" : "bg-line")}
          />
        ))}
      </div>

      <main key={step.id} className="flex flex-1 flex-col pt-s-8 animate-pop-in motion-reduce:animate-fade-in md:pt-[12vh]">
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-display text-[2.5rem] font-semibold leading-[1.1] text-ink outline-none animate-night-enter tracking-night md:text-[length:var(--text-display)]"
        >
          {step.title}
        </h1>
        {step.description && <p className="mt-s-4 max-w-[32rem] text-body text-muted">{step.description}</p>}
        {step.content && <div className="mt-s-7">{step.content}</div>}
      </main>

      <footer className="sticky bottom-0 -mx-s-4 mt-s-7 flex flex-col gap-s-2 bg-bg px-s-4 pt-s-3 md:static md:mx-0 md:flex-row md:items-center md:justify-end md:bg-transparent md:px-0">
        {step.optional && !last && (
          <Button variant="ghost" size="lg" onClick={() => go(index + 1)}>
            Overslaan
          </Button>
        )}
        <Button variant="primary" size="lg" block className="md:w-auto" disabled={step.canContinue === false} onClick={next}>
          {step.continueLabel ?? (last ? "Klaar" : "Volgende")}
        </Button>
      </footer>
    </div>
  );
}
