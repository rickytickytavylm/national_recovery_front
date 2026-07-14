// Center analytics — aggregates mock requests into source/status breakdowns.
(function () {
  "use strict";

  const data = (window.NSV_DATA && window.NSV_DATA.requests) || [];
  const statusLabels = (window.NSV_DATA && window.NSV_DATA.REQUEST_STATUS) || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function countBy(key) {
    const map = {};
    data.forEach((r) => {
      const k = r[key] || "—";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  function rows(pairs, labelFn) {
    const max = pairs.reduce((m, [, n]) => Math.max(m, n), 0) || 1;
    return pairs
      .map(([k, n]) => {
        const pct = Math.round((n / max) * 100);
        return `
        <div class="an-row">
          <div class="an-row__top"><span>${esc(labelFn ? labelFn(k) : k)}</span><span class="table__name">${n}</span></div>
          <span class="prog-meter" style="width:100%"><span style="width:${pct}%"></span></span>
        </div>`;
      })
      .join("");
  }

  set("kpiMonth", data.length);

  const sources = document.getElementById("sources");
  if (sources) sources.innerHTML = rows(countBy("source"));

  const statuses = document.getElementById("statuses");
  if (statuses) {
    statuses.innerHTML = rows(countBy("status"), (k) => (statusLabels[k] && statusLabels[k].label) || k);
  }
})();
