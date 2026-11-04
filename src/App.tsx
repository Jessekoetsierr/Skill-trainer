import { useEffect, useState } from "react";
import { AppShell, ToastProvider, type NavItem } from "coachman-ui";
import { Building2, History as HistoryIcon, Mic, Settings } from "lucide-react";
import { Brain, type BrainMode } from "./lib/brain";
import { EXAMPLE_CO, type Company } from "./lib/content";
import { store } from "./lib/store";
import { Voice } from "./lib/speech";
import { TrainPage, type Selection } from "./pages/Train";
import { CallPage, type CallResult } from "./pages/Call";
import { ResultPage } from "./pages/Result";
import { CompanyPage } from "./pages/Company";
import { HistoryPage } from "./pages/History";
import { SettingsScreen } from "./pages/SettingsScreen";

export type PageId = "oefenen" | "bedrijf" | "geschiedenis" | "instellingen";
const PAGES: PageId[] = ["oefenen", "bedrijf", "geschiedenis", "instellingen"];

const NAV: NavItem[] = [
  { id: "oefenen", label: "Oefenen", icon: <Mic aria-hidden />, href: "#oefenen" },
  { id: "bedrijf", label: "Mijn bedrijf", icon: <Building2 aria-hidden />, href: "#bedrijf" },
  { id: "geschiedenis", label: "Geschiedenis", icon: <HistoryIcon aria-hidden />, href: "#geschiedenis" },
  { id: "instellingen", label: "Instellingen", icon: <Settings aria-hidden />, href: "#instellingen" },
];

const pageFromHash = (): PageId => {
  const h = location.hash.slice(1) as PageId;
  return PAGES.includes(h) ? h : "oefenen";
};

export function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [brain, setBrain] = useState<BrainMode | "pending">("pending");
  const [sel, setSel] = useState<Selection>(() => ({
    scen: store.get("scen", "koud"),
    pers: store.get("pers", "inkoper"),
    lvl: store.get("lvl", "realistisch"),
  }));
  const [company, setCompany] = useState<Company>(() => store.get<Company | null>("company", null) ?? { ...EXAMPLE_CO, isExample: true });
  // Within "Oefenen": choose → call → result
  const [stage, setStage] = useState<"choose" | "call" | "result">("choose");
  const [result, setResult] = useState<CallResult | null>(null);

  useEffect(() => {
    Voice.load();
    Brain.detect().then(setBrain);
    const onHash = () => setPage(pageFromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const go = (id: PageId) => {
    if (stage === "call") return; // finish or stop the call first
    setPage(id);
    if (location.hash.slice(1) !== id) history.replaceState(null, "", "#" + id);
    window.scrollTo({ top: 0 });
  };

  const updateSel = (next: Selection) => {
    setSel(next);
    store.set("scen", next.scen);
    store.set("pers", next.pers);
    store.set("lvl", next.lvl);
  };
  const updateCompany = (c: Company | null) => {
    const next = c ?? { ...EXAMPLE_CO, isExample: true };
    setCompany(next);
    store.set("company", c);
  };

  let content;
  if (page === "oefenen" && stage === "call") {
    content = (
      <CallPage
        sel={sel}
        company={company}
        onCancel={() => setStage("choose")}
        onDone={(r) => { setResult(r); setStage("result"); window.scrollTo({ top: 0 }); }}
      />
    );
  } else if (page === "oefenen" && stage === "result" && result) {
    content = (
      <ResultPage
        result={result}
        company={company}
        onAgain={() => setStage("call")}
        onBack={() => setStage("choose")}
      />
    );
  } else if (page === "oefenen") {
    content = (
      <TrainPage
        sel={sel}
        onSel={updateSel}
        brain={brain}
        company={company}
        onStart={() => { Voice.unlock(); setStage("call"); window.scrollTo({ top: 0 }); }}
        onGo={go}
      />
    );
  } else if (page === "bedrijf") {
    content = <CompanyPage company={company} onChange={updateCompany} brain={brain} />;
  } else if (page === "geschiedenis") {
    content = <HistoryPage onGo={go} />;
  } else {
    content = <SettingsScreen brain={brain} />;
  }

  return (
    <ToastProvider>
      <AppShell nav={NAV} activeId={page} onNavigate={(item) => go(item.id as PageId)} appName="Tegenspeler">
        {content}
      </AppShell>
    </ToastProvider>
  );
}
