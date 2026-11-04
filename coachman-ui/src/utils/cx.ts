/** Voegt classnames samen; falsy waarden vallen weg. */
export function cx(...parts: (string | false | null | undefined | 0)[]) {
  return parts.filter(Boolean).join(" ");
}
