#!/usr/bin/env node
/**
 * Headless browser driver for the Pussycat catalog.
 *
 *   NODE_PATH=<dir>/node_modules node .claude/skills/run-pussycat/driver.cjs \
 *       [--serve] [--port 8000] [--out test-results/run-pussycat] [--headed] < script.txt
 *
 * Reads one command per line from stdin and runs them in order against a
 * headless Chrome (falls back to Edge). With --serve it starts
 * scripts/serve.js itself on --port and stops it on exit, so nothing is left
 * listening. playwright-core is resolved through NODE_PATH, because the repo
 * deliberately has no dependencies (D-005).
 *
 * Commands (a failing command exits non-zero):
 *   nav <path-or-url>         go to a URL; bare paths are relative to the server
 *   wait-for <selector>       wait until the selector is visible
 *   click <selector>
 *   fill <selector> <text>    replace an input's value (fires input events)
 *   select <selector> <value> choose an <option> by value or label
 *   press <key>               keyboard key on the focused element, e.g. Escape
 *   count <selector>          print how many elements match
 *   text <selector>           print the first match's innerText
 *   eval <js expression>      print the JSON of an expression run in the page
 *   shot <name>               full-page screenshot to <out>/<name>.png
 *   errors                    print console errors / page errors so far; fails if any
 *   sleep <ms>
 *   # comment                 ignored, as are blank lines
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  console.error('playwright-core not found. Set NODE_PATH to a node_modules that has it (see SKILL.md Prerequisites).');
  process.exit(2);
}

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const REPO = path.resolve(__dirname, '..', '..', '..');
const PORT = Number(opt('--port', 8000));
const BASE = `http://localhost:${PORT}`;
const OUT = path.resolve(REPO, opt('--out', 'test-results/run-pussycat'));

function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http
        .get(BASE + '/', (res) => { res.resume(); resolve(); })
        .on('error', () => {
          if (Date.now() > deadline) reject(new Error(`no server on ${BASE}`));
          else setTimeout(attempt, 200);
        });
    };
    attempt();
  });
}

async function launchBrowser() {
  const headless = !flag('--headed');
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel, headless });
    } catch (err) {
      console.error(`[driver] ${channel} unavailable: ${err.message.split('\n')[0]}`);
    }
  }
  throw new Error('neither Chrome nor Edge could be launched');
}

async function main() {
  const script = fs.readFileSync(0, 'utf8').split(/\r?\n/);

  let server;
  if (flag('--serve')) {
    server = spawn(process.execPath, [path.join(REPO, 'scripts', 'serve.js'), String(PORT)], {
      stdio: 'ignore',
    });
  }
  await waitForServer();

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const where = m.location().url;
    // The site ships no favicon; Chrome's own /favicon.ico probe 404s on every page.
    if (where.endsWith('/favicon.ico')) return;
    errors.push(`console: ${m.text()}${where ? ` (${where})` : ''}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
  // Chrome's console line for a 404 omits the URL; this names it.
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
  page.setDefaultTimeout(10000);

  let failed = false;
  try {
    for (const raw of script) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const [cmd, ...rest] = line.split(' ');
      const arg = rest.join(' ');
      console.log(`> ${line}`);
      switch (cmd) {
        case 'nav':
          await page.goto(/^https?:/.test(arg) ? arg : BASE + (arg.startsWith('/') ? arg : '/' + arg));
          break;
        case 'wait-for':
          await page.locator(arg).first().waitFor({ state: 'visible' });
          break;
        case 'click':
          await page.locator(arg).first().click();
          break;
        case 'fill': {
          const [sel, ...text] = rest;
          await page.locator(sel).first().fill(text.join(' '));
          break;
        }
        case 'select': {
          const [sel, ...value] = rest;
          await page.locator(sel).first().selectOption(value.join(' '));
          break;
        }
        case 'press':
          await page.keyboard.press(arg);
          break;
        case 'count':
          console.log(await page.locator(arg).count());
          break;
        case 'text':
          console.log(await page.locator(arg).first().innerText());
          break;
        case 'eval':
          console.log(JSON.stringify(await page.evaluate(arg)));
          break;
        case 'shot': {
          fs.mkdirSync(OUT, { recursive: true });
          const file = path.join(OUT, `${arg || 'screenshot'}.png`);
          await page.screenshot({ path: file, fullPage: true });
          console.log(file);
          break;
        }
        case 'errors':
          console.log(errors.length ? errors.join('\n') : '(no errors)');
          if (errors.length) failed = true;
          break;
        case 'sleep':
          await page.waitForTimeout(Number(arg));
          break;
        default:
          throw new Error(`unknown command: ${cmd}`);
      }
    }
  } catch (err) {
    console.error(`[driver] FAILED: ${err.message.split('\n')[0]}`);
    failed = true;
  } finally {
    await browser.close();
    if (server) server.kill();
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(`[driver] ${err.message}`);
  process.exit(1);
});
