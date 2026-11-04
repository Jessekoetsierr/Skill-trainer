// Content of the trainer: situations, customer types, difficulty levels.
export type Scenario = {
  id: string; titel: string; sub: string; icon: "phone" | "ask" | "shield" | "pen"; kanaal: "telefoon" | "afspraak";
  doel: string; setting: string; opening: string; kennis: string; vaardigheden: [string, string][];
};
export type Persona = {
  id: string; naam: string; titel: string; leeftijd: number; g: "m" | "v"; rate: number;
  kort: string; traits: string[]; gedrag: string;
};
export type Level = { id: string; label: string; regel: string; note: string };
export type Company = { naam: string; aanbod: string; prijs: string; doelgroep: string; usps: string; concurrenten: string; context: string; isExample?: boolean };

export const SCENARIOS: Scenario[] = [
  { id: 'koud', titel: 'Koude acquisitie', sub: 'Je belt iemand die jou niet verwacht.', icon: 'phone' as const, kanaal: 'telefoon',
    doel: 'Een vervolgafspraak inplannen.',
    setting: 'Telefoongesprek. De verkoper belt jou onaangekondigd op je mobiel. Je neemt op terwijl je met iets anders bezig bent. Je kent de verkoper en het bedrijf niet.',
    opening: 'De klant neemt de telefoon op, bijvoorbeeld alleen met de eigen naam, een beetje afgeleid.',
    kennis: 'Je kent dit bedrijf niet en hebt de verkoper nooit gesproken.',
    vaardigheden: [
      ['Opening', 'Stelt zich kort voor en vraagt of het uitkomt, zonder te rammelen.'],
      ['Relevantie', 'Maakt binnen 30 seconden duidelijk waarom dit voor déze klant interessant is.'],
      ['Nieuwsgierigheid wekken', 'Stelt prikkelende vragen in plaats van een lange pitch te houden.'],
      ['Afwimpelen ombuigen', 'Gaat goed om met "geen tijd", "stuur maar een mailtje", "geen interesse".'],
      ['Vervolgstap', 'Vraagt concreet om een afspraak met datum en tijd.']
    ] },
  { id: 'discovery', titel: 'Kennismakingsgesprek', sub: 'Ontdek wat de klant echt dwarszit.', icon: 'ask' as const, kanaal: 'afspraak',
    doel: 'De echte pijn én wat die kost boven tafel krijgen.',
    setting: 'Eerste kennismakingsgesprek op jouw kantoor, ingepland voor een half uur. Je hebt ingestemd met het gesprek omdat je wel nieuwsgierig bent, maar je bent nog niets van plan.',
    opening: 'De klant begroet de verkoper, bijvoorbeeld bij binnenkomst, en zegt hoeveel tijd er is.',
    kennis: 'Je weet ongeveer wat het bedrijf doet, meer niet.',
    vaardigheden: [
      ['Agenda & rapport', 'Zet een prettige toon en spreekt af wat het doel van het gesprek is.'],
      ['Open vragen', 'Stelt open vragen in plaats van gesloten of suggestieve vragen.'],
      ['Doorvragen', 'Vraagt door naar de oorzaak en de impact (tijd, geld, frustratie).'],
      ['Luisteren & samenvatten', 'Vat samen in de woorden van de klant en checkt of het klopt.'],
      ['Vervolgafspraak', 'Sluit af met een concrete, logische volgende stap.']
    ] },
  { id: 'bezwaren', titel: 'Bezwaren & onderhandelen', sub: '"Te duur." "We zitten al goed." "Even nadenken."', icon: 'shield' as const, kanaal: 'afspraak',
    doel: 'De deal redden zonder onnodig korting weg te geven.',
    setting: 'Vervolggesprek (videocall). De klant heeft de offerte van de verkoper ontvangen en heeft bedenkingen. Je hebt bezwaren die je stevig naar voren brengt.',
    opening: 'De klant begint direct met een bezwaar over de offerte.',
    kennis: 'Je hebt al een kennismakingsgesprek gehad en de offerte gelezen. De prijs uit het bedrijfsprofiel staat in de offerte.',
    vaardigheden: [
      ['Bezwaar uitvragen', 'Vraagt wat er écht achter het bezwaar zit voordat hij antwoordt.'],
      ['Erkennen', 'Erkent het bezwaar zonder defensief te worden of meteen te pareren.'],
      ['Waarde boven prijs', 'Koppelt de prijs aan wat het de klant oplevert.'],
      ['Ruilen, niet geven', 'Geeft alleen iets als hij er iets voor terugkrijgt.'],
      ['Rust & overtuiging', 'Blijft rustig, laat stiltes vallen, klinkt zeker.']
    ] },
  { id: 'closing', titel: 'Afsluiten', sub: 'Het moment waarop de klant ja moet zeggen.', icon: 'pen' as const, kanaal: 'afspraak',
    doel: 'Een duidelijk ja, met afspraken over de start.',
    setting: 'Laatste gesprek (bij de klant op kantoor). Alles is besproken, de offerte ligt er. Je bent positief maar nog niet over de streep, en je hebt nog één of twee laatste twijfels.',
    opening: 'De klant opent vriendelijk en zegt dat hij de stukken nog eens heeft doorgenomen.',
    kennis: 'Je kent het voorstel en de prijs. Je bent al ver in het proces.',
    vaardigheden: [
      ['Samenvatten van waarde', 'Vat kort samen wat de klant ermee wint, in diens eigen woorden.'],
      ['Koopsignalen herkennen', 'Merkt op wanneer de klant eigenlijk al ja zegt.'],
      ['Afsluitvraag', 'Durft direct te vragen om de beslissing.'],
      ['Laatste twijfels', 'Haalt de laatste twijfels boven en neemt ze weg.'],
      ['Concrete afspraken', 'Spreekt start, ondertekening en volgende stappen af.']
    ] }
];

