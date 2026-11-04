import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "../utils/cx";

type TabsCtx = {
  value: string;
  select: (v: string) => void;
  baseId: string;
};

const Ctx = createContext<TabsCtx | null>(null);
const useTabs = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("Tab/TabList/TabPanel moeten binnen <Tabs> staan.");
  return c;
};

export type TabsProps = {
  /** Gecontroleerde waarde. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
};

export function Tabs({ value, defaultValue = "", onValueChange, className, children }: TabsProps) {
  const [inner, setInner] = useState(defaultValue);
  const baseId = useId();
  const current = value ?? inner;
  const select = (v: string) => {
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };
  return (
    <Ctx.Provider value={{ value: current, select, baseId }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export type TabListProps = HTMLAttributes<HTMLDivElement> & { "aria-label"?: string };

/** Underline-stijl; pijltjes, Home en End wisselen van tab. */
export function TabList({ className, children, ...rest }: TabListProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? [],
    );
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cx(
        "flex gap-s-5 overflow-x-auto border-b border-line [scrollbar-width:none]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export type TabProps = Omit<HTMLAttributes<HTMLButtonElement>, "onClick"> & {
  value: string;
  disabled?: boolean;
  /** Teller of tag rechts van het label. */
  badge?: ReactNode;
};

export function Tab({ value, disabled, badge, className, children, ...rest }: TabProps) {
  const { value: current, select, baseId } = useTabs();
  const active = current === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={active}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      onClick={() => select(value)}
      className={cx(
        "relative -mb-px inline-flex min-h-hit shrink-0 items-center gap-s-2 border-b py-s-2 text-small font-medium md:min-h-control-md",
        "transition-colors duration-fast ease focus-visible:rounded-sm",
        active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
      {badge}
    </button>
  );
}

export type TabPanelProps = HTMLAttributes<HTMLDivElement> & { value: string };

export function TabPanel({ value, className, children, ...rest }: TabPanelProps) {
  const { value: current, baseId } = useTabs();
  if (current !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cx("pt-s-5 focus-visible:rounded-sm", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
