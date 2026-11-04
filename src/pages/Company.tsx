import { useRef, useState, type DragEvent } from "react";
import { Button, Card, DayHeader, Input, SettingsGroup, SettingsPage, SettingsRow, Spinner, Tag, Textarea, useToast } from "coachman-ui";
import { Upload } from "lucide-react";
import { Brain, errCopy, type BrainMode } from "../lib/brain";
import { CO_FIELDS, type Company } from "../lib/content";
import { profilePrompt } from "../lib/prompts";

const LABELS: Record<string, { label: string; long?: boolean }> = {
  naam: { label: "Bedrijfsnaam" },
  aanbod: { label: "Wat verkoop je?", long: true },
  prijs: { label: "Prijs of tarief" },
  doelgroep: { label: "Je ideale klant", long: true },
  usps: { label: "Waarom kiezen klanten voor jou?", long: true },
  concurrenten: { label: "Concurrenten of alternatieven" },
  context: { label: "Overige context", long: true },
};

declare global { interface Window { pdfjsLib?: { getDocument: (o: object) => { promise: Promise<PdfDoc> } } } }
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: { str: string }[] }> }> };

function loadScript(src: string) {
  return new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error("Kon de PDF-lezer niet laden."));
    document.head.appendChild(s);
  });
}
async function pdfToText(file: File) {
  if (!window.pdfjsLib) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"); // runs on the main thread
  }
  const doc = await window.pdfjsLib!.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  let out = "";
  for (let i = 1; i <= Math.min(doc.numPages, 25) && out.length < 20000; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    out += tc.items.map((it) => it.str).join(" ") + "\n\n";
  }
  return out;
}

export function CompanyPage({ company, onChange, brain }: {
  company: Company; onChange: (c: Company | null) => void; brain: BrainMode | "pending";
}) {
  const { toast } = useToast();
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileIn = useRef<HTMLInputElement>(null);

  const set = (k: keyof Company, v: string) => onChange({ ...company, [k]: v, isExample: false });

  const readCompany = async (text: string) => {
    if (text.trim().length < 40) { toast({ title: "Te weinig tekst", description: "Plak wat meer tekst of upload een bestand.", tone: "danger" }); return; }
    if (!brain || brain === "pending") { toast({ title: "Geen AI-verbinding", description: "Vul de velden hieronder met de hand in.", tone: "danger" }); return; }
    setBusy("AI leest je bedrijf…");
    try {
      const j = await Brain.ask<Record<string, unknown>>(profilePrompt(text), { tier: "quick", json: true });
      if (!j || typeof j !== "object") throw { code: "invalid_json" };
      const next: Company = { ...company, isExample: false };
      CO_FIELDS.forEach((k) => { if (k !== "isExample") (next[k] as string) = typeof j[k] === "string" ? (j[k] as string) : company.isExample ? "" : String(company[k] ?? ""); });
      onChange(next);
      toast({ title: "Bedrijf ingelezen", description: "Controleer de velden en pas ze aan waar nodig.", tone: "success" });
    } catch (e) {
      toast({ title: "Inlezen lukte niet", description: errCopy(e), tone: "danger" });
    } finally { setBusy(null); }
  };

  const handleFile = async (file: File) => {
    try {
      setBusy("Bestand lezen…");
      let text: string;
      if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) text = await pdfToText(file);
      else if (/\.docx?$/i.test(file.name)) throw new Error("Word-bestanden kan ik nog niet lezen. Sla het op als PDF of plak de tekst.");
      else text = await file.text();
      if (/\.html?$/i.test(file.name)) { const d = new DOMParser().parseFromString(text, "text/html"); text = d.body?.innerText || d.body?.textContent || text; }
      text = text.replace(/\s+\n/g, "\n").trim();
      if (text.length < 40) throw new Error("Er stond te weinig leesbare tekst in dit bestand.");
      setPaste(text.slice(0, 18000));
      await readCompany(text);
    } catch (e) {
      setBusy(null);
      toast({ title: "Dit bestand kon ik niet lezen", description: (e as Error).message, tone: "danger" });
    }
  };

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };

  return (
    <SettingsPage
      header={
        <DayHeader
          title="Mijn bedrijf"
          description="De klant reageert op wat jij echt verkoopt. Vul je bedrijf in, of laat de AI het inlezen uit een brochure, offerte of websitetekst."
          actions={company.isExample ? <Tag tone="info">Voorbeeld</Tag> : undefined}
        />
      }
    >
      <SettingsGroup title="Automatisch invullen" description="Het bestand blijft op je apparaat. Alleen de tekst gaat naar de AI om je profiel in te vullen.">
        <div className="grid gap-s-4 py-s-4">
          <Card variant="inset" className={drag ? "border-accent" : undefined}>
            <div
              className="grid gap-s-3"
              onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              <div className="flex flex-wrap items-center gap-s-3">
                <Button variant="secondary" iconStart={<Upload aria-hidden />} onClick={() => fileIn.current?.click()} disabled={!!busy}>
                  Upload bestand
                </Button>
                <span className="text-small text-muted">PDF of tekst, of sleep het hierheen</span>
                <input ref={fileIn} type="file" hidden accept=".pdf,.txt,.md,.html,.htm,.csv,text/plain,application/pdf"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
              </div>
              <Textarea id="plak" label="Of plak tekst" minRows={3} maxRows={8} value={paste} onChange={(e) => setPaste(e.target.value)}
                placeholder="Bijvoorbeeld de tekst van je website of een offerte" />
              <div className="flex flex-wrap items-center gap-s-3">
                <Button variant="primary" onClick={() => readCompany(paste)} disabled={!!busy || paste.trim().length < 40}>Laat AI dit inlezen</Button>
                {busy && <span className="flex items-center gap-s-2 text-small text-muted"><Spinner />{busy}</span>}
              </div>
            </div>
          </Card>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Je bedrijf" description="Wordt bewaard op dit apparaat.">
        <div className="grid gap-s-4 py-s-4">
          {CO_FIELDS.map((k) => {
            const f = LABELS[k];
            const v = String(company[k] ?? "");
            return f.long ? (
              <Textarea key={k} id={"f_" + k} label={f.label} minRows={2} maxRows={6} value={v} onChange={(e) => set(k, e.target.value)} />
            ) : (
              <Input key={k} id={"f_" + k} label={f.label} value={v} onChange={(e) => set(k, e.target.value)} />
            );
          })}
        </div>
        <SettingsRow
          label="Voorbeeldbedrijf terugzetten"
          description="Vervangt je gegevens door het voorbeeld (Planwerk)."
          onClick={() => { onChange(null); toast({ title: "Voorbeeldbedrijf teruggezet" }); }}
        />
      </SettingsGroup>
    </SettingsPage>
  );
}
