/**
 * Zonsopkomst/-ondergang (NOAA-benadering van de "sunrise equation").
 * Nauwkeurig tot ~1–2 minuten op gematigde breedtes — ruim genoeg voor de modus.
 */

const RAD = Math.PI / 180;
const J1970 = 2440587.5;
const J2000 = 2451545.0;
const DAY_MS = 86_400_000;

const toJulian = (d: Date) => d.getTime() / DAY_MS + J1970;
const fromJulian = (j: number) => new Date((j - J1970) * DAY_MS);

export type SunTimes =
  | { kind: "normal"; sunrise: Date; sunset: Date }
  | { kind: "polar-day" }
  | { kind: "polar-night" };

/**
 * @param date  willekeurig moment op de gewenste (lokale) dag
 * @param lat   breedtegraad, noord positief
 * @param lon   lengtegraad, oost positief
 */
export function getSunTimes(date: Date, lat: number, lon: number): SunTimes {
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);

  const n = Math.round(toJulian(noon) - J2000 + 0.0008);
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C =
    1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = J2000 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);

  const sinDec = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosW =
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec);

  if (cosW > 1) return { kind: "polar-night" };
  if (cosW < -1) return { kind: "polar-day" };

  const w = Math.acos(cosW) / RAD;
  return {
    kind: "normal",
    sunrise: fromJulian(jTransit - w / 360),
    sunset: fromJulian(jTransit + w / 360),
  };
}
