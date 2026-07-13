// Material detail — loads from backend by ?id= (slug), mock fallback.
(function () {
  "use strict";

  const api = window.NSV_API;
  const imgOf = window.NSVMaterialImg || ((m) => (m && m.image) || "");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.textContent = val || ""; };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function initials(name) {
    return String(name || "")
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map((w) => w[0].toUpperCase()).join("");
  }

  function renderBlocks(blocks) {
    return blocks
      .map((b) => {
        if (typeof b === "string") return `<p>${esc(b)}</p>`;
        switch (b.t) {
          case "h2":
            return `<h2>${esc(b.x)}</h2>`;
          case "quote":
            return `<blockquote>${esc(b.x)}${b.by ? `<cite>${esc(b.by)}</cite>` : ""}</blockquote>`;
          case "list":
            return `<ul>${(b.items || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
          case "note":
            return `<aside class="article__note">${esc(b.x)}</aside>`;
          case "p":
          default:
            return `<p>${esc(b.x || "")}</p>`;
        }
      })
      .join("");
  }

  function setCover(item) {
    const src = imgOf(item);
    const figure = document.getElementById("matFigure");
    const cover = document.getElementById("matCover");
    const caption = document.getElementById("matCaption");
    if (!figure || !cover || !src) {
      if (figure) figure.hidden = true;
      document.body.classList.add("page-article--no-cover");
      return;
    }
    cover.src = src;
    cover.alt = item.title;
    figure.hidden = false;
    document.body.classList.remove("page-article--no-cover");
    const cap = item.imageCaption || "";
    if (caption) {
      caption.textContent = cap;
      caption.hidden = !cap;
    }
    const og = document.querySelector('meta[property="og:image"]');
    if (og) og.setAttribute("content", new URL(src, location.href).href);
  }

  function materialCard(m) {
    const src = imgOf(m);
    const href = "material-detail.html?id=" + encodeURIComponent(m.id);
    return `
      <article class="material-card">
        <a class="material-card__media" href="${href}" aria-label="Открыть: ${esc(m.title)}">
          <img src="${esc(src)}" alt="" loading="lazy" />
        </a>
        <div class="material-card__top">
          <span class="material-card__type">${esc(m.type)}</span>
          <span class="badge">${esc(m.audience)}</span>
        </div>
        <h3><a href="${href}" style="color:inherit">${esc(m.title)}</a></h3>
        <p>${esc(m.desc)}</p>
        <div class="material-card__foot">
          <span>${esc(m.time)}</span>
          <a href="${href}" class="link-arrow">Открыть</a>
        </div>
      </article>`;
  }

  function render(item, all) {
    document.title = item.title + " — Национальная система восстановления";
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", item.title);
    set("crumbName", item.title);
    set("matTitle", item.title);
    set("matDesc", item.dek || item.desc);
    set("matType", item.type);
    set("matAudience", item.audience);
    set("matTime", item.time);
    set("matAuthor", item.author || "Редакция");
    set("matAuthorRole", item.authorRole || "Национальная система восстановления");
    set("matDate", item.date || "");
    set("matAvatar", initials(item.author || "НС"));

    setCover(item);

    const body = document.getElementById("matBody");
    if (body) {
      const blocks = Array.isArray(item.body) && item.body.length ? item.body : [item.desc || ""];
      body.innerHTML = renderBlocks(blocks);
    }

    const related = document.getElementById("matRelated");
    if (related) {
      const rest = all
        .filter((m) => m.id !== item.id && m.audience === item.audience)
        .concat(all.filter((m) => m.id !== item.id && m.audience !== item.audience))
        .slice(0, 3);
      related.innerHTML = rest.map(materialCard).join("");
    }
  }

  async function init() {
    let item = null;
    let all = [];
    try {
      item = api ? await api.getMaterial(id) : null;
      all = (api ? await api.getMaterials() : null) || [];
    } catch {
      item = null;
    }
    const mock = (window.NSV_DATA && window.NSV_DATA.materials) || [];
    if (!all || !all.length) all = mock;
    if (!item) item = mock.find((m) => String(m.id) === String(id)) || mock[0];
    if (item) render(item, all);
  }

  init();
})();
