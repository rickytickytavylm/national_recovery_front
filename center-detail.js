// Center detail — populate from shared data by ?id=
(function () {
  "use strict";

  const api = window.NSV_API;
  const imgOf = window.NSVCenterImg || ((c) => (c && c.image) || "center1.png");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const reviews = [
    { name: "Ирина", stars: 5, text: "Помогли не только сыну, но и всей семье. Чёткий план и постоянная связь." },
    { name: "Анонимно", stars: 5, text: "Спокойное отношение без осуждения. Впервые за долгое время появилась опора." },
    { name: "Дмитрий", stars: 4, text: "Профессиональная команда. Сопровождение после программы действительно работает." }
  ];

  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.textContent = val; };

  function avatarLetter(name) {
    const n = String(name || "?").trim();
    return n.charAt(0).toLocaleLowerCase("ru-RU");
  }

  function render(center) {    const statusHtml = center.status === "verified"
      ? '<span class="status status--verified">Проверен</span>'
      : '<span class="status status--review">На проверке</span>';

    document.title = center.name + " — Национальная система восстановления";
    const src = imgOf(center);
    const cover = document.getElementById("centerCover");
    const figure = document.getElementById("centerFigure");
    if (cover && src) {
      cover.src = src;
      cover.alt = "Фотография центра " + center.name;
      if (figure) figure.hidden = false;
      document.body.classList.remove("page-center--no-cover");
      const og = document.querySelector('meta[property="og:image"]');
      if (og) og.setAttribute("content", new URL(src, location.href).href);
    } else if (figure) {
      figure.hidden = true;
      document.body.classList.add("page-center--no-cover");
    }

    set("crumbName", center.name);
    set("centerName", center.name);
    set("centerCity", center.city);
    set("centerAbout", center.about || center.short);
    set("centerPhone", "Телефон: " + (center.phone || "8 800 123-45-67"));
    set("centerEmail", "Email: " + (center.email || "info@center.local"));
    const statusEl = document.getElementById("centerStatus");
    if (statusEl) statusEl.innerHTML = statusHtml;

    const spec = document.getElementById("centerSpec");
    if (spec) {
      spec.classList.add("spec--booking");
      const items = [
        ["Рейтинг", center.rating.toFixed(1) + " · " + center.reviews + " отзывов"],
        ["Форматы", center.formats.join(", ")],
        ["Работает с", center.established || "—"],
        ["Длительность", center.duration || "гибко"]
      ];
      if (center.seats) items.push(["Мест в программе", String(center.seats)]);
      spec.innerHTML = items
        .map(([l, v]) => `<div class="spec__item"><div class="spec__label">${l}</div><div class="spec__value">${v}</div></div>`)
        .join("");
    }

    const progWrap = document.getElementById("centerPrograms");
    if (progWrap && Array.isArray(center.programs)) {
      progWrap.className = "program-list";
      progWrap.innerHTML = center.programs
        .map(
          (p) => `<article class="program-card"><div class="program-card__name">${p.name}</div><div class="program-card__format">${p.format}</div><div class="program-card__duration">${p.duration}</div></article>`
        )
        .join("");
    }

    const revWrap = document.getElementById("centerReviews");
    if (revWrap) {
      revWrap.innerHTML = reviews
        .map(
          (r) => `<div class="review"><div class="review__head"><span class="review__avatar" aria-hidden="true">${avatarLetter(r.name)}</span><div><div class="review__name">${r.name}</div><div class="review__stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div></div></div><p>${r.text}</p></div>`
        )
        .join("");
    }
  }

  async function init() {
    let center = null;
    try {
      center = api ? await api.getCenter(id) : null;
    } catch {
      center = null;
    }
    if (!center) {
      const mock = (window.NSV_DATA && window.NSV_DATA.centers) || [];
      center = mock.find((c) => String(c.id) === String(id)) || mock[0];
    }
    if (center) render(center);
  }

  init();
})();

