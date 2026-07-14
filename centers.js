// Centers catalog — shared data, persisted filters, detail links
(function () {
  "use strict";

  const api = window.NSV_API;
  let centers = [];
  const store = window.NSVStore;
  const STORAGE_KEY = "centers:filters";

  const catalog = document.getElementById("catalog");
  const countEl = document.getElementById("resultsCount");
  const searchInput = document.getElementById("searchInput");

  const defaults = { search: "", city: "all", format: "all", status: "all" };
  const saved = (store && store.get(STORAGE_KEY, null)) || {};
  const state = Object.assign({}, defaults, saved);

  function persist() { if (store) store.set(STORAGE_KEY, state); }

  function badges(c) {
    const out = [];
    if (c.status === "verified") {
      out.push('<span class="cbadge cbadge--verified">Проверен</span>');
      out.push('<span class="cbadge cbadge--assoc">Участник ассоциации</span>');
    } else {
      out.push('<span class="cbadge cbadge--assoc">На проверке</span>');
    }
    if ((c.formats || []).some((f) => /онлайн/i.test(f))) {
      out.push('<span class="cbadge cbadge--online">Онлайн-консультация</span>');
    }
    return out.join("");
  }
  const imgOf = window.NSVCenterImg || ((c) => (c && c.image) || "center1.webp");
  function centerImg(c) {
    return imgOf(c);
  }
  function scoreWord(r) { return r >= 4.8 ? "Отлично" : r >= 4.5 ? "Хорошо" : "Неплохо"; }
  function reviewsWord(n) {
    const d10 = n % 10, d100 = n % 100;
    if (d10 === 1 && d100 !== 11) return "отзыв";
    if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return "отзыва";
    return "отзывов";
  }

  function matches(c) {
    const q = state.search.trim().toLowerCase();
    if (q && !(c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q))) return false;
    if (state.city !== "all" && c.city !== state.city) return false;
    if (state.format !== "all" && !c.formats.includes(state.format)) return false;
    if (state.status !== "all" && c.status !== state.status) return false;
    return true;
  }

  function render() {
    const list = centers.filter(matches);
    countEl.textContent = list.length ? `Найдено центров: ${list.length}` : "";

    if (!list.length) {
      catalog.innerHTML = '<p class="empty-state">Ничего не найдено. Попробуйте изменить фильтры.</p>';
      return;
    }

    catalog.innerHTML = list
      .map(
        (c) => `
      <article class="center-card">
        <a class="center-card__media center-card__media--link" href="center-detail.html?id=${c.id}" aria-label="Открыть центр ${c.name}"><img src="${centerImg(c)}" alt="Фото центра ${c.name}" loading="lazy" /></a>
        <div class="center-card__body">
          <div class="center-card__badges">${badges(c)}</div>
          <div class="center-card__head">
            <h3><a href="center-detail.html?id=${c.id}" style="color:inherit">${c.name}</a></h3>
          </div>
          <p class="center-card__city">${c.city}</p>
          <p class="center-card__desc">${c.short}</p>
          <div class="center-card__tags">
            ${c.formats.map((f) => `<span class="tag">${f}</span>`).join("")}
          </div>
          <div class="center-card__foot">
            <div class="center-card__rating">
              <b>${c.rating.toFixed(1)}</b> · ${c.reviews} ${reviewsWord(c.reviews)} · ${scoreWord(c.rating)}
            </div>
            <a href="center-detail.html?id=${c.id}" class="link-arrow">Подробнее</a>
          </div>
        </div>
      </article>`
      )
      .join("");
  }

  function syncChips() {
    ["city", "format", "status"].forEach((key) => {
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

  bindGroup("cityFilter", "city");
  bindGroup("formatFilter", "format");
  bindGroup("statusFilter", "status");

  searchInput.addEventListener("input", () => {
    state.search = searchInput.value;
    persist();
    render();
  });

  // Restore saved state on load
  searchInput.value = state.search || "";
  syncChips();

  async function init() {
    catalog.innerHTML = '<p class="empty-state">Загрузка центров…</p>';
    try {
      centers = (api ? await api.getCenters() : null) || [];
    } catch {
      centers = (window.NSV_DATA && window.NSV_DATA.centers) || [];
    }
    if (!Array.isArray(centers)) centers = [];
    render();
  }

  init();
})();
