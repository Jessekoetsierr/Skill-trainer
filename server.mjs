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
import { readFile } from 'node:fs/promises';
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

// The page is written as an artifact body; give it a proper document shell here.
const SHELL_HEAD = '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
const SHELL_FOOT = '</body></html>';

function askClaude(prompt, tier, res, req) {
  const args = [
    '-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages',
    '--tools', '', '--strict-mcp-config', '--setting-sources', '', '--no-session-persistence',
    '--system-prompt', SYSTEM
  ];
  const model = MODELS[tier] || MODELS.default;
  if (model) args.push('--model', model);

  const child = spawn(CLAUDE_BIN, args, { cwd: tmpdir(), stdio: ['pipe', 'pipe', 'pipe'] });
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
      const body = await readFile(path.join(ROOT, 'index.html'), 'utf8');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(SHELL_HEAD + body + SHELL_FOOT);
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
  console.log(`\n  Tegenspeler draait op http://localhost:${PORT}${MOCK ? '  (testmodus)' : ''}`);
  console.log('  Open de link in Chrome of Edge en geef toegang tot je microfoon.\n');
});
