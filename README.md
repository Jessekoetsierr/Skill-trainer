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

### Lokaal starten

Nodig: Node 18+ en Claude Code, waarmee je bent ingelogd (`claude`).

```bash
npm start
```

Open daarna http://localhost:5173 in **Chrome of Edge** en geef toegang tot je microfoon.

Wil je de klant sneller laten reageren? Kies dan een sneller model voor de klantbeurten:

```bash
TRAINER_MODEL_QUICK=haiku npm start
```

Testmodus zonder AI-gebruik (nep-antwoorden):

```bash
npm run test-mode
```

## Opbouw

- `index.html` is de hele app. Hij draait als Claude-artifact en wordt ook lokaal geserveerd.
- `server.mjs` is de lokale server. Hij stuurt AI-verzoeken naar de Claude Code CLI en levert het antwoord als stream terug.
- In `index.html` regelt het object `Brain` alle AI-aanroepen. Voor een betaalde versie vervang je alleen die laag door een server die de Claude API aanroept, met login en betaling ervoor.

## Stemmen

De klant gebruikt de stemmen van je browser. Edge heeft de beste Nederlandse stemmen ("Fenna" en "Maarten", Natural). Chrome gebruikt "Google Nederlands". Voor de betaalde versie kun je een stemdienst als ElevenLabs inzetten, die klinkt natuurlijker.
