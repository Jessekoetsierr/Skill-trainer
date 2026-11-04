import { useEffect, useRef, useState } from "react";
import { Button, Card, DetailPage, Divider, EmptyState, Log, LogEntry, Progress, Skeleton, Spinner, Tag, useToast } from "coachman-ui";
import { Brain, errCopy } from "../lib/brain";
import type { Company } from "../lib/content";
import { firstName, scorePrompt, type Scorecard } from "../lib/prompts";
import { history } from "../lib/store";
import type { CallResult } from "./Call";

const FILLERS = /\b(eh+|ehm+|uh+m*|uhm|euh|nou|eigenlijk|zeg maar|gewoon|weet je|als het ware)\b/gi;
const QWORDS = /(^|[.!?]\s+)(wat|hoe|waarom|welke|wie|wanneer|waar|waardoor|kunt|kun|kan|heeft|hebt|heb|bent|ben|zou|zijn|is|wil|wilt|mag|vindt|merkt|gebruikt|werkt)\b/i;
const dur = (ms: number) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const clamp = (n: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));

function localStats(r: CallResult) {
  const me = r.turns.filter((t) => t.who === "jij").map((t) => t.text);
  const them = r.turns.filter((t) => t.who === "klant").map((t) => t.text);
  const words = (a: string[]) => a.join(" ").split(/\s+/).filter(Boolean).length;
  const wm = words(me), wt = words(them);
  let questions = 0;
  me.forEach((t) => { const q = (t.match(/\?/g) ?? []).length; questions += q || (QWORDS.test(" " + t) ? 1 : 0); });
  return { talk: wm + wt ? Math.round((wm / (wm + wt)) * 100) : 0, fillers: (me.join(" ").match(FILLERS) ?? []).length, questions, mine: me.length };
}

const LOADING = ["Transcript doorlezen…", "Vragen tellen en wegen…", "Vergelijken met wat de klant verborg…", "Betere zinnen formuleren…", "Bijna klaar…"];