export const PERSONAS: Persona[] = [
  { id: 'inkoper', naam: 'Henk Vermeulen', titel: 'De sceptische inkoper', leeftijd: 56, g: 'm', rate: 0.96,
    kort: 'Wil bewijs en vergelijkt alles op prijs.', traits: ['Kritisch', 'Prijsgericht', 'Wantrouwig'],
    gedrag: 'Je bent een ervaren inkoper die al honderd verkopers heeft gezien. Je bent kortaf maar beleefd, vraagt naar bewijs, cijfers en referenties, en begint graag over de prijs. Enthousiasme maakt je juist argwanend. Je wordt pas milder als de verkoper concreet en eerlijk is.' },
  { id: 'directeur', naam: 'Sandra de Wit', titel: 'De drukke directeur', leeftijd: 48, g: 'v', rate: 1.1,
    kort: 'Heeft geen tijd. Kom ter zake.', traits: ['Ongeduldig', 'Resultaatgericht', 'Direct'],
    gedrag: 'Je bent directeur-eigenaar, je agenda zit vol en je hebt een hekel aan vage praatjes. Je onderbreekt lange verhalen ("Wat is je punt?") en wilt weten wat iets oplevert in geld of tijd. Als de verkoper scherp en kort is, geef je ruimte.' },
  { id: 'twijfelaar', naam: 'Mark Jansen', titel: 'De vriendelijke twijfelaar', leeftijd: 34, g: 'm', rate: 1.0,
    kort: 'Zegt overal ja op, maar beslist nooit.', traits: ['Aardig', 'Conflictmijdend', 'Besluiteloos'],
    gedrag: 'Je bent vriendelijk en zegt vaak "Ja, interessant!", maar je vermijdt beslissingen. Je verschuilt je achter "even overleggen", "nog even nadenken", "stuur maar wat informatie". Je echte reden om te twijfelen noem je alleen als de verkoper er rustig en direct naar vraagt.' },
  { id: 'loyaal', naam: 'Ingrid Bakker', titel: 'De klant van de concurrent', leeftijd: 52, g: 'v', rate: 0.98,
    kort: '"We zitten al goed." Tevreden met haar huidige partij.', traits: ['Loyaal', 'Tevreden', 'Gesloten'],
    gedrag: 'Je werkt al jaren met een andere leverancier en bent daar redelijk tevreden over. Overstappen voelt als gedoe en risico. Je bent niet onvriendelijk, maar wel gesloten. Je hebt kleine ergernissen over je huidige leverancier, die je alleen deelt als de verkoper goede vragen stelt in plaats van te pitchen.' },
  { id: 'analist', naam: 'Nadia Kaya', titel: 'De analist', leeftijd: 41, g: 'v', rate: 1.0,
    kort: 'Wil alles tot in detail weten.', traits: ['Grondig', 'Feitelijk', 'Voorzichtig'],
    gedrag: 'Je bent controller en denkt in risico\'s, details en onderbouwing. Je stelt precieze vragen over implementatie, voorwaarden, beveiliging en terugverdientijd. Vage antwoorden irriteren je. Je waardeert het als een verkoper eerlijk zegt iets niet te weten en het uitzoekt.' },
  { id: 'onderhandelaar', naam: 'Patrick Smit', titel: 'De harde onderhandelaar', leeftijd: 45, g: 'm', rate: 1.04,
    kort: 'Speelt spelletjes om korting te krijgen.', traits: ['Dominant', 'Tactisch', 'Charmant'],
    gedrag: 'Je bent een geslepen onderhandelaar. Je gebruikt tactieken: "jullie concurrent is twintig procent goedkoper", stiltes, tijdsdruk, "als je nu korting geeft, teken ik vandaag". Je test of de verkoper zomaar toegeeft. Je respecteert verkopers die rustig blijven en alleen iets geven als ze er iets voor terugkrijgen.' }
];

