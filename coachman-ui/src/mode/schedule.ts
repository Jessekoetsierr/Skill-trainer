import { getSunTimes } from "./sun";

export type Mode = "day" | "night";
export type Coords = { lat: number; lon: number };
/** Vaste tijden als "HH:MM" (lokale tijd). */
export type FallbackTimes = { dayStart: string; nightStart: string };

export const DEFAULT_FALLBACK: FallbackTimes = { dayStart: "07:00", nightStart: "19:00" };

export type AutoResult = {
  mode: Mode;
  /** Moment van de volgende wissel (null bij poolnacht/-dag zonder wissel vandaag). */
  next: Date | null;
  /** Waar de berekening op gebaseerd is. */
  basis: "sun" | "fallback";
  /** Zonsopkomst/-ondergang of vaste tijden voor vandaag. */
  dayStart: Date | null;
  nightStart: Date | null;
};

const atTime = (base: Date, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

const addDays = (d: Date, days: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
};

function boundsFor(day: Date, coords: Coords | null, fallback: FallbackTimes) {
  if (coords) {
    const t = getSunTimes(day, coords.lat, coords.lon);
    if (t.kind === "normal") return { start: t.sunrise, end: t.sunset, polar: null };
    return { start: null, end: null, polar: t.kind === "polar-day" ? "day" : ("night" as Mode) };
  }
  return { start: atTime(day, fallback.dayStart), end: atTime(day, fallback.nightStart), polar: null };
}

/** Berekent de automatische modus voor een gegeven moment. */
export function computeAutoMode(
  now: Date,
  coords: Coords | null,
  fallback: FallbackTimes = DEFAULT_FALLBACK,
): AutoResult {
  const basis = coords ? "sun" : "fallback";
  const today = boundsFor(now, coords, fallback);

  if (today.polar) {
    return { mode: today.polar, next: null, basis, dayStart: null, nightStart: null };
  }

  const { start, end } = today as { start: Date; end: Date };
  let mode: Mode;
  let next: Date | null;

  if (start < end) {
    // Normaal: dag tussen start en eind
    if (now < start) {
      mode = "night";
      next = start;
    } else if (now < end) {
      mode = "day";
      next = end;
    } else {
      mode = "night";
      const tomorrow = boundsFor(addDays(now, 1), coords, fallback);
      next = tomorrow.start;
    }
  } else {
    // Omgekeerde vaste tijden (bijv. dag 20:00, nacht 06:00): dag loopt over middernacht
    if (now < end) {
      mode = "day";
      next = end;
    } else if (now < start) {
      mode = "night";
      next = start;
    } else {
      mode = "day";
      next = boundsFor(addDays(now, 1), coords, fallback).end;
    }
  }

  return { mode, next, basis, dayStart: start, nightStart: end };
}
