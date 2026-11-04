import type { ReactNode } from "react";
import { cx } from "../utils/cx";

export type LedgerColumn<Row> = {
  key: string;
  header: ReactNode;
  /** Cijferkolom: rechts uitgelijnd, mono, tabular-nums. */
  numeric?: boolean;
  align?: "left" | "right" | "center";
  /** Celinhoud; standaard row[key]. */
  render?: (row: Row) => ReactNode;
  /** Breedte, bijv. "40%" of "var(--s-8)". */
  width?: string;
  /** Verbergen op smalle schermen. */
  hideOnMobile?: boolean;
};

export type LedgerProps<Row> = {
  columns: LedgerColumn<Row>[];
  rows: Row[];
  /** Sleutel per rij (standaard de index). */
  rowKey?: (row: Row, index: number) => string | number;
  /** Totaalregel: waarden per kolom-key. Krijgt een dubbele lijn erboven. */
  total?: Partial<Record<string, ReactNode>>;
  /** Toegankelijke titel van de tabel (zichtbaar als label boven de tabel). */
  caption?: ReactNode;
  /** Tekst als er geen rijen zijn. */
  empty?: ReactNode;
  /** Rij aanklikbaar maken. */
  onRowClick?: (row: Row) => void;
  dense?: boolean;
  className?: string;
};

/**
 * Tabel in logboekstijl (§4). Geen zebra-strepen, alleen 1px lijnen; cijfers rechts
 * in mono met tabular-nums; totaalregel met dubbele lijn erboven.
 */
export function Ledger<Row extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  total,
  caption,
  empty = "Nog geen regels.",
  onRowClick,
  dense,
  className,
}: LedgerProps<Row>) {
  const alignOf = (c: LedgerColumn<Row>) => c.align ?? (c.numeric ? "right" : "left");
  const cell = (c: LedgerColumn<Row>) =>
    cx(
      dense ? "py-s-2" : "py-s-3",
      "px-s-3 first:pl-0 last:pr-0",
      alignOf(c) === "left" && "text-left",
      alignOf(c) === "right" && "text-right",
      alignOf(c) === "center" && "text-center",
      c.numeric && "whitespace-nowrap font-mono text-mono tabular-nums",
      c.hideOnMobile && "hidden sm:table-cell",
    );

  return (
    <div className={cx("min-w-0 overflow-x-auto", className)}>
      <table className="w-full border-collapse text-small">
        {caption && (
          <caption className="mb-s-3 text-left text-label uppercase text-muted">{caption}</caption>
        )}
        {columns.some((c) => c.width) && (
          <colgroup>
            {columns.map((c) => (
              <col key={c.key} style={c.width ? { width: c.width } : undefined} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cx(cell(c), "pb-s-2 pt-0 font-sans text-label font-medium uppercase text-faint")}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="border-b border-line">
              <td colSpan={columns.length} className="py-s-5 text-center text-small text-faint">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx(
                  "border-b border-line text-ink",
                  onRowClick && "cursor-pointer transition-colors duration-fast hover:bg-surface-2",
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cell(c)}>
                    {c.render ? c.render(row) : (row[c.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {total && (
          <tfoot>
            <tr className="border-t-[3px] border-double border-line font-medium text-ink">
              {columns.map((c, i) => (
                <td key={c.key} className={cx(cell(c), "text-ink")}>
                  {total[c.key] ?? (i === 0 ? <span className="text-label uppercase text-muted">Totaal</span> : null)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
