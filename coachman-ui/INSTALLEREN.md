# Coachman UI installeren in een bestaand project

Instructies voor Claude Code. De map `coachman-ui/` staat in de root van het project.

## 1. Kijk eerst wat voor project het is

Lees `package.json`. De kit is React + Tailwind CSS v3 en wordt als TypeScript-bron meegeleverd.

- **Vite + React** → volg stap 2 t/m 6.
- **Next.js** → volg stap 2 t/m 6 én stap 7.
- **Tailwind v4** (`@import "tailwindcss"` in de CSS, geen `tailwind.config`) → de preset is voor v3. Neem de tokens over via `@theme` in de CSS: elke kleur/maat uit `coachman-ui/src/tokens/tailwind.preset.js` wordt een `--color-*`/`--spacing-*`-variabele die naar dezelfde `var(--…)` verwijst. Of stap over op Tailwind v3.
- **Geen React** → gebruik alleen `coachman-ui/src/tokens/tokens.css` (alle kleuren, maten, beweging als CSS-variabelen) en `fonts.css`. De componenten werken dan niet.

## 2. Afhankelijkheid toevoegen

```bash
npm install ./coachman-ui
```

Zo komt `"coachman-ui": "file:coachman-ui"` in `package.json`. Zorg dat `react`, `react-dom` en `lucide-react` geïnstalleerd zijn.

## 3. Stijlen importeren (één keer, in het entry-bestand of root layout)

```ts
import "coachman-ui/fonts.css";
import "coachman-ui/tokens.css";
```

Fonts zijn zelf gehost (geen Google Fonts nodig).

## 4. Tailwind-preset

In `tailwind.config.(js|ts)`:

```js
import coachmanPreset from "coachman-ui/tailwind-preset";

export default {
  presets: [coachmanPreset],
  content: [
    // bestaande paden…
    "./coachman-ui/src/**/*.{ts,tsx}",
  ],
};
```

Let op: de preset vervangt het kleurenpalet van Tailwind. Klassen als `bg-gray-100` of `text-blue-600` bestaan daarna niet meer; zet ze om naar tokens (`bg-surface-2`, `text-muted`, `bg-accent`, …). Zie de tabel onderaan.

## 5. Bundler-instellingen

**Vite** (`vite.config`):

```js
resolve: { dedupe: ["react", "react-dom"] },
optimizeDeps: { exclude: ["coachman-ui"], include: ["lucide-react"] },
```

En de dag/nacht-modus vóór de eerste paint (geen flits):

```js
import { modeInitScript } from "coachman-ui/init-script";
// in plugins:
{ name: "coachman-mode-init", transformIndexHtml: () => [{ tag: "script", children: modeInitScript, injectTo: "head-prepend" }] },
```

**TypeScript**: als `tsc` klaagt over twee soorten React-types, voeg in `tsconfig.json` toe:

```json
"paths": { "react": ["./node_modules/@types/react"], "react/*": ["./node_modules/@types/react/*"] }
```

## 6. App-schil en regels

- Zet de app in `<AppShell nav={…} activeId={…} onNavigate={…} appName="…">` en wikkel alles in `<ToastProvider>`.
- Pagina's beginnen met `<DayHeader>` en gebruiken een layout: `DashboardPage`, `LogPage`, `DetailPage`, `SettingsPage`, `Onboarding`.
- Kopieer de regels uit `coachman-ui/CLAUDE.md` naar de `CLAUDE.md` van het project (maak die aan als hij er niet is) en volg ze vanaf nu.
- Bouw bestaande schermen om naar de kit-componenten in plaats van eigen knoppen, kaarten, inputs en tabellen.

## 7. Alleen Next.js

- `next.config`: `transpilePackages: ["coachman-ui"]`.
- De componenten gebruiken hooks. Maak `src/components/coachman.ts`:

  ```ts
  "use client";
  export * from "coachman-ui";
  ```

  en importeer de kit overal vanuit dat bestand, niet rechtstreeks.
- Modus zonder flits: zet in `app/layout.tsx` in `<head>`
  `<script dangerouslySetInnerHTML={{ __html: modeInitScript }} />` (import uit `coachman-ui/init-script`) en `suppressHydrationWarning` op `<html>`.

## Wat er is

| Onderdeel | Import uit `coachman-ui` |
|---|---|
| Modus | `useMode`, `ModeToggle`, `ModeTransition`, `NightLayer` |
| Basis | `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `Switch`, `RadioGroup`, `Card`, `Stat`, `Progress`, `Tag`, `Badge`, `Tabs`/`TabList`/`Tab`/`TabPanel`, `Modal`, `Sheet`, `ToastProvider`/`useToast`, `EmptyState`, `Skeleton`, `Avatar`, `Divider`, `Tooltip` |
| Signature | `DayHeader`, `Log` + `LogEntry`, `Mark`, `Ledger`, `CommandBar` |
| Layouts | `AppShell`, `DashboardPage`, `LogPage`, `DetailPage`, `SettingsPage` + `SettingsGroup` + `SettingsRow`, `Onboarding` |

| Tailwind-klasse | Token |
|---|---|
| `bg-bg`, `bg-surface`, `bg-surface-2` | pagina, kaart, verzonken vlak |
| `text-ink`, `text-muted`, `text-faint` | hoofdtekst, secundair, tijdstempels |
| `border-line` | randen en lijnen |
| `bg-accent`, `text-accent`, `bg-accent-soft`, `text-on-accent` | ossenbloed (schaars!) |
| `text-success/warning/danger/info`, `bg-*-soft` | status |
| `p-s-1` … `p-s-8`, `gap-s-*` | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px |
| `rounded-sm/md/lg/full` | 4 · 8 · 14 px · rond |
| `font-display`, `font-ui`, `font-mono` | Cormorant Garamond · Geist · Geist Mono |
| `text-display/h1/h2/h3/body/small/label/mono` | typeschaal |
| `shadow-1`, `shadow-2`, `shadow-glow` | diepte, nachtgloed |
| `duration-fast/base/slow`, `ease`, `ease-heavy` | beweging |
| `max-w-read`, `max-w-dashboard` | 720 · 1200 px |
