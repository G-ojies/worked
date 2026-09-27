import { contentCss } from "./content";
import type { Theme } from "../theme";

// Rules the web page never needed: it had a desktop column to sit in, the app
// has a phone. Wide tables and matrices scroll sideways inside their own box
// instead of pushing the whole page wider than the screen.
const APP_CSS = `
html, body { overflow-x: hidden; }
body { padding: 16px 16px 40px; font-size: 16.5px; -webkit-tap-highlight-color: transparent; }
.prompt, .sol-body { padding: 0; margin: 0; border: 0; background: none; max-width: none; }
.work, .sol-body > table, .prompt > table { overflow-x: auto; -webkit-overflow-scrolling: touch; }
table { max-width: 100%; }
svg { max-width: 100%; height: auto; }
pre { overflow-x: auto; white-space: pre; }
img { max-width: 100%; }
.app-label { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--blue); margin: 0 0 0.5rem; }
.app-rule { border: 0; border-top: 1px solid var(--rule); margin: 1.6rem 0 1.4rem; }
#sol[hidden] { display: none; }
`;

export function page(theme: Theme, body: string) {
  return `<!doctype html>
<html data-theme="${theme.scheme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>${contentCss}${APP_CSS}</style>
</head>
<body>${body}</body>
</html>`;
}

export function questionBody(prompt: string, solution: string, label: string, title: string, revealed: boolean) {
  const ask = prompt || `<p><strong>${title}</strong></p>`;
  return `<p class="app-label">Question</p>
<div class="prompt">${ask}</div>
<div id="sol"${revealed ? "" : " hidden"}>
<hr class="app-rule">
<p class="app-label">${label}</p>
<div class="sol-body">${solution}</div>
</div>`;
}

// Run inside the WebView to show the worked solution without a reload, so the
// reader keeps their place in a long question.
export const REVEAL_JS = `(function(){var s=document.getElementById('sol');if(s){s.hidden=false;s.scrollIntoView({behavior:'smooth',block:'start'});}})();true;`;
export const HIDE_JS = `(function(){var s=document.getElementById('sol');if(s){s.hidden=true;window.scrollTo(0,0);}})();true;`;
