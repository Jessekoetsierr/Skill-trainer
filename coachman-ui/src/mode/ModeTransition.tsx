import { useEffect, useRef, useState } from "react";
import { setModeTransition, type ModeTransitionHandler } from "./store";
import type { Mode } from "./schedule";
import { cssDuration } from "../utils/duration";

/** Tijdfractie waarop een cubic-bezier halverwege (y = 0,5) is. */
function halfwayTime(x1: number, y1: number, x2: number, y2: number) {
  const bez = (a: number, b: number, s: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (bez(y1, y2, mid) < 0.5) lo = mid;
    else hi = mid;
  }
  return bez(x1, x2, (lo + hi) / 2);
}

function readTiming() {
  const cs = getComputedStyle(document.documentElement);
  const duration = cssDuration("--dur-mode", 1400);
  const easing = cs.getPropertyValue("--ease-heavy").trim() || "cubic-bezier(0.7, 0, 0.2, 1)";
  const m = easing.match(/cubic-bezier\(([^)]+)\)/);
  const [x1, y1, x2, y2] = m ? m[1].split(",").map(Number) : [0.7, 0, 0.2, 1];
  return { duration, easing, half: halfwayTime(x1, y1, x2, y2) };
}

/**
 * De dag/nacht-overgang (§2). Eén keer in de app plaatsen, bijv. naast <NightLayer />.
 * Bij een wissel schuift een gradient in de kleur van de doelmodus van boven naar
 * beneden over het scherm; halverwege wisselen de tokens. Nooit bij paginalaad.
 * Bij prefers-reduced-motion: een korte fade.
 */
export function ModeTransition() {
  const [target, setTarget] = useState<{ to: Mode; key: number; reduced: boolean } | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const pending = useRef<{ commit: () => void; timer?: ReturnType<typeof setTimeout>; anim?: Animation } | null>(null);
  const keyRef = useRef(0);

  useEffect(() => {
    const handler: ModeTransitionHandler = (to, commit) => {
      // Een lopende overgang meteen afronden
      const prev = pending.current;
      if (prev) {
        clearTimeout(prev.timer);
        prev.anim?.cancel();
      }
      pending.current = { commit };
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTarget({ to, key: ++keyRef.current, reduced });
    };
    const unregister = setModeTransition(handler);
    return () => {
      unregister();
      // Bij verdwijnen: een lopende wissel altijd doorvoeren
      const p = pending.current;
      if (p) {
        clearTimeout(p.timer);
        p.anim?.cancel();
        p.commit();
        pending.current = null;
      }
    };
  }, []);

  // Start de animatie zodra de overlay (met data-mode van het doel) in de DOM staat
  useEffect(() => {
    const node = el.current;
    const p = pending.current;
    if (!target || !node || !p) return;
    const { duration, easing, half } = readTiming();
    const { reduced } = target;

    const anim = reduced
      ? node.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], {
          duration,
          easing: "linear",
        })
      : node.animate(
          [{ transform: "translateY(-100%)" }, { transform: "translateY(100vh)" }],
          { duration, easing },
        );
    p.anim = anim;
    p.timer = setTimeout(p.commit, reduced ? duration / 2 : duration * half);
    anim.onfinish = () => {
      if (pending.current === p) {
        pending.current = null;
        setTarget(null);
      }
    };
    return () => {
      clearTimeout(p.timer);
      anim.cancel();
    };
  }, [target]);

  if (!target) return null;

  return (
    <div
      ref={el}
      key={target.key}
      data-mode={target.to}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
      style={
        target.reduced
          ? { height: "100vh", opacity: 0 }
          : {
              height: "300vh",
              transform: "translateY(-100%)",
              backgroundColor: "transparent",
              // Doorlopende band: transparant → vol (precies één scherm) → transparant
              backgroundImage:
                "linear-gradient(to bottom, transparent 0%, var(--bg) 33.33%, var(--bg) 66.67%, transparent 100%)",
            }
      }
    />
  );
}
