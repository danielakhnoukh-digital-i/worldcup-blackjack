// fixturedownload.com feed JSON -> canonical partial matches.
// Mirrors tools/generate_data.py canonical() — keep the two in sync.
// Goal convention: feed scores are full-time incl. extra time; penalty
// shootout results are expected in Winner, never in the score. If the feed
// turns out to bake shootout goals into scores, fix per match in overrides.js.
window.WCB = window.WCB || {}; WCB.adapters = WCB.adapters || {};

WCB.adapters.fixturedownload = {
  parse: function (rawText) {
    var feed = JSON.parse(rawText);
    if (!Array.isArray(feed)) throw new Error("feed is not an array");

    var nameToCode = {};
    WCB.data.teams.forEach(function (t) {
      t.feedNames.forEach(function (n) { nameToCode[n] = t.code; });
    });
    var ROUNDS = { 4: "R32", 5: "R16", 6: "QF", 7: "SF" };

    var matches = feed.map(function (m) {
      var round = m.RoundNumber <= 3
        ? "GROUP"
        : ROUNDS[m.RoundNumber] || (m.MatchNumber === 103 ? "THIRD" : "FINAL");
      var hg = m.HomeTeamScore, ag = m.AwayTeamScore;
      return {
        id: m.MatchNumber,
        round: round,
        group: round === "GROUP" && m.Group ? m.Group.replace("Group ", "") : null,
        kickoffUtc: m.DateUtc ? m.DateUtc.replace(" ", "T") : null,
        home: nameToCode[m.HomeTeam] || null,
        away: nameToCode[m.AwayTeam] || null,
        homeLabel: m.HomeTeam || null,
        awayLabel: m.AwayTeam || null,
        status: hg != null && ag != null ? "finished" : "scheduled",
        homeGoals: hg != null ? hg : null,
        awayGoals: ag != null ? ag : null,
        winner: nameToCode[m.Winner] || null,
      };
    });
    return { matches: matches };
  },
};
