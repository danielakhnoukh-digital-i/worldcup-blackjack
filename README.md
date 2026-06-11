# World Cup Blackjack '26

**Live site:** https://danielakhnoukh-digital-i.github.io/worldcup-blackjack/

Office pool tracker for the 2026 World Cup, hosted on GitHub Pages. Everyone
picked **4 teams**; your score is the **total goals** they score all
tournament. **Closest to 21 without going over wins** — blackjack rules.

## How scores update

A GitHub Action ([refresh-results.yml](.github/workflows/refresh-results.yml))
fetches the public fixtures feed every 30 minutes and commits
`data/results.json`; Pages redeploys automatically. Nobody has to do anything
on matchdays. Results appear ≤ ~40 min after full time.

- **Refresh now:** Actions tab → "Refresh results" → Run workflow.
- The page itself re-fetches every 5 min and when you return to the tab; tap
  the status pill (top right) to force it.

## Admin guide (the only two files you ever edit)

### `data/players.js` — the picks
One line per colleague: `{ name: "Sam", teams: ["ENG", "BRA", "JPN", "RSA"] }`.
Exactly 4 codes each (code list is in the file's comment). Duplicates across
people are fine. When the real picks are in, set `playersArePlaceholders` to
`false` to clear the warning banner. Edit straight in the GitHub web UI —
live a minute after committing.

### `data/overrides.js` — corrections
Anything you put here beats the feed (see the comments in the file). The two
cases you'll actually meet:

1. **Penalty shootout** — if a knockout game ends level the feed may not say
   who went through. The site shows an amber "Admin: match N…" banner; add
   `"N": { winner: "ARG", note: "Pens 4-3" }` to `matches`.
2. **Wrong/late score** — set `homeGoals`/`awayGoals` (goals incl. extra time,
   **never** shootout goals) and `status: "finished"`.

`eliminated` / `notEliminated` force a team out of / back into "alive", and
`banner` shows a notice on the site.

## Rules implemented

- Bust (>21) ranks below every non-bust; busts ordered by smallest overshoot;
  ties share a rank. Exactly 21 = Blackjack ✨.
- Goals in 90′ + extra time count; shootout goals don't; own goals count for
  the credited team.
- "Alive" = still has matches left (a doomed team's last group game still
  scores pool goals). Knockout losers are derived automatically; group-stage
  exits flip once the full round-of-32 bracket is known.

## Local development

Double-click `index.html` — everything works off the baked snapshot (the
results fetch fails on `file://` by design and falls back). Debug params:

| Param | Effect |
|---|---|
| `?mock=1` | Fake feed + fake players covering every edge case (21, ties, busts, pens, eliminations) |
| `?feed=off` | Force feed failure → exercises cache/snapshot fallback |
| `?today=2026-06-25` | Pretend it's another day (Today strip, match auto-scroll) |
| `?dump=1` | Console-log the canonical schedule + feed labels |

Logic tests (adapter → merge → ranking, no browser needed): `node tools/run_tests.js`
Regenerate the baked snapshot from a fresh feed copy: `python tools/generate_data.py`

## Files

| File | What |
|---|---|
| `data/players.js` / `data/overrides.js` | The two admin-edited files |
| `data/results.json` | Latest raw feed (committed by the Action) |
| `data/teams.js` / `data/schedule.js` | Generated tournament data (48 teams, 104 matches) |
| `js/store.js` | live results → cached → snapshot fallback, then overrides |
| `js/derive.js` | goals, eliminations, blackjack ranking (pure functions) |
| `js/adapter-fixturedownload.js` | feed format → canonical matches |
