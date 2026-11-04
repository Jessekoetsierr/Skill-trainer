# Tegenspeler

Oefen salesgesprekken met een AI-klant die hardop terugpraat.

Je kiest een situatie (koude acquisitie, kennismaking, bezwaren, afsluiten), een type klant (6 persona's) en een niveau. De klant krijgt een verborgen dossier met een echte pijn, een budget en bezwaren, afgestemd op **jouw eigen bedrijf**. Na afloop krijg je een scorekaart met 5 vaardigheden, je grootste gemiste kans, betere zinnen en een onthulling van wat de klant voor je verborg.

## Twee manieren om te gebruiken (allebei zonder API-credits)

| | In Claude (claude.ai) | Lokaal op je computer |
|---|---|---|
| AI | Je eigen Claude-abonnement | Je eigen Claude Code-abonnement |
| Klant praat | Ja | Ja |
| Jij praat | Via dicteren (Win+H / 2x Fn), verstuurt vanzelf als je stil valt | Handsfree via je microfoon |
| Delen | Link delen; anderen gebruiken hun eigen abonnement | Alleen op jouw computer |

### Als app op Windows (eenmalig instellen, ongeveer 10 minuten)

1. **Download Tegenspeler.** Ga op GitHub naar deze repository, kies de branch `claude/loving-ride-yfluzb` en klik op **Code > Download ZIP**. Pak de ZIP uit, bijvoorbeeld in je map Documenten.
2. **Installeer Node.js.** Download de LTS-versie op https://nodejs.org en klik door de installatie.
3. **Installeer Claude Code.** Open **PowerShell** (zoek in het Startmenu op "PowerShell") en plak:
   ```powershell
   irm https://claude.ai/install.ps1 | iex
   ```
4. **Log in met je Claude-abonnement.** Typ in PowerShell `claude` en volg de stappen. Daarna kun je het venster sluiten.
5. **Start de app.** Dubbelklik in de uitgepakte map op **`Start Tegenspeler.bat`**. Tegenspeler opent in een eigen venster. Laat het zwarte venster open zolang je oefent.
6. **Zet hem vast als app.** Klik in de app op **Installeer als app**. Daarna staat Tegenspeler met een eigen icoon in je Startmenu en taakbalk. Het zwarte venster (stap 5) moet wel draaien.

De eerste keer vraagt Edge om toegang tot je microfoon. Kies **Toestaan**.

### Voor ontwikkelaars

```bash
npm start              # app op http://127.0.0.1:5173
npm run test-mode      # nep-antwoorden, geen AI-gebruik
TRAINER_MODEL_QUICK=haiku npm start   # klant reageert sneller
```

## Opbouw

- `index.html` is de hele app. Hij draait als Claude-artifact en wordt ook lokaal geserveerd.
- `app/` bevat het app-icoon, het manifest en de service worker, zodat je hem kunt installeren.
- `Start Tegenspeler.bat` start alles met een dubbelklik op Windows.
- `server.mjs` is de lokale server. Hij stuurt AI-verzoeken naar de Claude Code CLI en levert het antwoord als stream terug.
- In `index.html` regelt het object `Brain` alle AI-aanroepen. Voor een betaalde versie vervang je alleen die laag door een server die de Claude API aanroept, met login en betaling ervoor.

## Stemmen

De klant gebruikt de stemmen van je browser. Edge heeft de beste Nederlandse stemmen ("Fenna" en "Maarten", Natural). Chrome gebruikt "Google Nederlands". Voor de betaalde versie kun je een stemdienst als ElevenLabs inzetten, die klinkt natuurlijker.

## Op weg naar verkopen

De app is een installeerbare web-app (PWA). Zet je hem straks online, dan installeren klanten hem op Windows, Mac, iPhone en Android vanaf één link, zonder app store. Daarvoor zijn nodig:

1. hosting (bijvoorbeeld Vercel of Netlify),
2. een kleine server die de Claude API aanroept, in plaats van Claude Code,
3. inloggen en betalen (bijvoorbeeld Stripe),
4. optioneel betere stemmen via een stemdienst.

Dan betaal jij per gesprek voor de API, en je klanten betalen jou een abonnement.
