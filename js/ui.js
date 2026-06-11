// All rendering. Reads model built in app.js, writes DOM. No data logic here.
window.WCB = window.WCB || {};

WCB.ui = (function () {
  var ROUND_LABEL = {
    R32: "Round of 32", R16: "Round of 16", QF: "Quarter-final",
    SF: "Semi-final", THIRD: "3rd place", FINAL: "Final",
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function roundTag(m) {
    return m.round === "GROUP" ? "Group " + m.group : ROUND_LABEL[m.round];
  }

  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function fmtDateTime(d) {
    return d.toLocaleDateString([], { day: "numeric", month: "short" }) + " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function shortLabel(m, side) {
    var code = m[side], label = m[side + "Label"] || "?";
    if (code) {
      var t = WCB.ui._teamsByCode[code];
      return (t ? t.flag + " " : "") + code;
    }
    return label === "To be announced" ? "TBD" : label;
  }

  function pensNote(m) {
    if (m.note) return m.note;
    if (m.status === "finished" && m.round !== "GROUP" &&
        m.homeGoals === m.awayGoals && m.winner) {
      return "Pens: " + m.winner + " advance";
    }
    return null;
  }

  function matchRow(m) {
    var row = el("div", "match-row" + (m.status === "finished" ? " played" : ""));
    var when = el("div", "m-when", m.status === "finished" ? "FT" : fmtTime(m.kickoffUtc));
    var home = el("div", "m-team m-home", shortLabel(m, "home"));
    var score = el("div", "m-score",
      m.status === "finished" ? m.homeGoals + "–" + m.awayGoals : "–");
    var away = el("div", "m-team m-away", shortLabel(m, "away"));
    var tag = el("div", "m-tag", roundTag(m));
    if (m.overridden) tag.textContent += " ✎";
    row.append(when, home, score, away, tag);
    var note = pensNote(m);
    if (note) row.append(el("div", "m-note", note));
    return row;
  }

  // ---- leaderboard ------------------------------------------------------

  function badge(p) {
    if (p.blackjack) return el("span", "badge gold", "21!");
    if (p.busted) return el("span", "badge red", "BUST +" + p.overBy);
    if (p.isFinal) return el("span", "badge grey", "DONE");
    return el("span", "badge dim", p.needed + " to go");
  }

  function teamChip(t) {
    var cls = "chip";
    if (t.champion) cls += " champ";
    else if (!t.alive && (t.reason === "ko" || t.reason === "group" || t.reason === "manual" || t.invalid)) cls += " out";
    else if (!t.alive) cls += " done";
    var chip = el("span", cls);
    chip.append(
      el("span", "chip-flag", t.flag || "❓"),
      el("span", "chip-code", t.code),
      el("span", "chip-goals", String(t.goals))
    );
    if (t.champion) chip.append(el("span", "chip-crown", "🏆"));
    return chip;
  }

  function playerCard(p, viewState, rerender) {
    var card = el("article", "card" + (p.busted ? " busted" : "") +
      (p.blackjack ? " blackjack" : "") + (p.isFinal && !p.blackjack && !p.busted ? " final" : ""));

    var top = el("div", "card-top");
    top.append(el("div", "rank", String(p.rank)));
    var who = el("div", "who");
    who.append(el("div", "name", p.name));
    who.append(el("div", "sub", p.aliveCount + " of " + p.perTeam.length + " teams alive"));
    top.append(who);
    var score = el("div", "score");
    var total = el("div", "total", String(p.total));
    total.append(el("span", "of21", "/21"));
    score.append(total, badge(p));
    top.append(score);
    card.append(top);

    var bar = el("div", "bar");
    var fill = el("div", "fill" + (p.busted ? " bust" : p.blackjack ? " gold" : ""));
    fill.style.width = Math.min(100, (p.total / 21) * 100) + "%";
    bar.append(fill);
    card.append(bar);

    var chips = el("div", "chips");
    p.perTeam.forEach(function (t) { chips.append(teamChip(t)); });
    card.append(chips);

    if (viewState.expanded[p.name]) {
      var detail = el("div", "detail");
      p.perTeam.forEach(function (t) {
        var r = el("div", "d-row");
        r.append(el("span", "d-team", (t.flag ? t.flag + " " : "") + t.name));
        r.append(el("span", "d-goals", t.goals + " goal" + (t.goals === 1 ? "" : "s") +
          " in " + t.played + " game" + (t.played === 1 ? "" : "s")));
        var status = t.champion ? "Champions 🏆"
          : t.invalid ? "Unknown code!"
          : !t.alive ? "Out"
          : t.nextMatch ? "Next: " + roundTag(t.nextMatch) + ", " + fmtDateTime(new Date(t.nextMatch.kickoffUtc))
          : "Alive";
        r.append(el("span", "d-status" + (!t.alive && !t.champion ? " out" : ""), status));
        detail.append(r);
      });
      card.append(detail);
    }

    card.addEventListener("click", function () {
      viewState.expanded[p.name] = !viewState.expanded[p.name];
      rerender();
    });
    return card;
  }

  function renderLeaderboard(root, model, viewState, rerender) {
    var today = WCB.derive.todayMatches(model.state, model.pickedCodes, WCB.now());
    if (today.length) {
      root.append(el("h2", "h-sec", "Today · your teams"));
      var strip = el("div", "today-strip");
      today.forEach(function (m) {
        var chip = el("span", "today-chip",
          (m.status === "finished" ? "FT" : fmtTime(m.kickoffUtc)) + " " +
          shortLabel(m, "home") + " " +
          (m.status === "finished" ? m.homeGoals + "–" + m.awayGoals : "v") + " " +
          shortLabel(m, "away"));
        strip.append(chip);
      });
      root.append(strip);
    }
    model.ranked.forEach(function (p) {
      root.append(playerCard(p, viewState, rerender));
    });
    if (!model.ranked.length) root.append(el("p", "empty", "No players yet — add picks in data/players.js."));
  }

  // ---- teams ------------------------------------------------------------

  function teamRow(t) {
    var row = el("div", "team-row" + (!t.alive && !t.champion ? " out" : ""));
    row.append(el("span", "t-flag", t.flag));
    var name = el("span", "t-name", t.name);
    if (t.champion) name.textContent += " 🏆";
    row.append(name);
    row.append(el("span", "t-played", "P" + t.played));
    row.append(el("span", "t-gf", String(t.goalsFor)));
    row.append(el("span", "t-dot" + (t.alive ? " alive" : ""), t.alive ? "●" : "○"));
    var picked = el("div", "t-picked", t.pickedBy.length ? t.pickedBy.join(", ") : "—");
    row.append(picked);
    return row;
  }

  function renderTeams(root, model, viewState, rerender) {
    var toggle = el("button", "toggle", viewState.sortTeamsByGoals ? "Show groups" : "Sort by goals");
    toggle.addEventListener("click", function () {
      viewState.sortTeamsByGoals = !viewState.sortTeamsByGoals;
      rerender();
    });
    root.append(toggle);

    var all = WCB.data.teams.map(function (t) { return model.ts.byCode[t.code]; });
    if (viewState.sortTeamsByGoals) {
      all.slice().sort(function (a, b) {
        return b.goalsFor - a.goalsFor || a.name.localeCompare(b.name);
      }).forEach(function (t) { root.append(teamRow(t)); });
      return;
    }
    "ABCDEFGHIJKL".split("").forEach(function (g) {
      var sec = el("section", "group-card");
      sec.append(el("h2", "h-sec", "Group " + g));
      all.filter(function (t) { return t.group === g; })
        .forEach(function (t) { sec.append(teamRow(t)); });
      root.append(sec);
    });
  }

  // ---- matches ----------------------------------------------------------

  function renderMatches(root, model, viewState, rerender) {
    var toggle = el("button", "toggle" + (viewState.pickedOnly ? " on" : ""),
      viewState.pickedOnly ? "Showing picked teams" : "Show picked teams only");
    toggle.addEventListener("click", function () {
      viewState.pickedOnly = !viewState.pickedOnly;
      rerender();
    });
    root.append(toggle);

    var picked = {};
    model.pickedCodes.forEach(function (c) { picked[c] = true; });
    var list = model.state.matches.filter(function (m) {
      return !viewState.pickedOnly || picked[m.home] || picked[m.away];
    });

    var now = WCB.now();
    var todayKey = now.toDateString();
    var currentKey = null, anchor = null, lastGroup = null;
    list.forEach(function (m) {
      var d = new Date(m.kickoffUtc);
      var key = d.toDateString();
      if (key !== currentKey) {
        currentKey = key;
        var h = el("h2", "h-date" + (key === todayKey ? " today" : ""),
          d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }));
        if (!anchor && d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) anchor = h;
        root.append(h);
        lastGroup = el("div", "day-group");
        root.append(lastGroup);
      }
      lastGroup.append(matchRow(m));
    });
    if (!list.length) root.append(el("p", "empty", "Nothing to show."));

    if (anchor && !viewState.scrolledOnce) {
      viewState.scrolledOnce = true;
      setTimeout(function () { anchor.scrollIntoView({ block: "start" }); }, 0);
    }
  }

  // ---- rules ------------------------------------------------------------

  function renderRules(root, model) {
    var rules = [
      ["The game", "Everyone picked 4 national teams before the tournament. Your score is the total number of goals your 4 teams score across the whole World Cup. Closest to 21 WITHOUT going over wins — blackjack rules. Hit exactly 21 and you are a legend."],
      ["Going bust", "Over 21 means bust: you rank below every non-busted player, however close you are. Busted players are ordered by smallest overshoot. Equal totals share a rank."],
      ["What counts as a goal", "Goals in regulation and extra time count. Penalty-shootout goals do NOT count. Own goals count for the team credited on the scoreline. The score you see on TV at full time is the score used here."],
      ["“Alive” teams", "A team is alive while it still has matches left to play — even if it cannot qualify any more, its remaining group games still produce goals. Knocked-out teams are struck through; their goals keep counting toward your total."],
      ["Where scores come from", "Results update automatically every ~30 minutes from a public fixtures feed via a GitHub Action. If something looks wrong, the admin can correct any match in data/overrides.js — corrected matches show a ✎ mark."],
    ];
    rules.forEach(function (r) {
      var sec = el("section", "rule");
      sec.append(el("h2", "h-sec", r[0]));
      sec.append(el("p", null, r[1]));
      root.append(sec);
    });
    if (WCB.config.repoUrl) {
      var p = el("p", "rule-link");
      var a = el("a", null, "Site source & data on GitHub");
      a.href = WCB.config.repoUrl;
      p.append(a);
      root.append(p);
    }
  }

  // ---- chrome -----------------------------------------------------------

  function renderPill(state) {
    var pill = document.getElementById("source-pill");
    pill.className = "pill " + state.source;
    var txt = state.source === "live" ? "Live · " + fmtTime(state.sourceTime.toISOString())
      : state.source === "cache" ? "Cached · " + fmtDateTime(state.sourceTime)
      : "Snapshot";
    if (WCB.config.mock) txt = "MOCK · " + txt;
    if (state.overrideCount) txt += " · " + state.overrideCount + " ✎";
    pill.textContent = txt;
  }

  function renderBanners(model) {
    var box = document.getElementById("banners");
    box.textContent = "";
    var ov = WCB.data.overrides || {};
    if (ov.banner) box.append(el("div", "banner info", ov.banner));
    if (!WCB.config.mock && WCB.data.playersArePlaceholders) {
      box.append(el("div", "banner warn",
        "Sample picks shown — the admin needs to enter the real ones in data/players.js."));
    }
    model.errors.forEach(function (e) { box.append(el("div", "banner error", e)); });
    if (model.ts.needsOverride.length) {
      box.append(el("div", "banner warn",
        "Admin: match " + model.ts.needsOverride.join(", ") +
        " finished level — set the pens winner in data/overrides.js so the loser can be marked out."));
    }
  }

  function renderFooter(state) {
    var f = document.getElementById("footer");
    f.textContent = "Goals in 90′ + extra time count · shootout goals don’t · " +
      "own goals count for the credited team. " +
      (state.source === "live" && state.sourceTime
        ? "Updated " + fmtDateTime(state.sourceTime) + "."
        : state.source === "cache" && state.sourceTime
        ? "Showing cached results from " + fmtDateTime(state.sourceTime) + "."
        : "Showing the offline snapshot.");
  }

  function render(route, model, viewState, rerender) {
    WCB.ui._teamsByCode = model.ts.byCode;
    var root = document.getElementById("view");
    root.textContent = "";
    document.querySelectorAll("#tabs a").forEach(function (a) {
      a.classList.toggle("active", a.dataset.route === route);
    });
    if (route === "teams") renderTeams(root, model, viewState, rerender);
    else if (route === "matches") renderMatches(root, model, viewState, rerender);
    else if (route === "rules") renderRules(root, model);
    else renderLeaderboard(root, model, viewState, rerender);
    renderPill(model.state);
    renderBanners(model);
    renderFooter(model.state);
  }

  return { render: render, _teamsByCode: {} };
})();
