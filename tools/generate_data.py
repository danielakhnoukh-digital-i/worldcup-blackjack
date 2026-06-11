"""Generate data/teams.js and data/schedule.js from the vendored feed snapshot.

Single source of truth for the team table (codes, flags, groups, feed spellings).
Run from the repo root:  python tools/generate_data.py
"""

import datetime
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# code, name (display), flag emoji, group, feed spellings
TEAMS = [
    ("MEX", "Mexico",                 "\U0001F1F2\U0001F1FD", "A", ["Mexico"]),
    ("RSA", "South Africa",           "\U0001F1FF\U0001F1E6", "A", ["South Africa"]),
    ("KOR", "South Korea",            "\U0001F1F0\U0001F1F7", "A", ["Korea Republic"]),
    ("CZE", "Czechia",                "\U0001F1E8\U0001F1FF", "A", ["Czechia"]),
    ("CAN", "Canada",                 "\U0001F1E8\U0001F1E6", "B", ["Canada"]),
    ("BIH", "Bosnia & Herzegovina",   "\U0001F1E7\U0001F1E6", "B", ["Bosnia and Herzegovina"]),
    ("QAT", "Qatar",                  "\U0001F1F6\U0001F1E6", "B", ["Qatar"]),
    ("SUI", "Switzerland",            "\U0001F1E8\U0001F1ED", "B", ["Switzerland"]),
    ("BRA", "Brazil",                 "\U0001F1E7\U0001F1F7", "C", ["Brazil"]),
    ("MAR", "Morocco",                "\U0001F1F2\U0001F1E6", "C", ["Morocco"]),
    ("HAI", "Haiti",                  "\U0001F1ED\U0001F1F9", "C", ["Haiti"]),
    ("SCO", "Scotland",               "\U0001F3F4\U000E0067\U000E0062\U000E0073\U000E0063\U000E0074\U000E007F", "C", ["Scotland"]),
    ("USA", "USA",                    "\U0001F1FA\U0001F1F8", "D", ["USA"]),
    ("PAR", "Paraguay",               "\U0001F1F5\U0001F1FE", "D", ["Paraguay"]),
    ("AUS", "Australia",              "\U0001F1E6\U0001F1FA", "D", ["Australia"]),
    ("TUR", "Türkiye",           "\U0001F1F9\U0001F1F7", "D", ["Türkiye", "Turkey"]),
    ("GER", "Germany",                "\U0001F1E9\U0001F1EA", "E", ["Germany"]),
    ("CUW", "Curaçao",           "\U0001F1E8\U0001F1FC", "E", ["Curaçao", "Curacao"]),
    ("CIV", "Côte d'Ivoire",     "\U0001F1E8\U0001F1EE", "E", ["Côte d'Ivoire", "Cote d'Ivoire", "Ivory Coast"]),
    ("ECU", "Ecuador",                "\U0001F1EA\U0001F1E8", "E", ["Ecuador"]),
    ("NED", "Netherlands",            "\U0001F1F3\U0001F1F1", "F", ["Netherlands"]),
    ("JPN", "Japan",                  "\U0001F1EF\U0001F1F5", "F", ["Japan"]),
    ("SWE", "Sweden",                 "\U0001F1F8\U0001F1EA", "F", ["Sweden"]),
    ("TUN", "Tunisia",                "\U0001F1F9\U0001F1F3", "F", ["Tunisia"]),
    ("BEL", "Belgium",                "\U0001F1E7\U0001F1EA", "G", ["Belgium"]),
    ("EGY", "Egypt",                  "\U0001F1EA\U0001F1EC", "G", ["Egypt"]),
    ("IRN", "Iran",                   "\U0001F1EE\U0001F1F7", "G", ["IR Iran", "Iran"]),
    ("NZL", "New Zealand",            "\U0001F1F3\U0001F1FF", "G", ["New Zealand"]),
    ("ESP", "Spain",                  "\U0001F1EA\U0001F1F8", "H", ["Spain"]),
    ("CPV", "Cabo Verde",             "\U0001F1E8\U0001F1FB", "H", ["Cabo Verde", "Cape Verde"]),
    ("KSA", "Saudi Arabia",           "\U0001F1F8\U0001F1E6", "H", ["Saudi Arabia"]),
    ("URU", "Uruguay",                "\U0001F1FA\U0001F1FE", "H", ["Uruguay"]),
    ("FRA", "France",                 "\U0001F1EB\U0001F1F7", "I", ["France"]),
    ("SEN", "Senegal",                "\U0001F1F8\U0001F1F3", "I", ["Senegal"]),
    ("IRQ", "Iraq",                   "\U0001F1EE\U0001F1F6", "I", ["Iraq"]),
    ("NOR", "Norway",                 "\U0001F1F3\U0001F1F4", "I", ["Norway"]),
    ("ARG", "Argentina",              "\U0001F1E6\U0001F1F7", "J", ["Argentina"]),
    ("ALG", "Algeria",                "\U0001F1E9\U0001F1FF", "J", ["Algeria"]),
    ("AUT", "Austria",                "\U0001F1E6\U0001F1F9", "J", ["Austria"]),
    ("JOR", "Jordan",                 "\U0001F1EF\U0001F1F4", "J", ["Jordan"]),
    ("POR", "Portugal",               "\U0001F1F5\U0001F1F9", "K", ["Portugal"]),
    ("COD", "DR Congo",               "\U0001F1E8\U0001F1E9", "K", ["Congo DR", "DR Congo"]),
    ("UZB", "Uzbekistan",             "\U0001F1FA\U0001F1FF", "K", ["Uzbekistan"]),
    ("COL", "Colombia",               "\U0001F1E8\U0001F1F4", "K", ["Colombia"]),
    ("ENG", "England",                "\U0001F3F4\U000E0067\U000E0062\U000E0065\U000E006E\U000E0067\U000E007F", "L", ["England"]),
    ("CRO", "Croatia",                "\U0001F1ED\U0001F1F7", "L", ["Croatia"]),
    ("GHA", "Ghana",                  "\U0001F1EC\U0001F1ED", "L", ["Ghana"]),
    ("PAN", "Panama",                 "\U0001F1F5\U0001F1E6", "L", ["Panama"]),
]

