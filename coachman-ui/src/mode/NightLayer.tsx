import { cx } from "../utils/cx";

/**
 * Statische filmkorrel (geen ruis-animatie). Inline SVG-turbulentie → wit met
 * willekeurige alpha; de dekking komt uit --night-grain-opacity.
 */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
).replace(/%2523/g, "%23")}")`;

export type NightLayerProps = {
  /**
   * fixed (standaard): over het hele scherm, één keer in de app.
   * contained: vult de dichtstbijzijnde positioned parent (bijv. een kaart of paneel).
   */
  contained?: boolean;
  /**
   * overlay (standaard): over de inhoud, z-40. behind: achter de inhoud (z-0) —
   * handig als er dag-vlakken op een nacht-pagina staan, zoals in de showcase.
   */
  layer?: "overlay" | "behind";
  className?: string;
};

/**
 * De nacht-sfeer (§2): zeer subtiele korrel + zachte radiale vignet vanaf de
 * bovenkant, alsof er één lamp brandt. Zichtbaarheid volgt de tokens: in dag
 * --night-layer-opacity 0, in nacht 1, met een fade die ná de ModeTransition inzet.
 */
export function NightLayer({ contained = false, layer = "overlay", className }: NightLayerProps) {
  return (
    <div
      aria-hidden
      className={cx(
        "pointer-events-none overflow-hidden",
        layer === "behind" ? "z-0" : "z-40",
        contained ? "absolute inset-0 rounded-[inherit]" : "fixed inset-0",
        "transition-opacity duration-slow ease",
        className,
      )}
      style={{ opacity: "var(--night-layer-opacity)", transitionDelay: "var(--dur-fast)" }}
    >
      <div className="absolute inset-0" style={{ backgroundImage: "var(--night-vignette)" }} />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: GRAIN, opacity: "var(--night-grain-opacity)" }}
      />
    </div>
  );
}
