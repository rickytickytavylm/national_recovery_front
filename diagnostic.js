// Mini-diagnostic quiz — no backend, fake but realistic scoring
(function () {
  "use strict";

  const root = document.getElementById("quizRoot");
  if (!root) return;

  const questions = [
    {
      q: "Кого касается ситуация?",
      options: [
        { t: "Меня самого", s: 1 },
        { t: "Близкого человека", s: 1 },
        { t: "Пока просто хочу разобраться", s: 0 }
      ]
    },
    {
      q: "Как часто возникает тяга или желание употребить?",
      options: [
        { t: "Почти каждый день", s: 3 },
        { t: "Несколько раз в неделю", s: 2 },
        { t: "Изредка", s: 1 },
        { t: "Сложно ответить", s: 1 }
      ]
    },
    {
      q: "Получается ли контролировать количество?",
      options: [
        { t: "Практически нет", s: 3 },
        { t: "Иногда срываюсь", s: 2 },
        { t: "В основном да", s: 1 }
      ]
    },
    {
      q: "Влияет ли это на работу, учёбу или отношения?",
      options: [
        { t: "Сильно влияет", s: 3 },
        { t: "Периодически", s: 2 },
        { t: "Почти не влияет", s: 0 }
      ]
    },
    {
      q: "Были ли попытки прекратить самостоятельно?",
      options: [
        { t: "Да, но безуспешно", s: 3 },
        { t: "Да, с переменным успехом", s: 2 },
        { t: "Пока не пробовал(а)", s: 1 }
      ]
    },
    {
      q: "Готовы ли вы сделать первый шаг сейчас?",
      options: [
        { t: "Да, нужна помощь", s: 2 },
        { t: "Хочу больше информации", s: 1 },
        { t: "Пока сомневаюсь", s: 1 }
      ]
    }
  ];

  const results = [
    {
      max: 5,
      badge: "Низкий уровень риска",
      title: "Ситуация под контролем — но внимание не будет лишним",
      text: "Явных признаков зависимости немного. Рекомендуем познакомиться с материалами и сохранить контакты поддержки на будущее.",
      primary: { t: "Смотреть материалы", href: "materials.html" },
      secondary: { t: "На главную", href: "index.html" }
    },
    {
      max: 11,
      badge: "Средний уровень риска",
      title: "Стоит поговорить со специалистом",
      text: "Есть признаки, которые важно обсудить. Бесплатная консультация поможет понять ситуацию точнее и выбрать формат помощи.",
      primary: { t: "Получить консультацию", href: "help.html" },
      secondary: { t: "Найти центр", href: "centers.html" }
    },
    {
      max: 100,
      badge: "Высокий уровень риска",
      title: "Рекомендуем обратиться за помощью",
      text: "Ответы указывают на выраженные трудности. Не откладывайте — специалисты помогут подобрать программу и центр.",
      primary: { t: "Получить помощь", href: "help.html" },
      secondary: { t: "Найти центр", href: "centers.html" }
    }
  ];

  const store = window.NSVStore;
  const KEY = "diagnostic:progress";
  const savedState = (store && store.get(KEY, null)) || null;

  let answers = savedState && Array.isArray(savedState.answers)
    ? savedState.answers.slice(0, questions.length)
    : new Array(questions.length).fill(null);
  while (answers.length < questions.length) answers.push(null);

  let completed = !!(savedState && savedState.completed);
  let current = completed ? questions.length : (savedState && savedState.current) || 0;

  function persist() { if (store) store.set(KEY, { answers, current, completed }); }

  function render() {
    if (completed || current >= questions.length) return renderResult();

    const q = questions[current];
    const pct = Math.round((current / questions.length) * 100);

    root.innerHTML = `
      <div class="quiz__progress"><div class="quiz__progress-bar" style="width:${pct}%"></div></div>
      <div class="quiz__meta"><span>Вопрос ${current + 1} из ${questions.length}</span><span>${pct}%</span></div>
      <div class="quiz__card">
        <h2 class="quiz__question">${q.q}</h2>
        <div class="quiz__options">
          ${q.options
            .map(
              (o, i) =>
                `<button class="quiz__option${answers[current] === i ? " is-selected" : ""}" data-i="${i}">
                   <span class="dot-radio"></span><span>${o.t}</span>
                 </button>`
            )
            .join("")}
        </div>
        <div class="quiz__nav">
          <button class="btn btn--ghost" data-nav="prev"${current === 0 ? " style=\"visibility:hidden\"" : ""}>Назад</button>
          <button class="btn btn--primary" data-nav="next"${answers[current] === null ? " disabled style=\"opacity:.5;pointer-events:none\"" : ""}>
            ${current === questions.length - 1 ? "Показать результат" : "Далее"}
          </button>
        </div>
      </div>`;

    root.querySelectorAll(".quiz__option").forEach((btn) =>
      btn.addEventListener("click", () => {
        answers[current] = Number(btn.dataset.i);
        persist();
        render();
      })
    );
    root.querySelector('[data-nav="prev"]').addEventListener("click", () => {
      if (current > 0) current--;
      persist();
      render();
    });
    const next = root.querySelector('[data-nav="next"]');
    if (next) next.addEventListener("click", () => { current++; persist(); render(); });
  }

  function renderResult() {
    const score = answers.reduce((sum, ans, i) => sum + (ans === null ? 0 : questions[i].options[ans].s), 0);
    const res = results.find((r) => score <= r.max) || results[results.length - 1];

    completed = true;
    current = questions.length;
    persist();

    // Отправляем результат на backend (не блокируя UI; при ошибке — тихо)
    if (window.NSV_API && window.NSV_API.submitDiagnostic) {
      const sid = (store && store.get("diagnostic:session", null)) || "s-" + Date.now();
      if (store) store.set("diagnostic:session", sid);
      window.NSV_API
        .submitDiagnostic({ score, answers: answers.slice(), session_id: sid })
        .catch(function () {});
    }

    root.innerHTML = `
      <div class="quiz__progress"><div class="quiz__progress-bar" style="width:100%"></div></div>
      <div class="quiz__meta"><span>Готово · результат сохранён</span><span>100%</span></div>
      <div class="quiz__card quiz__result">
        <span class="result-badge">${res.badge}</span>
        <h3>${res.title}</h3>
        <p>${res.text}</p>
        <div class="quiz__result-actions">
          <a href="${res.primary.href}" class="btn btn--primary btn--lg">${res.primary.t}</a>
          <a href="${res.secondary.href}" class="btn btn--ghost btn--lg">${res.secondary.t}</a>
        </div>
        <div style="margin-top:24px">
          <button class="linkish link-arrow" id="restart">Пройти заново</button>
        </div>
      </div>`;

    document.getElementById("restart").addEventListener("click", () => {
      completed = false;
      current = 0;
      answers = new Array(questions.length).fill(null);
      persist();
      if (window.toast) window.toast("Диагностика сброшена", { type: "info" });
      render();
    });
  }

  render();
})();
