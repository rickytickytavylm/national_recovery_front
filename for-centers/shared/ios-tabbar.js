/* iOS-style bottom tab bar — public + center platforms */
(function () {
  "use strict";

  var MQ = window.matchMedia("(max-width: 900px)");

  var ICONS = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M5 10.5 12 4l7 6.5V20a1 1 0 0 1-1 1h-5v-6H11v6H6a1 1 0 0 1-1-1z"/><path d="M5 10.5 12 4l7 6.5V20a1 1 0 0 1-1 1h-5v-6H11v6H6a1 1 0 0 1-1-1z"/></svg>',
    centers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6M4 20V8l8-4 8 4v12"/></svg>',
    diag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M6 4h12a2 2 0 0 1 2 2v12l-4-3-4 3-4-3-4 3V6a2 2 0 0 1 2-2z"/><path d="M8 8h8M8 12h5"/></svg>',
    materials: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M5 5h14v14H5z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M12 21s-7-4.5-7-10a7 7 0 1 1 14 0c0 5.5-7 10-7 10z"/><path d="M12 21s-7-4.5-7-10a7 7 0 1 1 14 0c0 5.5-7 10-7 10z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M5 5h6v6H5zm8 0h6v6h-6zM5 13h6v6H5zm8 0h6v6h-6z"/><path d="M5 5h6v6H5zm8 0h6v6h-6zM5 13h6v6H5zm8 0h6v6h-6z"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M4 6h16v12H4z"/><path d="M4 6h16v12H4zM4 10l4 3h8l4-3"/></svg>',
    program: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M5 19V5"/><path d="M5 19h14M9 16V9M13 16V6M17 16v-4"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 9a7 7 0 0 1 14 0"/><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 9a7 7 0 0 1 14 0"/></svg>',
    connect: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M12 3l8 4v10l-8 4-8-4V7zM12 11v10M4 7l8 4 8-4"/></svg>',
    building: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-part" d="M4 20V6l8-4 8 4v14"/><path d="M8 20v-5h3v5M13 20v-8h3v8"/></svg>'
  };

  var PUBLIC_TABS = [
    { href: "index.html", label: "Главная", icon: "home", match: ["index.html", ""] },
    { href: "centers.html", label: "Центры", icon: "centers", match: ["centers.html", "center-detail.html"] },
    { href: "diagnostic.html", label: "Тест", icon: "diag", match: ["diagnostic.html"] },
    { href: "materials.html", label: "Гайды", icon: "materials", match: ["materials.html", "material-detail.html"] },
    { href: "help.html", label: "Помощь", icon: "help", match: ["help.html"] }
  ];

  var CENTER_LANDING_TABS = [
    { href: "index.html", label: "Главная", icon: "home", match: ["index.html", ""] },
    { href: "onboarding.html", label: "Подключить", icon: "connect", match: ["onboarding.html"] },
    { href: "dashboard.html", label: "Кабинет", icon: "grid", match: ["dashboard.html"] }
  ];

  var CENTER_CABINET_TABS = [
    { href: "dashboard.html", label: "Обзор", icon: "grid", match: ["dashboard.html"] },
    { href: "requests.html", label: "Заявки", icon: "inbox", match: ["requests.html", "request-detail.html"] },
    { href: "programs.html", label: "Программы", icon: "program", match: ["programs.html"] },
    { href: "analytics.html", label: "Аналитика", icon: "chart", match: ["analytics.html"] },
    { href: "profile.html", label: "Профиль", icon: "profile", match: ["profile.html", "association.html"] }
  ];

  function currentFile() {
    var file = location.pathname.split("/").pop() || "index.html";
    return file.split("?")[0].split("#")[0];
  }

  function isAdmin() {
    return location.pathname.indexOf("admin-platform") !== -1;
  }

  function isCenterCabinet() {
    return !!document.querySelector(".app__main");
  }

  function isCenterPlatform() {
    return location.pathname.indexOf("center-platform") !== -1;
  }

  function isPublicPlatform() {
    return location.pathname.indexOf("public-platform") !== -1 ||
      (!isCenterPlatform() && !isAdmin() && !!document.getElementById("header"));
  }

  function getTabs() {
    if (isAdmin()) return null;
    if (isCenterCabinet()) return CENTER_CABINET_TABS;
    if (isCenterPlatform()) return CENTER_LANDING_TABS;
    if (isPublicPlatform()) return PUBLIC_TABS;
    return null;
  }

  function isActive(tab, file) {
    return tab.match.indexOf(file) !== -1;
  }

  function buildBar(tabs) {
    var file = currentFile();
    var html = "";
    tabs.forEach(function (tab) {
      var active = isActive(tab, file);
      html +=
        '<a href="' + tab.href + '" class="ios-tabbar__item' + (active ? " is-active" : "") + '"' +
        (active ? ' aria-current="page"' : "") + ">" +
        '<span class="ios-tabbar__icon">' + (ICONS[tab.icon] || ICONS.home) + "</span>" +
        '<span class="ios-tabbar__label">' + tab.label + "</span>" +
        "</a>";
    });
    return html;
  }

  function render() {
    var tabs = getTabs();
    var bar = document.querySelector(".ios-tabbar");
    var app = document.querySelector(".app");

    if (!MQ.matches || !tabs) {
      document.body.classList.remove("ios-app");
      if (app) app.classList.remove("has-ios-tabbar");
      if (bar) bar.remove();
      return;
    }

    document.body.classList.add("ios-app");
    if (app) app.classList.add("has-ios-tabbar");

    if (!bar) {
      bar = document.createElement("nav");
      bar.className = "ios-tabbar";
      bar.setAttribute("aria-label", "Основная навигация");
      document.body.appendChild(bar);
    }

    bar.innerHTML = buildBar(tabs);
  }

  render();
  if (MQ.addEventListener) MQ.addEventListener("change", render);
  else if (MQ.addListener) MQ.addListener(render);
})();
