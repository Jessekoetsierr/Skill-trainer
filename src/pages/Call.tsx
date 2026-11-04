import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Card, Checkbox, DetailPage, Log, LogEntry, Progress, Spinner, Tag, Textarea, useToast } from "coachman-ui";
import { Mic, MicOff } from "lucide-react";
import { Brain, errCopy, type BrainError } from "../lib/brain";
import { LEVELS, PERSONAS, SCENARIOS, type Company, type Level, type Persona, type Scenario } from "../lib/content";
import { dossierPrompt, firstName, turnPrompt, type Dossier, type Turn } from "../lib/prompts";
import { Ears, Ring, Voice } from "../lib/speech";
import type { Selection } from "./Train";

export type CallResult = { s: Scenario; p: Persona; d: Level; dossier: Dossier; turns: Turn[]; duration: number };
type Phase = "preparing" | "thinking" | "speaking" | "listening" | "ended";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
/** What the customer says, without the [[interesse:N]] tags and stage directions. */
const visible = (t: string) => {
  let i = t.indexOf("[[");
  if (i < 0) { const j = t.lastIndexOf("["); i = j >= 0 && j >= t.length - 1 ? j : -1; }
  return (i >= 0 ? t.slice(0, i) : t).replace(/\*[^*]*\*/g, "").trim();
};

