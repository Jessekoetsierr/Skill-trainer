import { Avatar, Button, Card, DashboardPage, DayHeader, Log, LogEntry, RadioGroup, Tag, type StatProps } from "coachman-ui";
import { Check, Phone, PenLine, Search, ShieldQuestion } from "lucide-react";
import { Brain, type BrainMode } from "../lib/brain";
import { LEVELS, PERSONAS, SCENARIOS, type Company } from "../lib/content";
import { firstName } from "../lib/prompts";
import { history } from "../lib/store";
import { BrainStatus } from "./parts";
import type { PageId } from "../App";

export type Selection = { scen: string; pers: string; lvl: string };

const ICON = { phone: Phone, ask: Search, shield: ShieldQuestion, pen: PenLine };

export function TrainPage({ sel, onSel, brain, company, onStart, onGo }: {
  sel: Selection; onSel: (s: Selection) => void; brain: BrainMode | "pending"; company: Company;
  onStart: () => void; onGo: (p: PageId) => void;
}) {
  const s = SCENARIOS.find((x) => x.id === sel.scen) ?? SCENARIOS[0];
  const p = PERSONAS.find((x) => x.id === sel.pers) ?? PERSONAS[0];
  const d = LEVELS.find((x) => x.id === sel.lvl) ?? LEVELS[1];
  const items = history.all();

  const now = Date.now();
  const week = items.filter((h) => now - h.t < 7 * 864e5);
  const recent = items.slice(0, 5);
  const avg = recent.length ? Math.round(recent.reduce((a, h) => a + h.score, 0) / recent.length) : null;
  const best = items.length ? Math.max(...items.map((h) => h.score)) : null;
  const stats: StatProps[] = [
    { label: "Sessies", value: items.length, caption: "in totaal" },
    { label: "Deze week", value: week.length, caption: "afgelopen 7 dagen" },
    { label: "Gemiddelde", value: avg ?? "–", unit: avg != null ? "/100" : undefined, caption: "laatste 5 sessies", sparkline: recent.length > 1 ? recent.map((h) => h.score).reverse() : undefined },
    { label: "Beste score", value: best ?? "–", unit: best != null ? "/100" : undefined },
  ];

  return (
    <DashboardPage
      header={
        <DayHeader
          title="Oefenen"
          description="Kies een situatie en een klant. De klant praat hardop terug, reageert op wat je zegt en houdt iets voor je verborgen. Na afloop krijg je een scorekaart."
          actions={<BrainStatus brain={brain} />}
        />
      }
      stats={stats}
      columns={2}
      feedTitle="Laatste sessies"
      feedAction={items.length > 0 ? <Button variant="ghost" size="sm" onClick={() => onGo("geschiedenis")}>Alles bekijken</Button> : undefined}
      feed={
        items.length > 0 ? (
          <Log>
            {items.slice(0, 3).map((h) => {
              const hs = SCENARIOS.find((x) => x.id === h.s), hp = PERSONAS.find((x) => x.id === h.p);
              return (
                <LogEntry
                  key={h.t}
                  time={new Date(h.t).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  title={`${hs?.titel ?? h.s} met ${hp ? firstName(hp.naam) : h.p}`}
                  note={h.oordeel}
                  meta={`${h.score}/100`}
                />
              );
            })}
          </Log>
        ) : undefined
      }
    >
      {brain === "local" && (Brain.cli === "ontbreekt" || Brain.cli === "fout") && (
        <Card variant="inset" className="col-span-full border-danger">
          <p className="text-body font-medium text-danger">{Brain.cli === "ontbreekt" ? "Claude Code is niet gevonden op deze computer." : "Claude Code werkt nog niet: je bent waarschijnlijk niet ingelogd."}</p>
          <p className="mt-s-1 text-small text-muted">
            Open PowerShell en voer {Brain.cli === "ontbreekt" ? <><span className="font-mono text-mono">irm https://claude.ai/install.ps1 | iex</span> uit, typ daarna </> : "uit: "}
            <span className="font-mono text-mono">claude</span> en log in. Sluit het zwarte venster en start Tegenspeler opnieuw.
          </p>
        </Card>
      )}

      <Card className="col-span-full">
        <SectionTitle n="1" title="Kies de situatie" />
        <div className="grid grid-cols-1 gap-s-3 sm:grid-cols-2 xl:grid-cols-4">
          {SCENARIOS.map((x) => {
            const Icon = ICON[x.icon];
            const on = x.id === sel.scen;
            return (
              <Card key={x.id} variant="interactive" aria-pressed={on} onClick={() => onSel({ ...sel, scen: x.id })}
                className={on ? "h-full border-accent" : "h-full"}>
                <div className="grid h-full content-start gap-s-2">
                  <div className="flex items-center justify-between text-muted [&_svg]:size-icon-ui">
                    <Icon aria-hidden />
                    {on && <Check aria-hidden className="text-accent" />}
                  </div>
                  <p className="hyphens-auto break-words text-h3 text-ink" lang="nl">{x.titel}</p>
                  <p className="text-small text-muted">{x.sub}</p>
                  <p className="border-t border-line pt-s-2 text-small text-ink"><span className="text-muted">Doel: </span>{x.doel}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card className="col-span-full">
        <SectionTitle n="2" title="Kies je klant" />
        <div className="grid grid-cols-1 gap-s-3 sm:grid-cols-2 xl:grid-cols-3">
          {PERSONAS.map((x) => {
            const on = x.id === sel.pers;
            return (
              <Card key={x.id} variant="interactive" aria-pressed={on} onClick={() => onSel({ ...sel, pers: x.id })}
                className={on ? "h-full border-accent" : "h-full"}>
                <div className="grid h-full content-start gap-s-3">
                  <div className="flex items-center gap-s-3">
                    <Avatar name={x.naam} />
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-ink">{x.naam}</p>
                      <p className="text-small text-muted">{x.titel}</p>
                    </div>
                    {on && <Check aria-hidden className="size-icon-ui shrink-0 text-accent" />}
                  </div>
                  <p className="text-small text-muted">{x.kort}</p>
                  <div className="flex flex-wrap gap-s-1">
                    {x.traits.map((t) => <Tag key={t}>{t}</Tag>)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card className="col-span-full">
        <SectionTitle n="3" title="Hoe moeilijk?" />
        <RadioGroup
          name="niveau"
          orientation="horizontal"
          value={sel.lvl}
          onValueChange={(v) => onSel({ ...sel, lvl: v })}
          options={LEVELS.map((l) => ({ value: l.id, label: l.label, description: l.note }))}
        />
      </Card>

      <Card variant="inset" className="col-span-full">
        <div className="flex flex-wrap items-center justify-between gap-s-4">
          <div className="grid min-w-0 gap-s-1">
            <p className="text-label uppercase text-muted">Klaar om te beginnen</p>
            <p className="text-body text-ink">{s.titel} met {p.naam}, niveau {d.label.toLowerCase()}.</p>
            <p className="text-small text-muted">
              Voor {company.naam || "je bedrijf"}{company.isExample ? " (voorbeeld)" : ""}.{" "}
              <a href="#bedrijf" onClick={(e) => { e.preventDefault(); onGo("bedrijf"); }} className="text-ink underline underline-offset-4">Bedrijf aanpassen</a>
            </p>
          </div>
          <Button variant="primary" size="lg" disabled={!brain || brain === "pending"} onClick={onStart}>
            Start gesprek met {firstName(p.naam)}
          </Button>
        </div>
      </Card>
    </DashboardPage>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <h2 className="mb-s-4 flex items-baseline gap-s-2 text-h2 text-ink">
      <span className="font-mono text-mono tabular-nums text-faint">{n}</span>
      {title}
    </h2>
  );
}
