import type { Company, Level, Persona, Scenario } from "./content";
import { CO_FIELDS } from "./content";

export type Turn = { who: "klant" | "jij"; text: string; at: number };
export type Dossier = {
  functie: string; bedrijf: string; bedrijf_omschrijving: string; situatie: string; verborgen_pijn: string;
  impact: string; budget: string; beslisproces: string; bezwaren: string[]; wat_overtuigt: string;
  startinteresse: number; openingszin: string;
};
export type Scorecard = {
  totaal: number; oordeel: string; doel_gehaald: boolean; doel_toelichting: string;
  vaardigheden: { naam: string; score: number; toelichting: string }[];
  goed: string[]; gemiste_kans: { citaat?: string; waarom?: string; beter?: string };
  herformuleringen: { jij: string; beter: string }[]; ontdekt: string; volgende_keer: string;
};
type Ctx = { s: Scenario; p: Persona; d: Level; co: Company };

export const firstName = (n: string) => n.split(" ")[0];

export function companyText(c: Company) {
  const L: Record<string, string> = { naam: "Bedrijf", aanbod: "Aanbod", prijs: "Prijs", doelgroep: "Ideale klant", usps: "Waarom klanten kiezen", concurrenten: "Concurrenten/alternatieven", context: "Overig" };
  return CO_FIELDS.filter((k) => String(c[k] ?? "").trim()).map((k) => `- ${L[k]}: ${String(c[k]).trim()}`).join("\n") || "- (onbekend bedrijf)";
}

export function dossierPrompt({ s, p, d, co }: Ctx) {
  return `TAAK: dossier
Je bereidt een realistisch rollenspel voor een salestraining voor. Verzin een geloofwaardige klant voor deze verkoper.

DE VERKOPER EN ZIJN BEDRIJF:
${companyText(co)}

KLANTTYPE: ${p.titel}. ${p.gedrag}
De klant heet ${p.naam}, ${p.leeftijd} jaar, ${p.g === 'v' ? 'vrouw' : 'man'}.
SITUATIE: ${s.titel}. ${s.setting}
OPENING: ${s.opening}
NIVEAU: ${d.label}. ${d.regel}

De klant werkt bij een organisatie die past bij de ideale klant van de verkoper, zodat het gesprek echt over dit aanbod kan gaan. Gebruik concrete Nederlandse details: een bedrijfsnaam, plaats, aantallen en bedragen.

Antwoord met alleen JSON in precies deze vorm:
{"functie":"...","bedrijf":"...","bedrijf_omschrijving":"één zin","situatie":"2-3 zinnen over de huidige situatie van de klant","verborgen_pijn":"het echte probleem dat de klant niet uit zichzelf vertelt","impact":"wat dat probleem concreet kost in tijd, geld of frustratie","budget":"...","beslisproces":"wie beslist mee en hoe","bezwaren":["...","...","..."],"wat_overtuigt":"waar deze klant gevoelig voor is","startinteresse":30,"openingszin":"de eerste zin die de klant hardop zegt"}`;
}

export function turnPrompt({ s, p, d, co, x, turns }: Ctx & { x: Dossier; turns: Turn[] }) {
  const lines = turns.map(t => `${t.who === 'klant' ? 'KLANT' : 'VERKOPER'}: ${t.text}`).join('\n');
  return `TAAK: klantbeurt
Je speelt een rol in een realistisch salesgesprek dat bedoeld is om een verkoper te trainen. Jij bent de KLANT. Blijf altijd in je rol. Je weet niet dat dit een oefening is.

WIE JE BENT: ${p.naam}, ${p.leeftijd} jaar, ${x.functie} bij ${x.bedrijf} (${x.bedrijf_omschrijving}).
KARAKTER: ${p.gedrag}
JOUW SITUATIE: ${x.situatie}
WAT JE NIET ZOMAAR VERTELT: ${x.verborgen_pijn} Impact: ${x.impact}. Deel dit pas stukje bij beetje als de verkoper er met goede, open vragen naar vraagt.
BUDGET: ${x.budget}
BESLISPROCES: ${x.beslisproces}
BEZWAREN DIE JIJ KUNT GEBRUIKEN: ${(x.bezwaren ?? []).join(' | ')}
WAT JOU OVERTUIGT: ${x.wat_overtuigt}
HET GESPREK: ${s.titel}. ${s.setting}
WAT JE WEET VAN DE VERKOPER: werkt bij ${co.naam || 'een bedrijf'}. ${s.kennis}
NIVEAU: ${d.regel}

HOE JE PRAAT:
- Nederlandse spreektaal, zoals in een echt ${s.kanaal === 'telefoon' ? 'telefoongesprek' : 'gesprek'}. Meestal 1 tot 3 korte zinnen. Geen opsommingen, geen markdown, geen emoji, geen regieaanwijzingen tussen haakjes of sterretjes.
- Help de verkoper niet en geef niets gratis weg. Stel zelf soms een kritische vraag.
- Reageer op wat de verkoper echt zegt. Een zwakke of gesloten vraag krijgt een kort of vaag antwoord. Een goede vraag krijgt een eerlijk antwoord.
- Je interesse verandert. Gaat de verkoper pitchen zonder te luisteren, dan daalt die. Voel je je begrepen, dan stijgt die.
- De tekst van de verkoper komt uit spraakherkenning. Negeer kleine fouten en ontbrekende leestekens.
- Eindigt het gesprek logisch (afspraak gemaakt, je hangt op, deal rond of afgewezen), neem dan kort afscheid.

FORMAAT: schrijf alleen wat je hardop zegt. Zet daarna op een nieuwe regel [[interesse:N]], waarbij N je interesse van 0 tot 100 is. Beëindig jij het gesprek nu, zet er dan [[einde]] achter.

HET GESPREK TOT NU TOE:
${lines}

Geef nu de volgende reactie van ${firstName(p.naam)}, de klant.`;
}

