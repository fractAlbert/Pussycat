---
name: run-pussycat
description: Run, start, serve, drive, and screenshot the Pussycat puzzle catalog site. Use when asked to run the site locally, check a UI change in a browser, take a screenshot of the catalog, detail modal, or checklist, check for console errors, or run the syntax/data checks.
---

The Pussycat catalog is a static site (`src/`) with no build step. An agent
drives it with `.claude/skills/run-pussycat/driver.cjs`. The driver starts
`scripts/serve.js`, runs a script of commands from stdin against headless
Chrome, and writes screenshots. All paths below are relative to the repo root.
Verified on Windows 11 (Git Bash, Node 25) with system Chrome.

## Prerequisites

You need Google Chrome or Microsoft Edge installed. The driver launches the
system browser, so no Playwright browser download is needed. The repo has no
dependencies by design (D-005), so `playwright-core` is installed *outside* the
repo, once per machine:

```bash
mkdir -p "$HOME/.cache/pussycat-run" && cd "$HOME/.cache/pussycat-run" && npm install --no-save --no-package-lock --prefix . playwright-core@1.63.0
```

Every driver run needs this in the environment:

```bash
export NODE_PATH="$HOME/.cache/pussycat-run/node_modules"
```

## Run (agent path)

Pipe a command script to the driver. `--serve` starts the server and stops it
on exit. This flow searches, opens a puzzle, closes it, then checks the
checklist page:

```bash
node .claude/skills/run-pussycat/driver.cjs --serve --port 8123 <<'EOF'
nav /
wait-for .card
text #count
fill #search van gogh
text #count
count .card:visible
click .card:visible .card__open
wait-for dialog#detail[open]
text .modal__title
shot detail
press Escape
eval document.querySelector('#detail').open
nav /checklist.html
wait-for input[type=checkbox]
shot checklist
errors
EOF
```

Expected output: `91 puzzles` → `2 of 91 puzzles` → `2` →
`Schwertlilien (Irises)` → `false` → `(no errors)`, with exit code 0.
Screenshots land in `test-results/run-pussycat/<name>.png`. Change the folder
with `--out <dir>`, and use one folder per test name when the screenshots are
Atlas evidence. Open the PNGs and look at them.

| command | what it does |
|---|---|
| `nav <path-or-url>` | go to a page; bare paths are relative to the server |
| `wait-for <sel>` | wait until visible (10s timeout) |
| `click <sel>` / `fill <sel> <text>` / `select <sel> <value>` / `press <key>` | interact |
| `count <sel>` / `text <sel>` / `eval <js>` | print what's on the page |
| `shot <name>` | full-page PNG to `<out>/<name>.png` |
| `errors` | print console errors, page errors, failed requests and HTTP ≥400 responses; makes the run exit 1 if there are any |
| `sleep <ms>` | wait for a fixed time; prefer `wait-for` |

Any failing command stops the script and exits 1. `--port` defaults to 8000.
Without `--serve`, the driver attaches to a server already listening on
`--port`.

## Run (human path)

```bash
node scripts/serve.js   # -> http://localhost:8000 in your browser. Ctrl-C to stop.
```

## Checks

The repo has no test suite. These two checks cover syntax and data:

```bash
git ls-files "*.js" | xargs -n1 node --check
node -e "JSON.parse(require('fs').readFileSync('src/data/puzzles.json','utf8'))"
```

## Gotchas

- **Filtered cards stay in the DOM.** The grid only hides them so that a
  manual sort keeps its order. `count .card` is always 91, and `click .card`
  can hit a hidden card and time out. Use `.card:visible` and read `#count`
  (`"2 of 91 puzzles"`).
- **Search is live.** `fill #search` filters right away. No Enter or wait is needed.
- **A `/favicon.ico` 404 happens on every page.** The site has no favicon.
  Chrome requests the file itself, so the page's network events never show it,
  and the console message has no URL. The driver ignores that one case. Any
  other 404 is reported with its URL.
- **Don't open `src/index.html` from disk.** `fetch()` of `puzzles.json` is
  blocked under `file://`, so you get the page frame with no cards.
- **Stopping a background `serve.js` from Git Bash is unreliable**
  (`lsof` isn't available, and `$!` isn't the Windows PID). `--serve` avoids
  this because the driver kills its own child process. Use a port other than
  8000 if you have a server of your own running.
- **`--serve` on a busy port silently reuses whatever is already listening
  there.** It checks the port, not the process. Pick a port that is free.

## Troubleshooting

- **`locator.click: Timeout 10000ms exceeded`** after a search: the selector
  matched a hidden card. Use `.card:visible ...`.
- **`playwright-core not found`**: `NODE_PATH` isn't set in this shell. Export
  it as shown in Prerequisites.