NAME_TO_CODE = {fn: code for code, _, _, _, fns in TEAMS for fn in fns}


def to_round(round_number, match_number):
    if round_number <= 3:
        return "GROUP"
    return {4: "R32", 5: "R16", 6: "QF", 7: "SF"}.get(
        round_number, "THIRD" if match_number == 103 else "FINAL"
    )


def canonical(m):
    """Mirror of js/adapter-fixturedownload.js — keep the two in sync."""
    rnd = to_round(m["RoundNumber"], m["MatchNumber"])
    hg, ag = m["HomeTeamScore"], m["AwayTeamScore"]
    winner = NAME_TO_CODE.get(m.get("Winner") or "")
    return {
        "id": m["MatchNumber"],
        "round": rnd,
        "group": m["Group"].replace("Group ", "") if rnd == "GROUP" and m["Group"] else None,
        "kickoffUtc": m["DateUtc"].replace(" ", "T"),
        "home": NAME_TO_CODE.get(m["HomeTeam"]),
        "away": NAME_TO_CODE.get(m["AwayTeam"]),
        "homeLabel": m["HomeTeam"],
        "awayLabel": m["AwayTeam"],
        "status": "finished" if hg is not None and ag is not None else "scheduled",
        "homeGoals": hg,
        "awayGoals": ag,
        "winner": winner if winner else None,
        "note": None,
    }


def js_file(var, value, header):
    lines = json.dumps(value, ensure_ascii=False, indent=2)
    return (
        f"// {header}\n"
        "window.WCB = window.WCB || {}; WCB.data = WCB.data || {};\n"
        f"WCB.data.{var} = {lines};\n"
    )


def main():
    feed = json.loads((ROOT / "data" / "results.json").read_text(encoding="utf-8"))
    assert len(feed) == 104, f"expected 104 matches, got {len(feed)}"

    # every group-stage team name must map to a code
    group_names = {m[side] for m in feed if m["RoundNumber"] <= 3 for side in ("HomeTeam", "AwayTeam")}
    unmapped = sorted(n for n in group_names if n not in NAME_TO_CODE)
    assert not unmapped, f"unmapped feed team names: {unmapped}"
    assert len(group_names) == 48, f"expected 48 teams in group stage, got {len(group_names)}"

    teams = [
        {"code": c, "name": n, "flag": f, "group": g, "feedNames": fns}
        for c, n, f, g, fns in TEAMS
    ]
    schedule = {
        "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "matches": [canonical(m) for m in sorted(feed, key=lambda m: m["MatchNumber"])],
    }

    (ROOT / "data" / "teams.js").write_text(
        js_file("teams", teams, "Generated by tools/generate_data.py - do not hand-edit."),
        encoding="utf-8", newline="\n")
    (ROOT / "data" / "schedule.js").write_text(
        js_file("schedule", schedule, "Generated by tools/generate_data.py from data/results.json - do not hand-edit."),
        encoding="utf-8", newline="\n")
    print(f"OK: 48 teams, {len(schedule['matches'])} matches")


if __name__ == "__main__":
    main()
