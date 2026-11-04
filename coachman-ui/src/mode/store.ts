import {
  computeAutoMode,
  DEFAULT_FALLBACK,
  type AutoResult,
  type Coords,
  type FallbackTimes,
  type Mode,
} from "./schedule";

export type ModePreference = "auto" | "day" | "night";
export type LocationStatus = "none" | "pending" | "granted" | "denied" | "unavailable";

export type ModeState = {
  /** Actieve modus. */
  mode: Mode;
  /** Waar de modus vandaan komt. */
  source: "auto" | "manual";
  /** Ingestelde voorkeur (per apparaat opgeslagen). */
  preference: ModePreference;
  /** Resultaat van de automatische berekening (ook bij handmatige override). */
  auto: AutoResult;
  location: Coords | null;
  locationStatus: LocationStatus;
  fallback: FallbackTimes;
};

const KEY_PREF = "coachman.mode";
const KEY_LOC = "coachman.location";
const KEY_FALLBACK = "coachman.fallback";
/** Laatst berekende auto-modus + geldig-tot, zodat het init-script niet hoeft te rekenen. */
const KEY_AUTO_CACHE = "coachman.auto";

/* ---------- opslag (alles in try/catch: privévenster, geblokkeerde opslag) ---------- */

function read<T>(key: string, parse: (raw: string) => T | null): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? null : parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* opslag niet beschikbaar — negeren */
  }
}

const parsePref = (raw: string): ModePreference | null =>
  raw === "auto" || raw === "day" || raw === "night" ? raw : null;

const parseJSON = <T,>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const isCoords = (c: unknown): c is Coords =>
  !!c && typeof (c as Coords).lat === "number" && typeof (c as Coords).lon === "number";

const isTime = (s: unknown) => typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
const isFallback = (f: unknown): f is FallbackTimes =>
  !!f && isTime((f as FallbackTimes).dayStart) && isTime((f as FallbackTimes).nightStart);

/* ---------- store ---------- */

let preference: ModePreference = "auto";
let location: Coords | null = null;
let locationStatus: LocationStatus = "none";
let fallback: FallbackTimes = DEFAULT_FALLBACK;
let state: ModeState;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function load() {
  preference = read(KEY_PREF, parsePref) ?? "auto";
  const loc = read(KEY_LOC, parseJSON<unknown>);
  location = isCoords(loc) ? loc : null;
  locationStatus = location ? "granted" : "none";
  const fb = read(KEY_FALLBACK, parseJSON<unknown>);
  fallback = isFallback(fb) ? fb : DEFAULT_FALLBACK;
}

function compute(): ModeState {
  const auto = computeAutoMode(new Date(), location, fallback);
  const manual = preference !== "auto";
  return {
    mode: manual ? (preference as Mode) : auto.mode,
    source: manual ? "manual" : "auto",
    preference,
    auto,
    location,
    locationStatus,
    fallback,
  };
}

/**
 * Optionele overgang (ModeTransition registreert zich hier). Krijgt de doelmodus
 * en een commit-functie die de tokens wisselt — halverwege de animatie.
 */
export type ModeTransitionHandler = (to: Mode, commit: () => void) => void;
let transition: ModeTransitionHandler | null = null;
/** Laatst doorgevoerde doelmodus; null = nog niets toegepast (eerste paginalaad). */
let applied: Mode | null = null;

export function setModeTransition(fn: ModeTransitionHandler) {
  transition = fn;
  return () => {
    if (transition === fn) transition = null;
  };
}

/** Houdt <meta name="theme-color"> gelijk aan --bg (statusbalk van de PWA). */
function syncThemeColor() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  if (bg) meta.content = bg;
}

function apply() {
  if (typeof document !== "undefined") {
    const to = state.mode;
    const root = document.documentElement;
    const commit = () => {
      root.dataset.mode = to;
      syncThemeColor();
    };
    // Alleen animeren bij een echte wissel, nooit bij de eerste paginalaad.
    if (transition && applied !== null && applied !== to && !document.hidden) transition(to, commit);
    else if (applied !== to) commit();
    applied = to;
  }
  const until = state.auto.next?.getTime();
  write(KEY_AUTO_CACHE, until ? JSON.stringify({ mode: state.auto.mode, until }) : null);
}

/** Plant een herberekening op het volgende wisselmoment (en minstens elk uur). */
function schedule() {
  clearTimeout(timer);
  if (listeners.size === 0) return;
  const next = state.auto.next?.getTime() ?? Infinity;
  const delay = Math.max(1_000, Math.min(next - Date.now() + 1_000, 3_600_000));
  timer = setTimeout(refresh, delay);
}

function refresh() {
  const prev = state;
  state = compute();
  apply();
  schedule();
  if (
    prev.mode !== state.mode ||
    prev.source !== state.source ||
    prev.auto.next?.getTime() !== state.auto.next?.getTime() ||
    prev.preference !== state.preference ||
    prev.location !== state.location ||
    prev.locationStatus !== state.locationStatus ||
    prev.fallback !== state.fallback
  ) {
    listeners.forEach((l) => l());
  }
}

load();
state = compute();
apply();

/* ---------- publieke API ---------- */

export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    refresh();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
      document.addEventListener("visibilitychange", onVisible);
    }
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearTimeout(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
        document.removeEventListener("visibilitychange", onVisible);
      }
    }
  };
}

export const getSnapshot = () => state;

/** Andere tab wijzigde de voorkeur. */
function onStorage(e: StorageEvent) {
  if (e.key && e.key.startsWith("coachman.") && e.key !== KEY_AUTO_CACHE) {
    load();
    refresh();
  }
}

/** Terug naar de app (bijv. na slaapstand): direct herberekenen. */
function onVisible() {
  if (document.visibilityState === "visible") refresh();
}

export function setPreference(next: ModePreference) {
  preference = next;
  write(KEY_PREF, next);
  refresh();
}

export function setFallback(next: FallbackTimes) {
  if (!isFallback(next)) return;
  fallback = next;
  write(KEY_FALLBACK, JSON.stringify(next));
  refresh();
}

/** Vraagt locatie op (alleen op verzoek van de gebruiker) voor echte zonsondergang. */
export function requestLocation(): Promise<Coords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    locationStatus = "unavailable";
    refresh();
    return Promise.resolve(null);
  }
  locationStatus = "pending";
  refresh();
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Afgerond op ~1 km: genoeg voor zonstijden, minder privacygevoelig.
        location = {
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lon: Math.round(pos.coords.longitude * 100) / 100,
        };
        locationStatus = "granted";
        write(KEY_LOC, JSON.stringify(location));
        refresh();
        resolve(location);
      },
      () => {
        locationStatus = "denied";
        refresh();
        resolve(null);
      },
      { maximumAge: 86_400_000, timeout: 15_000 },
    );
  });
}

/** Vergeet de opgeslagen locatie; terug naar vaste tijden. */
export function clearLocation() {
  location = null;
  locationStatus = "none";
  write(KEY_LOC, null);
  refresh();
}
