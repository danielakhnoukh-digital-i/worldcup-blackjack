// Fake feed (raw fixturedownload format) + matching players, used with ?mock=1.
// Exercises every ranking/elimination edge case through the REAL adapter+merge:
//   team goals: MEX 6, RSA 4, KOR 3 (incl. a pens game), CZE 3, BRA 6, GER 6,
//               ESP 5, FRA 4, ARG 4, NED 6, ENG 4, CRO 3, POR 4
//   Blackjack Beth  MEX+RSA+GER+ESP = 21  -> rank 1, gold badge
//   Tied Tom/Tara   BRA+FRA+ARG+NED = 20  -> shared rank 2 (duplicate picks OK)
//   Under Uma       ENG+CRO+POR+KOR = 14  -> rank 4
//   Done Dana       CUW+CPV+EGY+PAN = 3   -> rank 5, all 4 group-eliminated => DONE
//   Bust Barry      MEX+GER+BRA+ESP = 23  -> bust +2, rank 6
//   Bust Bella      MEX+GER+BRA+NED = 24  -> bust +3, rank 7
//   m73 KOR 1-1 SUI, Winner set    -> pens: goals count, SUI out, KOR through
//   m74 GER 0-0 ECU, Winner ""     -> unresolved pens: both alive + override hint
//   all 16 R32 slots filled        -> 16 absent teams flip to group-eliminated
//   m101/102 SF finished           -> SF losers (BRA, FRA) stay ALIVE (3rd-place pending)
//   m104 FINAL MEX wins on pens    -> champion crown; ESP done
window.WCB = window.WCB || {}; WCB.data = WCB.data || {};

