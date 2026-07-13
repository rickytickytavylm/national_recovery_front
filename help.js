// Help page — adjust flow after completed diagnostic
(function () {
  "use strict";

  const store = window.NSVStore;
  const progress = store && store.get("diagnostic:progress", null);
  const fromDiagnostic =
    new URLSearchParams(location.search).get("from") === "diagnostic" ||
    !!(progress && progress.completed);

  if (!fromDiagnostic) return;

  const path = document.querySelector(".path");
  if (path) path.classList.add("path--post-diagnostic");

  const heroTitle = document.querySelector(".page-hero__title");
  const heroLead = document.querySelector(".page-hero__lead");
  const heroActions = document.querySelector(".page-hero__actions");

  if (heroTitle) heroTitle.textContent = "Следующие шаги после диагностики";
  if (heroLead) {
    heroLead.textContent =
      "Диагностика уже пройдена — теперь можно связаться со специалистом или подобрать центр.";
  }
  if (heroActions) {
    heroActions.innerHTML =
      '<a href="#channels" class="btn btn--primary">Связаться со специалистом</a>' +
      '<a href="centers.html" class="btn btn--ghost">Подобрать центр</a>';
  }

  const sectionHead = document.querySelector(".section .section__head .section__title");
  const sectionLead = document.querySelector(".section .section__head .section__lead");
  if (sectionHead) sectionHead.textContent = "Что делать дальше";
  if (sectionLead) {
    sectionLead.textContent = "Первый шаг уже сделан — продолжайте с консультации или выбора центра.";
  }

  const steps = path ? path.querySelectorAll(".path-step") : [];
  const step1 = steps[0];
  const step2 = steps[1];

  if (step1) {
    step1.classList.add("path-step--done");
    const h3 = step1.querySelector("h3");
    const p = step1.querySelector("p");
    const btn = step1.querySelector(".btn");
    if (h3) h3.textContent = "Диагностика пройдена";
    if (p) p.textContent = "Результат сохранён — можно посмотреть рекомендации ещё раз.";
    if (btn) {
      btn.textContent = "К результату";
      btn.setAttribute("href", "diagnostic.html");
    }
  }

  if (step2) {
    step2.classList.add("path-step--current");
    const btn = step2.querySelector(".btn");
    if (btn) btn.classList.replace("btn--ghost", "btn--primary");
  }

  const cta = document.querySelector(".cta");
  if (cta) {
    const ctaTitle = cta.querySelector(".cta__title");
    const ctaText = cta.querySelector(".cta__text");
    const ctaActions = cta.querySelector(".cta__actions");
    if (ctaTitle) ctaTitle.textContent = "Готовы к следующему шагу?";
    if (ctaText) ctaText.textContent = "Свяжитесь со специалистом или выберите подходящий центр.";
    if (ctaActions) {
      ctaActions.innerHTML =
        '<a href="#channels" class="btn btn--primary btn--lg">Связаться</a>' +
        '<a href="centers.html" class="btn btn--ghost btn--lg">Найти центр</a>';
    }
  }
})();
