// Tegenspeler, local version.
// Serves the app on http://localhost:5173 and answers AI requests through the
// Claude Code CLI, so it runs on your own Claude subscription (no API credits).
//
//   npm start                  start the app
//   TRAINER_MOCK=1 npm start   test mode with canned answers (no AI usage)
//
// Optional: TRAINER_MODEL_QUICK / TRAINER_MODEL_DEFAULT choose the model per task
// (any value `claude --model` accepts). A faster model for the customer's replies
// makes the conversation feel snappier.

import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
const MOCK = process.env.TRAINER_MOCK === '1';
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const MODELS = {
  quick: process.env.TRAINER_MODEL_QUICK || '',
  default: process.env.TRAINER_MODEL_DEFAULT || '',
  complex: process.env.TRAINER_MODEL_COMPLEX || process.env.TRAINER_MODEL_DEFAULT || ''
};
const SYSTEM = 'Je bent de AI-motor van een salestrainingsapp. Volg de instructies in het bericht precies op en antwoord alleen met wat er gevraagd wordt, zonder inleiding of uitleg.';

// The built app (npm run build → dist/index.html) gets the install-as-app tags here,
// so the artifact version stays free of them.
const PWA_TAGS = '<link rel="manifest" href="/app/manifest.webmanifest"><meta name="theme-color" content="#0c0b0a"><link rel="icon" href="/app/icon-192.png"><link rel="apple-touch-icon" href="/app/icon-192.png">' +
  '<script>if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}))</script>';

const STATIC = {
  '/app/manifest.webmanifest': 'application/manifest+json',
  '/sw.js': 'text/javascript; charset=utf-8',
  '/app/icon-192.png': 'image/png',
  '/app/icon-512.png': 'image/png',
  '/app/icon-maskable.png': 'image/png'
};

// The system prompt goes through a file, so no shell quoting is needed on Windows.
const SYSTEM_FILE = path.join(tmpdir(), 'tegenspeler-system.txt');
await writeFile(SYSTEM_FILE, SYSTEM, 'utf8');
const IS_WIN = process.platform === 'win32';
const winQuote = a => a === '' ? '""' : /[\s"&|<>^()%!]/.test(a) ? '"' + a.replace(/"/g, '""') + '"' : a;

function askClaude(prompt, tier, res, req) {
  const args = [
    '-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages',
    '--tools', '', '--strict-mcp-config', '--setting-sources', '', '--no-session-persistence',
    '--system-prompt-file', SYSTEM_FILE
  ];
  const model = MODELS[tier] || MODELS.default;
  if (model) args.push('--model', model);

  // On Windows `claude` can be a .cmd shim, which Node only starts through the shell.
  const child = IS_WIN
    ? spawn([CLAUDE_BIN, ...args].map(winQuote).join(' '), { cwd: tmpdir(), stdio: ['pipe', 'pipe', 'pipe'], shell: true, windowsHide: true })
    : spawn(CLAUDE_BIN, args, { cwd: tmpdir(), stdio: ['pipe', 'pipe', 'pipe'] });
  let streamed = false, buf = '', errText = '', finished = false;
  const finish = (err) => {
    if (finished) return; finished = true;
    if (err) res.write('\u0000ERROR:' + err);
    res.end();
  };
  req.on('close', () => { if (!finished) child.kill('SIGTERM'); });
  child.on('error', e => finish(e.code === 'ENOENT'
    ? 'De Claude CLI is niet gevonden. Installeer Claude Code en log in met `claude`.'
    : String(e.message)));
  child.stderr.on('data', d => { errText += d; });
  child.stdout.on('data', chunk => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line) continue;
      let ev; try { ev = JSON.parse(line); } catch { continue; }
      if (ev.type === 'stream_event' && ev.event?.type === 'content_block_delta' && ev.event.delta?.type === 'text_delta') {
        streamed = true; res.write(ev.event.delta.text);
      } else if (ev.type === 'result') {
        if (ev.is_error) return finish(String(ev.result || 'Claude gaf een fout terug.'));
        if (!streamed && ev.result) res.write(String(ev.result));
        return finish();
      }
    }
  });
  child.on('close', code => finish(code ? (errText.trim().split('\n').pop() || `claude stopte met code ${code}`) : undefined));
  child.stdin.end(prompt);
}

