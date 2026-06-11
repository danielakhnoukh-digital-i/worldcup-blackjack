// Data loading: live results -> localStorage cache -> baked snapshot,
// then overrides applied verbatim on top. Produces WCB.store.state.
window.WCB = window.WCB || {};

WCB.store = {
  state: null,

  // Sanity gate: refuse to use a "feed" that is obviously not the tournament
  // (error pages, truncated bodies). Skipped for the mock feed.
  _parse: function (rawText) {
    var parsed = WCB.adapters.fixturedownload.parse(rawText);
    if (!WCB.config.mock) {
      var baseIds = {};
      WCB.data.schedule.matches.forEach(function (m) { baseIds[m.id] = true; });
      var overlap = parsed.matches.filter(function (m) { return baseIds[m.id]; }).length;
      if (parsed.matches.length < 50 || overlap < 1) throw new Error("feed failed sanity gate");
    }
    return parsed;
  },

  _fetchLive: function () {
    var cfg = WCB.config;
    if (cfg.mock) return Promise.resolve(JSON.stringify(WCB.data.mockfeed));
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, cfg.fetchTimeoutMs);
    return fetch(cfg.resultsUrl, { cache: "no-store", signal: ctrl.signal })
      .then(function (resp) {
        clearTimeout(timer);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.text();
      });
  },

  load: function () {
    var self = this, cfg = WCB.config;
    var attempt = cfg.feedOff
      ? Promise.reject(new Error("feed disabled via ?feed=off"))
      : self._fetchLive().then(function (raw) {
          var parsed = self._parse(raw);
          try {
            localStorage.setItem(cfg.cacheKey, JSON.stringify({ fetchedAt: Date.now(), raw: raw }));
          } catch (e) { /* storage full/blocked — cache is best-effort */ }
          return { parsed: parsed, source: "live", sourceTime: new Date() };
        });

    return attempt
      .catch(function () {
        var cached = null;
        try { cached = JSON.parse(localStorage.getItem(cfg.cacheKey)); } catch (e) {}
        if (cached && cached.raw) {
          return { parsed: self._parse(cached.raw), source: "cache", sourceTime: new Date(cached.fetchedAt) };
        }
        throw new Error("no cache");
      })
      .catch(function () {
        return { parsed: { matches: [] }, source: "baked", sourceTime: null };
      })
      .then(function (layer) {
        self.state = self._merge(layer.parsed, layer.source, layer.sourceTime);
        return self.state;
      });
  },

  _merge: function (parsed, source, sourceTime) {
    var byId = {};
    var merged = WCB.data.schedule.matches.map(function (m) {
      var out = Object.assign({}, m, { source: source, overridden: false });
      byId[out.id] = out;
      return out;
    });

    // Feed layer: non-null fields only — a feed that does not know something
    // yet must not erase what the snapshot knows.
    parsed.matches.forEach(function (f) {
      var base = byId[f.id];
      if (!base) return;
      Object.keys(f).forEach(function (k) {
        if (k !== "id" && f[k] !== null && f[k] !== undefined) base[k] = f[k];
      });
    });

    // Override layer: every present field applies verbatim, nulls included.
    var ov = WCB.data.overrides || {};
    var overrideCount = 0;
    Object.keys(ov.matches || {}).forEach(function (idStr) {
      var base = byId[+idStr];
      if (!base) return;
      var o = ov.matches[idStr];
      Object.keys(o).forEach(function (k) { base[k] = o[k]; });
      base.overridden = true;
      overrideCount++;
    });

    merged.sort(function (a, b) {
      return a.kickoffUtc === b.kickoffUtc ? a.id - b.id : (a.kickoffUtc < b.kickoffUtc ? -1 : 1);
    });
    return {
      matches: merged, byId: byId,
      source: source, sourceTime: sourceTime,
      overrideCount: overrideCount,
    };
  },
};
