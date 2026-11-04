import { useEffect, useState } from "react";
import { Button, DayHeader, Modal, ModeToggle, SettingsGroup, SettingsPage, SettingsRow, Switch, useToast } from "coachman-ui";
import type { BrainMode } from "../lib/brain";
import { Ears, Voice } from "../lib/speech";
import { store } from "../lib/store";
import { BrainStatus } from "./parts";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
// The browser offers installing once, early; keep it for when this page opens.
let installPrompt: InstallEvent | null = null;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installPrompt = e as InstallEvent; });

export function SettingsScreen({ brain }: { brain: BrainMode | "pending" }) {
  const { toast } = useToast();
  const [voice, setVoice] = useState(Voice.on);
  const [confirm, setConfirm] = useState(false);
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(installPrompt);
  const [standalone] = useState(() => matchMedia("(display-mode: standalone)").matches);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); installPrompt = e as InstallEvent; setInstallEvt(installPrompt); };
    addEventListener("beforeinstallprompt", on);
    return () => removeEventListener("beforeinstallprompt", on);
  }, []);
  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const { outcome } = await installEvt.userChoice.catch(() => ({ outcome: "dismissed" }));
    installPrompt = null; setInstallEvt(null);
    if (outcome === "accepted") toast({ title: "Tegenspeler staat nu als app op je computer", tone: "success" });
  };

  return (
    <SettingsPage header={<DayHeader title="Instellingen" />}>
      <SettingsGroup title="Gesprek">
        <SettingsRow
          label="Stem van de klant"
          description="De klant spreekt zijn antwoorden hardop uit."
          control={<Switch checked={voice} onCheckedChange={(v) => { Voice.setOn(v); setVoice(v); }} aria-label="Stem van de klant" />}
        />
        <SettingsRow
          label="Zelf praten"
          description={Ears.supported
            ? "Handsfree: praat gewoon. Als je even stil valt, reageert de klant."
            : "Je microfoon is hier niet beschikbaar. Typ, of dicteer met Win + H (Windows) of 2× Fn (Mac)."}
          value={Ears.supported ? "Microfoon" : "Typen"}
        />
      </SettingsGroup>

      <SettingsGroup title="App" description="Werkt in Edge en Chrome als je Tegenspeler op je eigen computer draait.">
        <SettingsRow
          label="Installeer als app"
          description={standalone ? "Tegenspeler draait al als app." : installEvt ? "Krijg een eigen venster en een icoon in je Startmenu en taakbalk." : "Niet beschikbaar in deze weergave. Open Tegenspeler via Start Tegenspeler.bat in Edge."}
          control={!standalone && installEvt ? <Button variant="secondary" onClick={install}>Installeren</Button> : undefined}
        />
      </SettingsGroup>

      <SettingsGroup title="Weergave" description="Auto volgt zonsopkomst en -ondergang.">
        <SettingsRow label="Dag of nacht" control={<ModeToggle />} />
      </SettingsGroup>

      <SettingsGroup title="Verbinding">
        <SettingsRow label="AI" description="Tegenspeler gebruikt je eigen Claude-abonnement. Er gaan geen extra credits af." control={<BrainStatus brain={brain} />} />
      </SettingsGroup>

      <SettingsGroup title="Gegevens" description="Je geschiedenis en bedrijfsgegevens staan alleen op dit apparaat.">
        <SettingsRow label="Geschiedenis wissen" danger onClick={() => setConfirm(true)} />
      </SettingsGroup>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Geschiedenis wissen?"
        description="Al je scores en sessies op dit apparaat worden verwijderd. Dit kun je niet ongedaan maken."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Annuleren</Button>
            <Button variant="danger" onClick={() => { store.set("history", []); setConfirm(false); toast({ title: "Geschiedenis gewist", tone: "success" }); }}>Wissen</Button>
          </>
        }
      />
    </SettingsPage>
  );
}
