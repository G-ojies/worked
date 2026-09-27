/**
 * Turns the worked study pages into the offline content bundle the app ships.
 *
 *     node tools/build-content.mjs [path-to-study-guide]
 *
 * Each course page is a list of <article class="q"> blocks: a prompt and a
 * worked solution. They are kept as HTML, because the solutions carry tables,
 * matrices and inline SVG diagrams that plain text would destroy, and rendered
 * in a WebView against the stylesheet extracted alongside them.
 *
 * Output (all generated, all committed so the app builds without the source):
 *   src/content/index.json        course and section metadata, question stubs
 *   src/content/<course>.json     prompt and solution HTML per question
 *   src/content/styles.json       the content stylesheet
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(process.argv[2] || join(HERE, "..", "..", "greyat-study-guide"));
const OUT = join(HERE, "..", "src", "content");

// Display order, short names and which course is free. The free course is the
// largest worked paper, so the free tier is a real product and not a teaser.
const COURSES = [
  { id: "csc328", code: "CSC328", name: "Discrete Structures", blurb: "Graphs, network flow, linear programming, automata and logic, worked end to end.", free: true },
  { id: "ict305", code: "ICT305", name: "Data Communications and Networks", blurb: "From signals to subnetting, with every calculation worked digit by digit." },
  { id: "dts304", code: "DTS304", name: "Data Management", blurb: "ER modelling, normalization, architectures, SQL and transactions." },
  { id: "csc325", code: "CSC325", name: "Compiler Construction", blurb: "Grammars, lexing, parsing tables and intermediate code generation." },
  { id: "csc311", code: "CSC311", name: "Web Technologies", blurb: "HTML, CSS, JavaScript and web architecture, from three years of papers." },
  { id: "csc322", code: "CSC322", name: "Innovation and New Technologies", blurb: "Innovation, ventures, management science and artificial intelligence." },
];

// The source pages are private and name an institution and people. This
// bundle is public, so those are generalised on the way through. The patterns
// themselves would give the names away, so they live in a file that is not
// committed: tools/scrub.local.json, a list of [pattern, flags, replacement].
const SCRUB_FILE = join(HERE, "scrub.local.json");
const RULES = existsSync(SCRUB_FILE)
  ? JSON.parse(readFileSync(SCRUB_FILE, "utf8")).map(([pattern, flags, to]) => [new RegExp(pattern, flags), to])
  : [];
const scrub = (s) => RULES.reduce((out, [re, to]) => out.replace(re, to), s);

const text = (html) =>
  html
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const tidy = (html) => html.replace(/\n\s+/g, "\n").trim();

// In-page anchors pointed at other parts of the web page. Inside the app they
// go nowhere, so they are unwrapped to their text.
const unlink = (html) => html.replace(/<a\s+href="#[^"]*"[^>]*>([\s\S]*?)<\/a>/g, "$1");

const pick = (block, re) => (block.match(re) || [, ""])[1];

if (!existsSync(SRC)) {
  console.error(`Study guide not found at ${SRC}`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const index = [];
let css = "";
let total = 0;

for (const course of COURSES) {
  const html = readFileSync(join(SRC, course.id, "index.html"), "utf8");
  // Pages share a stylesheet but some add rules of their own (matrices, graph
  // diagrams, code blocks), so every page contributes and duplicates are dropped.
  css += pick(html, /<style>([\s\S]*?)<\/style>/) + "\n";

  const sections = [];
  const bodies = {};

  const parts = html.split(/<section class="section" id="/).slice(1);
  for (const part of parts) {
    const sid = part.slice(0, part.indexOf('"'));
    const firstArticle = part.indexOf('<article class="q"');
    if (firstArticle < 0) continue;
    const head = part.slice(0, firstArticle);
    const note = pick(head, /<div class="note">([\s\S]*?)<\/div>\s*$/);

    const questions = [];
    const re = /<article class="q" id="([^"]+)">([\s\S]*?)<\/article>/g;
    let m;
    while ((m = re.exec(part))) {
      const [, qid, block] = m;
      const solStart = block.indexOf('<details class="sol"');
      const promptHtml = pick(block.slice(0, solStart < 0 ? undefined : solStart), /<div class="prompt">([\s\S]*)<\/div>/);
      const sol = solStart < 0 ? "" : block.slice(solStart);
      const solutionHtml = pick(sol, /<div class="sol-body">([\s\S]*)<\/div>\s*<\/details>/);
      if (!promptHtml && !solutionHtml) continue;

      const prompt = scrub(unlink(tidy(promptHtml)));
      const solution = scrub(unlink(tidy(solutionHtml)));
      const ask = text(prompt);

      questions.push({
        id: qid,
        num: text(pick(block, /<span class="q-num">([\s\S]*?)<\/span>/)),
        marks: text(pick(block, /<span class="marks">([\s\S]*?)<\/span>/)),
        title: scrub(text(pick(block, /<span class="q-title">([\s\S]*?)<\/span>/))),
        ask: ask.length > 220 ? ask.slice(0, 217).trimEnd() + "..." : ask,
        label: text(pick(sol, /<summary>([\s\S]*?)<\/summary>/)) || "Solution",
      });
      bodies[qid] = { prompt, solution };
    }
    if (!questions.length) continue;

    const title = scrub(text(pick(head, /<h2>([\s\S]*?)<\/h2>/)));
    sections.push({
      id: sid,
      letter: text(pick(head, /<span class="letter">([\s\S]*?)<\/span>/)),
      title,
      tally: text(pick(head, /<span class="tally">([\s\S]*?)<\/span>/)),
      // Real past papers and mock papers are what a timed mock draws from.
      kind: /^(pp-|sec-x|mock)/.test(sid) || /past paper|real .*paper|mock/i.test(title) ? "paper" : /^ref/.test(sid) ? "reference" : "topic",
      note: note ? scrub(unlink(tidy(note))) : "",
      questions,
    });
  }

  const count = sections.reduce((n, s) => n + s.questions.length, 0);
  total += count;
  index.push({ ...course, free: !!course.free, count, sections });
  writeFileSync(join(OUT, `${course.id}.json`), JSON.stringify(bodies));
  console.log(`${course.code}: ${sections.length} sections, ${count} questions`);
}

// The page stylesheet styles the whole site. Only the rules that reach inside a
// question are wanted, so the page chrome is dropped by selector.
const CHROME = /(^|[\s,>+~])\.(wrap|masthead|eyebrow|lede|facts|toc|toolbar|section-head|letter|tally|q-head|q-num|q-title|marks|footer|chat|fab|search|plan|hub|card|pill|flash|mock-|timer|print)/;
const rules = [];
{
  // Split top-level rules, keeping @media blocks whole.
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        rules.push(css.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
  }
}
const kept = [...new Set(rules)]
  .map((r) => r.replace(/\/\*[\s\S]*?\*\//g, "").trim())
  .filter((r, i, all) => r && !r.startsWith("@media print") && all.indexOf(r) === i)
  .filter((r) => {
    if (r.startsWith("@") || r.startsWith(":root")) return true;
    const selector = r.slice(0, r.indexOf("{"));
    return !selector.split(",").every((s) => CHROME.test(s));
  });

writeFileSync(join(OUT, "index.json"), JSON.stringify(index));
writeFileSync(join(OUT, "styles.json"), JSON.stringify({ css: kept.join("\n") }));

console.log(`\n${total} questions, ${kept.length} of ${rules.length} style rules kept.`);
if (!RULES.length) console.warn("No tools/scrub.local.json found: nothing was generalised.");
