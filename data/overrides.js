// Manual corrections — the escape hatch when the feed is wrong, late, or
// ambiguous. Fields here are absolute truth: they apply VERBATIM on top of
// whatever the feed says (explicit nulls do apply, e.g. to un-finish a match).
//
// matches: keyed by match id ("1".."104"). Useful fields:
//   homeGoals/awayGoals  goals incl. extra time, NEVER shootout goals
//   status               "finished" | "scheduled"
//   winner               team CODE — required when a knockout game went to
//                        penalties (scores level) so the loser can be eliminated
//   home/away            team CODEs — fix a wrong bracket slot
//   note                 free text shown on the match row, e.g. "AET, pens 4-3"
//
// eliminated / notEliminated: team CODEs to force out of / back into "alive".
// banner: a notice shown at the top of the site, or null.
//
// Example:
//   matches: { "87": { homeGoals: 1, awayGoals: 1, status: "finished",
//                      winner: "ARG", note: "AET, pens 4-3" } },
window.WCB = window.WCB || {}; WCB.data = WCB.data || {};

WCB.data.overrides = {
  matches: {},
  eliminated: [],
  notEliminated: [],
  banner: null,
};
