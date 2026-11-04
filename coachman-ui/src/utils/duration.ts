/** Leest een CSS-duur ("120ms", "1.4s", ".15s") als milliseconden. */
export function parseDuration(value: string, fallback: number) {
  const v = value.trim();
  const n = parseFloat(v);
  if (Number.isNaN(n)) return fallback;
  return /ms$/i.test(v) ? n : /s$/i.test(v) ? n * 1000 : n;
}

/** Duur-token van een element (standaard <html>), bijv. cssDuration("--dur-mode", 1400). */
export function cssDuration(name: string, fallback: number, el: Element = document.documentElement) {
  return parseDuration(getComputedStyle(el).getPropertyValue(name), fallback);
}
