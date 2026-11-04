import { useState, type MouseEvent, type ReactNode } from "react";
import { Search } from "lucide-react";
import { cx } from "../utils/cx";
import { ModeToggle } from "../mode/ModeToggle";
import { ModeTransition } from "../mode/ModeTransition";
import { NightLayer } from "../mode/NightLayer";
import { CommandBar, type Command, type CommandBarProps } from "../signature/CommandBar";

export type NavItem = {
  id: string;
  label: string;
  /** Lucide-icoon, bijv. <Home />. */
  icon: ReactNode;
  href?: string;
  /** Teller/markering (bijv. aantal open taken). */
  badge?: ReactNode;
};

export type AppShellProps = {
  /** 4–5 hoofdbestemmingen; op mobiel de onderbalk, op desktop de zijbalk. */
  nav: NavItem[];
  activeId?: string;
  /**
   * Navigatie afhandelen (router). Zonder deze functie volgen links gewoon hun href.
   * Met deze functie wordt de standaard-navigatie onderdrukt.
   */
  onNavigate?: (item: NavItem) => void;
  /** Naam van de tool onder het woordmerk, bijv. "Wayne Protocol". */
  appName?: ReactNode;
  /** Eigen woordmerk/logo i.p.v. "THE COACHMAN". */
  brand?: ReactNode;
  /** Commando's voor de CommandBar (⌘K / swipe). Laat weg om hem niet te tonen. */
  commands?: Command[];
  commandBarProps?: Omit<CommandBarProps, "commands" | "open" | "onOpenChange">;
  /** Onderaan de zijbalk; standaard de ModeToggle. */
  sidebarFooter?: ReactNode;
  /** Korrel/vignet + dag/nacht-overgang (standaard aan). */
  atmosphere?: boolean;
  children: ReactNode;
};

/**
 * AppShell (§5). Mobiel: content met onderbalk (4–5 iconen, safe-area).
 * Desktop: smalle zijbalk met iconen + labels. Pagina's starten zelf met een DayHeader.
 */
export function AppShell({
  nav,
  activeId,
  onNavigate,
  appName,
  brand,
  commands,
  commandBarProps,
  sidebarFooter,
  atmosphere = true,
  children,
}: AppShellProps) {
  const [commandsOpen, setCommandsOpen] = useState(false);

  const linkProps = (item: NavItem) => ({
    href: item.href ?? "#",
    "aria-current": item.id === activeId ? ("page" as const) : undefined,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (onNavigate) {
        e.preventDefault();
        onNavigate(item);
      }
    },
  });

  return (
    <div className="relative min-h-dvh bg-bg text-ink md:grid md:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
      {atmosphere && (
        <>
          <NightLayer />
          <ModeTransition />
        </>
      )}

      <a
        href="#cm-content"
        className="sr-only z-50 rounded-md bg-surface px-s-4 py-s-2 text-small shadow-2 focus:not-sr-only focus:fixed focus:left-s-4 focus:top-s-4"
      >
        Naar inhoud
      </a>

      {/* ---------- Zijbalk (desktop) ---------- */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-bg md:flex">
        <div className="px-s-5 pb-s-5 pt-s-6">
          {brand ?? (
            <p className="font-display text-h3 font-semibold uppercase tracking-display text-ink">The Coachman</p>
          )}
          {appName && <p className="mt-s-1 text-label uppercase text-faint">{appName}</p>}
        </div>

        {commands && (
          <div className="px-s-3 pb-s-3">
            <button
              type="button"
              onClick={() => setCommandsOpen(true)}
              className="flex h-control-md w-full items-center gap-s-2 rounded-md border border-line bg-surface-2 px-s-3 text-small text-faint transition-colors duration-fast hover:border-muted hover:text-muted [&_svg]:size-[calc(var(--icon-ui)*0.85)]"
            >
              <Search aria-hidden />
              <span className="flex-1 text-left">Zoeken</span>
              <kbd className="font-mono text-mono">⌘K</kbd>
            </button>
          </div>
        )}

        <nav aria-label="Hoofdmenu" className="flex-1 overflow-y-auto px-s-3">
          <ul className="grid gap-s-1">
            {nav.map((item) => {
              const active = item.id === activeId;
              return (
                <li key={item.id}>
                  <a
                    {...linkProps(item)}
                    className={cx(
                      "relative flex h-control-md items-center gap-s-3 rounded-md px-s-3 text-small font-medium",
                      "transition-colors duration-fast ease [&_svg]:size-icon-ui [&_svg]:shrink-0",
                      active ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {active && (
                      <span aria-hidden className="absolute inset-y-s-2 left-0 w-px bg-accent" />
                    )}
                    <span className={active ? "text-accent" : undefined}>{item.icon}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge != null && (
                      <span className="font-mono text-mono tabular-nums text-faint">{item.badge}</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-line p-s-3">{sidebarFooter ?? <ModeToggle className="w-full [&>button]:flex-1" />}</div>
      </aside>

      {/* ---------- Inhoud ---------- */}
      <main
        id="cm-content"
        tabIndex={-1}
        className="relative z-[1] min-w-0 px-s-4 pb-[calc(var(--bottombar-h)+env(safe-area-inset-bottom)+var(--s-7))] pt-[max(var(--s-5),env(safe-area-inset-top))] outline-none md:px-s-6 md:pb-s-8 md:pt-s-7 lg:px-s-7"
      >
        {children}
      </main>

      {/* ---------- Onderbalk (mobiel) ---------- */}
      <nav
        aria-label="Hoofdmenu"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-1 md:hidden"
      >
        <ul className="grid h-bottombar" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id} className="min-w-0">
                <a
                  {...linkProps(item)}
                  className={cx(
                    "relative flex h-full flex-col items-center justify-center gap-s-1",
                    "transition-colors duration-fast ease [&_svg]:size-icon-nav",
                    active ? "text-ink" : "text-faint",
                  )}
                >
                  {active && <span aria-hidden className="absolute inset-x-s-5 top-0 h-px bg-accent" />}
                  <span className={cx("relative", active && "text-accent")}>
                    {item.icon}
                    {item.badge != null && (
                      <span className="absolute -right-s-2 -top-s-1 min-w-s-4 rounded-full bg-surface-2 px-s-1 text-center font-mono text-[0.625rem] leading-[var(--s-4)] tabular-nums text-muted ring-1 ring-line">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate px-s-1 text-[0.6875rem] font-medium leading-none">
                    {item.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {commands && (
        <CommandBar commands={commands} open={commandsOpen} onOpenChange={setCommandsOpen} {...commandBarProps} />
      )}
    </div>
  );
}
