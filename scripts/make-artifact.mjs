// Turns the single-file build (dist/index.html) into a Claude artifact body:
// the artifact host adds its own <!doctype>/<html>/<head>/<body> shell.
import { readFile, writeFile } from "node:fs/promises";

const html = await readFile("dist/index.html", "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
const body = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? "";
const title = head.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? "<title>Tegenspeler</title>";
const rest = head
  .replace(/<meta[^>]*>/gi, "")
  .replace(/<title>[\s\S]*?<\/title>/i, "");
await writeFile("dist/artifact.html", `${title}\n${rest.trim()}\n${body.trim()}\n`);
console.log("dist/artifact.html written");
