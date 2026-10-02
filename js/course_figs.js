/* Figuras interactivas del curso: perfil del cono (SideFig), pantalla del radar + vista desde arriba (ScopeFig),
   panel de botones del DDI (OsbFig) y tarjetas (CardsFig). Todas siguen la misma interfaz:
   constructor(host, opts, notify), s (estado), set(id, v), act(nombre), read() -> {lines, chips}, flags, destroy(). */
(function () {
  const C = window.RadarConfig;
  const T = window.RadarText;
  const RAD = Math.PI / 180;

  const GREEN = '#46ff72';
  const YELLOW = '#ffe14d';
  const RED = '#ff5050';
  const MONO = "'Consolas', 'Courier New', monospace";
  const LABEL = "600 12px 'Barlow Condensed', 'Barlow', sans-serif";

  const OWN_ALT = 25;                       // altitud del avión del perfil (ángeles = miles de pies)
  const FT_NM = 6.076;                      // miles de pies por milla náutica
  const HALF = C.antenna.barSpacingDeg / 2; // semiapertura vertical de una barra
  const BAR_S = 2.5;                        // segundos que tarda cada barra (valor didáctico, ver vídeo del escuadrón)
  const D_MAX = 80;
  const A_MAX = 50;
  const DET_NM = C.detection.baseNm;        // límite de detección didáctico
  const SCAN = C.antenna.scanRateDegS;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmtSigned = (v, d) => (v > 0 ? '+' : '') + v.toFixed(d);

  class Base {
    constructor(host, opts, notify) {
      this.host = host;
      this.o = opts || {};
      this.notify = notify || (() => {});
      this.s = {};
      this.flags = {};
      this.alive = true;
      this.t = 0;
    }
    flag(k) { if (!this.flags[k]) { this.flags[k] = true; this.notify(); } }
    canvas(label) {
      const cv = document.createElement('canvas');
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', label || '');
      this.host.appendChild(cv);
      this.cv = cv;
      return cv;
    }
    start() {
      let last = performance.now();
      const f = (now) => {
        if (!this.alive) return;
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        this.t += dt;
        this.tick(dt);
        this.draw();
        this.raf = requestAnimationFrame(f);
      };
      this.raf = requestAnimationFrame(f);
    }
    destroy() { this.alive = false; cancelAnimationFrame(this.raf); this.host.innerHTML = ''; }
    size() {
      const r = this.cv.getBoundingClientRect();
      const W = Math.max(200, Math.round(r.width));
      const H = Math.max(150, Math.round(r.height));
      const dpr = window.devicePixelRatio || 1;
      if (this.cv.width !== Math.round(W * dpr) || this.cv.height !== Math.round(H * dpr)) { this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); }
      const ctx = this.cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      return { ctx, W, H, rect: r };
    }
    tick() {}
    set(k, v) { this.s[k] = v; this.notify(); }
    act() {}
    read() { return { lines: [], chips: [] }; }
  }

  // ---------------------------------------------------------------------------------------------------------
  // Perfil del cono
  // ---------------------------------------------------------------------------------------------------------
  class SideFig extends Base {
    constructor(host, opts, notify) {
      super(host, opts, notify);
      this.s = { elev: 0, pitch: 0, dist: 70, bars: 1, alt1: 40 };
      this.targets = [{ name: 'MiG-1', d: 60, alt: 40 }, { name: 'MiG-2', d: 45, alt: 10 }];
      this.seenSet = new Set();
      const cv = this.canvas(T.course.figAria);
      const drag = (e) => {
        if (!this.o.drag) return;
        const g = this.geom();
        const r = cv.getBoundingClientRect();
        const x = (e.clientX - r.left) * (g.W / r.width);
        this.set('dist', clamp(Math.round((x - g.l) / (g.r - g.l) * D_MAX), 5, D_MAX));
      };
      cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); this.drag = true; drag(e); });
      cv.addEventListener('pointermove', (e) => { if (this.drag) drag(e); });
      cv.addEventListener('pointerup', () => { this.drag = false; });
      if (this.o.drag) cv.style.cursor = 'ew-resize';
      this.start();
    }
    set(k, v) {
      this.s[k] = v;
      if (k === 'alt1') this.targets[0].alt = v;
      this.notify();
    }
    theta() { return this.s.elev + this.s.pitch; }
    band(d) {
      const c = OWN_ALT + d * FT_NM * Math.tan(this.theta() * RAD);
      const h = this.s.bars * d * FT_NM * Math.tan(HALF * RAD);
      return { lo: c - h, hi: c + h };
    }
    seen(t) { const b = this.band(t.d); return t.alt >= b.lo && t.alt <= b.hi; }
    geom() {
      const r = this.cv.getBoundingClientRect();
      const W = Math.max(200, Math.round(r.width));
      const H = Math.max(150, Math.round(r.height));
      const l = 44, rr = W - 16, t = 16, b = H - 34;
      return { W, H, l, r: rr, t, b, X: (d) => l + (d / D_MAX) * (rr - l), Y: (a) => b - (a / A_MAX) * (b - t) };
    }
    jet(ctx, x, y, size, rot, flip, fill, stroke) {
      const P = [[1, 0], [0.35, -0.16], [-0.5, -0.16], [-0.95, -0.6], [-1.05, -0.6], [-0.9, 0], [-1.05, 0.1], [-0.2, 0.15], [0.4, 0.15]];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(flip ? -size : size, size);
      ctx.beginPath();
      P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.restore();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }
    tick() {
      for (const t of this.targets) if (this.seen(t)) this.seenSet.add(t.name);
      if (this.o.challenge && this.seenSet.size >= this.targets.length) this.flag('both');
      if (this.o.escape) {
        const t0 = this.targets[0];
        if (this.s.bars <= 2 && !this.seen(t0) && this.seen(this.targets[1])) this.lostOnce = true;
        if (this.lostOnce && this.seen(t0)) this.flag('recovered');
      }
    }
    activeBar() { return Math.floor(this.t / BAR_S) % this.s.bars; }
    draw() {
      const { ctx } = this.size();
      const g = this.geom();
      const o = this.o;
      const N = this.s.bars;
      ctx.font = LABEL;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.fillStyle = 'rgba(232,228,220,0.55)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let a = 0; a <= A_MAX; a += 10) {
        const y = Math.round(g.Y(a)) + 0.5;
        ctx.beginPath(); ctx.moveTo(g.l, y); ctx.lineTo(g.r, y); ctx.stroke();
        ctx.fillText(String(a), g.l - 6, y);
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let d = 0; d <= D_MAX; d += 10) {
        const x = Math.round(g.X(d)) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, g.t); ctx.lineTo(x, g.b); ctx.stroke();
        ctx.fillText(String(d), x, g.b + 5);
      }
      ctx.fillStyle = 'rgba(232,228,220,0.4)';
      ctx.textAlign = 'right';
      ctx.fillText('Distancia (NM)', g.r, g.b + 18);
      ctx.save();
      ctx.translate(12, (g.t + g.b) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Altitud (ángeles)', 0, 0);
      ctx.restore();
      ctx.fillStyle = 'rgba(120,90,50,0.35)';
      ctx.fillRect(g.l, g.b, g.r - g.l, 3);

      ctx.save();
      ctx.beginPath(); ctx.rect(g.l, g.t, g.r - g.l, g.b - g.t); ctx.clip();
      const th = this.theta();
      const edge = (ang, d) => OWN_ALT + d * FT_NM * Math.tan(ang * RAD);
      // Cono: N barras apiladas; la barra activa (la que está barriendo ahora) más clara
      if (o.cone) {
        const act = o.sweep ? this.activeBar() : -1;
        for (let i = 0; i < N; i++) {
          const c = th + (i - (N - 1) / 2) * 2 * HALF;
          ctx.beginPath();
          ctx.moveTo(g.X(0), g.Y(OWN_ALT));
          ctx.lineTo(g.X(D_MAX), g.Y(edge(c - HALF, D_MAX)));
          ctx.lineTo(g.X(D_MAX), g.Y(edge(c + HALF, D_MAX)));
          ctx.closePath();
          ctx.fillStyle = i === act ? 'rgba(201,168,76,0.42)' : 'rgba(201,168,76,0.14)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(201,168,76,0.55)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(201,168,76,0.95)';
        ctx.lineWidth = 1.6;
        const top = th + N * HALF, bot = th - N * HALF;
        ctx.beginPath(); ctx.moveTo(g.X(0), g.Y(OWN_ALT)); ctx.lineTo(g.X(D_MAX), g.Y(edge(top, D_MAX))); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(g.X(0), g.Y(OWN_ALT)); ctx.lineTo(g.X(D_MAX), g.Y(edge(bot, D_MAX))); ctx.stroke();
      }
      if (o.cursor) {
        const d = this.s.dist;
        const bd = this.band(d);
        const x = g.X(d);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, g.t); ctx.lineTo(x, g.b); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#7fe08f';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, g.Y(bd.lo)); ctx.lineTo(x, g.Y(bd.hi)); ctx.stroke();
        ctx.fillStyle = '#7fe08f';
        ctx.font = "600 13px 'Barlow Condensed', 'Barlow', sans-serif";
        const right = x < g.r - 70;
        ctx.textAlign = right ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        const tx = x + (right ? 8 : -8);
        ctx.fillText('máx ' + Math.round(bd.hi), tx, Math.max(g.t + 8, g.Y(bd.hi)));
        ctx.fillText('mín ' + Math.round(bd.lo), tx, Math.min(g.b - 8, g.Y(bd.lo)));
        ctx.font = LABEL;
      }
      ctx.restore();

      if (o.targets) {
        for (const t of this.targets) {
          const x = g.X(t.d), y = g.Y(t.alt);
          const vis = this.seen(t);
          if (vis) { ctx.beginPath(); ctx.arc(x, y, 17, 0, 6.2832); ctx.fillStyle = 'rgba(224,82,74,0.18)'; ctx.fill(); }
          this.jet(ctx, x, y, 11, 0, true, vis ? '#e0524a' : 'rgba(150,150,150,0.35)', vis ? '#ffb0aa' : 'rgba(180,180,180,0.5)');
          ctx.font = LABEL;
          ctx.fillStyle = vis ? '#ffb0aa' : 'rgba(200,200,200,0.55)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(t.name, x, y - 12);
        }
      }
      // Tu avión: el morro apunta como la línea central del cono sin elevar (la que marca el cabeceo)
      const pitchAlt = OWN_ALT + D_MAX * FT_NM * Math.tan(this.s.pitch * RAD);
      const noseRot = Math.atan2(g.Y(pitchAlt) - g.Y(OWN_ALT), g.X(D_MAX) - g.X(0));
      this.jet(ctx, g.X(0) + 14, g.Y(OWN_ALT), 14, noseRot, false, '#cfd6e3', '#ffffff');
      ctx.font = LABEL;
      ctx.fillStyle = 'rgba(232,228,220,0.8)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('TÚ', g.l + 4, g.Y(OWN_ALT) + 14);
    }
    read() {
      const tx = T.course;
      const lines = [];
      const o = this.o;
      if (o.cursor) {
        const b = this.band(this.s.dist);
        lines.push(`${tx.readAt} <b>${this.s.dist} NM</b>: ${tx.readMin} <b>${Math.round(b.lo)}</b> · ${tx.readMax} <b>${Math.round(b.hi)}</b> ${tx.readUnit}`);
      }
      if (o.period) {
        const N = this.s.bars;
        lines.push(`${tx.period}: <b>${(N * BAR_S).toFixed(1).replace('.', ',')} s</b> (${N} ${N === 1 ? 'barra' : 'barras'} × ${String(BAR_S).replace('.', ',')} s)`);
      }
      const chips = o.targets ? this.targets.map((t) => ({ t: `${t.name} · ${this.seen(t) ? tx.visible : tx.hidden}`, on: this.seen(t) })) : [];
      return { lines, chips };
    }
  }

  // ---------------------------------------------------------------------------------------------------------
  // Pantalla del radar (B-scan: azimut en horizontal, distancia en vertical) y vista real desde arriba
  // ---------------------------------------------------------------------------------------------------------
  const PRESETS = {
    three: [
      { id: 'A', name: 'A', type: 'MiG-29', r: 55, b: -22, alt: 30, mach: 0.9, side: 'hostile' },
      { id: 'B', name: 'B', type: 'Su-27', r: 33, b: 12, alt: 18, mach: 0.8, side: 'hostile' },
      { id: 'C', name: 'C', type: 'F/A-18C', r: 24, b: 38, alt: 26, mach: 0.85, side: 'friend' },
      { id: 'D', name: 'D', type: 'Su-30', r: 110, b: -30, alt: 33, mach: 0.9, side: 'hostile' },
    ],
    age: [
      { id: 'A', name: 'A', type: 'MiG-29', r: 40, b: -10, alt: 28, mach: 0.9, side: 'hostile', mv: (t) => ({ r: 40, b: -10 + ((t * 5) % 55) }) },
      { id: 'B', name: 'B', type: 'Su-27', r: 55, b: 8, alt: 22, mach: 0.8, side: 'hostile' },
    ],
    stt: [
      { id: 'A', name: 'A', type: 'MiG-29', r: 40, b: 5, alt: 30, mach: 0.9, side: 'hostile', ang: 0 },
      { id: 'B', name: 'B', type: 'Su-27', r: 32, b: -22, alt: 20, mach: 0.8, side: 'hostile' },
      { id: 'C', name: 'C', type: 'MiG-31', r: 55, b: 20, alt: 36, mach: 1.4, side: 'hostile' },
    ],
    iff: [
      { id: 'F', name: 'F', type: 'F/A-18C', r: 30, b: 10, alt: 25, mach: 0.85, side: 'friend' },
      { id: 'H', name: 'H', type: 'MiG-29', r: 42, b: -15, alt: 28, mach: 0.9, side: 'hostile' },
      { id: 'X', name: 'X', type: 'Su-27', r: 36, b: -45, alt: 22, mach: 0.8, side: 'hostile' },
    ],
    nws: [
      { id: 'A', name: '1', type: 'MiG-29', r: 28, b: -18, alt: 30, mach: 0.9, side: 'hostile' },
      { id: 'B', name: '2', type: 'Su-27', r: 41, b: 6, alt: 22, mach: 0.8, side: 'hostile' },
      { id: 'C', name: '3', type: 'MiG-31', r: 54, b: 24, alt: 36, mach: 1.4, side: 'hostile' },
    ],
    tws: [
      { id: 'a', r: 22, b: -30, alt: 20, mach: 0.8 }, { id: 'b', r: 27, b: -12, alt: 28, mach: 0.9 },
      { id: 'c', r: 31, b: 4, alt: 25, mach: 0.9 }, { id: 'd', r: 35, b: 18, alt: 32, mach: 1.1 },
      { id: 'e', r: 39, b: -24, alt: 18, mach: 0.8 }, { id: 'f', r: 43, b: 10, alt: 30, mach: 0.9 },
      { id: 'g', r: 47, b: 28, alt: 26, mach: 0.85 }, { id: 'h', r: 51, b: -6, alt: 35, mach: 1.2 },
      { id: 'i', r: 56, b: 14, alt: 22, mach: 0.8 }, { id: 'j', r: 60, b: -34, alt: 29, mach: 0.9 },
    ].map((c, i) => ({ ...c, name: String(i + 1), type: 'MiG-29', side: 'hostile' })),
    raid: [
      { id: 'A', name: 'A', type: 'MiG-29', r: 40, b: 3, alt: 28, mach: 0.9, side: 'hostile' },
      { id: 'B', name: 'B', type: 'MiG-29', r: 41, b: 4, alt: 31, mach: 0.9, side: 'hostile' },
      { id: 'C', name: 'C', type: 'Su-27', r: 28, b: -30, alt: 24, mach: 0.8, side: 'hostile' },
    ],
  };

  class ScopeFig extends Base {
    constructor(host, opts, notify) {
      super(host, opts, notify);
      const o = this.o;
      this.contacts = (PRESETS[o.preset] || PRESETS.three).map((c, i) => ({ ang: 0, closure: 700, last: -1e9, sr: c.r, sb: c.b, idx: i, ...c }));
      this.s = {
        az: o.az || 80, scale: o.scale || 80, bars: o.bars || 1, age: o.age || 8, center: 0, centering: 'AUTO',
        ltws: false, bra: false, nctr: false, raid: false,
        sel: null, ls: null, dt2: null, stt: null, iff: {}, tr: 0, tb: 0, ang: 0,
      };
      this.ant = 0;       // azimut actual de la antena
      this.pass = 0;      // número de pasada (una barra por pasada)
      this.u = 0;         // tiempo dentro de la pasada
      this.ang = 0;       // posición del barrido
      this.prevAng = 0;
      this.sttT = 0;
      this.notchT = 0;
      this.pend = null;
      this.msg = '';
      this.msgT = 0;
      this.cur = null;
      this.hov = null;
      if (o.focus) { const f = this.focus(); this.s.tr = f.r; this.s.tb = f.b; this.s.ang = f.ang; }
      if (o.initLS) this.s.ls = o.initLS;
      if (o.initSel) this.s.sel = o.initSel;
      const cv = this.canvas('Pantalla del radar y vista real desde arriba');
      cv.style.cursor = 'crosshair';
      cv.addEventListener('pointermove', (e) => this.pointer(e, false));
      cv.addEventListener('pointerleave', () => { this.cur = null; this.hov = null; });
      cv.addEventListener('pointerdown', (e) => this.pointer(e, true));
      for (const c of this.contacts) if (!c.mv) { c.sr = c.r; c.sb = c.b; }
      this.start();
    }

    focus() { return this.contacts.find((c) => c.id === this.o.focus); }
    // Aplica al blanco enfocado los valores iniciales que traiga el paso (distancia, marcación, rumbo)
    applyInit() {
      const f = this.focus();
      if (!f) return;
      f.r = this.s.tr; f.b = this.s.tb; f.ang = this.s.ang; f.sr = f.r; f.sb = f.b;
    }
    get(id) { return this.contacts.find((c) => c.id === id); }
    say(t) { this.msg = t; this.msgT = 2.8; }

    // ---- ajustes y límites ----
    effAz() {
      if (this.s.raid) return C.raid.azDeg;
      let az = this.s.az;
      if (this.o.mode === 'tws') az = Math.min(az, C.display.twsMaxAz[this.s.bars] || az);
      return az;
    }
    effBars() { return this.s.raid ? C.raid.bars : this.s.bars; }
    notchOf(c) { return Math.abs(Math.cos(c.ang * RAD)) * 450 < C.detection.notchKt; }
    detectable(c) {
      const az = this.effAz();
      return Math.abs(c.b - this.ant) <= az / 2 && c.r <= DET_NM && !this.notchOf(c);
    }

    set(k, v) {
      const s = this.s;
      if (k === 'tr' || k === 'tb' || k === 'ang') {
        const f = this.focus();
        if (f) { if (k === 'tr') f.r = v; if (k === 'tb') f.b = v; if (k === 'ang') f.ang = v; if (this.s.stt !== f.id) { f.sr = f.r; f.sb = f.b; } }
      }
      s[k] = v;
      if (k === 'raid' && v && !s.ls) { s.raid = false; this.say('RAID: SE NECESITA UN L&S'); }
      if (k === 'bars' && this.o.mode === 'tws') this.flag('barsChanged');
      if (k === 'centering') { if (v === 'AUTO' && !s.ls) { s.centering = 'MAN'; this.say('SIN L&S: MAN'); } this.flag('centered'); }
      if (k === 'az' && this.o.mode === 'tws' && v > (C.display.twsMaxAz[s.bars] || v)) this.say(`TWS LIMITA A ${C.display.twsMaxAz[s.bars]}°`);
      this.notify();
    }

    act(name) {
      const s = this.s;
      const byRange = () => this.visible().sort((a, b) => a.sr - b.sr);
      if (name === 'lock') {
        let c = this.get(s.sel) || this.get(s.ls) || byRange()[0];
        if (!c || s.stt) return;
        s.stt = c.id; s.sel = c.id; s.ls = c.id; this.sttT = 0; this.notchT = 0; this.say('STT');
        this.flag('locked');
        if (!s.iff[c.id]) this.pend = { id: c.id, t: 0 };
      } else if (name === 'release') {
        if (s.stt) { s.stt = null; this.pend = null; this.say('RTS'); this.flag('released'); }
      } else if (name === 'nws') {
        this.undesignate();
      } else if (name === 'rset') {
        s.ls = null; s.dt2 = null; s.sel = null; s.raid = false; this.say('RSET');
      } else if (name === 'iff') {
        const c = this.get(s.sel) || this.focus();
        if (c && !s.iff[c.id]) this.pend = { id: c.id, t: 0 };
      } else if (name === 'again') {
        s.iff = {}; this.pend = null;
      }
      this.notify();
    }

    // Undesignate / NWS: igual que en el simulador
    undesignate() {
      const s = this.s;
      if (s.stt) { this.act('release'); return; }
      const ids = this.visible().sort((a, b) => a.sr - b.sr).map((c) => c.id);
      if (!ids.length) return;
      if (s.ls == null) { s.ls = ids[0]; this.say('L&S'); this.flag('nws1'); return; }
      if (s.dt2 != null) { [s.ls, s.dt2] = [s.dt2, s.ls]; this.flag('swap'); return; }
      s.ls = ids[(ids.indexOf(s.ls) + 1) % ids.length];
      this.flag('cycle');
    }

    designate(id) {
      const s = this.s;
      s.sel = id;
      if (!this.o.designate) return;
      if (this.o.mode === 'rws' && !s.ltws) return;
      if (s.ls == null) { s.ls = id; this.say('L&S'); if (s.centering === 'MAN' && this.o.mode === 'tws') s.centering = 'AUTO'; this.flag('ls'); }
      else if (id === s.ls) return;
      else { s.dt2 = id; this.say('DT2'); this.flag('dt2'); }
    }

    // ---- geometría ----
    geom() {
      const r = this.cv.getBoundingClientRect();
      const W = Math.max(240, Math.round(r.width));
      const H = Math.max(180, Math.round(r.height));
      const S = Math.min(H - 32, Math.round(W * 0.56));
      return { W, H, S, x0: 10, y0: 22, px: S + 24, pw: W - S - 34 };
    }
    raidCenter() { const c = this.get(this.s.ls); return c ? { b: c.sb, r: c.sr } : { b: 0, r: 40 }; }
    // Posición en la pantalla del radar (en píxeles) de un punto (b, r)
    scopeXY(g, b, r) {
      if (this.s.raid) {
        const rc = this.raidCenter();
        return [g.x0 + g.S * (0.5 + (b - rc.b) / C.raid.azDeg), g.y0 + g.S * (0.5 - (r - rc.r) / C.raid.rangeNm)];
      }
      return [g.x0 + g.S * (0.5 + b / 140), g.y0 + g.S * (1 - r / this.s.scale)];
    }
    inScope(b, r) {
      if (this.s.raid) { const rc = this.raidCenter(); return Math.abs(b - rc.b) <= C.raid.azDeg / 2 && Math.abs(r - rc.r) <= C.raid.rangeNm / 2; }
      return Math.abs(b) <= 70 && r <= this.s.scale && r >= 0;
    }
    age(c) { return this.t - c.last; }
    shown(c) {
      if (this.s.stt) return c.id === this.s.stt;
      return this.age(c) <= this.s.age && this.inScope(c.sb, c.sr);
    }
    visible() { return this.contacts.filter((c) => this.shown(c)); }

    pointer(e, down) {
      const g = this.geom();
      const r = this.cv.getBoundingClientRect();
      const x = (e.clientX - r.left) * (g.W / r.width);
      const y = (e.clientY - r.top) * (g.H / r.height);
      const inside = x >= g.x0 && x <= g.x0 + g.S && y >= g.y0 && y <= g.y0 + g.S;
      if (!inside) { this.cur = null; this.hov = null; return; }
      let b, rr;
      if (this.s.raid) {
        const rc = this.raidCenter();
        b = rc.b + ((x - g.x0) / g.S - 0.5) * C.raid.azDeg;
        rr = rc.r + (0.5 - (y - g.y0) / g.S) * C.raid.rangeNm;
      } else {
        b = ((x - g.x0) / g.S - 0.5) * 140;
        rr = (1 - (y - g.y0) / g.S) * this.s.scale;
      }
      this.cur = { b, r: rr, x, y };
      let best = null, bd = 18;
      for (const c of this.visible()) {
        const [cx, cy] = this.scopeXY(g, c.sb, c.sr);
        const d = Math.hypot(cx - x, cy - y);
        if (d < bd) { bd = d; best = c; }
      }
      this.hov = best ? best.id : null;
      if (down) {
        if (best) this.designate(best.id);
        else if (this.o.clickCenter && !this.s.stt) { this.s.center = clamp(b, -60, 60); this.flag('centered'); }
        else if (this.o.mode === 'tws' && !this.s.stt) {
          const s = this.s;
          if (s.centering === 'MAN' || !s.ls) { s.center = clamp(b, -60, 60); s.centering = 'MAN'; this.flag('centered'); }
          else if (s.centering === 'AUTO') { s.centering = 'BIAS'; s.bias = clamp(b - this.get(s.ls).sb, -20, 20); this.flag('centered'); }
        }
        this.notify();
      }
    }

    // ---- simulación ----
    tick(dt) {
      const s = this.s;
      const o = this.o;
      if (this.msgT > 0) this.msgT -= dt;
      for (const c of this.contacts) if (c.mv) { const p = c.mv(this.t); c.r = p.r; c.b = p.b; }
      const az = this.effAz();
      const bars = this.effBars();

      // Antena: a su destino con velocidad limitada
      let target = s.center;
      const lsC = this.get(s.ls);
      if (s.stt) target = this.get(s.stt).b;
      else if (o.mode === 'tws' && s.centering !== 'MAN' && lsC) target = lsC.sb + (s.centering === 'BIAS' ? s.bias || 0 : 0);
      else if (o.mode === 'tws' && !lsC && s.centering !== 'MAN') s.centering = 'MAN';
      if (s.raid && lsC) target = lsC.sb;
      const lim = Math.max(0, 70 - az / 2);
      target = clamp(target, -lim, lim);
      const step = SCAN * dt;
      this.ant += clamp(target - this.ant, -step, step);

      // Barrido: una pasada por barra; el contacto se refresca cuando el barrido cruza su marcación en la pasada de su barra
      const Tp = az / SCAN;
      this.prevAng = this.ang;
      this.u += dt;
      if (this.u >= Tp) { this.u -= Tp; this.pass++; }
      const fwd = this.pass % 2 === 0;
      const f = Math.min(1, this.u / Tp);
      this.ang = this.ant - az / 2 + az * (fwd ? f : 1 - f);
      const lo = Math.min(this.prevAng, this.ang), hi = Math.max(this.prevAng, this.ang);
      const barNow = this.pass % bars;
      for (const c of this.contacts) {
        const refresh = () => { c.last = this.t; c.sr = c.r; c.sb = c.b; };
        if (s.stt) { if (c.id === s.stt) refresh(); continue; }
        if (s.raid) { if (this.inScope(c.b, c.r)) refresh(); continue; }
        if (this.detectable(c) && c.idx % bars === barNow && c.b >= lo - 0.01 && c.b <= hi + 0.01) refresh();
      }

      // Lock: IFF automático, NCTR y notch
      if (s.stt) {
        const c = this.get(s.stt);
        this.sttT += dt;
        if (this.notchOf(c)) {
          this.notchT += dt;
          if (this.notchT >= C.detection.sttNotchGraceS) { s.stt = null; this.pend = null; this.say('PERDIDO: NOTCH'); this.flag('notchLost'); }
        } else this.notchT = 0;
        if (c.r > DET_NM * C.detection.sttBoost) { s.stt = null; this.say('BLANCO PERDIDO'); }
      }
      if (this.pend) {
        const c = this.get(this.pend.id);
        const ok = c.r <= C.iff.maxNm && Math.abs(c.b) <= C.iff.azHalfDeg;
        if (!ok) {
          this.pend.t += dt;
          if (this.pend.t >= C.iff.timeS) { this.say('IFF: SIN RESPUESTA'); this.flag('iffNone'); this.pend = null; }
        } else {
          this.pend.t += dt;
          if (this.pend.t >= C.iff.timeS) { s.iff[c.id] = c.side; this.say('IFF: ' + (c.side === 'friend' ? 'AMIGO' : 'HOSTIL')); this.flag('iffAns'); this.pend = null; }
        }
      }
      if (o.mode === 'rws' && s.ltws && s.ls && s.dt2) this.flag('both');
      if (this.flags.iffAns && this.flags.iffNone) this.flag('iffBoth');
      if (s.raid) {
        const rc = this.raidCenter();
        if (this.contacts.filter((c) => this.inScope(c.b, c.r)).length >= 2 && rc) this.flag('raidSplit');
      }
      if (o.mode === 'tws') this.updateTracks();
    }
    updateTracks() {}

    // ---- dibujo ----
    sym(ctx, x, y, c, st) {
      const k = 1.15;
      const kind = this.s.iff[c.id] || 'unknown';
      const col = kind === 'hostile' ? RED : kind === 'friend' ? GREEN : YELLOW;
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y);
      ctx.beginPath();
      if (kind === 'hostile') { ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.closePath(); }
      else if (kind === 'friend') ctx.arc(x, y + 3, 7, Math.PI, 0);
      else { ctx.moveTo(x - 7, y + 4); ctx.lineTo(x - 7, y - 5); ctx.lineTo(x + 7, y - 5); ctx.lineTo(x + 7, y + 4); }
      ctx.stroke();
      ctx.lineWidth = 1;
      if (st.ls || st.stt) this.star(ctx, x, y, 3.4);
      if (st.dt2) { ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 3); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill(); }
      if (!st.data && st.rank) { ctx.font = `10px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(st.rank), x, y + 1); }
      ctx.restore();
      if (st.data) {
        ctx.font = `11px ${MONO}`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        ctx.fillText(c.mach.toFixed(1), x - 12 * k, y);
        ctx.textAlign = 'left';
        ctx.fillText(String(c.alt), x + 12 * k, y);
        if (st.nctr) { ctx.textAlign = 'center'; ctx.fillText(st.nctr, x, y + 19); }
      }
    }
    star(ctx, x, y, r) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 ? r * 0.45 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    }

    draw() {
      const { ctx } = this.size();
      const g = this.geom();
      const s = this.s;
      const o = this.o;
      const S = g.S;
      const az = this.effAz();

      // ---------- Pantalla ----------
      ctx.fillStyle = '#021208';
      ctx.fillRect(g.x0, g.y0, S, S);
      ctx.save();
      ctx.beginPath(); ctx.rect(g.x0, g.y0, S, S); ctx.clip();
      const gx = (b) => g.x0 + S * (0.5 + b / 140);
      if (!s.raid && !s.stt) {
        ctx.fillStyle = 'rgba(70,255,114,0.07)';
        const a = Math.max(-70, this.ant - az / 2), b = Math.min(70, this.ant + az / 2);
        ctx.fillRect(gx(a), g.y0, gx(b) - gx(a), S);
      }
      ctx.strokeStyle = 'rgba(70,255,114,0.22)';
      ctx.lineWidth = 1;
      if (!s.raid) {
        for (let b = -60; b <= 60; b += 20) { ctx.beginPath(); ctx.moveTo(Math.round(gx(b)) + 0.5, g.y0); ctx.lineTo(Math.round(gx(b)) + 0.5, g.y0 + S); ctx.stroke(); }
        for (let i = 1; i < 4; i++) { const y = Math.round(g.y0 + S * i / 4) + 0.5; ctx.beginPath(); ctx.moveTo(g.x0, y); ctx.lineTo(g.x0 + S, y); ctx.stroke(); }
        if (!s.stt) {
          const sx = gx(this.ang);
          ctx.strokeStyle = 'rgba(70,255,114,0.8)';
          ctx.beginPath(); ctx.moveTo(sx, g.y0); ctx.lineTo(sx, g.y0 + S); ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.moveTo(g.x0 + S / 2, g.y0); ctx.lineTo(g.x0 + S / 2, g.y0 + S); ctx.moveTo(g.x0, g.y0 + S / 2); ctx.lineTo(g.x0 + S, g.y0 + S / 2); ctx.stroke();
      }

      // Contactos
      const vis = this.visible();
      const sorted = [...vis].sort((a, b) => a.sr - b.sr);
      const rank = {};
      sorted.forEach((c, i) => { rank[c.id] = i + 1; });
      const ik = 1.25;
      for (const c of vis) {
        const [x, y] = this.scopeXY(g, c.sb, c.sr);
        const a = s.stt ? 1 : Math.max(0.3, 1 - 0.7 * this.age(c) / s.age);
        ctx.globalAlpha = a;
        const isLS = s.ls === c.id, isDT2 = s.dt2 === c.id, isSel = s.sel === c.id;
        if (s.stt) {
          const near = c.r <= C.nctr.maxNm && this.sttT >= C.nctr.timeS;
          this.sym(ctx, x, y, c, { stt: true, data: true, nctr: s.nctr ? (near ? c.type : '???') : null });
          if (this.pend && this.pend.id === c.id && Math.floor(this.t * 4) % 2 === 0) { ctx.fillStyle = YELLOW; ctx.font = `11px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText('IFF', x, y - 18); }
        } else if (o.mode === 'tws' || o.mode === 'sym') {
          if (o.mode === 'tws' && rank[c.id] > C.tws.hafuMax) {
            ctx.strokeStyle = YELLOW; ctx.lineWidth = 1.2 * ik;
            ctx.beginPath(); ctx.moveTo(x - 4 * ik, y); ctx.lineTo(x + 4 * ik, y); ctx.moveTo(x, y - 4 * ik); ctx.lineTo(x, y + 4 * ik); ctx.stroke();
          } else this.sym(ctx, x, y, c, { ls: isLS, dt2: isDT2, rank: rank[c.id], data: isLS || isDT2 || this.hov === c.id });
        } else if (o.mode === 'rws' && s.ltws && (isLS || isDT2 || this.hov === c.id || isSel)) {
          this.sym(ctx, x, y, c, { ls: isLS, dt2: isDT2, data: true });
        } else {
          ctx.fillStyle = GREEN;
          ctx.fillRect(x - 4 * ik, y - 2 * ik, 8 * ik, 4 * ik);
          if (isSel && o.mode === 'rws') { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1; ctx.strokeRect(x - 9, y - 7, 18, 14); }
        }
        ctx.globalAlpha = 1;
      }
      // Zona de disparo del L&S (TWS): marcas Rmax y Rne a la altura del blanco
      if (o.zone && s.ls && !s.raid) {
        const c = this.get(s.ls);
        const z = this.zone(c);
        const [x] = this.scopeXY(g, c.sb, c.sr);
        ctx.font = `10px ${MONO}`;
        ctx.textBaseline = 'middle';
        for (const [v, lab] of [[z.rmax, 'Rmax'], [z.rne, 'Rne']]) {
          const [, y] = this.scopeXY(g, 0, v);
          if (y < g.y0 || y > g.y0 + S) continue;
          ctx.strokeStyle = lab === 'Rne' ? RED : YELLOW; ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.lineTo(x + 26, y); ctx.stroke();
          ctx.textAlign = 'left'; ctx.fillText(lab, x + 28, y);
        }
      }
      // Cursor
      if (this.cur) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(this.cur.x - 6, this.cur.y); ctx.lineTo(this.cur.x + 6, this.cur.y); ctx.moveTo(this.cur.x, this.cur.y - 6); ctx.lineTo(this.cur.x, this.cur.y + 6); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(70,255,114,0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(g.x0 + 0.5, g.y0 + 0.5, S - 1, S - 1);

      // Rótulos de la pantalla
      ctx.font = `12px ${MONO}`;
      ctx.fillStyle = GREEN;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      const modeLabel = s.stt ? 'STT' : s.raid ? 'RAID' : o.mode === 'tws' ? 'TWS' : 'RWS' + (s.ltws ? '·LTWS' : '');
      ctx.fillText(modeLabel, g.x0 + 6, g.y0 + 5);
      if (!s.stt) ctx.fillText(`${s.raid ? C.raid.bars : s.bars}B  ${Math.round(az)}°`, g.x0 + 6, g.y0 + 19);
      ctx.textAlign = 'right';
      ctx.fillText(s.raid ? '10 NM' : String(s.scale), g.x0 + S - 6, g.y0 + 5);
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'left';
      ctx.fillText('RUMBO ▲', g.x0 + 6, g.y0 + S - 5);
      if (this.msgT > 0) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `bold 13px ${MONO}`;
        ctx.fillStyle = YELLOW;
        ctx.fillText(this.msg, g.x0 + S / 2, g.y0 + S * 0.16);
      }
      ctx.font = LABEL;
      ctx.fillStyle = 'rgba(232,228,220,0.5)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('PANTALLA DEL RADAR', g.x0, g.y0 - 3);

      // ---------- Vista desde arriba (real) o leyenda ----------
      if (o.plan) this.drawPlan(ctx, g);
      else this.drawLegend(ctx, g);
    }

    zone(c) {
      const w = C.weapons['120'];
      const k = clamp((c.closure || 700) / C.launchZone.closureRefKt, 0, 1);
      const rmax = w.rmaxNm * (C.launchZone.aspectMin + (1 - C.launchZone.aspectMin) * Math.pow(k, C.launchZone.curve || 1));
      return { rmax, rne: rmax * w.rneFrac };
    }

    drawPlan(ctx, g) {
      const s = this.s;
      const o = this.o;
      const { px, pw, S, y0 } = g;
      const R = Math.min(S - 22, pw / 2 - 4);
      const ox = px + pw / 2 - 3;
      const oy = y0 + R + 12;
      const scale = s.raid ? 60 : s.scale;
      const rp = (nm) => (nm / scale) * R;
      const P = (b, r) => [ox + rp(r) * Math.sin(b * RAD), oy - rp(r) * Math.cos(b * RAD)];
      ctx.save();
      ctx.fillStyle = '#0b0d0c';
      ctx.fillRect(px - 6, y0, pw + 10, R + 24);
      ctx.beginPath(); ctx.rect(px - 6, y0, pw + 10, R + 24); ctx.clip();
      // anillos
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(ox, oy, rp(scale * i / 4), -Math.PI, 0); ctx.stroke(); }
      // Límite de detección didáctico
      if (DET_NM <= scale) {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(224,82,74,0.6)';
        ctx.beginPath(); ctx.arc(ox, oy, rp(DET_NM), -Math.PI, 0); ctx.stroke(); ctx.setLineDash([]);
      }
      // Cono IFF
      if (o.iffCone) {
        ctx.fillStyle = 'rgba(80,160,255,0.16)'; ctx.strokeStyle = 'rgba(120,180,255,0.8)';
        ctx.beginPath(); ctx.moveTo(ox, oy);
        for (let a = -C.iff.azHalfDeg; a <= C.iff.azHalfDeg; a += 2) { const [x, y] = P(a, C.iff.maxNm); ctx.lineTo(x, y); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      // Sector que barre el radar
      const az = this.effAz();
      ctx.fillStyle = 'rgba(201,168,76,0.17)'; ctx.strokeStyle = 'rgba(201,168,76,0.8)';
      ctx.beginPath(); ctx.moveTo(ox, oy);
      for (let a = this.ant - az / 2; a <= this.ant + az / 2 + 0.01; a += 2) { const [x, y] = P(a, scale); ctx.lineTo(x, y); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Zona de disparo
      if (o.zone && s.ls) {
        const c = this.get(s.ls);
        const z = this.zone(c);
        for (const [v, col] of [[z.rmax, YELLOW], [z.rne, RED]]) {
          ctx.strokeStyle = col; ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let a = c.b - 12; a <= c.b + 12; a += 2) { const [x, y] = P(a, v); a === c.b - 12 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
          ctx.stroke();
        }
      }
      // Contactos reales
      ctx.font = LABEL;
      for (const c of this.contacts) {
        if (c.r > scale) continue;
        const [x, y] = P(c.b, c.r);
        const seen = (this.age(c) <= s.age) || s.stt === c.id;
        const col = c.side === 'friend' ? GREEN : RED;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.2832);
        if (seen) { ctx.fillStyle = col; ctx.fill(); } else { ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.stroke(); }
        ctx.fillStyle = 'rgba(232,228,220,0.75)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(c.name, x + 7, y);
      }
      // Tu avión
      ctx.fillStyle = '#cfd6e3';
      ctx.beginPath(); ctx.moveTo(ox, oy - 7); ctx.lineTo(ox + 5, oy + 3); ctx.lineTo(ox - 5, oy + 3); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.font = LABEL;
      ctx.fillStyle = 'rgba(232,228,220,0.5)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('REAL, DESDE ARRIBA', px - 6, y0 - 3);
      // Clave de la vista desde arriba
      const ky = y0 + R + 40;
      const key = (i, draw, text) => { draw(px + 4, ky + i * 18); ctx.fillStyle = 'rgba(232,228,220,0.75)'; ctx.font = "400 11px 'Barlow', sans-serif"; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, px + 16, ky + i * 18); };
      key(0, (x, y) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.2832); ctx.fillStyle = RED; ctx.fill(); }, 'Avión visto por el radar');
      key(1, (x, y) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.2832); ctx.strokeStyle = RED; ctx.lineWidth = 1.3; ctx.stroke(); }, 'Avión sin eco en pantalla');
      key(2, (x, y) => { ctx.fillStyle = 'rgba(201,168,76,0.5)'; ctx.fillRect(x - 4, y - 4, 8, 8); }, 'Zona que barre el radar');
    }

    drawLegend(ctx, g) {
      const items = this.o.legend || [];
      let y = g.y0 + 8;
      const x = g.px;
      ctx.font = LABEL;
      ctx.fillStyle = 'rgba(232,228,220,0.5)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('SÍMBOLOS', x, g.y0 - 3);
      for (const it of items) {
        const cx = x + 18, cy = y + 16;
        const fake = { id: '_', mach: 0.9, alt: 30 };
        if (it.k === 'brick') { ctx.fillStyle = GREEN; ctx.fillRect(cx - 5, cy - 2.5, 10, 5); }
        else if (it.k === 'plus') { ctx.strokeStyle = YELLOW; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5); ctx.stroke(); }
        else { this.s.iff._ = it.k; this.sym(ctx, cx, cy, fake, { ls: it.ls, dt2: it.dt2 }); delete this.s.iff._; }
        ctx.fillStyle = 'rgba(232,228,220,0.85)';
        ctx.font = "400 12px 'Barlow', sans-serif";
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        this.wrap(ctx, it.t, x + 38, cy, g.pw - 34);
        y += 38;
      }
    }
    wrap(ctx, text, x, y, w) {
      const words = text.split(' ');
      let line = '';
      const lines = [];
      for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > w && line) { lines.push(line); line = wd; } else line = t; }
      lines.push(line);
      lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * 14));
    }

    read() {
      const s = this.s;
      const o = this.o;
      const lines = [];
      const fmtB = (b) => String(Math.round((b + 360) % 360)).padStart(3, '0') + '°';
      if (o.period) {
        const az = this.effAz(), N = this.effBars();
        const per = N * az / SCAN;
        lines.push(`Tiempo entre barridos de la misma altura: <b>${per.toFixed(1).replace('.', ',')} s</b> (${N} ${N === 1 ? 'barra' : 'barras'} × ${az}° a ${SCAN}°/s)`);
      }
      if (o.mode === 'tws' && o.zone) {
        const m = C.display.twsMaxAz[s.bars] || s.az;
        lines.push(`TWS con <b>${s.bars}B</b>: azimut máximo <b>${m}°</b> · centrado <b>${s.centering}</b>${s.ls ? '' : ' (sin L&amp;S solo MAN)'}`);
        if (s.ls) { const c = this.get(s.ls); const z = this.zone(c); lines.push(`L&amp;S a <b>${c.sr.toFixed(0)} NM</b>: Rmax <b>${z.rmax.toFixed(0)} NM</b> · Rne <b>${z.rne.toFixed(0)} NM</b> (valores didácticos con AMRAAM)`); }
      }
      if (o.bra && s.bra) {
        if (this.cur) {
          const near = this.contacts.filter((c) => Math.hypot(c.r - this.cur.r, c.b - this.cur.b) < 6).sort((a, b) => a.r - b.r)[0];
          lines.push(`BRA <b>${fmtB(this.cur.b)} / ${Math.max(0, this.cur.r).toFixed(0)} NM</b>${near ? ` · altitud ${near.alt}` : ''}`);
        } else lines.push('BRA: pasa el cursor por la pantalla del radar');
      }
      const sel = this.get(s.sel);
      if (o.info === 'brick' && sel) lines.push(`Eco <b>${sel.name}</b>: solo sabes que hay algo en <b>${fmtB(sel.sb)}</b> a <b>${sel.sr.toFixed(0)} NM</b>. Sin altitud, sin Mach, sin identidad.`);
      if (o.info === 'symbol' && sel) lines.push(`Traza <b>${sel.name}</b>: Mach <b>${sel.mach.toFixed(1)}</b> · altitud <b>${sel.alt}</b> · IFF <b>${s.iff[sel.id] ? (s.iff[sel.id] === 'friend' ? 'amigo' : 'hostil') : 'ambiguo'}</b>`);
      if (s.stt) {
        const c = this.get(s.stt);
        lines.push(`STT en <b>${c.name}</b> · distancia <b>${c.r.toFixed(0)} NM</b> · cierre aprox. <b>${Math.abs(Math.round(450 * Math.cos(c.ang * RAD)))} kt</b>${this.notchOf(c) ? ' · <b style="color:#ffb0aa">¡en el notch!</b>' : ''}`);
      }
      const chips = [];
      if (o.chips === 'seen') for (const c of this.contacts) chips.push({ t: `${c.name} · ${c.r > DET_NM ? 'fuera de alcance' : this.age(c) <= s.age ? 'detectado' : 'sin eco'}`, on: this.age(c) <= s.age });
      if (o.chips === 'iff') for (const c of this.contacts) chips.push({ t: `${c.name} · ${s.iff[c.id] ? (s.iff[c.id] === 'friend' ? 'amigo' : 'hostil') : 'ambiguo'}`, on: !!s.iff[c.id] });
      if (o.chips === 'tracks') chips.push({ t: `L&S ${s.ls ? this.get(s.ls).name : '—'}`, on: !!s.ls }, { t: `DT2 ${s.dt2 ? this.get(s.dt2).name : '—'}`, on: !!s.dt2 });
      return { lines, chips };
    }
  }

  // ---------------------------------------------------------------------------------------------------------
  // Panel de botones del DDI
  // ---------------------------------------------------------------------------------------------------------
  // [n, texto, clave de ayuda en T.osb, columna, fila] sobre una rejilla 7x7
  const OSB_SEARCH = [
    [1, '4B', 'bars'], [2, 'SIL', 'sil'], [3, 'ERASE', 'erase'], [4, '', null], [5, '120C', 'wpn'],
    [6, '↑', 'rngUp'], [7, '↓', 'rngDn'], [8, 'SET', 'set'], [9, 'RSET', 'rset'], [10, 'NCTR', 'nctr'],
    [11, 'DATA', 'data'], [12, 'CHAN', 'chan'], [13, '', null], [14, '80°', 'az'], [15, 'MODE', 'mode15'],
    [16, 'PRF', 'prf'], [17, 'RDR PRI', 'rdrpri'], [18, 'SURF', 'surf'], [19, '', null], [20, 'RWS', 'modeSel'],
  ];
  const OSB_DATA = [
    [1, '', null], [2, 'SIL', 'sil'], [3, 'ERASE', 'erase'], [4, '', null], [5, '8', 'age'],
    [6, '', null], [7, 'RAID 1LOOK', 'raidlook'], [8, 'COLOR', 'color'], [9, 'MSI', 'msi'], [10, 'LTWS', 'ltws'],
    [11, 'DATA', 'data'], [12, 'DCLTR', 'dcltr'], [13, '', null], [14, 'BRA', 'bra'], [15, 'MODE', 'mode15'],
    [16, 'PRF', 'prf'], [17, '', null], [18, '', null], [19, 'ECCM', 'eccm'], [20, 'RWS', 'modeSel'],
  ];
  // posición en la rejilla (columna, fila) de cada OSB: arriba 1-5 (izq→der), derecha 6-10 (arriba→abajo), abajo 11-15 (der→izq), izquierda 16-20 (abajo→arriba)
  function osbCell(n) {
    if (n <= 5) return [n + 1, 1];
    if (n <= 10) return [7, n - 5 + 1];
    if (n <= 15) return [7 - (n - 10), 7];
    return [1, 7 - (n - 15)];
  }

  class OsbFig extends Base {
    constructor(host, opts, notify) {
      super(host, opts, notify);
      this.s = { sel: null };
      this.seen = new Set();
      this.list = opts.page === 'data' ? OSB_DATA : OSB_SEARCH;
      const box = document.createElement('div');
      box.className = 'osb-grid';
      for (const [n, label, key] of this.list) {
        const [col, row] = osbCell(n);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cosb' + (key ? '' : ' dead') + ((opts.hl || []).includes(n) ? ' hl' : '');
        b.style.gridColumn = String(col);
        b.style.gridRow = String(row);
        b.innerHTML = `<small>${n}</small><span>${label}</span>`;
        b.disabled = !key;
        b.addEventListener('click', () => { this.s.sel = n; this.seen.add(n); this.refreshSel(); const need = (opts.hl || []).length; if (need && (opts.hl || []).every((x) => this.seen.has(x))) this.flag('all'); this.notify(); });
        box.appendChild(b);
      }
      const mid = document.createElement('div');
      mid.className = 'osb-mid';
      mid.innerHTML = `<b>DDI</b><span>${opts.page === 'data' ? 'Página DATA' : 'Página del radar (RWS)'}</span><em>Pulsa un botón</em>`;
      box.appendChild(mid);
      this.host.appendChild(box);
      this.box = box;
    }
    refreshSel() {
      this.box.querySelectorAll('.cosb').forEach((b, i) => b.classList.toggle('on', this.list[i][0] === this.s.sel));
    }
    read() {
      if (this.s.sel == null) return { lines: ['Pulsa un botón del DDI para leer qué hace.'], chips: [] };
      const it = this.list.find((x) => x[0] === this.s.sel);
      return { lines: [`<b>${it[1]} (OSB ${it[0]})</b> — ${T.osb[it[2]]}`], chips: [] };
    }
  }

  // ---------------------------------------------------------------------------------------------------------
  // Tarjetas: lista de pasos o ideas en las que se hace clic
  // ---------------------------------------------------------------------------------------------------------
  class CardsFig extends Base {
    constructor(host, opts, notify) {
      super(host, opts, notify);
      this.s = { sel: null };
      this.seen = new Set();
      const wrap = document.createElement('div');
      wrap.className = 'cards';
      opts.items.forEach((it, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'card-it';
        b.innerHTML = `<i>${i + 1}</i><b>${it.title}</b><span>${it.sub || ''}</span>`;
        b.addEventListener('click', () => {
          this.s.sel = i; this.seen.add(i);
          wrap.querySelectorAll('.card-it').forEach((x, j) => { x.classList.toggle('on', j === i); x.classList.toggle('seen', this.seen.has(j)); });
          if (this.seen.size === opts.items.length) this.flag('all');
          this.notify();
        });
        wrap.appendChild(b);
      });
      this.host.appendChild(wrap);
    }
    read() {
      const it = this.o.items[this.s.sel];
      return { lines: [it ? `<b>${it.title}</b> — ${it.text}` : (this.o.hint || 'Pulsa una tarjeta para leer su explicación.')], chips: [] };
    }
  }

  window.RadarCourseFigs = {
    side: SideFig, scope: ScopeFig, osb: OsbFig, cards: CardsFig, BAR_S,
  };
})();
