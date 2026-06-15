// Boot, routing, refresh loop. Wires store -> derive -> ui.
(function () {
  var viewState = { expanded: {}, sortTeamsByGoals: true, pickedOnly: false, scrolledOnce: false };

  function players() {
    return WCB.config.mock ? WCB.data.mockPlayers : WCB.data.players;
  }

  function validate(list) {
    var errors = [];
    var valid = {};
    WCB.data.teams.forEach(function (t) { valid[t.code] = true; });
    (list || []).forEach(function (p) {
      if (!p.teams || p.teams.length !== 4) {
        errors.push("Player “" + p.name + "” must have exactly 4 teams.");
        return;
      }
      var seen = {};
      p.teams.forEach(function (c) {
        if (!valid[c]) errors.push("Player “" + p.name + "” has unknown team code “" + c + "”.");
        if (seen[c]) errors.push("Player “" + p.name + "” picked “" + c + "” twice.");
        seen[c] = true;
      });
    });
    return errors;
  }

  function buildModel() {
    var ps = players();
    var ts = WCB.derive.teamStats(WCB.store.state, WCB.data.teams, ps, WCB.data.overrides);
    var ranked = WCB.derive.playerStats(ps, ts);
    var pickedCodes = [];
    var seen = {};
    (ps || []).forEach(function (p) {
      p.teams.forEach(function (c) { if (!seen[c]) { seen[c] = true; pickedCodes.push(c); } });
    });
    return { state: WCB.store.state, ts: ts, ranked: ranked, pickedCodes: pickedCodes, errors: validate(ps) };
  }

  function route() {
    var r = (window.location.hash || "#leaderboard").slice(1);
    return ["leaderboard", "teams", "matches", "rules"].indexOf(r) >= 0 ? r : "leaderboard";
  }

  function render() {
    if (!WCB.store.state) return;
    WCB.ui.render(route(), buildModel(), viewState, render);
  }

  function refresh() {
    WCB.store.load().then(function () {
      render();
      if (WCB.config.dump) {
        // Regeneration aid: canonical matches + every label the feed used.
        console.log("WCB schedule dump:\n" + JSON.stringify(WCB.store.state.matches, null, 2));
        var labels = {};
        WCB.store.state.matches.forEach(function (m) {
          labels[m.homeLabel] = true; labels[m.awayLabel] = true;
        });
        console.log("WCB feed labels: " + Object.keys(labels).sort().join(" | "));
      }
    });
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) refresh();
  });
  document.getElementById("source-pill").addEventListener("click", refresh);
  setInterval(refresh, WCB.config.refreshMs);
  refresh();
})();
