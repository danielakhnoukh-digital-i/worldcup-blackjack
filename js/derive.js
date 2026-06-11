// Pure derivations over merged state: team stats, eliminations, blackjack
// ranking. No DOM, no fetch — unit-testable in Node.
window.WCB = window.WCB || {};

WCB.derive = (function () {
  var KO = { R32: true, R16: true, QF: true, SF: true, THIRD: true, FINAL: true };

  // "Alive" means "can still score goals" (has remaining matches), NOT
  // "mathematically in contention" — a doomed team's last group game still
  // produces real goals for the pool.
  function teamStats(state, teams, players, overrides) {
    var by = {};
    teams.forEach(function (t) {
      by[t.code] = {
        code: t.code, name: t.name, flag: t.flag, group: t.group,
        played: 0, goalsFor: 0, alive: true, reason: null, champion: false,
        pickedBy: [], nextMatch: null,
      };
    });
    (players || []).forEach(function (p) {
      p.teams.forEach(function (c) { if (by[c]) by[c].pickedBy.push(p.name); });
    });

    var needsOverride = [];
    var inBracket = {};
    var r32Slots = 0;

    state.matches.forEach(function (m) {
      if (KO[m.round]) {
        if (m.home) inBracket[m.home] = true;
        if (m.away) inBracket[m.away] = true;
        if (m.round === "R32") r32Slots += (m.home ? 1 : 0) + (m.away ? 1 : 0);
      }
      if (m.status !== "finished") return;
      if (m.home && by[m.home]) { by[m.home].played++; by[m.home].goalsFor += m.homeGoals || 0; }
      if (m.away && by[m.away]) { by[m.away].played++; by[m.away].goalsFor += m.awayGoals || 0; }

      // Knockout eliminations. SF losers are NOT out — they play the
      // third-place match. THIRD/FINAL participants are done either way.
      if (KO[m.round] && m.round !== "SF" && m.home && m.away) {
        var winner = null, loser = null;
        if (m.homeGoals > m.awayGoals) { winner = m.home; loser = m.away; }
        else if (m.awayGoals > m.homeGoals) { winner = m.away; loser = m.home; }
        else if (m.winner === m.home || m.winner === m.away) {
          winner = m.winner;
          loser = m.winner === m.home ? m.away : m.home;
        }
        if (!loser) { needsOverride.push(m.id); return; }   // pens, winner unknown
        if (by[loser]) { by[loser].alive = false; by[loser].reason = "ko"; }
        if (m.round === "THIRD" && by[winner]) { by[winner].alive = false; by[winner].reason = "done"; }
        if (m.round === "FINAL" && by[winner]) {
          by[winner].alive = false; by[winner].reason = "done"; by[winner].champion = true;
        }
      }
    });

    // Group eliminations without standings math: once all 32 R32 slots are
    // known, any team absent from the bracket has no remaining matches.
    if (r32Slots === 32) {
      Object.keys(by).forEach(function (c) {
        if (!inBracket[c] && by[c].alive) { by[c].alive = false; by[c].reason = "group"; }
      });
    }

    var ov = overrides || {};
    (ov.eliminated || []).forEach(function (c) {
      if (by[c]) { by[c].alive = false; by[c].reason = "manual"; }
    });
    (ov.notEliminated || []).forEach(function (c) {
      if (by[c]) { by[c].alive = true; by[c].reason = null; }
    });

    state.matches.forEach(function (m) {
      if (m.status === "finished") return;
      [m.home, m.away].forEach(function (c) {
        if (c && by[c] && !by[c].nextMatch) by[c].nextMatch = m;
      });
    });

    return { byCode: by, needsOverride: needsOverride };
  }

  // Blackjack: safe (<=21) above busted (>21); safe by higher total first,
  // busted by smaller overshoot first. Equal keys share a competition rank.
  function better(a, b) {
    if (a.busted !== b.busted) return !a.busted;
    if (a.total === b.total) return false;
    return a.busted ? a.total < b.total : a.total > b.total;
  }

  function playerStats(players, ts) {
    var list = (players || []).map(function (p) {
      var perTeam = p.teams.map(function (c) {
        var t = ts.byCode[c];
        return t
          ? { code: c, name: t.name, flag: t.flag, goals: t.goalsFor, played: t.played,
              alive: t.alive, reason: t.reason, champion: t.champion, nextMatch: t.nextMatch }
          : { code: c, name: c, flag: "", goals: 0, played: 0, alive: false, invalid: true };
      });
      var total = perTeam.reduce(function (s, t) { return s + t.goals; }, 0);
      var aliveCount = perTeam.filter(function (t) { return t.alive; }).length;
      return {
        name: p.name, perTeam: perTeam, total: total,
        busted: total > 21, blackjack: total === 21,
        needed: Math.max(0, 21 - total), overBy: Math.max(0, total - 21),
        aliveCount: aliveCount, isFinal: aliveCount === 0,
        invalid: perTeam.some(function (t) { return t.invalid; }),
      };
    });
    list.forEach(function (p) {
      p.rank = 1 + list.filter(function (q) { return better(q, p); }).length;
    });
    list.sort(function (a, b) {
      if (better(a, b)) return -1;
      if (better(b, a)) return 1;
      return a.name.localeCompare(b.name);
    });
    return list;
  }

  function isSameLocalDay(iso, now) {
    var d = new Date(iso);
    return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
  }

  // Today's matches (viewer-local dates); codes filters to matches involving
  // those teams, null/undefined means all matches.
  function todayMatches(state, codes, now) {
    var set = null;
    if (codes) {
      set = {};
      codes.forEach(function (c) { set[c] = true; });
    }
    return state.matches.filter(function (m) {
      if (!m.kickoffUtc || !isSameLocalDay(m.kickoffUtc, now)) return false;
      return !set || set[m.home] || set[m.away];
    });
  }

  return { teamStats: teamStats, playerStats: playerStats, todayMatches: todayMatches, _better: better };
})();
