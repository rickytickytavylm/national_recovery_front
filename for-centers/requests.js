// Requests table — loads from backend (center scope) with mock fallback.
(function () {
  "use strict";

  const api = window.NSV_API;
  const labels = (window.NSV_DATA && window.NSV_DATA.REQUEST_STATUS) || {};
  const store = window.NSVStore;
  const STORAGE_KEY = "requests:filters";

  const body = document.getElementById("requestsBody");
  const countEl = document.getElementById("resultsCount");
  const searchInput = document.getElementById("searchInput");

  const defaults = { search: "", status: "all" };
  const saved = (store && store.get(STORAGE_KEY, null)) || {};
  const state = Object.assign({}, defaults, saved);
  let data = [];

  function persist() { if (store) store.set(STORAGE_KEY, state); }

  const ACTIVE = ["contacted", "assigned", "in_progress"];

  function updateKpis() {
    const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
    set("kpiTotal", data.length);
    set("kpiNew", data.filter((d) => d.status === "new").length);
    set("kpiWork", data.filter((d) => ACTIVE.includes(d.status)).length);
    set("kpiDone", data.filter((d) => d.status === "completed").length);
  }

  function matches(d) {
    const q = state.search.trim().toLowerCase();
    if (q && !(("№" + d.id).toLowerCase().includes(q) || String(d.source).toLowerCase().includes(q) || String(d.program).toLowerCase().includes(q) || String(d.who).toLowerCase().includes(q))) return false;
    if (state.status !== "all" && d.status !== state.status) return false;
    return true;
  }

  function render() {
    const list = data.filter(matches);
    countEl.textContent = `Показано: ${list.length} из ${data.length}`;

    if (!list.length) {
      body.innerHTML = '<tr><td colspan="6"><p class="empty-state">Заявок не найдено.</p></td></tr>';
      return;
    }

    body.innerHTML = list
      .map((d) => {
        const l = labels[d.status] || { label: d.status, cls: "new" };
        return `
        <tr>
          <td><span class="table__name">№${d.id}</span><br><span class="table__meta">${d.who}</span></td>
          <td>${d.source}</td>
          <td>${d.program}</td>
          <td class="table__meta">${d.date}</td>
          <td><span class="pill pill--${l.cls}">${l.label}</span></td>
          <td><a class="table__action" href="request-detail.html?id=${d.id}">Открыть</a></td>
        </tr>`;
      })
      .join("");
  }

  const statusGroup = document.getElementById("statusFilter");
  if (statusGroup) {
    statusGroup.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip-btn");
      if (!btn) return;
      statusGroup.querySelectorAll(".chip-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.status = btn.dataset.status;
      persist();
      render();
    });
    statusGroup.querySelectorAll(".chip-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.status === state.status);
    });
  }

  searchInput.addEventListener("input", () => {
    state.search = searchInput.value;
    persist();
    render();
  });

  async function init() {
    searchInput.value = state.search || "";
    body.innerHTML = '<tr><td colspan="6"><p class="empty-state">Загрузка…</p></td></tr>';
    try {
      if (api && api.ensureCenterSession) await api.ensureCenterSession();
      data = (api ? await api.getCenterRequests() : null) || [];
    } catch {
      data = (window.NSV_DATA && window.NSV_DATA.requests) || [];
    }
    if (!Array.isArray(data)) data = [];
    updateKpis();
    render();
  }

  init();
})();
