// Center onboarding wizard — 5 steps, no backend
(function () {
  "use strict";

  const root = document.getElementById("wizardRoot");
  if (!root) return;

  const stepTitles = ["Профиль", "Программы", "Команда", "Проверка", "Готово"];
  const store = window.NSVStore;
  const api = window.NSV_API;
  const KEY = "onboarding:step";

  let step = (store && store.get(KEY, 0)) || 0;
  if (step < 0 || step > stepTitles.length - 1) step = 0;
  function persist() { if (store) store.set(KEY, step); }

  function stepper() {
    return `
      <ul class="wizard__steps">
        ${stepTitles
          .map((t, i) => {
            const cls = i < step ? "is-done" : i === step ? "is-active" : "";
            return `<li class="${cls}"><span class="wizard__dot">${i < step ? "✓" : i + 1}</span><span class="label">${t}</span>${i < stepTitles.length - 1 ? '<span class="wizard__line"></span>' : ""}</li>`;
          })
          .join("")}
      </ul>`;
  }

  function nav(prevLabel, nextLabel, nextTarget) {
    return `
      <div class="wizard__nav">
        <button class="btn btn--ghost" data-nav="prev"${step === 0 ? " style=\"visibility:hidden\"" : ""}>${prevLabel}</button>
        <button class="btn btn--primary" data-nav="next">${nextLabel}</button>
      </div>`;
  }

  const steps = [
    () => `
      <div class="wizard__card">
        <h2 class="wizard__title">Профиль центра</h2>
        <p class="wizard__sub">Основные данные, которые увидят пользователи.</p>
        <div class="form-grid">
          <div class="field field--full">
            <label>Название центра</label>
            <input type="text" placeholder="Например, Центр «Ясность»" value="" />
          </div>
          <div class="field">
            <label>Город</label>
            <input type="text" placeholder="Москва" />
          </div>
          <div class="field">
            <label>Телефон</label>
            <input type="tel" placeholder="+7 (___) ___-__-__" />
          </div>
          <div class="field field--full">
            <label>Краткое описание</label>
            <textarea placeholder="Чем занимается центр и какой подход используете"></textarea>
          </div>
        </div>
        ${nav("Назад", "Далее")}
      </div>`,

    () => `
      <div class="wizard__card">
        <h2 class="wizard__title">Программы восстановления</h2>
        <p class="wizard__sub">Выберите форматы помощи, которые вы предоставляете.</p>
        <div class="choice-grid">
          <label class="choice"><input type="checkbox" checked /><span>Стационар</span></label>
          <label class="choice"><input type="checkbox" checked /><span>Амбулаторно</span></label>
          <label class="choice"><input type="checkbox" /><span>Онлайн-сопровождение</span></label>
          <label class="choice"><input type="checkbox" /><span>Работа с семьёй</span></label>
        </div>
        <div class="form-grid" style="margin-top:18px">
          <div class="field">
            <label>Количество мест</label>
            <input type="number" placeholder="24" />
          </div>
          <div class="field">
            <label>Средняя длительность</label>
            <input type="text" placeholder="от 30 дней" />
          </div>
        </div>
        ${nav("Назад", "Далее")}
      </div>`,

    () => `
      <div class="wizard__card">
        <h2 class="wizard__title">Команда и специалисты</h2>
        <p class="wizard__sub">Пригласите сотрудников — можно сделать это и позже.</p>
        <div class="form-grid">
          <div class="field">
            <label>Имя сотрудника</label>
            <input type="text" placeholder="Анна Петрова" />
          </div>
          <div class="field">
            <label>Роль</label>
            <select>
              <option>Администратор</option>
              <option>Психолог</option>
              <option>Куратор</option>
              <option>Врач</option>
            </select>
          </div>
          <div class="field field--full">
            <label>Email для приглашения</label>
            <input type="email" placeholder="colleague@center.ru" />
          </div>
        </div>
        <p class="field__hint" style="margin-top:14px">Вы сможете добавить неограниченное число сотрудников в кабинете.</p>
        ${nav("Назад", "Далее")}
      </div>`,

    () => `
      <div class="wizard__card">
        <h2 class="wizard__title">Проверка данных</h2>
        <p class="wizard__sub">Загрузите документы — верификация подтверждает надёжность центра.</p>
        <div class="form-grid">
          <div class="field field--full">
            <label>Лицензия / документы</label>
            <input type="text" placeholder="Прикрепите файл или укажите номер лицензии" />
            <span class="field__hint">PDF, JPG или PNG до 10 МБ.</span>
          </div>
          <div class="field field--full">
            <label>Юридическое название</label>
            <input type="text" placeholder="ООО «Название»" />
          </div>
        </div>
        <label class="choice field--full" style="margin-top:16px">
          <input type="checkbox" checked /><span>Согласен с условиями и политикой обработки данных</span>
        </label>
        ${nav("Назад", "Отправить на проверку")}
      </div>`,

    () => `
      <div class="wizard__card wizard__result">
        <span class="result-badge">Заявка отправлена</span>
        <h3>Центр зарегистрирован</h3>
        <p>Данные приняты на проверку — обычно она занимает до 2 рабочих дней. А пока можно настроить кабинет и добавить программы.</p>
        <div class="wizard__result-actions">
          <a href="dashboard.html" class="btn btn--primary btn--lg">Перейти в кабинет</a>
          <a href="profile.html" class="btn btn--ghost btn--lg">Открыть профиль</a>
        </div>
      </div>`
  ];

  const SUBMIT_STEP = 3; // "Проверка" → отправка на проверку

  function goTo(next) {
    step = Math.max(0, Math.min(steps.length - 1, next));
    persist();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    root.innerHTML = stepper() + steps[step]();

    const prev = root.querySelector('[data-nav="prev"]');
    const next = root.querySelector('[data-nav="next"]');
    if (prev) prev.addEventListener("click", () => goTo(step - 1));
    if (next) {
      next.addEventListener("click", () => {
        if (step === SUBMIT_STEP) {
          if (window.NSVSetLoading) window.NSVSetLoading(next, true);
          (api ? api.registerCenter({}) : Promise.resolve({ ok: true })).then(() => {
            if (window.NSVSetLoading) window.NSVSetLoading(next, false);
            if (window.toast) window.toast("Заявка на подключение отправлена", { type: "success" });
            goTo(step + 1);
          });
        } else {
          goTo(step + 1);
        }
      });
    }
  }

  render();
})();
