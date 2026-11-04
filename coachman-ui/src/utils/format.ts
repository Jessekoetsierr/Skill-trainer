/** Opmaak voor datums en tijden in de UI (nl-NL). */
export const LOCALE = "nl-NL";

/** "DINSDAG 3 NOVEMBER" — label-stijl, zonder jaar tenzij een ander jaar. */
export function formatDayLabel(date: Date, now = new Date()) {
  const opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
  if (date.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return date.toLocaleDateString(LOCALE, opts).toUpperCase();
}

/** "07:42" */
export function formatTime(date: Date) {
  return date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

/** ISO-string voor <time dateTime>. */
export const toISO = (d: Date) => d.toISOString();
