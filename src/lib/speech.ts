// Speech: the customer talks (speechSynthesis), you talk (speech recognition),
// and a cold call starts with a ringing phone.
import { PERSONAS, type Persona } from "./content";
import { store } from "./store";

type Listener = () => void;

/* ---------- The customer's voice ---------- */
class VoiceImpl {
  on: boolean = store.get("voice", true);
  level = 0; // 0..1, pulses on every spoken word
  onSpeakStart: Listener | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private pending = 0;
  private waiters: Listener[] = [];

  load() {
    if (!("speechSynthesis" in window)) return;
    const grab = () => { this.voices = speechSynthesis.getVoices().filter((v) => /^nl/i.test(v.lang)); };
    grab();
    speechSynthesis.addEventListener?.("voiceschanged", grab);
  }

  setOn(on: boolean) { this.on = on; store.set("voice", on); if (!on) this.stop(); }

  private pick(p: Persona) {
    const FEM = /fenna|colette|claire|ellen|femke|lotte|saskia|google nederlands|dena|anouk|laura|hanna|sanne/i;
    const MAL = /maarten|xander|frank|arnaud|guus|daan|willem|bram|ruben|lukas/i;
    const score = (v: SpeechSynthesisVoice) => (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/premium|enhanced|google/i.test(v.name) ? 2 : 0) + (/nl-NL/i.test(v.lang) ? 1 : 0);
    const ranked = [...this.voices].sort((a, b) => score(b) - score(a));
    const match = ranked.filter((v) => (p.g === "v" ? FEM : MAL).test(v.name));
    const pool = match.length ? match : ranked;
    // spread personas of the same gender over the available voices
    const idx = PERSONAS.filter((x) => x.g === p.g).indexOf(p);
    const voice = pool.length ? pool[Math.min(idx, pool.length - 1) % pool.length] : null;
    let pitch = match.length ? 1 : p.g === "v" ? 1.15 : 0.78;
    pitch += [0, -0.06, 0.06][idx % 3] ?? 0;
    return { voice, pitch };
  }

  speak(text: string, p: Persona) {
    text = text.trim();
    if (!text || !this.on || !("speechSynthesis" in window)) return;
    const { voice, pitch } = this.pick(p);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : "nl-NL";
    if (voice) u.voice = voice;
    u.rate = p.rate || 1;
    u.pitch = pitch;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(guard);
      this.pending = Math.max(0, this.pending - 1);
      if (!this.pending) { this.level = 0; this.waiters.splice(0).forEach((f) => f()); }
    };
    // some browsers forget to fire onend
    const guard = setTimeout(done, 2500 + (text.length * 95) / (p.rate || 1));
    u.onstart = () => this.onSpeakStart?.();
    u.onboundary = () => { this.level = 1; };
    u.onend = done;
    u.onerror = done;
    this.pending++;
    speechSynthesis.speak(u);
  }

  /** Call inside a click, so later speech is allowed. */
  unlock() {
    try { if (this.on && "speechSynthesis" in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance("")); } } catch { /* ignore */ }
  }

  drain() { return new Promise<void>((r) => { if (!this.pending) r(); else this.waiters.push(r); }); }

  stop() {
    try { speechSynthesis.cancel(); } catch { /* ignore */ }
    this.pending = 0;
    this.level = 0;
    this.waiters.splice(0).forEach((f) => f());
  }
}
export const Voice = new VoiceImpl();

/* ---------- Your voice: hands-free listening ---------- */
type SR = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; abort(): void;
  onstart: (() => void) | null; onend: (() => void) | null;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
const SRCtor = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition
  ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;

class EarsImpl {
  blocked = !SRCtor || !!window.claude; // inside claude.ai a page may not use the microphone
  silenceMs = 1500;
  onHeard: ((text: string) => void) | null = null;
  onCommit: ((text: string) => void) | null = null;
  onBlocked: Listener | null = null;
  onListening: ((on: boolean) => void) | null = null;
  private rec: SR | null = null;
  private want = false;
  private running = false;
  private finalT = "";
  private interim = "";
  private timer: ReturnType<typeof setTimeout> | undefined;

  get supported() { return !this.blocked; }

  private init() {
    if (!SRCtor || this.rec) return;
    const r = (this.rec = new SRCtor());
    r.lang = "nl-NL";
    r.continuous = true;
    r.interimResults = true;
    r.onstart = () => { this.running = true; };
    r.onresult = (e) => {
      if (!this.want) return;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) this.finalT += res[0].transcript + " ";
        else interim += res[0].transcript;
      }
      this.interim = interim;
      this.onHeard?.((this.finalT + interim).trim());
      Voice.level = Math.max(Voice.level, 0.55);
      this.arm();
    };
    r.onerror = (e) => {
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(e.error)) {
        this.blocked = true;
        this.want = false;
        this.onListening?.(false);
        this.onBlocked?.();
      }
    };
    r.onend = () => { this.running = false; if (this.want) { try { r.start(); } catch { /* already running */ } } };
  }

  start() {
    this.init();
    if (!this.rec) return;
    this.finalT = "";
    this.interim = "";
    this.onHeard?.("");
    this.want = true;
    if (!this.running) { try { this.rec.start(); } catch { /* already running */ } }
    this.onListening?.(true);
  }

  stop() {
    this.want = false;
    clearTimeout(this.timer);
    try { this.rec?.abort(); } catch { /* ignore */ }
    this.onListening?.(false);
  }

  private arm() { clearTimeout(this.timer); this.timer = setTimeout(() => this.commit(), this.silenceMs); }

  commit() {
    const t = (this.finalT + " " + this.interim).replace(/\s+/g, " ").trim();
    if (!t || !this.want) return;
    this.stop();
    this.finalT = "";
    this.interim = "";
    this.onHeard?.("");
    this.onCommit?.(t);
  }
}
export const Ears = new EarsImpl();

/* ---------- Phone ring for cold calls ---------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ctx: AudioContext | null = null;
let stopRing = false;
export const Ring = {
  async play(times = 2) {
    if (!Voice.on) return;
    try {
      ctx = ctx ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      await ctx.resume();
    } catch { return; }
    stopRing = false;
    for (let i = 0; i < times && !stopRing; i++) {
      const c = ctx, t = c.currentTime, g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.connect(c.destination);
      [440, 480].forEach((f) => { const o = c.createOscillator(); o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 1.6); });
      g.gain.linearRampToValueAtTime(0.07, t + 0.05); g.gain.setValueAtTime(0.07, t + 0.75); g.gain.linearRampToValueAtTime(0, t + 0.8);
      g.gain.linearRampToValueAtTime(0.07, t + 0.85); g.gain.setValueAtTime(0.07, t + 1.55); g.gain.linearRampToValueAtTime(0, t + 1.6);
      await sleep(2600);
    }
  },
  stop() { stopRing = true; },
};
