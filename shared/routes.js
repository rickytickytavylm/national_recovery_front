/* =========================================================
   Национальная система восстановления — карта маршрутов
   Единое место с именами страниц. Пути указаны относительно
   корня соответствующей платформы.
   ========================================================= */
window.NSV_ROUTES = {
  public: {
    home: "index.html",
    help: "help.html",
    diagnostic: "diagnostic.html",
    centers: "centers.html",
    materials: "materials.html",
    centerDetail: "center-detail.html",
    materialDetail: "material-detail.html"
  },
  center: {
    home: "index.html",
    onboarding: "onboarding.html",
    dashboard: "dashboard.html",
    requests: "requests.html",
    requestDetail: "request-detail.html",
    profile: "profile.html"
  },
  crossToCenter: "https://rickytickytavylm.github.io/central_platform/",
  crossToPublic: "../public-platform/",

  // routes.withId("center-detail.html", "yasnost") -> "center-detail.html?id=yasnost"
  withId: function (path, id) {
    return path + "?id=" + encodeURIComponent(id);
  }
};