export const LEVELS: Level[] = [
  { id: 'mild', label: 'Mild', regel: 'Je bent redelijk welwillend en geeft de verkoper het voordeel van de twijfel. Je bezwaren zijn zacht.', note: 'Een welwillende klant. Goed om een nieuwe aanpak te proberen.' },
  { id: 'realistisch', label: 'Realistisch', regel: 'Je gedraagt je als een echte klant: niet vijandig, maar je geeft niets gratis weg en je hebt echte bezwaren.', note: 'Zoals een gemiddelde echte klant: niet vijandig, wel kritisch.' },
  { id: 'pittig', label: 'Pittig', regel: 'Je bent lastig: weinig tijd, je onderbreekt, je gooit stevige bezwaren op. Als de verkoper twee keer achter elkaar niet relevant is of blijft pitchen, beëindig je het gesprek.', note: 'Weinig geduld en stevige bezwaren. Blijf je twee keer vaag, dan is het gesprek voorbij.' }
];

export const EXAMPLE_CO: Company = {
  naam: 'Planwerk',
  aanbod: 'Online planningssoftware voor installatiebedrijven: monteurs inplannen, werkbonnen digitaal laten tekenen en direct factureren.',
  prijs: '€39 per gebruiker per maand, implementatie eenmalig €1.500',
  doelgroep: 'Installatie- en onderhoudsbedrijven met 10 tot 80 monteurs in Nederland',
  usps: 'Monteurs werken offline in de app, koppeling met Exact en AFAS, binnen 2 weken live, Nederlandse support',
  concurrenten: 'Excel en whiteboards, grote ERP-pakketten, andere planningstools',
  context: 'Klanten besparen gemiddeld 6 uur planningswerk per week en factureren 9 dagen sneller.'
};
export const CO_FIELDS: (keyof Company)[] = ['naam', 'aanbod', 'prijs', 'doelgroep', 'usps', 'concurrenten', 'context'];
