// Headless logic tests: loads the REAL browser files with minimal shims and
// drives adapter -> merge -> derive end to end.   Run: node tools/run_tests.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

// --- browser shims -----------------------------------------------------
global.window = globalThis;
global.location = { search: "", hash: "" };
const storage = {};
global.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
};
let fetchImpl = () => Promise.reject(new Error("fetch not stubbed"));
global.fetch = (...a) => fetchImpl(...a);

for (const f of [
  "js/config.js", "data/teams.js", "data/schedule.js", "data/players.js",
  "data/overrides.js", "data/mockfeed.js", "js/adapter-fixturedownload.js",
  "js/store.js", "js/derive.js",
]) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), "utf8"), { filename: f });
}

// --- tiny runner ---------------------------------------------------------
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error("  FAIL: " + msg); }
}
function eq(actual, expected, msg) {
  ok(actual === expected, msg + " (expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual) + ")");
}

(async function main() {
  const snapshotRaw = fs.readFileSync(path.join(ROOT, "data", "results.json"), "utf8");

  // ---- adapter on the real vendored feed --------------------------------
  console.log("adapter");
  {
    const p = WCB.adapters.fixturedownload.parse(snapshotRaw);
    eq(p.matches.length, 104, "parses all 104 matches");
    const byId = {}; p.matches.forEach((m) => (byId[m.id] = m));
    eq(byId[1].round, "GROUP", "m1 is group stage");
    eq(byId[1].group, "A", "m1 group letter");
    eq(byId[1].home, "MEX", "m1 home mapped to code");
    eq(byId[1].away, "RSA", "m1 away mapped to code");
    ok(byId[1].kickoffUtc.includes("T"), "kickoff is ISO-ish");
    eq(byId[73].round, "R32", "m73 round of 32");
    eq(byId[73].home, null, "m73 home is TBD");
    eq(byId[73].homeLabel, "2A", "m73 placeholder label kept");
    eq(byId[103].round, "THIRD", "m103 is 3rd place");
    eq(byId[104].round, "FINAL", "m104 is the final");
    const codes = new Set();
    p.matches.filter((m) => m.round === "GROUP").forEach((m) => { codes.add(m.home); codes.add(m.away); });
    eq(codes.size, 48, "48 distinct team codes in group stage");
    ok(!codes.has(null), "every group team name mapped");
  }

  // ---- merge layer rules -------------------------------------------------
  console.log("merge");
  {
    const merged = WCB.store._merge(
      { matches: [{ id: 1, homeGoals: 2, awayGoals: 0, status: "finished", home: null }] },
      "live", new Date()
    );
    eq(merged.byId[1].homeGoals, 2, "feed non-null field applies");
    eq(merged.byId[1].home, "MEX", "feed null does NOT erase baked value");

    WCB.data.overrides.matches = { "1": { homeGoals: null, status: "scheduled" } };
    const merged2 = WCB.store._merge(
      { matches: [{ id: 1, homeGoals: 2, awayGoals: 0, status: "finished" }] },
      "live", new Date()
    );
    eq(merged2.byId[1].homeGoals, null, "override null DOES apply (verbatim)");
    eq(merged2.byId[1].status, "scheduled", "override beats feed");
    eq(merged2.byId[1].overridden, true, "override flagged");
    eq(merged2.overrideCount, 1, "override counted");
    WCB.data.overrides.matches = {};
  }

  // ---- sanity gate ---------------------------------------------------------
  console.log("sanity gate");
  {
    WCB.config.mock = false;
    let threw = false;
    try { WCB.store._parse("[]"); } catch (e) { threw = true; }
    ok(threw, "empty feed rejected");
    threw = false;
    try { WCB.store._parse(JSON.stringify({ error: "nope" })); } catch (e) { threw = true; }
    ok(threw, "non-array feed rejected");
  }

  // ---- failure ladder ------------------------------------------------------
  console.log("ladder");
  {
    WCB.config.mock = false;
    fetchImpl = () => Promise.resolve({ ok: true, text: () => Promise.resolve(snapshotRaw) });
    let st = await WCB.store.load();
    eq(st.source, "live", "rung 1: live fetch used");
    ok(storage[WCB.config.cacheKey], "raw feed cached");

    fetchImpl = () => Promise.reject(new Error("network down"));
    st = await WCB.store.load();
    eq(st.source, "cache", "rung 2: cache used when fetch fails");

    delete storage[WCB.config.cacheKey];
    st = await WCB.store.load();
    eq(st.source, "baked", "rung 3: baked snapshot when no cache");
    eq(st.matches.length, 104, "baked still has all matches");
  }

  // ---- the big one: mock scenario through the full pipeline -----------------
  console.log("mock pipeline");
  {
    WCB.config.mock = true;
    const st = await WCB.store.load();
    const ts = WCB.derive.teamStats(st, WCB.data.teams, WCB.data.mockPlayers, WCB.data.overrides);
    const ranked = WCB.derive.playerStats(WCB.data.mockPlayers, ts);
    const by = {}; ranked.forEach((p) => (by[p.name] = p));

    // goals
    eq(ts.byCode.MEX.goalsFor, 6, "MEX goals");
    eq(ts.byCode.KOR.goalsFor, 3, "KOR goals incl. pens-game goal");
    eq(ts.byCode.GER.goalsFor, 6, "GER goals (0-0 pens game adds none)");

    // totals + flags
    eq(by["Blackjack Beth"].total, 21, "Beth total 21");
    ok(by["Blackjack Beth"].blackjack, "Beth has blackjack");
    eq(by["Tied Tom"].total, 20, "Tom total");
    eq(by["Tied Tara"].total, 20, "Tara total");
    eq(by["Under Uma"].total, 14, "Uma total");
    eq(by["Done Dana"].total, 3, "Dana total");
    eq(by["Bust Barry"].total, 23, "Barry total");
    eq(by["Bust Bella"].total, 24, "Bella total");

    // ranks: 1, 2, 2, 4, 5, then busts 6, 7
    eq(by["Blackjack Beth"].rank, 1, "Beth rank 1");
    eq(by["Tied Tom"].rank, 2, "Tom shares rank 2");
    eq(by["Tied Tara"].rank, 2, "Tara shares rank 2");
    eq(by["Under Uma"].rank, 4, "Uma rank 4 after shared 2s");
    eq(by["Done Dana"].rank, 5, "Dana rank 5");
    eq(by["Bust Barry"].rank, 6, "Barry (bust +2) rank 6, below ALL safe");
    eq(by["Bust Bella"].rank, 7, "Bella (bust +3) rank 7, below Barry");
    ok(by["Bust Barry"].busted && by["Bust Bella"].busted, "busts flagged");
    eq(ranked[1].name, "Tied Tara", "tie displays alphabetically (Tara before Tom)");

    // eliminations
    eq(ts.byCode.SUI.alive, false, "SUI out (lost R32 on pens)");
    eq(ts.byCode.SUI.reason, "ko", "SUI reason ko");
    eq(ts.byCode.KOR.alive, true, "KOR through (won pens)");
    ok(ts.needsOverride.includes(74), "m74 (level, winner unknown) flagged for override");
    eq(ts.byCode.GER.alive, true, "GER alive while m74 unresolved");
    eq(ts.byCode.ECU.alive, true, "ECU alive while m74 unresolved");
    eq(ts.byCode.CUW.alive, false, "CUW group-eliminated (absent from full bracket)");
    eq(ts.byCode.CUW.reason, "group", "CUW reason group");
    eq(ts.byCode.MAR.alive, false, "MAR group-eliminated");
    eq(ts.byCode.BRA.alive, true, "BRA alive: SF loser plays 3rd-place match");
    eq(ts.byCode.FRA.alive, true, "FRA alive: SF loser plays 3rd-place match");
    eq(ts.byCode.MEX.champion, true, "MEX champion (won final on pens)");
    eq(ts.byCode.MEX.alive, false, "champion has no matches left");
    eq(ts.byCode.ESP.alive, false, "final loser done");
    eq(by["Done Dana"].isFinal, true, "Dana all 4 teams out => DONE");
    eq(by["Done Dana"].aliveCount, 0, "Dana alive count 0");
    eq(by["Blackjack Beth"].aliveCount, 2, "Beth 2 of 4 alive (RSA, GER)");

    // manual override escape hatches
    WCB.data.overrides.eliminated = ["KOR"];
    WCB.data.overrides.notEliminated = ["SUI"];
    const ts2 = WCB.derive.teamStats(st, WCB.data.teams, WCB.data.mockPlayers, WCB.data.overrides);
    eq(ts2.byCode.KOR.alive, false, "override forces KOR out");
    eq(ts2.byCode.KOR.reason, "manual", "manual reason");
    eq(ts2.byCode.SUI.alive, true, "override forces SUI alive");
    WCB.data.overrides.eliminated = [];
    WCB.data.overrides.notEliminated = [];

    // today filter (UTC-evening kickoff on June 11)
    const today = WCB.derive.todayMatches(st, ["MEX"], new Date("2026-06-11T20:00:00Z"));
    eq(today.length, 1, "today strip finds MEX opener");
    eq(today[0].id, 1, "and it is match 1");
    WCB.config.mock = false;
  }

  // ---- THIRD-place loser is out (not coverable in one mock state) -----------
  console.log("third place");
  {
    const mini = {
      matches: [
        { id: 103, round: "THIRD", status: "finished", home: "BRA", away: "FRA", homeGoals: 2, awayGoals: 1, winner: null },
        { id: 104, round: "FINAL", status: "finished", home: "MEX", away: "ESP", homeGoals: 1, awayGoals: 1, winner: null },
      ],
    };
    const ts = WCB.derive.teamStats(mini, WCB.data.teams, [], {});
    eq(ts.byCode.FRA.alive, false, "3rd-place loser out");
    eq(ts.byCode.FRA.reason, "ko", "3rd-place loser reason ko");
    eq(ts.byCode.BRA.alive, false, "3rd-place winner also done");
    eq(ts.byCode.BRA.reason, "done", "3rd-place winner reason done");
    ok(ts.needsOverride.includes(104), "level final without winner flagged");
    eq(ts.byCode.MEX.alive, true, "finalists stay alive while final unresolved");
  }

  console.log("\n" + passed + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
