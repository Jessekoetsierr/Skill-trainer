// One interface for every AI call, with swappable engines:
//   artifact: runs on the viewer's own Claude plan (inside claude.ai)
//   local:    server.mjs drives the Claude Code CLI on your own subscription
//   later:    a paid version swaps in a server that calls the API

export type Tier = "quick" | "default" | "complex";
export type AskOptions = { tier?: Tier; onText?: (u: { text: string; delta: string }) => void; signal?: AbortSignal; json?: boolean };
export type BrainError = { code: string; message?: string; text?: string };
export type BrainMode = "artifact" | "local" | null;

type SampleFn = ((input: string, opts?: object) => Promise<{ text: string }>) & { json: (input: string, opts?: object) => Promise<unknown> };

declare global {
  interface Window { claude?: { use: (name: string) => Promise<unknown> } }
}

export function parseJsonLoose(text: string): unknown {
  try { return JSON.parse(text); } catch { /* try the next shape */ }
  const f = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (f) { try { return JSON.parse(f[1]); } catch { /* next */ } }
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch { /* fall through */ } }
  throw { code: "invalid_json", message: "Geen geldige JSON", text } satisfies BrainError;
}

class BrainImpl {
  mode: BrainMode = null;
  mock = false;
  /** Local server: result of its Claude Code self-test (ok, bezig, ontbreekt, fout). */
  cli = "ok";
  private sample: SampleFn | null = null;

  async detect(): Promise<BrainMode> {
    if (window.claude && typeof window.claude.use === "function") {
      try {
        const s = (await window.claude.use("sample")) as SampleFn | null;
        if (s) { this.sample = s; this.mode = "artifact"; return this.mode; }
      } catch { /* no sampling in this view */ }
    } else if (/^https?:$/.test(location.protocol)) {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (j?.ok) { this.mode = "local"; this.mock = j.mode === "mock"; this.cli = j.claude ?? "ok"; return this.mode; }
        }
      } catch { /* no local server */ }
    }
    this.mode = null;
    return null;
  }

  async ask<T = string>(prompt: string, { tier = "quick", onText, signal, json = false }: AskOptions = {}): Promise<T> {
    if (this.mode === "artifact" && this.sample) {
      const opts: Record<string, unknown> = { modelTier: tier, cache: false };
      if (signal) opts.signal = signal;
      if (onText) opts.onText = onText;
      if (json) return (await this.sample.json(prompt, opts)) as T;
      return (await this.sample(prompt, opts)).text as T;
    }
    if (this.mode === "local") {
      let res: Response;
      try {
        res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, tier }), signal });
      } catch (e) {
        throw { code: signal?.aborted ? "cancelled" : "upstream_error", message: String((e as Error)?.message ?? e) } satisfies BrainError;
      }
      if (!res.ok || !res.body) throw { code: "upstream_error", message: await res.text() } satisfies BrainError;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const d = dec.decode(value, { stream: true });
          if (!d) continue;
          text += d;
          const ei = text.indexOf("\u0000ERROR:");
          if (ei >= 0) throw { code: "upstream_error", message: text.slice(ei + 7).trim(), text: text.slice(0, ei) } satisfies BrainError;
          onText?.({ text, delta: d });
        }
      } catch (e) {
        if (signal?.aborted) throw { code: "cancelled", text } satisfies BrainError;
        throw (e as BrainError)?.code ? e : ({ code: "upstream_error", message: String(e) } satisfies BrainError);
      }
      if (!text.trim()) throw { code: "empty_completion", message: "Leeg antwoord" } satisfies BrainError;
      return (json ? parseJsonLoose(text) : text) as T;
    }
    throw { code: "sampling_disabled", message: "Geen AI-verbinding" } satisfies BrainError;
  }
}

export const Brain = new BrainImpl();

export function errCopy(e: unknown): string {
  const err = e as BrainError | undefined;
  switch (err?.code) {
    case "not_granted": return "Je hebt de pagina geen toestemming gegeven om Claude te gebruiken. Herlaad de pagina en kies Toestaan.";
    case "rate_limited": return "Je hebt even te veel gevraagd of je gebruikslimiet bereikt. Wacht een paar minuten en probeer het opnieuw.";
    case "sampling_disabled": return "Er is geen AI-verbinding. Open Tegenspeler in Claude of start de lokale versie.";
    case "session_expired": return "Je bent uitgelogd bij Claude. Log opnieuw in en herlaad de pagina.";
    case "invalid_json": return "Het antwoord kwam niet in het juiste formaat terug. Probeer het nog een keer.";
    case "refused": return "Claude wilde hier niet op reageren. Probeer het anders te formuleren.";
    default: return "De verbinding met de AI viel weg. Probeer het nog een keer." + (err?.message && Brain.mode === "local" ? ` (${err.message})` : "");
  }
}