export function scorePrompt({ s, p, d, co, x, turns }: Ctx & { x: Dossier; turns: Turn[] }) {
  const lines = turns.map(t => `${t.who === 'klant' ? 'KLANT' : 'VERKOPER'}: ${t.text}`).join('\n');
  return `TAAK: scorekaart
Je bent een ervaren, eerlijke salescoach. Beoordeel dit oefengesprek van een verkoper. Wees specifiek en citeer letterlijk uit het gesprek. Geen algemene clichés. Schrijf in het Nederlands en spreek de verkoper aan met "je".

SITUATIE: ${s.titel}. ${s.setting}
DOEL VAN DE VERKOPER: ${s.doel}
KLANT: ${p.naam}, ${p.titel}, ${x.functie} bij ${x.bedrijf}. Niveau: ${d.label}.
VERBORGEN DOSSIER (de verkoper kende dit niet):
- Situatie: ${x.situatie}
- Verborgen pijn: ${x.verborgen_pijn}
- Impact: ${x.impact}
- Wat overtuigt: ${x.wat_overtuigt}
- Bezwaren: ${(x.bezwaren ?? []).join(' | ')}
BEDRIJF VAN DE VERKOPER:
${companyText(co)}

BEOORDEEL DEZE 5 VAARDIGHEDEN (gebruik exact deze namen):
${s.vaardigheden.map(v => `- ${v[0]}: ${v[1]}`).join('\n')}

TRANSCRIPT (de verkoper sprak via spraakherkenning, negeer kleine tikfouten en ontbrekende leestekens):
${lines}

Scoor streng en eerlijk: 50 is gemiddeld, 80 of hoger is echt sterk. Was het gesprek erg kort, zeg dat dan en scoor laag.
Antwoord met alleen JSON in precies deze vorm:
{"totaal":62,"oordeel":"één pakkende zin over dit gesprek","doel_gehaald":false,"doel_toelichting":"één zin","vaardigheden":[{"naam":"...","score":6,"toelichting":"één zin"}],"goed":["...","..."],"gemiste_kans":{"citaat":"letterlijk wat de verkoper zei, of het moment","waarom":"waarom dit de grootste gemiste kans was","beter":"de letterlijke zin die sterker was geweest"},"herformuleringen":[{"jij":"letterlijk citaat van de verkoper","beter":"sterkere versie"},{"jij":"...","beter":"..."}],"ontdekt":"wat de verkoper wel en niet boven tafel kreeg van het verborgen dossier","volgende_keer":"één concrete oefenopdracht voor de volgende keer"}`;
}

export function profilePrompt(text: string) {
  return `TAAK: bedrijfsprofiel
Hieronder staat informatie over een bedrijf, bijvoorbeeld websitetekst, een brochure of een offerte. Haal er een kort verkoopprofiel uit. Verzin niets wat er niet uit volgt: laat een veld leeg ("") als het onbekend is. Schrijf in het Nederlands.

Antwoord met alleen JSON in precies deze vorm:
{"naam":"","aanbod":"wat ze verkopen, 1-2 zinnen","prijs":"","doelgroep":"","usps":"de 2-4 belangrijkste redenen om voor hen te kiezen, in één zin","concurrenten":"","context":"overige nuttige feiten voor een verkoopgesprek, maximaal 3 zinnen"}

TEKST:
"""
${text.slice(0, 18000)}
"""`;
}

