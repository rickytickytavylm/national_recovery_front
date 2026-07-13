// Materials knowledge base — shared data, persisted filters, detail links
(function () {
  "use strict";

  const api = window.NSV_API;
  const imgOf = window.NSVMaterialImg || ((m) => (m && m.image) || "");
  let items = [];
  const store = window.NSVStore;
  const STORAGE_KEY = "materials:filters";

  const grid = document.getElementById("materials");
  const countEl = document.getElementById("resultsCount");
  const searchInput = document.getElementById("searchInput");

  const defaults = { search: "", audience: "all", type: "all" };
  const saved = (store && store.get(STORAGE_KEY, null)) || {};
  const state = Object.assign({}, defaults, saved);

  function persist() { if (store) store.set(STORAGE_KEY, state); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function matches(m) {
    const q = state.search.trim().toLowerCase();
    if (q && !(m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q))) return false;
    if (state.audience !== "all" && m.audience !== state.audience) return false;
    if (state.type !== "all" && m.type !== state.type) return false;
    return true;
  }

  function render() {
    const list = items.filter(matches);
    countEl.textContent = list.length ? `Найдено материалов: ${list.length}` : "";

    if (!list.length) {
      grid.innerHTML = '<p class="empty-state">Ничего не найдено. Попробуйте изменить фильтры.</p>';
      return;
    }

    grid.innerHTML = list
      .map((m) => {
        const href = "material-detail.html?id=" + encodeURIComponent(m.id);
        const src = imgOf(m);
        return `
      <article class="material-card">
        <a class="material-card__media" href="${href}" aria-label="Открыть материал: ${esc(m.title)}">
          <img src="${esc(src)}" alt="" loading="lazy" />
        </a>
        <div class="material-card__top">
          <span class="material-card__cat">${esc(m.audience)}</span>
          <span class="material-card__type">${esc(m.type)}</span>
        </div>
        <h3><a href="${href}" style="color:inherit">${esc(m.title)}</a></h3>
        <p>${esc(m.desc)}</p>
        <div class="material-card__foot">
          <span>${esc(m.time)}</span>
          <a href="${href}" class="link-arrow">Открыть</a>
        </div>
      </article>`;
      })
      .join("");
  }

  function syncChips() {
    ["audience", "type"].forEach((key) => {
      const group = document.getElementById(key + "Filter");
      if (!group) return;
      group.querySelectorAll(".chip-btn").forEach((b) => {
        b.classList.toggle("is-active", b.dataset[key] === state[key]);
      });
    });
  }

  function bindGroup(id, key) {
    const group = document.getElementById(id);
    if (!group) return;
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip-btn");
      if (!btn) return;
      group.querySelectorAll(".chip-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state[key] = btn.dataset[key];
      persist();
      render();
    });
  }

  bindGroup("audienceFilter", "audience");
  bindGroup("typeFilter", "type");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.search = searchInput.value;
      persist();
      render();
    });
    searchInput.value = state.search || "";
  }
  syncChips();

  async function init() {
    grid.innerHTML = '<p class="empty-state">Загрузка материалов…</p>';
    try {
      items = (api ? await api.getMaterials() : null) || [];
    } catch {
      items = (window.NSV_DATA && window.NSV_DATA.materials) || [];
    }
    if (!Array.isArray(items)) items = [];
    render();
  }

  init();
})();
