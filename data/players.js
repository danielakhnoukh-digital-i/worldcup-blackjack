// THE admin file: one entry per colleague — display name + exactly 4 team codes.
// Valid codes (see data/teams.js):
//   A: MEX RSA KOR CZE    B: CAN BIH QAT SUI    C: BRA MAR HAI SCO
//   D: USA PAR AUS TUR    E: GER CUW CIV ECU    F: NED JPN SWE TUN
//   G: BEL EGY IRN NZL    H: ESP CPV KSA URU    I: FRA SEN IRQ NOR
//   J: ARG ALG AUT JOR    K: POR COD UZB COL    L: ENG CRO GHA PAN
// Duplicate teams across different people are allowed.
// When you've entered the real picks, set playersArePlaceholders to false
// to remove the warning banner on the site.
window.WCB = window.WCB || {}; WCB.data = WCB.data || {};

WCB.data.playersArePlaceholders = false;
WCB.data.players = [
  { name: "Alex S", teams: ["ENG", "SCO", "PAN", "IRN"] },
  { name: "Sam V", teams: ["IRN", "GHA", "BRA", "JPN"] },
  { name: "Euan", teams: ["SCO", "CIV", "NOR", "AUS"] },
  { name: "Alex T", teams: ["MEX", "JPN", "CRO", "NOR"] },
  { name: "Vic", teams: ["USA", "MEX", "KOR", "AUT"] },
  { name: "Dan A", teams: ["ENG", "CRO", "GHA", "PAN"] },
  { name: "Tom B", teams: ["ESP", "HAI", "UZB", "IRN"] },
  { name: "Fabel", teams: ["MAR", "URU", "ECU", "AUS"] },
  { name: "Sajeel", teams: ["KSA", "IRN", "SUI", "URU"] },
  { name: "Jun", teams: ["SUI", "URU", "ECU", "GHA"] },
  { name: "Dani", teams: ["MEX", "SUI", "SEN", "NOR"] },
  { name: "Dan H", teams: ["JPN", "IRN", "PAN", "SCO"] },
  { name: "Matt", teams: ["SEN", "NZL", "ECU", "MEX"] }
];