WCB.data.mockfeed = [
  // -- group stage (scored) --
  { MatchNumber: 1,  RoundNumber: 1, DateUtc: "2026-06-11 19:00:00Z", Group: "Group A", HomeTeam: "Mexico", AwayTeam: "South Africa", HomeTeamScore: 3, AwayTeamScore: 1, Winner: "Mexico" },
  { MatchNumber: 2,  RoundNumber: 1, DateUtc: "2026-06-12 02:00:00Z", Group: "Group A", HomeTeam: "Korea Republic", AwayTeam: "Czechia", HomeTeamScore: 0, AwayTeamScore: 2, Winner: "Czechia" },
  { MatchNumber: 7,  RoundNumber: 1, DateUtc: "2026-06-13 22:00:00Z", Group: "Group C", HomeTeam: "Brazil", AwayTeam: "Morocco", HomeTeamScore: 3, AwayTeamScore: 0, Winner: "Brazil" },
  { MatchNumber: 10, RoundNumber: 1, DateUtc: "2026-06-14 17:00:00Z", Group: "Group E", HomeTeam: "Germany", AwayTeam: "Curaçao", HomeTeamScore: 5, AwayTeamScore: 0, Winner: "Germany" },
  { MatchNumber: 11, RoundNumber: 1, DateUtc: "2026-06-14 20:00:00Z", Group: "Group F", HomeTeam: "Netherlands", AwayTeam: "Japan", HomeTeamScore: 2, AwayTeamScore: 2, Winner: "" },
  { MatchNumber: 14, RoundNumber: 1, DateUtc: "2026-06-15 16:00:00Z", Group: "Group H", HomeTeam: "Spain", AwayTeam: "Cabo Verde", HomeTeamScore: 4, AwayTeamScore: 0, Winner: "Spain" },
  { MatchNumber: 16, RoundNumber: 1, DateUtc: "2026-06-15 19:00:00Z", Group: "Group G", HomeTeam: "Belgium", AwayTeam: "Egypt", HomeTeamScore: 1, AwayTeamScore: 2, Winner: "Egypt" },
  { MatchNumber: 17, RoundNumber: 1, DateUtc: "2026-06-16 19:00:00Z", Group: "Group I", HomeTeam: "France", AwayTeam: "Senegal", HomeTeamScore: 2, AwayTeamScore: 1, Winner: "France" },
  { MatchNumber: 19, RoundNumber: 1, DateUtc: "2026-06-17 01:00:00Z", Group: "Group J", HomeTeam: "Argentina", AwayTeam: "Algeria", HomeTeamScore: 1, AwayTeamScore: 0, Winner: "Argentina" },
  { MatchNumber: 21, RoundNumber: 1, DateUtc: "2026-06-17 23:00:00Z", Group: "Group L", HomeTeam: "Ghana", AwayTeam: "Panama", HomeTeamScore: 1, AwayTeamScore: 1, Winner: "" },
  { MatchNumber: 22, RoundNumber: 1, DateUtc: "2026-06-17 20:00:00Z", Group: "Group L", HomeTeam: "England", AwayTeam: "Croatia", HomeTeamScore: 1, AwayTeamScore: 1, Winner: "" },
  { MatchNumber: 23, RoundNumber: 1, DateUtc: "2026-06-17 17:00:00Z", Group: "Group K", HomeTeam: "Portugal", AwayTeam: "Congo DR", HomeTeamScore: 2, AwayTeamScore: 1, Winner: "Portugal" },
  { MatchNumber: 25, RoundNumber: 2, DateUtc: "2026-06-18 16:00:00Z", Group: "Group A", HomeTeam: "Czechia", AwayTeam: "South Africa", HomeTeamScore: 1, AwayTeamScore: 1, Winner: "" },
  { MatchNumber: 28, RoundNumber: 2, DateUtc: "2026-06-19 01:00:00Z", Group: "Group A", HomeTeam: "Mexico", AwayTeam: "Korea Republic", HomeTeamScore: 2, AwayTeamScore: 0, Winner: "Mexico" },
  { MatchNumber: 29, RoundNumber: 2, DateUtc: "2026-06-20 01:00:00Z", Group: "Group C", HomeTeam: "Brazil", AwayTeam: "Haiti", HomeTeamScore: 3, AwayTeamScore: 1, Winner: "Brazil" },
  { MatchNumber: 33, RoundNumber: 2, DateUtc: "2026-06-20 20:00:00Z", Group: "Group E", HomeTeam: "Germany", AwayTeam: "Côte d'Ivoire", HomeTeamScore: 1, AwayTeamScore: 1, Winner: "" },
  { MatchNumber: 35, RoundNumber: 2, DateUtc: "2026-06-20 17:00:00Z", Group: "Group F", HomeTeam: "Netherlands", AwayTeam: "Sweden", HomeTeamScore: 4, AwayTeamScore: 1, Winner: "Netherlands" },
  { MatchNumber: 38, RoundNumber: 2, DateUtc: "2026-06-21 16:00:00Z", Group: "Group H", HomeTeam: "Spain", AwayTeam: "Saudi Arabia", HomeTeamScore: 1, AwayTeamScore: 0, Winner: "Spain" },
  { MatchNumber: 42, RoundNumber: 2, DateUtc: "2026-06-22 21:00:00Z", Group: "Group I", HomeTeam: "France", AwayTeam: "Iraq", HomeTeamScore: 2, AwayTeamScore: 0, Winner: "France" },
  { MatchNumber: 43, RoundNumber: 2, DateUtc: "2026-06-22 17:00:00Z", Group: "Group J", HomeTeam: "Argentina", AwayTeam: "Austria", HomeTeamScore: 3, AwayTeamScore: 2, Winner: "Argentina" },
  { MatchNumber: 45, RoundNumber: 2, DateUtc: "2026-06-23 20:00:00Z", Group: "Group L", HomeTeam: "England", AwayTeam: "Ghana", HomeTeamScore: 3, AwayTeamScore: 0, Winner: "England" },
  { MatchNumber: 46, RoundNumber: 2, DateUtc: "2026-06-23 23:00:00Z", Group: "Group L", HomeTeam: "Panama", AwayTeam: "Croatia", HomeTeamScore: 0, AwayTeamScore: 2, Winner: "Croatia" },
  { MatchNumber: 47, RoundNumber: 2, DateUtc: "2026-06-23 17:00:00Z", Group: "Group K", HomeTeam: "Portugal", AwayTeam: "Uzbekistan", HomeTeamScore: 2, AwayTeamScore: 0, Winner: "Portugal" },
  { MatchNumber: 53, RoundNumber: 3, DateUtc: "2026-06-25 01:00:00Z", Group: "Group A", HomeTeam: "Czechia", AwayTeam: "Mexico", HomeTeamScore: 0, AwayTeamScore: 1, Winner: "Mexico" },
  { MatchNumber: 54, RoundNumber: 3, DateUtc: "2026-06-25 01:00:00Z", Group: "Group A", HomeTeam: "South Africa", AwayTeam: "Korea Republic", HomeTeamScore: 2, AwayTeamScore: 2, Winner: "" },
  // -- round of 32: all slots filled; only 73 & 74 played --
  { MatchNumber: 73, RoundNumber: 4, DateUtc: "2026-06-28 19:00:00Z", Group: null, HomeTeam: "Korea Republic", AwayTeam: "Switzerland", HomeTeamScore: 1, AwayTeamScore: 1, Winner: "Korea Republic" },
  { MatchNumber: 74, RoundNumber: 4, DateUtc: "2026-06-29 20:30:00Z", Group: null, HomeTeam: "Germany", AwayTeam: "Ecuador", HomeTeamScore: 0, AwayTeamScore: 0, Winner: "" },
  { MatchNumber: 75, RoundNumber: 4, DateUtc: "2026-06-30 01:00:00Z", Group: null, HomeTeam: "Mexico", AwayTeam: "Czechia", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 76, RoundNumber: 4, DateUtc: "2026-06-29 17:00:00Z", Group: null, HomeTeam: "Brazil", AwayTeam: "Scotland", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 77, RoundNumber: 4, DateUtc: "2026-06-30 21:00:00Z", Group: null, HomeTeam: "France", AwayTeam: "Norway", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 78, RoundNumber: 4, DateUtc: "2026-06-30 17:00:00Z", Group: null, HomeTeam: "Netherlands", AwayTeam: "Japan", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 79, RoundNumber: 4, DateUtc: "2026-07-01 01:00:00Z", Group: null, HomeTeam: "USA", AwayTeam: "Paraguay", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 80, RoundNumber: 4, DateUtc: "2026-07-01 16:00:00Z", Group: null, HomeTeam: "England", AwayTeam: "Croatia", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 81, RoundNumber: 4, DateUtc: "2026-07-02 00:00:00Z", Group: null, HomeTeam: "Australia", AwayTeam: "Türkiye", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 82, RoundNumber: 4, DateUtc: "2026-07-01 20:00:00Z", Group: null, HomeTeam: "Belgium", AwayTeam: "IR Iran", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 83, RoundNumber: 4, DateUtc: "2026-07-02 23:00:00Z", Group: null, HomeTeam: "Portugal", AwayTeam: "Colombia", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 84, RoundNumber: 4, DateUtc: "2026-07-02 19:00:00Z", Group: null, HomeTeam: "Spain", AwayTeam: "Uruguay", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 85, RoundNumber: 4, DateUtc: "2026-07-03 03:00:00Z", Group: null, HomeTeam: "Canada", AwayTeam: "Bosnia and Herzegovina", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 86, RoundNumber: 4, DateUtc: "2026-07-03 22:00:00Z", Group: null, HomeTeam: "Qatar", AwayTeam: "Tunisia", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 87, RoundNumber: 4, DateUtc: "2026-07-04 01:30:00Z", Group: null, HomeTeam: "Argentina", AwayTeam: "Jordan", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 88, RoundNumber: 4, DateUtc: "2026-07-03 18:00:00Z", Group: null, HomeTeam: "New Zealand", AwayTeam: "South Africa", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  // -- semis finished 0-0 on pens (losers BRA & FRA stay alive: 3rd-place pending) --
  { MatchNumber: 101, RoundNumber: 7, DateUtc: "2026-07-14 19:00:00Z", Group: null, HomeTeam: "Mexico", AwayTeam: "Brazil", HomeTeamScore: 0, AwayTeamScore: 0, Winner: "Mexico" },
  { MatchNumber: 102, RoundNumber: 7, DateUtc: "2026-07-15 19:00:00Z", Group: null, HomeTeam: "Spain", AwayTeam: "France", HomeTeamScore: 0, AwayTeamScore: 0, Winner: "Spain" },
  // -- 3rd place scheduled, final decided on pens --
  { MatchNumber: 103, RoundNumber: 8, DateUtc: "2026-07-18 21:00:00Z", Group: null, HomeTeam: "Brazil", AwayTeam: "France", HomeTeamScore: null, AwayTeamScore: null, Winner: "" },
  { MatchNumber: 104, RoundNumber: 8, DateUtc: "2026-07-19 19:00:00Z", Group: null, HomeTeam: "Mexico", AwayTeam: "Spain", HomeTeamScore: 0, AwayTeamScore: 0, Winner: "Mexico" },
];

WCB.data.mockPlayers = [
  { name: "Blackjack Beth", teams: ["MEX", "RSA", "GER", "ESP"] },
  { name: "Tied Tom",       teams: ["BRA", "FRA", "ARG", "NED"] },
  { name: "Tied Tara",      teams: ["BRA", "FRA", "ARG", "NED"] },
  { name: "Under Uma",      teams: ["ENG", "CRO", "POR", "KOR"] },
  { name: "Done Dana",      teams: ["CUW", "CPV", "EGY", "PAN"] },
  { name: "Bust Barry",     teams: ["MEX", "GER", "BRA", "ESP"] },
  { name: "Bust Bella",     teams: ["MEX", "GER", "BRA", "NED"] },
];
