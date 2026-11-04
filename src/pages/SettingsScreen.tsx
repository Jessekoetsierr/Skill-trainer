import { useState } from "react";
import { Button, DayHeader, Modal, ModeToggle, SettingsGroup, SettingsPage, SettingsRow, Switch, useToast } from "coachman-ui";
import type { BrainMode } from "../lib/brain";
import { Ears, Voice } from "../lib/speech";
import { store } from "../lib/store";
import { BrainStatus } from "./parts";

export function SettingsScreen({ brain }: { brain: BrainMode | "pending" }) {
  const { toast } = useToast();
  const [voice, setVoice] = useState(Voice.on);
  const [confirm, setConfirm] = useState(false);

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
