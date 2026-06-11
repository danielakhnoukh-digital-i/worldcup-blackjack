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

WCB.data.playersArePlaceholders = true;
WCB.data.players = [
  { name: "Dan A", teams: ["ENG", "CRO", "GHA", "PAN"] },
  { name: "Alex S",  teams: ["FRA", "USA", "EGY", "PAN"] },
  { name: "Dan H", teams: ["ESP", "MAR", "KOR", "SCO"] },
  { name: "Euan", teams: ["ESP", "MAR", "KOR", "SCO"] },
  { name: "Dani", teams: ["ESP", "MAR", "KOR", "SCO"] },
  { name: "Tom", teams: ["ESP", "MAR", "KOR", "SCO"] },
  { name: "Sam V", teams: ["ESP", "MAR", "KOR", "SCO"] },
];
