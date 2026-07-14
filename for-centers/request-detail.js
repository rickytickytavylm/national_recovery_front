// Request detail — loads a single request (center scope) from backend, mock fallback.
(function () {
  "use strict";

  const api = window.NSV_API;
  const labels = (window.NSV_DATA && window.NSV_DATA.REQUEST_STATUS) || {};
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.textContent = val; };
  const pill = (status) => {
    const l = labels[status] || { label: status, cls: "new" };
    return `<span class="pill pill--${l.cls}">${l.label}</span>`;
  };

  let req = null;

  function renderTimeline(events) {
    const timeline = document.getElementById("reqTimeline");
    if (!timeline) return;
    let items = Array.isArray(events) ? events.slice() : [];
    if (!items.length) {
      items = [
        { date: req.date, text: `Обращение поступило через «${req.source}»` },
        { date: req.date, text: "Заявка распределена на специалиста" },
      ];
    }
    timeline.innerHTML = items
      .map(
        (e) => `<li><div class="timeline__time">${e.date || ""}${e.author_name ? " · " + e.author_name : ""}</div><div class="timeline__text">${e.text || ""}</div></li>`
      )
      .join("");
  }

  function renderStatusPill() {
    const el = document.getElementById("reqStatusPill");
    if (el) el.innerHTML = pill(req.status);
  }

  function fillKv() {
    const kv = document.getElementById("reqKv");
    if (!kv) return;
    const rows = [
      ["Обращение", req.who],
      ["Телефон", req.phone || "—"],
      ["Источник", req.source],
      ["Программа", req.program || "—"],
      ["Дата", req.date],
    ];
    kv.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  function bindActions() {
    document.querySelectorAll("[data-status-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const next = btn.getAttribute("data-status-action");
        if (window.NSVSetLoading) window.NSVSetLoading(btn, true);
        try {
          if (api && api.setCenterRequestStatus) await api.setCenterRequestStatus(id, next);
          req.status = next;
          renderStatusPill();
          const l = labels[next] || { label: next };
          if (window.toast) window.toast("Статус изменён: " + l.label, { type: "success" });
        } catch {
          if (window.toast) window.toast("Не удалось изменить статус", { type: "error" });
        } finally {
          if (window.NSVSetLoading) window.NSVSetLoading(btn, false);
        }
      });
    });
  }

  async function init() {
    let events = [];
    try {
      if (api && api.ensureCenterSession) await api.ensureCenterSession();
      const res = api ? await api.getCenterRequest(id) : null;
      if (res && res.request) {
        req = res.request;
        events = res.events || [];
      }
    } catch {
      /* fallback ниже */
    }
    if (!req) {
      const mock = (window.NSV_DATA && window.NSV_DATA.requests) || [];
      req = mock.find((r) => String(r.id) === String(id)) || mock[0];
    }
    if (!req) return;

    document.title = "Заявка №" + req.id + " — Национальная система восстановления";
    set("crumbId", "№" + req.id);
    set("reqTitle", "Заявка №" + req.id);
    set("reqNote", req.note || "Комментарий отсутствует.");
    fillKv();
    renderStatusPill();
    renderTimeline(events);
    bindActions();
  }

  init();
})();