export function CallPage({ sel, company, onCancel, onDone }: {
  sel: Selection; company: Company; onCancel: () => void; onDone: (r: CallResult) => void;
}) {
  const s = SCENARIOS.find((x) => x.id === sel.scen) ?? SCENARIOS[0];
  const p = PERSONAS.find((x) => x.id === sel.pers) ?? PERSONAS[0];
  const d = LEVELS.find((x) => x.id === sel.lvl) ?? LEVELS[1];
  const name = firstName(p.naam);
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("preparing");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [live, setLive] = useState<string>(""); // customer's line while it streams in
  const [mood, setMood] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [heard, setHeard] = useState("");
  const [voiceMode, setVoiceMode] = useState(Ears.supported);
  const [listening, setListening] = useState(false);
  const [draft, setDraftState] = useState("");
  const draftRef = useRef("");
  const setDraft = (v: string) => { draftRef.current = v; setDraftState(v); };
  const [autoSend, setAutoSend] = useState(true);
  const [dossier, setDossier] = useState<Dossier | null>(null);

  const ref = useRef({ turns: [] as Turn[], dossier: null as Dossier | null, startedAt: 0, ended: false, busy: false, ctl: null as AbortController | null, sendTimer: 0 as number | undefined });
  const ring = useRef<HTMLDivElement>(null);
  const logEnd = useRef<HTMLDivElement>(null);

  const at = () => (ref.current.startedAt ? Date.now() - ref.current.startedAt : 0);
  const pushTurn = (t: Turn) => { ref.current.turns = [...ref.current.turns, t]; setTurns(ref.current.turns); };

  const stopAll = () => {
    ref.current.ended = true;
    Ring.stop(); Voice.stop(); Ears.stop();
    try { ref.current.ctl?.abort(); } catch { /* ignore */ }
  };

  const listen = () => {
    if (ref.current.ended) return;
    setPhase("listening");
    if (Ears.supported) Ears.start();
  };

  const customerTurn = async () => {
    const r = ref.current;
    r.busy = true;
    setPhase("thinking");
    const ctl = (r.ctl = new AbortController());
    let spoken = 0;
    const feed = (vis: string, final: boolean) => {
      const rest = vis.slice(spoken);
      if (final) { if (rest.trim()) Voice.speak(rest, p); spoken = vis.length; return; }
      // speak each finished sentence while the rest is still being written
      const re = /[^.!?…]*[.!?…]+["'”)]*(?=\s)/g;
      let m: RegExpExecArray | null, upto = 0;
      while ((m = re.exec(rest))) upto = m.index + m[0].length;
      if (upto > 0) { Voice.speak(rest.slice(0, upto), p); spoken += upto; }
    };
    let raw = "";
    try {
      raw = await Brain.ask<string>(turnPrompt({ s, p, d, co: company, x: r.dossier!, turns: r.turns }), {
        tier: "quick", signal: ctl.signal,
        onText: ({ text }) => { if (r.ended) return; const v = visible(text); if (v) { setLive(v); feed(v, false); } },
      });
    } catch (e) {
      setLive("");
      if (r.ended || (e as BrainError)?.code === "cancelled") return;
      r.busy = false;
      toast({ title: "De klant reageerde niet", description: errCopy(e), tone: "danger" });
      // let the seller say it again
      const last = r.turns[r.turns.length - 1];
      r.turns = r.turns.slice(0, -1); setTurns(r.turns);
      if (last && !Ears.supported) setDraft(last.text);
      listen();
      return;
    }
    if (r.ended) return;
    const vis = visible(raw) || "…";
    feed(vis, true);
    setLive("");
    pushTurn({ who: "klant", text: vis, at: at() });
    const m = raw.match(/\[\[\s*interesse\s*:\s*(\d{1,3})/i);
    if (m) setMood(Math.min(100, +m[1]));
    const ended = /\[\[\s*einde\s*\]\]/i.test(raw);
    if (Voice.on && "speechSynthesis" in window) await Voice.drain(); else await sleep(300);
    r.busy = false;
    if (r.ended) return;
    if (ended) {
      toast({ title: `${name} heeft het gesprek beëindigd` });
      await sleep(900);
      finish();
      return;
    }
    listen();
  };

  const sellerSays = (text: string) => {
    const r = ref.current;
    text = text.trim();
    if (!text || r.ended || r.busy) return;
    pushTurn({ who: "jij", text, at: at() });
    customerTurn();
  };

  const finish = () => {
    const r = ref.current;
    const duration = at();
    stopAll();
    setPhase("ended");
    if (!r.dossier) { onCancel(); return; }
    onDone({ s, p, d, dossier: r.dossier, turns: r.turns, duration });
  };

  // Start: prepare the customer, ring if it is a phone call, then the customer opens.
  useEffect(() => {
    const r = ref.current;
    r.ended = false;
    Voice.onSpeakStart = () => setPhase("speaking");
    Ears.onHeard = setHeard;
    Ears.onCommit = sellerSays;
    Ears.onListening = setListening;
    Ears.onBlocked = () => { setVoiceMode(false); toast({ title: "Microfoon niet beschikbaar", description: "Typ of dicteer je antwoord.", tone: "info" }); };

    (async () => {
      const ringing = s.kanaal === "telefoon" ? Ring.play(2) : Promise.resolve();
      r.ctl = new AbortController();
      try {
        const x = await Brain.ask<Dossier>(dossierPrompt({ s, p, d, co: company }), { tier: "quick", json: true, signal: r.ctl.signal });
        if (!x?.openingszin) throw { code: "invalid_json" };
        r.dossier = x; setDossier(x);
      } catch (e) {
        Ring.stop();
        if (r.ended || (e as BrainError)?.code === "cancelled") return;
        toast({ title: "Het gesprek kon niet starten", description: errCopy(e), tone: "danger" });
        stopAll(); onCancel();
        return;
      }
      await ringing;
      if (r.ended) return;
      r.startedAt = Date.now();
      setMood(Math.max(0, Math.min(100, Number(r.dossier.startinteresse) || 30)));
      const open = String(r.dossier.openingszin).trim();
      pushTurn({ who: "klant", text: open, at: 0 });
      r.busy = true;
      Voice.speak(open, p);
      await Voice.drain();
      r.busy = false;
      listen();
    })();

    const tick = setInterval(() => setElapsed(at()), 500);
    // the ring around the customer breathes with the voice
    let raf = 0;
    const loop = () => {
      Voice.level *= 0.88;
      ring.current?.style.setProperty("--lvl", Voice.level.toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      clearInterval(tick); cancelAnimationFrame(raf); stopAll();
      Voice.onSpeakStart = null; Ears.onHeard = null; Ears.onCommit = null; Ears.onListening = null; Ears.onBlocked = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { logEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [turns.length, live]);

  const sendDraft = () => {
    clearTimeout(ref.current.sendTimer);
    const t = draftRef.current;
    if (!t.trim() || ref.current.busy || ref.current.ended) return;
    setDraft(""); sellerSays(t);
  };

  const myTurn = phase === "listening";
  const stateText = {
    preparing: s.kanaal === "telefoon" ? `Je belt ${name}…` : `${name} wordt voorbereid…`,
    thinking: `${name} denkt na…`,
    speaking: `${name} praat`,
    listening: voiceMode ? "Jouw beurt. Praat maar, ik luister." : "Jouw beurt.",
    ended: "Gesprek beëindigd",
  }[phase];

  return (
    <DetailPage
      back={{ label: "Stoppen", onClick: () => { stopAll(); onCancel(); } }}
      label={`${s.titel} · ${d.label}`}
      title={p.naam}
      status={clock(elapsed)}
      meta={[
        { label: "Klanttype", value: p.titel },
        { label: "Functie", value: dossier ? `${dossier.functie}, ${dossier.bedrijf}` : "–" },
      ]}
      actions={
        <>
          <Button variant="secondary" disabled={phase !== "speaking"} onClick={() => { Voice.stop(); ref.current.busy = false; listen(); }}>
            Onderbreek de klant
          </Button>
          <Button variant="danger" onClick={finish}>Gesprek afronden</Button>
        </>
      }
    >
      <div className="grid gap-s-5">
        <Card>
          <div className="flex flex-wrap items-center gap-s-5">
            <div
              ref={ring}
              className="cm-presence relative grid shrink-0 place-items-center rounded-full p-s-2"
              data-phase={phase}
            >
              <Avatar name={p.naam} size="lg" />
            </div>
            <div className="grid min-w-0 flex-1 gap-s-3">
              <p className="flex items-center gap-s-2 text-body text-ink" aria-live="polite">
                {(phase === "preparing" || phase === "thinking") && <Spinner />}
                {stateText}
              </p>
              <Progress value={mood ?? 0} label="Interesse van de klant" valueLabel={mood == null ? "–" : `${mood}/100`} />
            </div>
          </div>
        </Card>

        <section aria-label="Gesprek">
          {turns.length === 0 && !live ? (
            <p className="py-s-5 text-center text-small text-muted">Het gesprek verschijnt hier terwijl jullie praten.</p>
          ) : (
            <Log>
              {turns.map((t, i) => (
                <LogEntry key={i} time={clock(t.at)} title={t.text} meta={t.who === "klant" ? name : "Jij"} done={t.who === "jij"} />
              ))}
              {live && <LogEntry time={clock(elapsed)} title={live} meta={name} />}
            </Log>
          )}
          <div ref={logEnd} />
        </section>

        {voiceMode ? (
          <Card variant="inset">
            <div className="grid gap-s-3">
              <div className="flex items-center gap-s-2 text-small text-muted [&_svg]:size-icon-ui">
                {listening ? <Mic aria-hidden className="text-accent" /> : <MicOff aria-hidden />}
                {listening ? "Microfoon luistert" : "Microfoon wacht"}
              </div>
              <p className="min-h-s-5 text-body text-ink">{heard || <span className="text-faint">Wat je zegt, verschijnt hier.</span>}</p>
              <div className="flex flex-wrap items-center justify-between gap-s-3">
                <Button variant="ghost" size="sm" onClick={() => { Ears.stop(); setVoiceMode(false); }}>
                  Liever typen
                </Button>
                <Button variant="primary" disabled={!listening} onClick={() => Ears.commit()}>Klaar met praten</Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="inset">
            <div className="grid gap-s-3">
              <Textarea
                id="zeg"
                label="Jouw antwoord"
                minRows={2}
                maxRows={6}
                value={draft}
                disabled={!myTurn}
                placeholder={`Zeg iets tegen ${name}…`}
                onChange={(e) => {
                  setDraft(e.target.value);
                  clearTimeout(ref.current.sendTimer);
                  if (autoSend) ref.current.sendTimer = window.setTimeout(sendDraft, 2200);
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); sendDraft(); } }}
              />
              <div className="flex flex-wrap items-center justify-between gap-s-3">
                <Checkbox label="Verstuur vanzelf als ik stil val" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} />
                <Button variant="primary" disabled={!myTurn || !draft.trim()} onClick={sendDraft}>Stuur</Button>
              </div>
              <p className="flex flex-wrap items-center gap-s-1 text-small text-muted">
                Praten in plaats van typen? Dicteer met <Tag>Win + H</Tag> op Windows of <Tag>2× Fn</Tag> op Mac.
              </p>
            </div>
          </Card>
        )}
      </div>
    </DetailPage>
  );
}
