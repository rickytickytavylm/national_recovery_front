// Center dashboard — loads KPIs, recent requests and association status from backend.
(function () {
  "use strict";

  const api = window.NSV_API;
  const reqLabels = (window.NSV_DATA && window.NSV_DATA.REQUEST_STATUS) || {};
  const assocLabels = (window.NSV_DATA && window.NSV_DATA.ASSOCIATION_STATUS) || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const ACTIVE = ["contacted", "assigned", "in_progress"];

  function renderRecent(rows) {
    const body = document.getElementById("recentBody");
    if (!body) return;
    if (!rows || !rows.length) {
      body.innerHTML = '<tr><td colspan="4"><span class="table__meta">Пока нет заявок</span></td></tr>';
      return;
    }
    body.innerHTML = rows
      .slice(0, 5)
      .map((r) => {
        const l = reqLabels[r.status] || { label: r.status, cls: "new" };
        return `<tr>
          <td><span class="table__name">№${r.id}</span><br><span class="table__meta">${r.user_name || r.who || "—"}</span></td>
          <td>${r.source || "—"}</td>
          <td>${r.program || "—"}</td>
          <td><span class="pill pill--${l.cls}">${l.label}</span></td>
        </tr>`;
      })
      .join("");
  }

  function renderAssoc(status) {
    const el = document.getElementById("assocStatus");
    if (!el) return;
    const l = assocLabels[status] || { label: "Статус центра" };
    el.innerHTML = `<span class="dot"></span> ${l.label}`;
  }

  async function init() {
    try {
      if (api && api.ensureCenterSession) await api.ensureCenterSession();
      const dash = api ? await api.getCenterDashboard() : null;
      const requests = (api ? await api.getCenterRequests() : null) || [];

      if (dash && dash.stats) {
        set("kpiReqTotal", dash.stats.requests_total);
        set("kpiRating", (dash.stats.rating || 0).toFixed(1));
        renderAssoc(dash.stats.association_status);
      }
      const list = Array.isArray(requests) ? requests : [];
      set("kpiReqTotal", list.length);
      set("kpiReqNew", list.filter((r) => r.status === "new").length);
      set("kpiActive", list.filter((r) => ACTIVE.includes(r.status)).length);
      renderRecent(list.length ? list : (dash && dash.recent_requests) || []);
    } catch {
      const mock = (window.NSV_DATA && window.NSV_DATA.requests) || [];
      set("kpiReqTotal", mock.length);
      set("kpiReqNew", mock.filter((r) => r.status === "new").length);
      set("kpiActive", mock.filter((r) => ACTIVE.includes(r.status)).length);
      set("kpiRating", "4.9");
      renderRecent(mock);
    }
  }

  init();
})();
