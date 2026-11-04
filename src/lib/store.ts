// Per-device conveniences in browser storage. Every read and write may fail
// (private windows, blocked storage), so the app works without it.
export const store = {
  get<T>(k: string, d: T): T {
    try { const v = localStorage.getItem("tegenspeler:" + k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
  },
  set(k: string, v: unknown) {
    try { localStorage.setItem("tegenspeler:" + k, JSON.stringify(v)); } catch { /* ignore */ }
  },
};

export type HistoryItem = { t: number; s: string; p: string; score: number; lvl?: string; oordeel?: string; dur?: number };
export const history = {
  all: () => store.get<HistoryItem[]>("history", []),
  add(item: HistoryItem) { store.set("history", [item, ...history.all()].slice(0, 50)); },
};
