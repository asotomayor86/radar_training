/*
 * Pantalla DDI: marco con 20 botones (OSB) y página RDR ATTK dibujada en canvas.
 * Disposición de botones y símbolos según la Guía de Chuck del F/A-18C.
 */
(function () {
  const C = window.RadarConfig;
  const T = window.RadarText;
  T.plates = T.plates || { curso: 'CURSO', ejercicios: 'EJERCICIOS', cursoHelp: '', ejerciciosHelp: '' };
  C.links = C.links || { curso: '', ejercicios: '' };
  const W = 480;
  const P = { l: 44, r: 424, t: 52, b: 420 };   // marco del B-scope dentro del canvas (medido en el DDI real)
  const STRIP = P.t + 22;                         // línea inferior de la tira de azimut
  const GREEN = '#46ff72';
  const DIM = 'rgba(70,255,114,0.45)';
  const YELLOW = '#ffe14d';
  const RED = '#ff5050';
  const MONO = 'ui-monospace, Consolas, monospace';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad3 = (n) => String(Math.round(((n % 360) + 360) % 360)).padStart(3, '0');

  // Posiciones de los botones medidas en la vista frontal del DDI (fracción de la pantalla, 432 x 432 unidades):
  // la fila superior e inferior va centrada; los laterales van algo más bajos que el centro de la pantalla.
  const FH = [0.155, 0.3275, 0.5, 0.6725, 0.845];   // arriba y abajo (de izquierda a derecha)
  const FV = [0.19, 0.363, 0.535, 0.708, 0.881];     // laterales (de arriba abajo)
  // Numeración real de los OSB: 1-5 arriba (izq→der), 6-10 derecha (arriba→abajo),
  // 11-15 abajo (der→izq), 16-20 izquierda (abajo→arriba)
  function osbPos(n) {
    if (n <= 5) return { side: 'top', f: FH[n - 1] };
    if (n <= 10) return { side: 'right', f: FV[n - 6] };
    if (n <= 15) return { side: 'bottom', f: FH[4 - (n - 11)] };
    return { side: 'left', f: FV[4 - (n - 16)] };
  }
  // Lienzo del DDI: 600 x 654 unidades; pantalla 432 x 432 en (84, 139)
  const SCR = { x: 84, y: 139, s: 432 };
  const CH = 654;
  const pctX = (f) => ((SCR.x + f * SCR.s) / 600) * 100;
  const pctY = (f) => ((SCR.y + f * SCR.s) / CH) * 100;

  // Carcasa biselada del DDI (lienzo 600 x 654, medida en la vista frontal): tejado plano con flancos
  // diagonales a ~41°, placa del selector (sin fondo distinto: es el mismo color que la carcasa), alojamientos de
  // los 20 botones, placas de BRT/CONT y tornillos. Todo lo que queda por debajo de la placa va 14 unidades más bajo
  // que en el plano para que el selector no se monte sobre la fila superior de botones.
  function housingSvg() {
    const wells = [];
    for (const f of FH) { const x = SCR.x + f * SCR.s; wells.push([x, 103.3]); wells.push([x, 607]); }
    for (const f of FV) { const y = SCR.y + f * SCR.s; wells.push([42, y]); wells.push([558, y]); }
    const w = wells.map(([x, y]) => `<rect x="${(x - 23).toFixed(1)}" y="${(y - 23).toFixed(1)}" width="46" height="46" rx="7" fill="#08090a" stroke="rgba(255,255,255,.07)" stroke-width="1"/>`).join('');
    const screw = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#0a0a0b" stroke="#5f636b" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="3.6" fill="#15161a"/><path d="M${x - 2.8} ${y} H${x + 2.8}" stroke="#3a3d43" stroke-width="1.3"/><circle cx="${x - 1.8}" cy="${y - 1.8}" r="1.2" fill="rgba(255,255,255,.35)"/>`;
    // Placa alargada (en forma de pala) de cada mando, con el rótulo grabado; la punta redondeada queda en el lado
    // que se ve (derecha en BRT, izquierda en CONT)
    const leg = (x0, x1, round) => {
      const d = round === 'right'
        ? `M${x0} 580 H${x1 - 13} Q${x1} 580 ${x1} 594 Q${x1} 608 ${x1 - 13} 608 H${x0}Z`
        : `M${x1} 580 H${x0 + 13} Q${x0} 580 ${x0} 594 Q${x0} 608 ${x0 + 13} 608 H${x1}Z`;
      return `<path d="${d}" fill="#090a0c" stroke="rgba(255,255,255,.14)" stroke-width="1.2"/>`;
    };
    return `<svg class="hsvg" viewBox="0 0 600 ${CH}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="hs-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34363c"/><stop offset=".22" stop-color="#232529"/><stop offset=".6" stop-color="#1a1b1e"/><stop offset="1" stop-color="#1d1e22"/></linearGradient>
        <linearGradient id="hs-flank" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.10)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></linearGradient>
      </defs>
      <path d="M187 0H413L597 174V632Q597 654 575 654H25Q3 654 3 632V174Z" fill="#0a0b0c"/>
      <path d="M190 5H410L592 177V630Q592 649 573 649H27Q8 649 8 630V177Z" fill="url(#hs-face)"/>
      <path d="M190 5H410L592 177V304H8V177Z" fill="url(#hs-flank)" opacity=".5"/>
      <path d="M196 13H404L583 182M196 13L17 182" fill="none" stroke="rgba(0,0,0,.65)" stroke-width="1.8"/>
      <path d="M196 15H404L582 183M196 15L18 183" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
      <path d="M8 630Q8 649 27 649H573Q592 649 592 630" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1.2"/>
      <path d="M220 4V46Q220 58 232 58H369Q381 58 381 46V4" fill="none" stroke="rgba(255,255,255,.11)" stroke-width="1.3"/>
      ${w}${leg(30, 119, 'right')}${leg(481, 570, 'left')}
      ${screw(164, 42)}${screw(437, 42)}${screw(24, 408)}${screw(576, 408)}${screw(76, 630)}${screw(524, 630)}
      <path d="M272 9h19l7 6M328 9h-19l-7 6M266 20h12l4 3" fill="none" stroke="#dcdcd4" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  // Botón triangular de una esquina, CONTINUO con el marco: rellena el hueco de la esquina y también la franja oscura del
  // chaflán, con el mismo gris y degradado que la carcasa, y su contorno exterior coincide con el del marco (borde oscuro
  // de 5 unidades arriba y a los lados). El conjunto se ve como un rectángulo; la ranura del bisel queda como detalle de la
  // superficie. El de la derecha es el espejo del izquierdo. Coordenadas: lienzo del DDI (600 x 654).
  function plateSvg(side, label) {
    const m = (x) => (side === 'r' ? 190 - x : x);
    const P = (pts) => pts.map(([x, y]) => `${m(x)},${y}`).join(' ');
    // Esquina exterior redondeada con el mismo radio que las de abajo (22 el contorno, 19 la superficie)
    const rim = `M${m(25)} 0 H${m(190)} V5 L${m(8)} 177 H${m(3)} V22 Q${m(3)} 0 ${m(25)} 0 Z`;     // borde oscuro exterior (arriba, lateral y chaflán)
    const face = `M${m(27)} 5 H${m(190)} L${m(8)} 177 V24 Q${m(8)} 5 ${m(27)} 5 Z`;                  // superficie, hasta el antiguo chaflán
    return `<svg viewBox="0 0 190 177" aria-hidden="true">
      <defs><linearGradient id="pg-${side}" gradientUnits="userSpaceOnUse" x1="0" y1="5" x2="0" y2="649">
        <stop offset="0" stop-color="#1b1c20"/><stop offset=".22" stop-color="#131417"/><stop offset=".6" stop-color="#0e0f11"/><stop offset="1" stop-color="#101113"/></linearGradient>
        <linearGradient id="bv-${side}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d96b"/><stop offset=".5" stop-color="#c9a84c"/><stop offset="1" stop-color="#7d651d"/></linearGradient>
        <linearGradient id="pl-${side}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17181b"/><stop offset="1" stop-color="#0c0d0f"/></linearGradient></defs>
      <path d="${rim}" fill="#0a0b0c"/>
      <path class="tri-face" d="${face}" fill="url(#pg-${side})"/>
      <line class="tri-edge" x1="${m(190)}" y1="5" x2="${m(8)}" y2="177" stroke="transparent" stroke-width="2" stroke-linecap="round"/>
      <g class="tri-label" transform="translate(${m(87)} 31)">
        <rect class="tri-box-out" rx="4" ry="4" fill="none" stroke="rgba(0,0,0,.75)" stroke-width="1.4"/>
        <rect class="tri-box" rx="3" ry="3" fill="url(#pl-${side})" stroke="url(#bv-${side})" stroke-width="1.8"/>
        <rect class="tri-box-in" rx="2" ry="2" fill="none" stroke="rgba(0,0,0,.65)" stroke-width="1"/>
        <text class="tri-text" text-anchor="middle" dominant-baseline="central">${label}</text>
      </g>
    </svg>`;
  }

  // Dimensiona la placa negra que rodea al texto de cada botón triangular según lo que mide el texto
  function fitPlates(root) {
    for (const g of root.querySelectorAll('.tri-label')) {
      const t = g.querySelector('.tri-text');
      let b;
      try { b = t.getBBox(); } catch (e) { continue; }
      if (!b.width) continue;
      const px = 9;
      const py = 5.5;
      // Rótulo pegado al lado exterior de la esquina: CURSO a la izquierda, EJERCICIOS a la derecha
      const cx = 26 + px + b.width / 2;
      g.setAttribute('transform', `translate(${g.closest('.plate-r') ? 190 - cx : cx} 31)`);
      const set = (el, inset) => {
        el.setAttribute('x', (-b.width / 2 - px + inset).toFixed(1));
        el.setAttribute('y', (-b.height / 2 - py + inset).toFixed(1));
        el.setAttribute('width', (b.width + 2 * px - 2 * inset).toFixed(1));
        el.setAttribute('height', (b.height + 2 * py - 2 * inset).toFixed(1));
      };
      set(g.querySelector('.tri-box-out'), -1.6);
      set(g.querySelector('.tri-box'), 0);
      set(g.querySelector('.tri-box-in'), 2);
    }
  }

  class DDI {
    constructor(root, sim, onHelp) {
      this.sim = sim;
      this.onHelp = onHelp || (() => {});
      this.build(root);
    }

    build(root) {
      root.innerHTML = `
        <div class="ddi">
          ${housingSvg()}
          <div class="pwr">
            <span class="pl pl-night">NIGHT</span><span class="pl pl-off">OFF</span><span class="pl pl-day">DAY</span>
            <div class="pknob"><i></i></div>
          </div>
          <button type="button" class="plate plate-l" data-plate="curso" aria-label="${T.plates.curso}">${plateSvg('l', T.plates.curso)}</button>
          <button type="button" class="plate plate-r" data-plate="ejercicios" aria-label="${T.plates.ejercicios}">${plateSvg('r', T.plates.ejercicios)}</button>
          <div class="screen"><canvas></canvas><div class="labels"></div><div class="glass"></div></div>
          <div class="knob knob-brt"><span class="kring"></span><span class="kbody"></span><span class="kcap"></span></div><span class="kl kl-brt">BRT</span>
          <div class="knob knob-cont"><span class="kring"></span><span class="kbody"></span><span class="kcap"></span></div><span class="kl kl-cont">CONT</span>
        </div>`;
      this.ddi = root.querySelector('.ddi');
      this.screen = root.querySelector('.screen');
      this.canvas = root.querySelector('canvas');
      this.labelsEl = root.querySelector('.labels');
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = W * dpr;
      this.canvas.height = W * dpr;
      this.ctx = this.canvas.getContext('2d');
      this.ctx.scale(dpr, dpr);

      // Botones físicos y ranuras decorativas entre ellos
      this.lbls = {};
      for (let n = 1; n <= 20; n++) {
        const { side, f } = osbPos(n);
        const horiz = side === 'top' || side === 'bottom';
        const b = document.createElement('button');
        b.className = `osb osb-${side}`;
        b.setAttribute('aria-label', `Botón ${n}`);
        b.style[horiz ? 'left' : 'top'] = (horiz ? pctX(f) : pctY(f)) + '%';
        b.innerHTML = '<i></i>';
        this.bind(b, n);
        this.ddi.appendChild(b);

        const l = document.createElement('div');
        l.className = `lbl lbl-${side}`;
        l.style[horiz ? 'left' : 'top'] = f * 100 + '%';
        this.bind(l, n);
        this.labelsEl.appendChild(l);
        this.lbls[n] = l;
      }
      // Ranuras (píldoras) entre botones: a mitad de camino entre cada par
      for (const side of ['top', 'right', 'bottom', 'left']) {
        const horiz = side === 'top' || side === 'bottom';
        const F = horiz ? FH : FV;
        for (let i = 0; i < 4; i++) {
          const d = document.createElement('div');
          d.className = `slot slot-${side}`;
          d.style[horiz ? 'left' : 'top'] = (horiz ? pctX((F[i] + F[i + 1]) / 2) : pctY((F[i] + F[i + 1]) / 2)) + '%';
          this.ddi.appendChild(d);
        }
      }

      this.setupControls();
      fitPlates(this.ddi);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitPlates(this.ddi));
      window.addEventListener('load', () => fitPlates(this.ddi));

      for (const b of this.ddi.querySelectorAll('.plate')) {
        const key = b.dataset.plate;
        b.addEventListener('mouseenter', () => this.onHelp({ label: T.plates[key], text: T.plates[key + 'Help'] }));
        b.addEventListener('mouseleave', () => this.onHelp(null));
        b.addEventListener('click', () => {
          const url = C.links[key];
          if (url) window.open(url, '_blank', 'noopener');
          else document.dispatchEvent(new CustomEvent('radar:plate', { detail: key }));
        });
      }

      // Ratón: un clic mueve el TDC al punto y lo pulsa (TDC depress); mantenido 0,8 s sobre zona vacía = SPOT
      let downAt = 0;
      this.canvas.addEventListener('mousedown', (e) => {
        if (this.sim.radar.mode === 'STT' || this.power === 'OFF') return;
        const p = this.toCanvas(e);
        this.setTdcFromPx(p.x, p.y);
        downAt = performance.now();
      });
      this.canvas.addEventListener('mouseup', () => {
        if (!downAt || this.power === 'OFF') return;
        const long = (performance.now() - downAt) / 1000 >= C.tdc.spotHoldS;
        downAt = 0;
        this.designate(long);
      });
      this.canvas.addEventListener('mouseleave', () => { downAt = 0; });
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.addElev(e.deltaY < 0 ? 2 : -2);
      }, { passive: false });
    }

    // Selector OFF/NIGHT/DAY y mandos BRT (brillo) y CONT (contraste)
    setupControls() {
      this.power = 'DAY';
      this.brt = 0.8;
      this.cont = 0.75;
      const q = (sel) => this.ddi.querySelector(sel);

      const pwr = q('.pwr');
      const hint = (el, key) => {
        el.addEventListener('mouseenter', () => this.onHelp({ label: T.bezel[key].name, text: T.bezel[key].text }));
        el.addEventListener('mouseleave', () => this.onHelp(null));
      };
      for (const [cls, state] of [['.pl-night', 'NIGHT'], ['.pl-off', 'OFF'], ['.pl-day', 'DAY']]) {
        q(cls).addEventListener('click', () => { this.power = state; this.applyLook(); });
      }
      q('.pknob').addEventListener('click', () => {
        this.power = { OFF: 'NIGHT', NIGHT: 'DAY', DAY: 'OFF' }[this.power];
        this.applyLook();
      });
      hint(pwr, 'pwr');

      // Mandos: arrastrar o rueda del ratón
      for (const [cls, key] of [['.knob-brt', 'brt'], ['.knob-cont', 'cont']]) {
        const el = q(cls);
        const add = (d) => { this[key] = clamp(this[key] + d, 0, 1); this.applyLook(); };
        el.addEventListener('wheel', (e) => { e.preventDefault(); add(e.deltaY < 0 ? 0.05 : -0.05); }, { passive: false });
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          el.setPointerCapture(e.pointerId);
          let lx = e.clientX;
          let ly = e.clientY;
          const move = (m) => { add(((m.clientX - lx) - (m.clientY - ly)) / 120); lx = m.clientX; ly = m.clientY; };
          const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); };
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerup', up);
        });
        hint(el, key);
      }
      this.applyLook();
    }

    // Aplica brillo, contraste y estado de encendido a la pantalla y a los mandos
    applyLook() {
      const off = this.power === 'OFF';
      const level = off ? 0 : (0.3 + 0.7 * this.brt) * (this.power === 'NIGHT' ? 0.5 : 1);
      const st = this.screen.style;
      st.setProperty('--lvl', level.toFixed(3));
      // Contraste bajo: el fondo deja de ser negro puro y se vela un poco
      st.setProperty('--haze', (off ? 0 : (1 - this.cont) * 0.13 * level).toFixed(3));
      this.screen.classList.toggle('off', off);
      const ang = { NIGHT: -40, OFF: -105, DAY: 40 }[this.power];
      this.ddi.querySelector('.pknob i').style.transform = `rotate(${ang}deg)`;
      this.ddi.querySelectorAll('.pl').forEach((e) => e.classList.remove('on'));
      this.ddi.querySelector('.pl-' + this.power.toLowerCase()).classList.add('on');
      // Las estrías del cuerpo azul giran con el mando (la tapa gris es lisa)
      this.ddi.querySelector('.knob-brt').style.setProperty('--ka', `${this.brt * 270}deg`);
      this.ddi.querySelector('.knob-cont').style.setProperty('--ka', `${this.cont * 270}deg`);
    }

    bind(el, n) {
      el.addEventListener('click', () => this.press(n));
      el.addEventListener('mouseenter', () => this.help(n));
      el.addEventListener('mouseleave', () => this.onHelp(null));
    }

    toCanvas(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * W };
    }

    // ---- geometría ----
    X(az) { const H = C.display.azHalfView; return P.l + ((az + H) / (2 * H)) * (P.r - P.l); }
    Y(f) { return P.b - f * (P.b - P.t); }
    yEl(e) { const mid = (STRIP + P.b) / 2; return mid - (e / C.antenna.elevMax) * ((P.b - STRIP) / 2); }

    setTdcFromPx(x, y) {
      const r = this.sim.radar;
      const H = C.display.azHalfView;
      r.tdc.az = clamp(((x - P.l) / (P.r - P.l)) * 2 * H - H, -H, H);
      r.tdc.rng = clamp((P.b - y) / (P.b - P.t), 0, 1);
    }

    // Elevación manual de la antena: bloqueada en STT y en TWS con centrado AUTO y L&S
    addElev(d) {
      const r = this.sim.radar;
      if (r.mode === 'STT' || (r.mode === 'TWS' && r.centering === 'AUTO' && r.ls != null)) return;
      r.elev = clamp(r.elev + d, C.antenna.elevMin, C.antenna.elevMax);
    }

    // Blanco más cercano al TDC (máx. 16 px)
    pick() {
      const s = this.sim;
      const tx = this.X(s.radar.tdc.az);
      const ty = this.Y(s.radar.tdc.rng);
      let best = null;
      let bd = 16;
      for (const c of s.displayContacts()) {
        const d = Math.hypot(this.X(c.az) - tx, this.Y(c.f) - ty);
        if (d < bd) { bd = d; best = c; }
      }
      return best;
    }

    designate(long) {
      const s = this.sim;
      if (s.radar.mode === 'STT') return;
      const best = this.pick();
      if (best) s.designate(best.id);
      else if (long) s.startSpot();
      else s.designate(null);
    }

    aacq() {
      const best = this.pick();
      this.sim.aacq(best ? best.id : null);
    }

    // ---- botones ----
    // Asignación medida en el DDI real (Guía de Chuck, págs. 39, 187, 205, 207, 216 y 225):
    //   arriba 1-5: barras, SIL, ERASE/HITS, (RAID en TWS), arma
    //   derecha 6-10: escala ↑, escala ↓, SET/AUTO-MAN, RSET, NCTR
    //   abajo 11-15: DATA, CHAN, (contador), azimut, MODE/EXP
    //   izquierda 16-20: PRF, RDR PRI, SURF, (vacío), selector de modo (RWS/TWS/RTS)
    osbs() {
      const s = this.sim;
      const r = s.radar;
      const stt = r.mode === 'STT';
      const tws = r.mode === 'TWS';
      const data = r.dataPage;
      const o = {};

      // En SCAN RAID no están disponibles barras, azimut, EXP, escala, centrado ni HITS; solo RAID y RTS
      const scanRaid = r.raid === 'scan';
      const raidBtn = { label: 'RAID', boxed: !!r.raid, help: 'raid', press: () => s.toggleRaid() };

      // Izquierda
      o[20] = stt || scanRaid
        ? { lines: [{ t: 'RTS' }, { t: r.searchMode }], help: 'rts', press: () => (scanRaid ? s.exitRaid() : s.breakLock()) }
        : { label: r.mode, help: 'modeSel', press: () => s.cycleMode() };
      const eff = s.effectivePrf(1);
      o[16] = { lines: r.prf === 'INTL' ? [{ t: eff }, { t: 'INTL' }] : [{ t: r.prf }], help: 'prf', press: () => s.cyclePrf() };
      if (data) {
        o[19] = { label: 'ECCM', vertical: true, boxed: r.eccm, help: 'eccm', press: () => { r.eccm = !r.eccm; } };
      } else {
        o[18] = { label: 'SURF', vertical: true, help: 'surf', press: () => s.say('SURF N/D', 1.6) };
        o[17] = { cols: ['RDR', 'PRI'], help: 'rdrpri' };
      }

      // Arriba
      if (!data && !stt && !scanRaid) o[1] = { label: `${r.bars}B ${r.bar + 1}`, help: 'bars', press: () => s.cycleBars() };
      o[2] = { label: 'SIL', boxed: r.sil, help: 'sil', press: () => s.setSil(!r.sil) };
      if (tws) {
        if (!scanRaid) o[3] = { label: 'HITS', boxed: r.hits, help: 'hits', press: () => { r.hits = !r.hits; } };
        o[4] = raidBtn;
      } else if (stt) {
        o[4] = raidBtn;
      } else if (!stt) {
        o[3] = { label: 'ERASE', help: 'erase', press: () => s.erase() };
      }
      // En la página DATA, el botón superior derecho es el AGE: solo muestra el número de segundos (según el vídeo del escuadrón)
      o[5] = data
        ? { label: String(s.ageS), help: 'age', press: () => s.cycleAge() }
        : stt
        ? { label: 'TWS', help: 'tws', press: () => s.sttToTws() }
        : { label: `${s.weapon.label} ${s.weapon.count}`, help: 'wpn', press: () => { const k = Object.keys(C.weapons); s.selectWeapon(k[(k.indexOf(r.weapon) + 1) % k.length]); } };

      // Derecha
      if (data) {
        o[7] = { cols: ['RAID', '1LOOK'], help: 'raidlook' };
        o[8] = { label: 'COLOR', vertical: true, boxed: r.color, help: 'color', press: () => { r.color = !r.color; } };
        o[9] = { label: 'MSI', vertical: true, boxed: r.msi, help: 'msi', press: () => { r.msi = !r.msi; } };
        o[10] = { label: 'LTWS', vertical: true, boxed: r.ltws, help: 'ltws', press: () => { if (r.mode === 'RWS') r.ltws = !r.ltws; } };
      } else {
        if (!scanRaid) o[6] = { label: '↑', help: 'rngUp', press: () => { r.rangeIdx = Math.min(r.rangeIdx + 1, C.display.ranges.length - 1); } };
        if (!scanRaid) o[7] = { label: '↓', help: 'rngDn', press: () => { r.rangeIdx = Math.max(r.rangeIdx - 1, 0); } };
        if (tws && !scanRaid) {
          o[8] = {
            lines: [{ t: 'AUTO', boxed: r.centering === 'AUTO' }, { t: 'MAN', boxed: r.centering === 'MAN' }, ...(r.centering === 'BIAS' ? [{ t: 'BIAS', boxed: true }] : [])],
            help: 'cntr', press: () => s.cycleCentering(),
          };
        } else if (!stt && !tws) {
          o[8] = { label: 'SET', vertical: true, help: 'set', press: () => s.setWpnConfig() };
        }
        o[9] = { label: 'RSET', vertical: true, help: 'rset', press: () => s.reset() };
        o[10] = { label: 'NCTR', vertical: true, boxed: r.nctr, help: 'nctr', press: () => { r.nctr = !r.nctr; r.nctrT = 0; } };
      }

      // Abajo
      o[11] = { label: 'DATA', boxed: data, help: 'data', press: () => { r.dataPage = !r.dataPage; } };
      o[12] = data
        ? { label: `DCLTR ${r.dcltr}`, boxed: true, help: 'dcltr', press: () => { r.dcltr = r.dcltr === 2 ? 1 : 2; } }
        : { label: 'CHAN', help: 'chan' };
      if (data) o[14] = { label: 'BRA', boxed: r.bra, help: 'bra', press: () => { r.bra = !r.bra; } };
      else if (!stt && !scanRaid) o[14] = { label: `${r.spot !== null ? C.display.spotAz : r.az}°`, help: 'az', press: () => s.cycleAz() };
      if (!scanRaid) o[15] = tws || stt ? { label: 'EXP', help: 'exp' } : { label: 'MODE', help: 'mode15' };
      return o;
    }

    press(n) {
      const o = this.osbs()[n];
      if (o && o.press) o.press();
    }

    help(n) {
      const o = this.osbs()[n];
      if (!o) return this.onHelp({ label: `OSB ${n}`, text: T.osb.none });
      const name = o.lines ? o.lines.map((l) => l.t).join(' ') : o.cols ? o.cols.join(' ') : o.label;
      this.onHelp({ label: name, text: T.osb[o.help] });
    }

    updateLabels() {
      const o = this.osbs();
      for (let n = 1; n <= 20; n++) {
        const it = o[n];
        const el = this.lbls[n];
        el.textContent = '';
        el.classList.toggle('boxed', !!(it && it.boxed));
        el.classList.toggle('vertical', !!(it && it.vertical));
        el.classList.toggle('vcols', !!(it && it.cols));
        if (!it) continue;
        if (it.cols) {
          el.classList.add('vcols');
          for (const w of it.cols) {
            const d = document.createElement('span');
            d.textContent = w;
            el.appendChild(d);
          }
        } else if (it.lines) {
          for (const l of it.lines) {
            const d = document.createElement('div');
            d.textContent = l.t;
            if (l.boxed) d.className = 'boxed';
            el.appendChild(d);
          }
        } else {
          el.textContent = it.label;
        }
      }
    }

    // ---- dibujo ----
    render() {
      if (this.power === 'OFF') return;
      this.updateLabels();
      const s = this.sim;
      const r = s.radar;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, W, W);
      ctx.font = `12px ${MONO}`;
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 1;
      ctx.strokeStyle = GREEN;
      ctx.fillStyle = GREEN;

      this.drawFrame();
      this.drawScales();

      const list = s.displayContacts();
      const hover = r.mode === 'STT' ? null : this.pick();

      // Orden: primero rótulos, líneas y círculo; los contactos van siempre encima de todo para verse bien
      this.drawTexts(list, hover);
      if (r.mode === 'TWS' || r.mode === 'RWS') this.drawLaunchZone(list);
      this.drawAseCircle(list);
      if (r.mode !== 'STT') this.drawTdc();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      ctx.font = `12px ${MONO}`;
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = GREEN;
      ctx.fillStyle = GREEN;
      for (const d of list) this.drawContact(d, hover && hover.id === d.id);
    }

    drawFrame() {
      const ctx = this.ctx;
      const s = this.sim;
      const r = s.radar;
      ctx.strokeStyle = GREEN;
      ctx.strokeRect(P.l, P.t, P.r - P.l, P.b - P.t);
      // Tira de azimut con marcas a ±30° y ±60°
      ctx.beginPath();
      ctx.moveTo(P.l, STRIP); ctx.lineTo(P.r, STRIP);
      for (const a of [-60, -30, 30, 60]) { ctx.moveTo(this.X(a), STRIP); ctx.lineTo(this.X(a), STRIP + 18); }
      ctx.stroke();
      // Rumbo propio arriba (el triángulo que había aquí no existe así en el radar real)
      const cx = this.X(0);
      ctx.textAlign = 'center';
      ctx.font = `12px ${MONO}`;
      ctx.fillText(pad3(s.own.hdg) + '°', cx, P.t - 11);
      // B-sweep: posición instantánea de la antena. En SCAN RAID queda congelado en el azimut del L&S (escala de 140°)
      const rv = s.raidView();
      const sweepAz = clamp(rv ? rv.azC : r.antAz, -70, 70);
      ctx.beginPath(); ctx.moveTo(this.X(sweepAz), P.t); ctx.lineTo(this.X(sweepAz), P.b); ctx.stroke();
    }

    drawScales() {
      const ctx = this.ctx;
      const s = this.sim;
      const r = s.radar;
      ctx.strokeStyle = GREEN;
      ctx.fillStyle = GREEN;
      // Marcas de distancia a 1/4, 1/2 y 3/4 (borde derecho)
      ctx.beginPath();
      for (const f of [0.25, 0.5, 0.75]) { ctx.moveTo(P.r - 30, this.Y(f)); ctx.lineTo(P.r, this.Y(f)); }
      // Marcas largas de abajo, como las de la tira de arriba (±30° y ±60°, y el centro)
      for (const a of [-60, -30, 0, 30, 60]) { ctx.moveTo(this.X(a), P.b); ctx.lineTo(this.X(a), P.b - 22); }
      // Marcas de elevación (borde izquierdo)
      for (let e = -60; e <= 60; e += 20) { ctx.moveTo(P.l, this.yEl(e)); ctx.lineTo(P.l + (e === 0 ? 14 : 6), this.yEl(e)); }
      ctx.stroke();
      // Cursor de elevación de la antena (flecha "←" con cola)
      // Indica la barra que se está barriendo (salta de barra en barra con cada barrido); en STT, la elevación del blanco
      const elNow = r.mode === 'STT' ? r.elev : s.barEl(r.bar);
      const y = this.yEl(clamp(elNow, -60, 60));
      ctx.beginPath();
      ctx.moveTo(P.l + 18, y); ctx.lineTo(P.l + 2, y);
      ctx.moveTo(P.l + 9, y - 6); ctx.lineTo(P.l + 2, y); ctx.lineTo(P.l + 9, y + 6);
      ctx.stroke();

      // Escala de distancia (con el rombo del control del TDC) y cero
      ctx.textAlign = 'left';
      const rvw = s.raidView();
      const top = rvw ? String(Math.round(rvw.rngC + C.raid.rangeNm / 2)) : r.mode === 'VS' ? String(C.display.vsMaxClosureKt) : String(s.scale);
      ctx.fillText(top, P.r + 4, P.t + 2);
      ctx.beginPath();
      const dx = P.r + 14; const dy = P.t - 20;
      ctx.moveTo(dx, dy - 5); ctx.lineTo(dx + 5, dy); ctx.lineTo(dx, dy + 5); ctx.lineTo(dx - 5, dy); ctx.closePath();
      ctx.stroke();
      ctx.fillText(rvw ? String(Math.max(0, Math.round(rvw.rngC - C.raid.rangeNm / 2))) : '0', P.r + 6, P.b - 6);
    }

    drawTexts(list, hover) {
      const ctx = this.ctx;
      const s = this.sim;
      const r = s.radar;
      ctx.fillStyle = GREEN;
      ctx.textBaseline = 'middle';
      // Estado del radar y canal (OPR / C11): informativo, no es un botón
      ctx.textAlign = 'left';
      ctx.font = `12px ${MONO}`;
      ctx.fillText(r.sil ? 'SIL' : (r.power || 'OPR'), 14, 30);
      ctx.fillText('C11', 14, 44);
      // Velocidad y Mach propios (abajo izquierda) y altitud (abajo derecha)
      ctx.textAlign = 'left';
      ctx.font = `11px ${MONO}`;
      const mach = s.own.speed / (661.47 * Math.sqrt((288.15 - 0.0019812 * Math.min(s.own.alt, 36089)) / 288.15));
      ctx.fillText(String(Math.round(s.own.speed)), P.l + 20, P.b + 12);
      ctx.fillText(mach.toFixed(2), P.l + 20, P.b + 24);
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(s.own.alt)), P.r - 2, P.b + 14);
      ctx.font = `12px ${MONO}`;

      if (r.bra && r.mode !== 'STT' && r.mode !== 'VS') {
        ctx.textAlign = 'left';
        ctx.fillText(`BRA ${pad3(s.own.hdg + r.tdc.az)}°/${(r.tdc.rng * s.scale).toFixed(1)}`, P.l + 22, P.b - 32);
      }

      // Velocidad de cierre del L&S (TWS) o del blanco fijado (STT): un «>» sobre el marco derecho a su distancia
      const lsd = list.find((q) => q.isLS && (q.style === 'hafu' || q.style === 'stt'));
      if (lsd && lsd.f >= 0 && lsd.f <= 1) {
        const ly = this.Y(lsd.f);
        ctx.beginPath(); ctx.moveTo(P.r - 7, ly - 5); ctx.lineTo(P.r, ly); ctx.lineTo(P.r - 7, ly + 5); ctx.stroke();
        ctx.textAlign = 'right';
        ctx.font = `11px ${MONO}`;
        ctx.fillText(String(Math.round(lsd.c.closure)), P.r - 11, ly);
        ctx.font = `12px ${MONO}`;
      }

      if (r.mode === 'STT' && list[0]) {
        const c = list[0].c;
        ctx.textAlign = 'left';
        ctx.fillText(pad3(c.hdg) + '°', P.l + 8, STRIP + 28);
        ctx.textAlign = 'center';
        ctx.fillText(`${pad3(s.own.hdg + c.az)}°/${c.rng.toFixed(1)}`, (P.l + P.r) / 2 - 10, P.b + 12);
        ctx.fillText(`#${String(100 + c.id).padStart(3, '0')}`, (P.l + P.r) / 2 - 10, P.b + 25);
      } else if (C.display.showHoverData && hover && !(r.mode === 'TWS' && hover.style === 'hafu')) {
        this.drawHoverBox(hover.c);
      }

      ctx.textAlign = 'center';
      if (r.sil || r.standby) {
        ctx.font = `bold 26px ${MONO}`;
        ctx.fillText(r.sil ? 'SIL' : 'STBY', (P.l + P.r) / 2, (P.t + P.b) / 2);
      }
      if (r.raid === 'scan') {
        ctx.font = `bold 13px ${MONO}`;
        ctx.fillText('SCAN RAID', (P.l + P.r) / 2, (P.t + P.b) / 2 + 40);
      }
      if (r.raid === 'sam') {
        ctx.font = `bold 13px ${MONO}`;
        ctx.fillText('RAID', (P.l + P.r) / 2, P.b - 24);
      }
      if (r.spot !== null) {
        ctx.font = `bold 13px ${MONO}`;
        ctx.fillText('SPOT', (P.l + P.r) / 2, STRIP + 30);
      }
      if (r.msgT > 0 && (r.msgT > 1 || Math.floor(r.msgT * 6) % 2 === 0)) {
        ctx.font = `bold 13px ${MONO}`;
        ctx.fillText(r.msg, (P.l + P.r) / 2, STRIP + 48);
      }
    }

    // Ayuda didáctica: datos del blanco bajo el cursor (no existe así en el avión real en RWS)
    drawHoverBox(c) {
      const ctx = this.ctx;
      const lines = [
        `RNG ${c.rng.toFixed(1)}`,
        `CLS ${Math.round(c.closure)}`,
        `ALT ${Math.round(c.alt / 100) * 100}`,
        `HDG ${pad3(c.hdg)}`,
      ];
      const x0 = P.r - 98;
      const y0 = P.b - lines.length * 13 - 40;
      ctx.font = `11px ${MONO}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(x0, y0, 92, lines.length * 13 + 6);
      ctx.strokeStyle = DIM;
      ctx.strokeRect(x0, y0, 92, lines.length * 13 + 6);
      ctx.fillStyle = GREEN;
      lines.forEach((t, i) => ctx.fillText(t, x0 + 6, y0 + 11 + i * 13));
      ctx.font = `12px ${MONO}`;
    }

    // Alcance de disparo del L&S y del DT2 (con LTWS o TWS): una barra vertical a su azimut, desde el alcance mínimo
    // hasta el máximo, con un travesaño largo en cada extremo y uno corto en el alcance sin escape. Si el blanco
    // está entre esas marcas, está dentro del alcance. Valores didácticos (ver weapons y launchZone en config.js)
    drawLaunchZone(list) {
      const ctx = this.ctx;
      const s = this.sim;
      if (s.radar.mode === 'RWS' && !s.radar.ltws) return;
      if (s.radar.raid === 'scan') return;
      for (const d of list) {
        if (!(d.isLS || d.isDT2) || !d.c) continue;
        const z = s.launchZone(d.c);
        const x = this.X(d.az);
        const yMax = this.Y(Math.min(z.rmax / s.scale, 1));
        const yMin = this.Y(Math.min(z.rmin / s.scale, 1));
        const yNe = this.Y(Math.min(z.rne / s.scale, 1));
        ctx.strokeStyle = GREEN;   // siempre verde, sea hostil o no el blanco
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, yMax); ctx.lineTo(x, yMin);
        ctx.moveTo(x - 8, yMax); ctx.lineTo(x + 8, yMax);
        ctx.moveTo(x - 8, yMin); ctx.lineTo(x + 8, yMin);
        ctx.moveTo(x - 8, yNe); ctx.lineTo(x + 8, yNe);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      ctx.strokeStyle = GREEN;
    }

    // Círculo del centro de la pantalla: siempre centrado; crece cuando el blanco (L&S, o el fijado en STT) está dentro
    // del alcance máximo del arma y se encoge cuando no lo está
    drawAseCircle(list) {
      const s = this.sim;
      const r = s.radar;
      const now = performance.now();
      const dt = this.aseT ? Math.min(0.1, (now - this.aseT) / 1000) : 0;
      this.aseT = now;
      const ls = r.raid === 'scan' || !(r.mode === 'TWS' || r.mode === 'STT' || (r.mode === 'RWS' && r.ltws))
        ? null : list.find((q) => q.isLS && q.c && (q.style === 'hafu' || q.style === 'stt'));
      if (!ls) { this.aseR = null; return; }
      const inRange = ls.c.rng <= s.launchZone(ls.c).rmax;
      const target = inRange ? C.ase.inRangePx : C.ase.outRangePx;
      // El radio cambia de forma continua hacia el tamaño que corresponde
      if (this.aseR == null) this.aseR = target;
      else this.aseR += clamp(target - this.aseR, -C.ase.growPxS * dt, C.ase.growPxS * dt);
      const ctx = this.ctx;
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc((P.l + P.r) / 2, (P.t + P.b) / 2, this.aseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    drawTdc() {
      const ctx = this.ctx;
      const s = this.sim;
      const r = s.radar;
      const x = this.X(r.tdc.az);
      const y = this.Y(r.tdc.rng);
      ctx.strokeStyle = YELLOW;
      ctx.fillStyle = YELLOW;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const gap = 9.6; // semiseparación de las dos barras (16 px de separación total + 20 %)
      ctx.moveTo(x - gap, y - 11); ctx.lineTo(x - gap, y + 11);
      ctx.moveTo(x + gap, y - 11); ctx.lineTo(x + gap, y + 11);
      ctx.stroke();
      if (r.spot !== null) {
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke();
      }
      ctx.lineWidth = 1;
      // Altitudes (miles de pies) que cubre el haz a la distancia del cursor
      const a = s.tdcAltitudes();
      ctx.font = `11px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.round(a.top)), x, y - 18);
      ctx.fillText(String(Math.round(a.bottom)), x, y + 20);
      ctx.font = `12px ${MONO}`;
      ctx.strokeStyle = GREEN;
      ctx.fillStyle = GREEN;
    }

    drawContact(d, hovered) {
      const ctx = this.ctx;
      const s = this.sim;
      const x = this.X(d.az);
      const y = this.Y(d.f);
      if (x < P.l - 2 || x > P.r + 2 || y < P.t - 2 || y > P.b + 2) return;
      const ltwsSymbol = s.radar.mode === 'RWS' && s.radar.ltws && (d.isLS || d.isDT2 || hovered);
      ctx.globalAlpha = d.alpha;
      const ik = C.iconScale || 1;
      if (d.sam) {
        ctx.fillStyle = GREEN;
        ctx.textAlign = 'left';
        ctx.font = `11px ${MONO}`;
        if (d.sam.merged) ctx.fillText('M', x - 4, y);
        else { ctx.fillRect(x - 4 * ik, y - 2 * ik, 8 * ik, 4 * ik); ctx.fillText(String(Math.round(d.sam.alt / 1000)), x + 8 * ik, y); }
        ctx.font = `12px ${MONO}`;
      } else if (d.style === 'lpt') {
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 1.2 * ik;
        ctx.beginPath(); ctx.moveTo(x - 4 * ik, y); ctx.lineTo(x + 4 * ik, y); ctx.moveTo(x, y - 4 * ik); ctx.lineTo(x, y + 4 * ik); ctx.stroke();
        ctx.lineWidth = 1;
      } else if (d.style === 'brick' && !ltwsSymbol) {
        ctx.fillStyle = GREEN;
        ctx.fillRect(x - 4 * ik, y - 2 * ik, 8 * ik, 4 * ik);
      } else if (d.style === 'stt') {
        this.hafu(x, y, d, true, true);
      } else {
        this.hafu(x, y, d, d.isLS || d.isDT2 || hovered, false);
      }
      ctx.globalAlpha = 1;
    }

    // Símbolo HAFU (Hostile / Ambiguous / Friendly / Unknown) con Mach a la izquierda y altitud a la derecha
    hafu(x, y, d, showData, isStt) {
      const ctx = this.ctx;
      const c = d.c;
      const ik = C.iconScale || 1;
      // Color/forma según el resultado del IFF (amigo, hostil o desconocido); sin respuesta aún, desconocido
      const kind = d.iff || (d.ident ? (c.side === 'friend' ? 'friend' : c.side === 'hostile' ? 'hostile' : 'unknown') : 'unknown');
      const col = kind === 'hostile' ? RED : kind === 'friend' ? GREEN : YELLOW;
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.save();
      ctx.translate(x, y); ctx.scale(ik, ik); ctx.translate(-x, -y);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (kind === 'hostile') {
        ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.closePath();
      } else if (kind === 'friend') {
        ctx.arc(x, y + 3, 7, Math.PI, 0);
      } else {
        ctx.moveTo(x - 7, y + 4); ctx.lineTo(x - 7, y - 5); ctx.lineTo(x + 7, y - 5); ctx.lineTo(x + 7, y + 4);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      if (d.isLS || isStt) this.star(x, y, 3.4);
      if (d.isDT2) {
        ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 3); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill();
      }
      if (!showData && d.rank && !isStt) {
        ctx.font = `10px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.fillText(String(d.rank), x, y + 1);
        ctx.font = `12px ${MONO}`;
      }
      ctx.restore();
      if (showData) {
        ctx.font = `11px ${MONO}`;
        ctx.textAlign = 'right';
        ctx.fillText(c.mach.toFixed(1), x - 11 * ik, y);
        ctx.textAlign = 'left';
        ctx.fillText(String(+(c.alt / 1000).toFixed(1)), x + 11 * ik, y);
        if (isStt && this.sim.radar.nctr) {
          ctx.textAlign = 'center';
          ctx.fillText(d.ident ? c.type : T.ui.unknownType, x, y + 18);
        }
        if (d.iffPending) {
          ctx.textAlign = 'center';
          ctx.fillStyle = YELLOW;
          if (Math.floor(performance.now() / 250) % 2 === 0) ctx.fillText('IFF', x, y - 18);
        }
        ctx.font = `12px ${MONO}`;
      }
      // Vector de velocidad: un palito corto de longitud fija (no depende de la escala), del color del símbolo
      if (d.vec && !isStt) {
        const vx = this.X(d.vec.az) - x;
        const vy = this.Y(d.vec.f) - y;
        const vl = Math.hypot(vx, vy);
        if (vl > 0.5) {
          const ux = vx / vl;
          const uy = vy / vl;
          const g = C.tws.vectorGapPx * ik;
          ctx.strokeStyle = col;
          ctx.beginPath(); ctx.moveTo(x + ux * g, y + uy * g); ctx.lineTo(x + ux * (g + C.tws.vectorPx), y + uy * (g + C.tws.vectorPx)); ctx.stroke();
        }
      }
      ctx.strokeStyle = GREEN;
      ctx.fillStyle = GREEN;
    }

    star(x, y, r) {
      const ctx = this.ctx;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.45 : r;
        ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  window.RadarDDI = DDI;
})();