export function ResultPage({ result, company, onAgain, onBack }: {
  result: CallResult; company: Company; onAgain: () => void; onBack: () => void;
}) {
  const { s, p, d, dossier: x, turns, duration } = result;
  const name = firstName(p.naam);
  const st = localStats(result);
  const tooShort = st.mine < 2;
  const { toast } = useToast();
  const [card, setCard] = useState<Scorecard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState(0);
  const saved = useRef(false);

  const run = async () => {
    setError(null); setCard(null); setMsg(0);
    try {
      const r = await Brain.ask<Scorecard>(scorePrompt({ s, p, d, co: company, x, turns }), { tier: "default", json: true });
      if (!r || typeof r !== "object") throw { code: "invalid_json" };
      setCard(r);
      if (!saved.current) {
        saved.current = true;
        history.add({ t: Date.now(), s: s.id, p: p.id, lvl: d.id, score: clamp(r.totaal, 100), oordeel: r.oordeel, dur: duration });
      }
    } catch (e) { setError(errCopy(e)); }
  };

  useEffect(() => { if (!tooShort) run(); /* once per result */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (card || error || tooShort) return;
    const iv = setInterval(() => setMsg((m) => Math.min(m + 1, LOADING.length - 1)), 4500);
    return () => clearInterval(iv);
  }, [card, error, tooShort]);

  const total = card ? clamp(card.totaal, 100) : null;
  const copy = async () => {
    if (!card) return;
    const text = `Tegenspeler · ${s.titel} met ${p.naam} (${p.titel})\nScore: ${total}/100. ${card.oordeel ?? ""}\n` +
      (card.vaardigheden ?? []).map((v) => `- ${v.naam}: ${clamp(v.score, 10)}/10`).join("\n") +
      (card.gemiste_kans?.beter ? `\nSterkere zin: "${card.gemiste_kans.beter}"` : "");
    try { await navigator.clipboard.writeText(text); toast({ title: "Resultaat gekopieerd", tone: "success" }); }
    catch { toast({ title: "Kopiëren lukte niet", description: "Je browser staat het kopiëren niet toe.", tone: "danger" }); }
  };

  const meta = [
    { label: "Klant", value: `${p.naam}` },
    { label: "Niveau", value: d.label },
    { label: "Duur", value: dur(duration) },
    { label: "Jouw spreektijd", value: `${st.talk}%` },
    { label: "Vragen gesteld", value: st.questions },
    { label: "Stopwoordjes", value: st.fillers },
  ];

  return (
    <DetailPage
      back={{ label: "Terug naar oefenen", onClick: onBack }}
      label={`Scorekaart · ${s.titel}`}
      title={card?.oordeel ?? (tooShort ? "Te kort om te beoordelen" : error ? "De scorekaart lukte niet" : "Je coach kijkt het gesprek terug")}
      status={total != null ? `${total}/100` : undefined}
      meta={meta}
      actions={
        <>
          {card && <Button variant="secondary" onClick={copy}>Kopieer resultaat</Button>}
          <Button variant="primary" onClick={onAgain}>Nog een keer met {name}</Button>
        </>
      }
    >
      <div className="grid gap-s-5">
        {tooShort && (
          <EmptyState title="Te kort om te beoordelen" description={`Je coach heeft minstens twee beurten van jou nodig. Probeer het nog een keer en houd het gesprek met ${name} wat langer vol.`} />
        )}

        {!tooShort && error && (
          <EmptyState title="De scorekaart lukte niet" description={error} action={<Button variant="secondary" onClick={run}>Probeer opnieuw</Button>} />
        )}

        {!tooShort && !error && !card && (
          <Card>
            <div className="grid gap-s-4">
              <p className="flex items-center gap-s-2 text-body text-ink" aria-live="polite"><Spinner />{LOADING[msg]}</p>
              <Skeleton lines={4} />
            </div>
          </Card>
        )}

        {card && total != null && (
          <>
            <Card>
              <div className="flex flex-wrap items-center gap-s-5">
                <Progress variant="ring" value={total} valueLabel={String(total)} />
                <div className="grid min-w-0 flex-1 gap-s-2">
                  <div>
                    <Tag tone={card.doel_gehaald ? "success" : "danger"} dot>
                      {card.doel_gehaald ? "Doel gehaald" : "Doel niet gehaald"}
                    </Tag>
                  </div>
                  <p className="text-small text-muted"><span className="text-ink">{s.doel}</span> {card.doel_toelichting}</p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-s-4 text-h2 text-ink">Je vaardigheden</h2>
              <div className="grid gap-s-5">
                {(card.vaardigheden ?? []).map((v) => (
                  <div key={v.naam} className="grid gap-s-1">
                    <Progress value={clamp(v.score, 10)} max={10} label={<span className="text-ink">{v.naam}</span>} valueLabel={`${clamp(v.score, 10)}/10`} />
                    {v.toelichting && <p className="text-small text-muted">{v.toelichting}</p>}
                  </div>
                ))}
              </div>
            </Card>

            {(card.gemiste_kans?.waarom || card.gemiste_kans?.beter) && (
              <Card>
                <h2 className="mb-s-4 text-h2 text-ink">Grootste gemiste kans</h2>
                <div className="grid gap-s-3">
                  {card.gemiste_kans.citaat && <blockquote className="border-l border-line pl-s-4 text-body text-muted">“{card.gemiste_kans.citaat}”</blockquote>}
                  {card.gemiste_kans.waarom && <p className="text-body text-ink">{card.gemiste_kans.waarom}</p>}
                  {card.gemiste_kans.beter && (
                    <div className="grid gap-s-1 border-l border-success pl-s-4">
                      <span className="text-label uppercase text-success">Sterker</span>
                      <p className="text-body text-ink">“{card.gemiste_kans.beter}”</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {(card.goed ?? []).length > 0 && (
              <Card>
                <h2 className="mb-s-3 text-h2 text-ink">Wat ging goed</h2>
                <ul className="grid list-disc gap-s-2 pl-s-5 text-body text-ink">
                  {card.goed.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </Card>
            )}

            {(card.herformuleringen ?? []).filter((h) => h?.jij && h?.beter).length > 0 && (
              <Card>
                <h2 className="mb-s-3 text-h2 text-ink">Zo had je het kunnen zeggen</h2>
                <div className="grid gap-s-4">
                  {card.herformuleringen.filter((h) => h?.jij && h?.beter).map((h, i) => (
                    <div key={i} className="grid gap-s-2">
                      {i > 0 && <Divider />}
                      <blockquote className="border-l border-line pl-s-4 text-body text-muted">“{h.jij}”</blockquote>
                      <div className="grid gap-s-1 border-l border-success pl-s-4">
                        <span className="text-label uppercase text-success">Beter</span>
                        <p className="text-body text-ink">“{h.beter}”</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card variant="inset">
              <h2 className="mb-s-4 text-h2 text-ink">Wat {name} voor je verborg</h2>
              <dl className="grid grid-cols-1 gap-x-s-5 gap-y-s-3 sm:grid-cols-[auto_minmax(0,1fr)]">
                {[
                  ["Wie", `${x.functie} bij ${x.bedrijf}. ${x.bedrijf_omschrijving ?? ""}`],
                  ["Echte pijn", x.verborgen_pijn],
                  ["Wat het kost", x.impact],
                  ["Wat overtuigt", x.wat_overtuigt],
                  ["Budget", x.budget],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-small text-muted">{k}</dt>
                    <dd className="text-body text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              {card.ontdekt && (
                <p className="mt-s-4 border-t border-line pt-s-4 text-body text-ink"><span className="text-muted">Wat jij boven tafel kreeg: </span>{card.ontdekt}</p>
              )}
            </Card>

            {card.volgende_keer && (
              <Card>
                <h2 className="mb-s-2 text-h2 text-ink">Je oefening voor de volgende keer</h2>
                <p className="text-body text-ink">{card.volgende_keer}</p>
              </Card>
            )}
          </>
        )}

        <section aria-labelledby="tx-title">
          <h2 id="tx-title" className="mb-s-2 border-b border-line pb-s-2 text-label uppercase text-muted">Het hele gesprek</h2>
          <Log>
            {turns.map((t, i) => (
              <LogEntry key={i} time={dur(t.at)} title={t.text} meta={t.who === "klant" ? name : "Jij"} done={t.who === "jij"} />
            ))}
          </Log>
        </section>
      </div>
    </DetailPage>
  );
}
