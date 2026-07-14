// Association membership — status, admin comments, application submit (center scope).
(function () {
  "use strict";

  const api = window.NSV_API;
  const labels = (window.NSV_DATA && window.NSV_DATA.ASSOCIATION_STATUS) || {};

  const HINTS = {
    draft: "Центр ещё не подал заявку на вступление. Заполните анкету справа.",
    submitted: "Заявка отправлена и ожидает рассмотрения администратором Ассоциации.",
    under_review: "Заявка на проверке. Мы можем запросить уточнения.",
    needs_changes: "Требуются правки — посмотрите комментарий администратора и отправьте анкету повторно.",
    approved: "Центр принят в Ассоциацию и отображается в публичном каталоге.",
    rejected: "Заявка отклонена. Вы можете обратиться к администратору за разъяснениями.",
    suspended: "Участие временно приостановлено. Свяжитесь с администратором Ассоциации.",
  };

  function renderStatus(status) {
    const l = labels[status] || { label: status || "—", cls: "new" };
    const badge = document.getElementById("assocBadge");
    if (badge) badge.innerHTML = `<span class="pill pill--${l.cls}" style="font-size:14px">${l.label}</span>`;
    const hint = document.getElementById("assocHint");
    if (hint) hint.textContent = HINTS[status] || "";
    const side = document.getElementById("assocStatus");
    if (side) side.innerHTML = `<span class="dot"></span> ${l.label}`;
  }

  function renderHistory(application) {
    const list = document.getElementById("assocHistory");
    if (!list) return;
    const items = [];
    if (application) {
      if (application.submitted_at)
        items.push({ time: application.submitted_at.slice(0, 10), text: "Заявка отправлена на рассмотрение" });
      if (application.comment_from_center)
        items.push({ time: "", text: "Комментарий центра: " + application.comment_from_center });
      if (application.reviewed_at)
        items.push({ time: application.reviewed_at.slice(0, 10), text: "Заявка рассмотрена администратором" });
      if (application.comment_from_admin)
        items.push({ time: "", text: "Комментарий администратора: " + application.comment_from_admin });
    }
    if (!items.length) items.push({ time: "", text: "Пока нет событий по заявке." });
    list.innerHTML = items
      .map((e) => `<li><div class="timeline__time">${e.time}</div><div class="timeline__text">${e.text}</div></li>`)
      .join("");
  }

  function fillForm(application) {
    if (!application) return;
    ["legal_name", "inn", "ogrn", "director_name", "comment_from_center"].forEach((k) => {
      const el = document.getElementById(k);
      if (el && application[k]) el.value = application[k];
    });
  }

  const form = document.getElementById("assocForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const submitBtn = form.querySelector('[type="submit"]');
      const payload = Object.fromEntries(new FormData(form).entries());
      if (window.NSVSetLoading) window.NSVSetLoading(submitBtn, true);
      try {
        if (api && api.ensureCenterSession) await api.ensureCenterSession();
        const res = api ? await api.submitAssociation(payload) : { association_status: "submitted" };
        renderStatus(res.association_status || "submitted");
        renderHistory(res.application || payload);
        if (window.toast) window.toast("Заявка отправлена на рассмотрение", { type: "success" });
      } catch {
        if (window.toast) window.toast("Не удалось отправить заявку", { type: "error" });
      } finally {
        if (window.NSVSetLoading) window.NSVSetLoading(submitBtn, false);
      }
    });
  }

  async function init() {
    try {
      if (api && api.ensureCenterSession) await api.ensureCenterSession();
      const res = api ? await api.getAssociation() : null;
      const status = (res && res.association_status) || "draft";
      renderStatus(status);
      renderHistory(res && res.application);
      fillForm(res && res.application);
    } catch {
      renderStatus("draft");
      renderHistory(null);
    }
  }

  init();
})();
