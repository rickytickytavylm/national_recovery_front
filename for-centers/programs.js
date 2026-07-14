// Center programs — renders program list and capacity KPIs from mock data.
(function () {
  "use strict";

  const data = (window.NSV_DATA && window.NSV_DATA.centerPrograms) || [];
  const body = document.getElementById("programsBody");
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  const STATUS = {
    active: { label: "Активна", cls: "done" },
    draft: { label: "Черновик", cls: "work" },
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function updateKpis() {
    const seats = data.reduce((s, p) => s + (p.seats || 0), 0);
    const taken = data.reduce((s, p) => s + (p.taken || 0), 0);
    set("kpiProg", data.length);
    set("kpiSeats", seats);
    set("kpiTaken", taken);
    set("kpiFree", Math.max(0, seats - taken));
    set("progCount", data.length + " программ");
  }

  function render() {
    if (!body) return;
    if (!data.length) {
      body.innerHTML = '<tr><td colspan="6"><p class="empty-state">Программы пока не добавлены.</p></td></tr>';
      return;
    }
    body.innerHTML = data
      .map((p) => {
        const st = STATUS[p.status] || STATUS.active;
        const pct = p.seats ? Math.round((p.taken / p.seats) * 100) : 0;
        return `
        <tr>
          <td>
            <span class="table__name">${esc(p.name)}</span><br>
            <span class="table__meta">${esc(p.desc)}</span>
          </td>
          <td>${esc(p.format)}</td>
          <td class="table__meta">${esc(p.duration)}</td>
          <td>
            <span class="table__name">${p.taken} / ${p.seats}</span><br>
            <span class="prog-meter" aria-hidden="true"><span style="width:${pct}%"></span></span>
          </td>
          <td><span class="pill pill--${st.cls}">${st.label}</span></td>
          <td>
            <button type="button" class="table__action" data-soon="Редактирование программы появится в полной версии">Изменить</button>
          </td>
        </tr>`;
      })
      .join("");
  }

  updateKpis();
  render();
})();