// Canned answers so the whole flow can be tested without AI usage.
function mockAnswer(prompt) {
  if (prompt.startsWith('TAAK: dossier')) return JSON.stringify({
    functie: 'Operationeel manager', bedrijf: 'Van Dijk Installatietechniek', bedrijf_omschrijving: 'Installatiebedrijf in Amersfoort met 34 monteurs.',
    situatie: 'Plant alles in Excel en via de telefoon. Twee planners zijn er de hele dag mee bezig.', verborgen_pijn: 'Werkbonnen komen dagen te laat binnen, waardoor facturen pas na weken de deur uitgaan.',
    impact: 'Gemiddeld €180.000 openstaand aan onverwerkte werkbonnen.', budget: 'Zo\'n €20.000 per jaar als het zich terugverdient', beslisproces: 'De directeur tekent, de planners moeten akkoord zijn.',
    bezwaren: ['Geen tijd voor een implementatie', 'Monteurs zijn niet digitaal', 'We hebben al eens een tool geprobeerd'], wat_overtuigt: 'Concrete cijfers van vergelijkbare bedrijven', startinteresse: 25, openingszin: 'Met Henk Vermeulen.'
  });
  if (prompt.startsWith('TAAK: scorekaart')) return JSON.stringify({
    totaal: 58, oordeel: 'Goede opening, maar je liet de echte pijn liggen.', doel_gehaald: false, doel_toelichting: 'Je kreeg geen afspraak, wel een opening om terug te bellen.',
    vaardigheden: [{ naam: 'Opening', score: 7, toelichting: 'Kort en beleefd.' }, { naam: 'Relevantie', score: 5, toelichting: 'Te algemeen.' }, { naam: 'Nieuwsgierigheid wekken', score: 6, toelichting: 'Eén goede vraag.' }, { naam: 'Afwimpelen ombuigen', score: 4, toelichting: 'Je gaf meteen toe.' }, { naam: 'Vervolgstap', score: 5, toelichting: 'Geen concrete datum.' }],
    goed: ['Je vroeg of het uitkwam.', 'Je bleef rustig.'], gemiste_kans: { citaat: 'Oké, dan stuur ik een mailtje.', waarom: 'Daarmee gaf je de regie weg.', beter: 'Prima, zullen we dan nu even tien minuten prikken voor donderdag?' },
    herformuleringen: [{ jij: 'Wij hebben een hele mooie tool.', beter: 'Hoe lang duurt het nu voordat een werkbon gefactureerd is?' }], ontdekt: 'Je hoorde dat ze in Excel plannen, maar niet dat de facturatie achterloopt.', volgende_keer: 'Stel bij je volgende koude call minstens twee vragen voordat je iets over je product zegt.'
  });
  if (prompt.startsWith('TAAK: bedrijfsprofiel')) return JSON.stringify({ naam: 'Testbedrijf', aanbod: 'Testdiensten', prijs: '€99', doelgroep: 'MKB', usps: 'Snel en goedkoop', concurrenten: '', context: '' });
  const lines = ['Ja, zeg het maar. Ik heb niet veel tijd.', 'Hm. En wat levert me dat precies op?', 'Dat zeggen ze allemaal. Heb je daar cijfers van?', 'Goed, stuur me maar een mailtje.'];
  const n = (prompt.match(/\nVERKOPER:/g) || []).length;
  return `${lines[Math.min(n - 1, lines.length - 1)] || lines[0]}\n[[interesse:${20 + n * 10}]]`;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?') || req.url === '/index.html')) {
      let body;
      try { body = await readFile(path.join(ROOT, 'dist', 'index.html'), 'utf8'); }
      catch { res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('De app is nog niet gebouwd. Voer eerst  npm run build  uit.'); }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(body.replace('</head>', PWA_TAGS + '</head>'));
    }
    if (req.method === 'GET' && STATIC[req.url]) {
      const body = await readFile(path.join(ROOT, req.url === '/sw.js' ? 'app/sw.js' : req.url.slice(1)));
      res.writeHead(200, { 'content-type': STATIC[req.url], 'cache-control': 'no-cache' });
      return res.end(body);
    }
    if (req.method === 'GET' && req.url === '/api/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, mode: MOCK ? 'mock' : 'claude' }));
    }
    if (req.method === 'POST' && req.url === '/api/ask') {
      let raw = ''; for await (const c of req) { raw += c; if (raw.length > 400_000) throw new Error('Verzoek te groot'); }
      const { prompt, tier } = JSON.parse(raw || '{}');
      if (typeof prompt !== 'string' || !prompt.trim()) { res.writeHead(400); return res.end('prompt ontbreekt'); }
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
      if (MOCK) {
        const text = mockAnswer(prompt);
        for (const part of text.match(/.{1,12}/gs)) { res.write(part); await new Promise(r => setTimeout(r, 25)); }
        return res.end();
      }
      return askClaude(prompt, tier in MODELS ? tier : 'default', res, req);
    }
    res.writeHead(404); res.end('Niet gevonden');
  } catch (e) {
    if (!res.headersSent) res.writeHead(500);
    res.end(String(e.message || e));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Tegenspeler draait op http://127.0.0.1:${PORT}${MOCK ? '  (testmodus)' : ''}`);
  console.log('  Open de link in Edge of Chrome en geef toegang tot je microfoon.');
  console.log('  Tip: klik in de adresbalk op "App installeren" voor een eigen venster en icoon.\n');
});
