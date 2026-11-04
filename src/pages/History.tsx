import { Button, DayHeader, EmptyState, LogPage, Tag, type LogPageEntry } from "coachman-ui";
import { LEVELS, PERSONAS, SCENARIOS } from "../lib/content";
import { firstName } from "../lib/prompts";
import { history } from "../lib/store";
import type { PageId } from "../App";

const tone = (n: number): "success" | "warning" | "danger" => (n >= 75 ? "success" : n >= 50 ? "warning" : "danger");

export function HistoryPage({ onGo }: { onGo: (p: PageId) => void }) {
  const items = history.all();
  const entries: LogPageEntry[] = items.map((h) => {
    const s = SCENARIOS.find((x) => x.id === h.s), p = PERSONAS.find((x) => x.id === h.p), l = LEVELS.find((x) => x.id === h.lvl);
    return {
      id: h.t,
      time: new Date(h.t),
      title: `${s?.titel ?? h.s} met ${p ? firstName(p.naam) : h.p}`,
      note: h.oordeel,
      meta: `${h.score}/100`,
      important: h.score >= 80,
      tags: (
        <>
          <Tag tone={tone(h.score)} dot>{h.score >= 75 ? "Sterk" : h.score >= 50 ? "Op weg" : "Oefenpunt"}</Tag>
          {l && <Tag>{l.label}</Tag>}
        </>
      ),
    };
  });
  const avg = items.length ? Math.round(items.reduce((a, h) => a + h.score, 0) / items.length) : null;

  return (
    <LogPage
      header={
        <DayHeader
          title="Geschiedenis"
          description="Al je oefengesprekken op dit apparaat, nieuwste bovenaan."
          status={avg != null ? `gem. ${avg}/100` : undefined}
        />
      }
      entries={entries}
      empty={
        <EmptyState
          title="Nog geen gesprekken"
          description="Na je eerste oefengesprek verschijnt je scorekaart hier."
          action={<Button variant="primary" onClick={() => onGo("oefenen")}>Start met oefenen</Button>}
        />
      }
    />
  );
}
