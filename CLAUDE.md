# Tegenspeler

AI-salestrainer: oefen salesgesprekken met een klant die hardop terugpraat. Vite + React 19 + Tailwind v3, gebouwd met de eigen UI-kit in `coachman-ui/`.

## Regels — The Coachman UI

- Gebruik altijd componenten uit coachman-ui. Bouw geen nieuwe knop/kaart/input als er al een bestaat.
- Gebruik alleen design tokens (CSS-variabelen / Tailwind-preset). Nooit losse hex-kleuren, px-maten of fonts.
- Ossenbloed (accent) alleen voor de primaire actie, actieve staat en voltooiing. Max één primary button per scherm.
- Elke pagina en component moet werken in dag én nacht. Test beide.
- Cijfers, tijden en data in de mono-font met tabular-nums.
- UI-labels zijn gewone, functionele woorden. Geen koetsier-/paard-/koets-thematiek in tekst of iconen.
- Respecteer prefers-reduced-motion.
- Nieuwe pagina's starten met DayHeader en gebruiken een layout uit /layouts.
- Twijfel over stijl? Liever minder dan meer.

## Project

- `src/App.tsx`: AppShell met navigatie (Oefenen, Mijn bedrijf, Geschiedenis, Instellingen); route via `#hash`.
- `src/pages/`: één bestand per scherm. Oefenen heeft drie stappen: kiezen (`Train`) → gesprek (`Call`) → scorekaart (`Result`).
- `src/lib/brain.ts`: alle AI-aanroepen. Engines: Claude-artifact (abonnement van de kijker) of lokaal via `server.mjs` (Claude Code CLI). Een betaalde versie vervangt alleen deze laag.
- `src/lib/speech.ts`: stem van de klant (speechSynthesis), spraakherkenning, beltoon.
- `src/lib/prompts.ts`, `src/lib/content.ts`: prompts, scenario's, persona's, niveaus.
- Build: `npm run build` → `dist/index.html` (één bestand, fonts inline) en `dist/artifact.html` (om als Claude-artifact te publiceren).
- Testen zonder AI-gebruik: `npm run test-mode` (nep-antwoorden).
