// Recovery System — public platform interactions
(function () {
  "use strict";

  /* ---- Homepage splash ---- */
  const splash = document.getElementById("splash");
  if (splash && document.body.classList.contains("page-home")) {
    const key = "nsv:splash-seen";
    const finish = () => {
      splash.classList.add("is-done");
      document.documentElement.classList.remove("splash-active");
      document.body.classList.remove("splash-active");
      sessionStorage.setItem(key, "1");
      window.setTimeout(() => splash.remove(), 600);
    };
    if (sessionStorage.getItem(key)) {
      splash.remove();
    } else {
      document.documentElement.classList.add("splash-active");
      document.body.classList.add("splash-active");
      window.setTimeout(finish, 2400);
    }
  }

  /* ---- Graceful image fallback (no broken-image icons on demo) ---- */
  const TRANSPARENT = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E";
  document.addEventListener(
    "error",
    function (e) {
      const el = e.target;
      if (!el || el.tagName !== "IMG" || el.dataset._fb) return;
      el.dataset._fb = "1";
      if (el.classList.contains("brand__logo")) {
        const span = document.createElement("span");
        span.className = "brand__name-fallback";
        span.textContent = "Национальная система восстановления";
        if (el.parentNode) el.parentNode.replaceChild(span, el);
        return;
      }
      el.src = TRANSPARENT;
      el.classList.add("img-fallback");
    },
    true
  );

  /* ---- Header shadow on scroll ---- */
  const header = document.getElementById("header");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");

  const closeMenu = () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", closeMenu)
    );
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ---- Reveal on scroll ---- */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el, i) => {
      el.style.transitionDelay = Math.min((i % 4) * 60, 180) + "ms";
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- Smooth anchor scroll with header offset ---- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* ---- Homepage featured materials ---- */
  const homeMaterials = document.getElementById("homeMaterials");
  if (homeMaterials && window.NSV_DATA && window.NSV_DATA.materials) {
    const imgOf = window.NSVMaterialImg || ((m) => m.image || "");
    const featured = [
      { id: "first-30-days", cat: "Начать путь" },
      { id: "talk-to-loved-one", cat: "Помочь близкому" },
      { id: "choose-center", cat: "Выбрать центр" }
    ];
    const byId = Object.fromEntries(window.NSV_DATA.materials.map((m) => [m.id, m]));
    homeMaterials.innerHTML = featured
      .map(({ id, cat }) => {
        const m = byId[id];
        if (!m) return "";
        const href = "material-detail.html?id=" + encodeURIComponent(m.id);
        const src = imgOf(m);
        return `
          <article class="material-card reveal">
            <a class="material-card__media" href="${href}" aria-label="Читать: ${m.title}">
              <img src="${src}" alt="" loading="lazy" />
            </a>
            <span class="material-card__cat">${cat}</span>
            <h3><a href="${href}" style="color:inherit">${m.title}</a></h3>
            <p>${m.desc}</p>
            <div class="material-card__foot">
              <span>${m.time}</span>
              <a href="${href}" class="link-arrow">Читать</a>
            </div>
          </article>`;
      })
      .join("");
    homeMaterials.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = Math.min((i % 3) * 60, 120) + "ms";
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
        );
        io.observe(el);
      } else {
        el.classList.add("is-visible");
      }
    });
  }
})();

/* =========================================================
   Shared UI utilities: storage, toast, feedback, live forms
   ========================================================= */
(function () {
  "use strict";
  const cfg = window.NSV_CONFIG || { STORAGE_PREFIX: "nsv:" };
  const api = window.NSV_API || null;

  /* ---- localStorage helper ---- */
  const store = {
    key(k) { return (cfg.STORAGE_PREFIX || "nsv:") + k; },
    get(k, fallback) {
      try { const v = localStorage.getItem(this.key(k)); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(this.key(k), JSON.stringify(v)); } catch (e) {} },
    remove(k) { try { localStorage.removeItem(this.key(k)); } catch (e) {} }
  };
  window.NSVStore = store;

  /* ---- Toast notifications ---- */
  let host = null;
  function ensureHost() {
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    return host;
  }
  function toast(message, opts) {
    opts = opts || {};
    const type = opts.type || "info";
    const el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.setAttribute("role", type === "error" ? "alert" : "status");
    const dot = document.createElement("span"); dot.className = "toast__dot";
    const msg = document.createElement("span"); msg.className = "toast__msg"; msg.textContent = message;
    el.appendChild(dot); el.appendChild(msg);
    ensureHost().appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-in"));
    setTimeout(() => { el.classList.remove("is-in"); setTimeout(() => el.remove(), 300); }, opts.duration || 3200);
  }
  window.toast = toast;

  /* ---- Loading state on buttons ---- */
  function setLoading(btn, on) {
    if (!btn) return;
    if (on) {
      btn.dataset._label = btn.innerHTML;
      btn.classList.add("is-loading");
      btn.setAttribute("aria-busy", "true");
      btn.disabled = true;
    } else {
      btn.classList.remove("is-loading");
      btn.removeAttribute("aria-busy");
      btn.disabled = false;
      if (btn.dataset._label != null) btn.innerHTML = btn.dataset._label;
    }
  }
  window.NSVSetLoading = setLoading;

  /* ---- Dead-end feedback + data-action ---- */
  document.addEventListener("click", function (e) {
    const soon = e.target.closest("[data-soon]");
    if (soon) {
      e.preventDefault();
      toast(soon.getAttribute("data-soon") || "Раздел появится в ближайшем релизе", { type: "info" });
      return;
    }
    const act = e.target.closest("[data-action]");
    if (act) {
      const action = act.getAttribute("data-action");
      if (action === "save-profile") {
        e.preventDefault();
        setLoading(act, true);
        (api ? api.saveProfile({}) : Promise.resolve({ ok: true }))
          .then(() => { setLoading(act, false); toast("Изменения сохранены", { type: "success" }); });
      }
    }
  });

  /* ---- Live forms (loading -> success block + toast) ---- */
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const submitBtn = form.querySelector('[type="submit"]');
      const kind = form.getAttribute("data-form");
      const payload = Object.fromEntries(new FormData(form).entries());
      setLoading(submitBtn, true);
      const call = api
        ? (kind === "register" ? api.registerCenter(payload) : api.submitLead(payload))
        : Promise.resolve({ ok: true, id: "L-demo" });
      call.then(function (res) {
        setLoading(submitBtn, false);
        toast("Заявка успешно отправлена", { type: "success" });
        const success = form.parentElement.querySelector("[data-form-success]");
        if (success) {
          form.hidden = true;
          success.hidden = false;
          const idEl = success.querySelector("[data-lead-id]");
          if (idEl && res && res.id) idEl.textContent = res.id;
          success.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        form.reset();
      });
    });
  });
})();

/* iOS tab bar (mobile) */
(function () {
  var scr = document.currentScript;
  if (!scr || !scr.src || window.__iosTabbarQueued) return;
  window.__iosTabbarQueued = true;
  var s = document.createElement("script");
  s.src = new URL("shared/ios-tabbar.js", scr.src).href;
  document.head.appendChild(s);
})();

/* PWA — service worker */
(function () {
  var scr = document.currentScript;
  if (!scr || !scr.src || window.__pwaQueued) return;
  window.__pwaQueued = true;
  var s = document.createElement("script");
  s.src = new URL("shared/pwa-register.js", scr.src).href;
  s.setAttribute("data-sw", "sw.js");
  document.head.appendChild(s);
})();
