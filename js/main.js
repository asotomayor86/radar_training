/* Arranque: une simulación, pantalla, teclado y panel lateral. */
(function () {
  const C = window.RadarConfig;
  const T = window.RadarText;
  const sim = new window.RadarSim();
  const $ = (id) => document.getElementById(id);

  // ---- Panel lateral ----
  document.title = T.tab;
  $('kicker').textContent = T.brand.kicker;
  $('back').textContent = T.brand.back;

  // Tema claro/oscuro (misma clave 'theme' que el Hangar)
  const themeBtn = $('theme-toggle');
  const paintTheme = () => {
    const light = document.documentElement.classList.contains('light');
    themeBtn.textContent = light ? T.brand.toDark : T.brand.toLight;
  };
  themeBtn.addEventListener('click', () => {
    const light = document.documentElement.classList.toggle('light');
    try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) { /* sin almacenamiento */ }
    paintTheme();
  });
  paintTheme();
  $('h-title').textContent = T.title;
  $('t-keys').textContent = T.ui.howTo;
  $('scenario').setAttribute('aria-label', T.ui.scenario);
  $('restart').textContent = T.ui.restart;
  $('keys').innerHTML = T.keys.map(([k, d]) => `<dt>${k}</dt><dd>${d}</dd>`).join('');

  const sel = $('scenario');
  sel.innerHTML = Object.entries(C.scenarios).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
  sel.addEventListener('change', () => sim.loadScenario(sel.value));
  $('restart').addEventListener('click', () => sim.loadScenario(sel.value));

  // CON AWACS / SIN AWACS: el texto del botón cambia con cada pulsación
  const awacsBtn = $('awacs');
  const paintAwacs = () => {
    awacsBtn.textContent = sim.awacs ? T.ui.withAwacs : T.ui.withoutAwacs;
    awacsBtn.setAttribute('aria-pressed', String(sim.awacs));
  };
  awacsBtn.addEventListener('click', () => { sim.awacs = !sim.awacs; paintAwacs(); });
  paintAwacs();

  // Mapa del instructor
  const mapCard = $('map-card');
  const instructorMap = new window.RadarMap($('map'), sim);
  let mapOn = true;
  function toggleMap() {
    mapOn = !mapOn;
    mapCard.classList.toggle('map-off', !mapOn);
  }

  // Altura del mapa: su tarjeta termina a la altura de la base del botón de reiniciar (solo en dos columnas)
  const mapEl = $('map');
  function fitMap() {
    mapEl.style.height = '';
    if (window.innerWidth <= 1120) return;
    const card = $('map-card');
    const cs = getComputedStyle(card);
    const extra = parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth);
    const h = $('restart').getBoundingClientRect().bottom - mapEl.getBoundingClientRect().top - extra;
    if (h > 240) mapEl.style.height = Math.round(h) + 'px';
  }
  window.addEventListener('resize', fitMap);
  // La fila del escenario puede cambiar de altura al cargar las fuentes: se vuelve a ajustar
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMap);
  window.addEventListener('load', fitMap);

  // Ventana flotante: explica el botón o mando bajo el cursor
  const tip = $('tip');
  let mx = 0;
  let my = 0;
  const placeTip = () => {
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let x = mx + 16;
    let y = my + 18;
    if (x + w > window.innerWidth - 8) x = mx - w - 16;
    if (y + h > window.innerHeight - 8) y = my - h - 14;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  };
  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; if (tip.classList.contains('on')) placeTip(); });
  const showHelp = (h) => {
    if (!h) { tip.classList.remove('on'); return; }
    tip.innerHTML = `<strong>${h.label}</strong>${h.text}`;
    placeTip();
    tip.classList.add('on');
  };

  const ddi = new window.RadarDDI($('ddi-root'), sim, showHelp);
  awacsBtn.addEventListener('mouseenter', () => showHelp({ label: 'AWACS', text: T.ui.awacsHelp }));
  awacsBtn.addEventListener('mouseleave', () => showHelp(null));


  // ---- Teclado ----
  const keys = new Set();
  let enterDownAt = null;
  const GAME = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Escape'];
  const norm = (k) => (k.length === 1 ? k.toLowerCase() : k);

  window.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'SELECT' || (tag === 'BUTTON' && (e.key === 'Enter' || e.key === ' '))) return;
    if (GAME.includes(e.key)) e.preventDefault();
    if (e.repeat) return;
    const k = norm(e.key);
    keys.add(k);
    if (k === 'Enter' || k === ' ') enterDownAt = performance.now();
    if (k === 'Escape' || k === 'Backspace') sim.undesignate();
    if (k === 'x') ddi.aacq();
    if (k === 'm') toggleMap();
  });
  window.addEventListener('keyup', (e) => {
    const k = norm(e.key);
    keys.delete(k);
    if ((k === 'Enter' || k === ' ') && enterDownAt !== null) {
      // TDC depress: pulsación larga en zona vacía = SPOT
      const long = (performance.now() - enterDownAt) / 1000 >= C.tdc.spotHoldS;
      enterDownAt = null;
      ddi.designate(long);
    }
  });
  window.addEventListener('blur', () => { keys.clear(); enterDownAt = null; });

  function readKeys(dt) {
    const r = sim.radar;
    if (r.mode !== 'STT') {
      const dx = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
      const dy = (keys.has('ArrowUp') ? 1 : 0) - (keys.has('ArrowDown') ? 1 : 0);
      const H = C.display.azHalfView;
      r.tdc.az = Math.max(-H, Math.min(H, r.tdc.az + dx * C.tdc.azRateDegS * dt));
      r.tdc.rng = Math.max(0, Math.min(1, r.tdc.rng + dy * C.tdc.rngRatePerS * dt));
      ddi.addElev(((keys.has('w') ? 1 : 0) - (keys.has('s') ? 1 : 0)) * C.antenna.elevRateDegS * dt);
    }
    sim.own.turn = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
  }

  // ---- Bucle ----
  const statusEl = $('status');
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    readKeys(dt);
    sim.update(dt);
    ddi.render();
    if (mapOn) instructorMap.render();

    const r = sim.radar;
    statusEl.innerHTML =
      `${T.ui.heading}: <b>${String(Math.round((sim.own.hdg + 360) % 360)).padStart(3, '0')}°</b> · ` +
      `${T.ui.range}: <b>${sim.scale} NM</b> · ` +
      `${T.ui.antenna}: <b>${r.antAz.toFixed(0)}°</b> · ` +
      `${T.ui.elev}: <b>${r.elev.toFixed(1)}°</b>`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.__radar = { sim, ddi, instructorMap }; // para depurar desde la consola
})();
