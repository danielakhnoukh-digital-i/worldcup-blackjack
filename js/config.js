// Runtime config + debug query params (?mock=1 ?feed=off ?today=YYYY-MM-DD ?dump=1).
window.WCB = window.WCB || {}; WCB.data = WCB.data || {}; WCB.adapters = WCB.adapters || {};

WCB.config = (function () {
  var params = new URLSearchParams(window.location.search);
  return {
    repoUrl: "https://github.com/danielakhnoukh-digital-i/worldcup-blackjack",
    resultsUrl: "data/results.json",
    refreshMs: 5 * 60 * 1000,
    fetchTimeoutMs: 8000,
    cacheKey: "wcb:feed:v1",
    mock: params.get("mock") === "1",
    feedOff: params.get("feed") === "off",
    dump: params.get("dump") === "1",
    todayOverride: params.get("today"),
  };
})();

// Current time, honoring the ?today= debug override (date only; clock time kept).
WCB.now = function () {
  var d = new Date();
  if (WCB.config.todayOverride) {
    var p = WCB.config.todayOverride.split("-");
    d.setFullYear(+p[0], +p[1] - 1, +p[2]);
  }
  return d;
};
