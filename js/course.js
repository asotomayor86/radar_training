/* Curso de introducción al radar: ventana superpuesta al radar y al mapa.
   El contenido (sesiones y pasos) está en course_data.js y las figuras interactivas en course_figs.js. */
(function () {
  const T = window.RadarText;
  const SESSIONS = window.RadarCourseData.SESSIONS;
  const FIGS = window.RadarCourseFigs;

  class CourseUI {
    constructor(o) {
      this.view = o.view;
      this.select = o.select;
      this.openBtn = o.open;
      this.onPractice = o.onPractice;
      this.sIdx = 0;
      this.stepIdx = 0;
      this.fig = null;
      this.timer = 0;
      this.tx = T.course;

      this.select.setAttribute('aria-label', this.tx.session);
      this.openBtn.textContent = this.tx.open;
      this.select.innerHTML = SESSIONS.map((s, i) =>
        `<option value="${i}"${s.steps ? '' : ' disabled'}>${i + 1}. ${s.title}${s.steps ? '' : ' · ' + this.tx.soon}</option>`).join('');
      this.select.value = '0';
      this.openBtn.addEventListener('click', () => this.open(+this.select.value));
      window.addEventListener('resize', () => this.place());
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.place());
    }

    isOpen() { return !this.view.hidden; }

    open(i, step) {
      const s = SESSIONS[i];
      if (!s || !s.steps) return;
      this.sIdx = i;
      this.stepIdx = step || 0;
      this.view.hidden = false;
      this.view.parentElement.classList.add('course-on');
      this.render();
      this.place();
    }

    teardown() {
      if (this.fig) { this.fig.destroy(); this.fig = null; }
      clearInterval(this.timer);
    }

    close() {
      this.teardown();
      this.view.hidden = true;
      this.view.parentElement.classList.remove('course-on');
    }

    // Se superpone al radar y, si hay sitio, también al mapa; termina justo encima de la fila de controles
    place() {
      if (this.view.hidden) return;
      const app = this.view.parentElement;
      const ar = app.getBoundingClientRect();
      const sim = app.querySelector('.sim');
      const ddi = document.getElementById('ddi-root');
      const panel = app.querySelector('.panel');
      const row = document.getElementById('row-course');
      const dr = ddi.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      const sr = sim.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      const wide = pr.left > dr.right - 10;
      const left = sr.left - ar.left;
      const right = (wide ? pr.right : sr.right) - ar.left;
      const top = dr.top - ar.top;
      const bottom = rr.top - ar.top - 14;
      Object.assign(this.view.style, { left: left + 'px', top: top + 'px', width: right - left + 'px', height: Math.max(300, bottom - top) + 'px' });
      this.view.classList.toggle('narrow', right - left < 760);
    }

    controlHtml(c, val) {
      if (c.type === 'seg') {
        return `<div class="cv-ctl" data-id="${c.id}"><span>${c.label}</span><div class="cv-seg">${c.options.map((v) =>
          `<button type="button" data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${c.fmt ? c.fmt(v) : v}</button>`).join('')}</div></div>`;
      }
      if (c.type === 'toggle') return `<div class="cv-ctl" data-id="${c.id}"><span>${c.label}</span><button type="button" class="cv-tog" aria-pressed="${!!val}">${val ? 'SÍ' : 'NO'}</button></div>`;
      if (c.type === 'btn') return `<div class="cv-ctl cv-ctl-btn" data-id="${c.id}"><span>${c.label}</span><button type="button" class="cv-act">${c.btn || c.label}</button></div>`;
      return `<label class="cv-ctl" data-id="${c.id}"><span>${c.label}</span><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${val}"><output></output></label>`;
    }

    render() {
      this.teardown();
      const sess = SESSIONS[this.sIdx];
      const step = sess.steps[this.stepIdx];
      const n = sess.steps.length;
      const tx = this.tx;
      const ctls = step.ctls || [];
      this.view.innerHTML = `
        <div class="cv-head">
          <span class="cv-kicker">${tx.session} ${this.sIdx + 1} · ${this.stepIdx + 1}/${n}</span>
          <h2 class="cv-title">${sess.title}</h2>
          <button type="button" class="cv-close">${tx.close}</button>
        </div>
        <div class="cv-body">
          <div class="cv-fig">
            <div class="cv-figbox" id="cv-figbox"></div>
            <div class="cv-ctls" id="cv-ctls"></div>
            <div class="cv-read" id="cv-read"></div>
          </div>
          <div class="cv-text">
            <h3>${step.title}</h3>
            ${step.html}
            <div id="cv-done"></div>
          </div>
        </div>
        <div class="cv-foot">
          <button type="button" class="cv-prev"${this.stepIdx ? '' : ' disabled'}>‹ ${tx.prev}</button>
          <span class="cv-dots">${sess.steps.map((_, i) => `<i class="${i === this.stepIdx ? 'on' : ''}"></i>`).join('')}</span>
          ${step.end
            ? `<button type="button" class="cv-practice">${tx.practice}</button>`
            : `<button type="button" class="cv-next">${tx.next} ›</button>`}
        </div>`;
      const q = (s) => this.view.querySelector(s);
      q('.cv-close').addEventListener('click', () => this.close());
      q('.cv-prev').addEventListener('click', () => { this.stepIdx--; this.render(); });
      const nx = q('.cv-next');
      if (nx) nx.addEventListener('click', () => { this.stepIdx++; this.render(); });
      const pr = q('.cv-practice');
      if (pr) pr.addEventListener('click', () => { this.close(); if (this.onPractice) this.onPractice(sess.practice || 'facil'); });

      const spec = step.fig;
      const Fig = FIGS[spec.type];
      const fig = new Fig(q('#cv-figbox'), spec, () => refresh());
      this.fig = fig;
      // Valores iniciales de los mandos (si la figura no los tiene, los toma del paso)
      for (const c of ctls) if (c.type !== 'btn' && c.val !== undefined) fig.s[c.id] = c.val;
      if (spec.type === 'side') fig.targets[0].alt = fig.s.alt1;
      if (fig.applyInit) fig.applyInit();

      const box = q('#cv-ctls');
      const build = () => {
        box.innerHTML = ctls.map((c) => this.controlHtml(c, fig.s[c.id])).join('');
        for (const c of ctls) {
          const el = box.querySelector(`[data-id="${c.id}"]`);
          if (c.type === 'seg') el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { const v = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; fig.set(c.id, v); refresh(); }));
          else if (c.type === 'toggle') el.querySelector('button').addEventListener('click', () => { fig.set(c.id, !fig.s[c.id]); refresh(); });
          else if (c.type === 'btn') el.querySelector('button').addEventListener('click', () => { fig.act(c.action); refresh(); });
          else el.querySelector('input').addEventListener('input', (e) => { fig.set(c.id, +e.target.value); refresh(); });
        }
      };

      const refresh = () => {
        for (const c of ctls) {
          const el = box.querySelector(`[data-id="${c.id}"]`);
          if (!el) continue;
          const v = fig.s[c.id];
          if (c.type === 'seg') el.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(b.dataset.v) === String(v)));
          else if (c.type === 'toggle') { const b = el.querySelector('button'); b.setAttribute('aria-pressed', String(!!v)); b.textContent = v ? 'SÍ' : 'NO'; }
          else if (c.type !== 'btn') {
            const inp = el.querySelector('input');
            if (+inp.value !== v) inp.value = v;
            const unit = c.unit === undefined ? '' : c.unit;
            el.querySelector('output').textContent = (c.signed && v > 0 ? '+' : '') + (c.step < 1 ? (+v).toFixed(1) : v) + unit;
          }
        }
        const r = fig.read();
        q('#cv-read').innerHTML = r.lines.map((l) => `<div>${l}</div>`).join('') +
          (r.chips.length ? `<div>${r.chips.map((c) => `<span class="cv-chip ${c.on ? 'on' : ''}">${c.t}</span>`).join('')}</div>` : '');
        const done = q('#cv-done');
        const html = step.doneFlag && fig.flags[step.doneFlag] ? step.done : '';
        if (done.innerHTML !== html) done.innerHTML = html;
      };
      build();
      refresh();
      this.timer = setInterval(refresh, 250);
    }
  }

  window.RadarCourse = { sessions: SESSIONS, UI: CourseUI };
})();
