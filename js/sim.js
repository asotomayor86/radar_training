/*
 * Motor de simulación: mundo, antena, detección y modos RWS / TWS / VS / STT.
 * Reglas basadas en la Guía de Chuck del F/A-18C (parte 9, radar AN/APG-73).
 */
(function () {
  const C = window.RadarConfig;
  const T = window.RadarText;
  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;
  const FT_PER_NM = 6076.12;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = (a) => {
    a %= 360;
    if (a > 180) a -= 360;
    if (a < -180) a += 360;
    return a;
  };
  const vel = (hdg, speed) => [Math.sin(hdg * D2R) * speed, Math.cos(hdg * D2R) * speed];

  function machOf(speedKt, altFt) {
    const tempK = 288.15 - 0.0019812 * Math.min(altFt, 36089);
    return speedKt / (661.47 * Math.sqrt(tempK / 288.15));
  }

  class Sim {
    constructor() {
      this.rng = Math.random;   // fuente de azar (se puede sustituir en las pruebas)
      this.awacs = true;        // CON AWACS: el mapa muestra siempre la posición real de todos los aviones
      this.loadScenario(Object.keys(C.scenarios)[0]);
    }

    loadScenario(key) {
      const sc = C.scenarios[key];
      this.scenarioKey = key;
      this.time = 0;          // reloj del ejercicio: desde que empieza
      this.doneAt = null;     // instante en que se identificó el último avión
      this.own = { x: 0, y: 0, hdg: 0, alt: C.ownship.alt, speed: C.ownship.speedKt, turn: 0 };
      // Aleatoriedad proporcional a la dificultad del escenario (1-4)
      const R = C.random;
      const d = R.enabled ? sc.difficulty || 1 : 0;
      const j = (amp) => (this.rng() * 2 - 1) * amp * d;
      this.targets = sc.targets.map((t, i) => {
        const rangeNm = Math.max(8, t.rangeNm + j(R.rangeNm));
        const bearing = t.bearing + j(R.bearingDeg);
        const hdg = t.beam ? bearing + 90 * t.beam + j(R.hdgDeg * 0.5) : t.hdg + j(R.hdgDeg);
        return {
          id: i + 1,
          type: t.type,
          side: t.side || 'hostile',
          rcs: t.rcs ?? 1,
          alt: Math.max(500, t.alt + j(R.altFt)),
          hdg: wrap(hdg),
          speed: Math.max(200, t.speed + j(R.speedKt)),
          x: Math.sin(bearing * D2R) * rangeNm,
          y: Math.cos(bearing * D2R) * rangeNm,
        };
      });
      this.radar = {
        mode: 'RWS',
        searchMode: 'RWS',
        standby: false,
        sil: false,
        nctr: false,
        power: 'OPR',
        eccm: false,
        color: false,
        msi: false,
        dcltr: 2,
        prf: 'INTL',
        rangeIdx: C.display.defaultRangeIdx,
        az: C.display.defaultAz,
        bars: C.display.defaultBars,
        bar: 0,
        elev: 0,
        scanCenter: 0,
        biasAz: 0,
        centering: 'AUTO',
        spot: null,
        hits: true,
        ltws: false,
        bra: true,
        dataPage: false,
        antAz: 0,
        dir: 1,
        stt: null,
        ls: null,
        dt2: null,
        ident: {},
        iff: {},     // id -> 'friend' | 'hostile' | 'unknown' (resultado de la interrogación IFF)
        iffT: 0,
        sttNotchT: 0,
        nctrT: 0,
        tdc: { az: 0, rng: 0.5 },
        contacts: {},
        msg: '',
        msgT: 0,
      };
      this.say(T.msg.scenario);
    }

    // ---- estado derivado ----
    get scale() { return C.display.ranges[this.radar.rangeIdx]; }
    get halfAz() { return this.radar.spot !== null ? C.display.spotAz / 2 : this.radar.az / 2; }
    get emitting() { const r = this.radar; return !r.standby && !r.sil; }
    say(text, secs = 2.5) { this.radar.msg = text; this.radar.msgT = secs; }

    barEl(i) {
      const a = C.antenna;
      const r = this.radar;
      return clamp(r.elev + (i - (r.bars - 1) / 2) * a.barSpacingDeg, a.elevMin, a.elevMax);
    }

    // Semialtura vertical que cubre el barrido (grados)
    get elevSpan() { return ((this.radar.bars - 1) / 2) * C.antenna.barSpacingDeg + C.antenna.beamHalfDeg; }

    // Altitudes (miles de pies) que cubre el haz a la distancia del cursor
    tdcAltitudes() {
      const r = this.radar;
      const rng = r.mode === 'VS' ? C.display.vsAltRangeNm : r.tdc.rng * this.scale;
      const f = (e) => (this.own.alt + rng * FT_PER_NM * Math.tan(e * D2R)) / 1000;
      return { top: f(r.elev + this.elevSpan), bottom: f(r.elev - this.elevSpan) };
    }

    // Geometría de un blanco respecto a tu avión
    rel(t) {
      const dx = t.x - this.own.x;
      const dy = t.y - this.own.y;
      const rng = Math.max(Math.hypot(dx, dy), 0.001);
      const az = wrap(Math.atan2(dx, dy) * R2D - this.own.hdg);
      const el = Math.atan2((t.alt - this.own.alt) / FT_PER_NM, rng) * R2D;
      const vt = vel(t.hdg, t.speed);
      const vo = vel(this.own.hdg, this.own.speed);
      const closure = -(((vt[0] - vo[0]) * dx + (vt[1] - vo[1]) * dy) / rng);
      // Velocidad del blanco a lo largo de la línea de visión, respecto al suelo: es 0 cuando vuela a 90° de ella
      const tgtRadial = (vt[0] * dx + vt[1] * dy) / rng;
      return { az, rng, el, closure, tgtRadial };
    }

    effectivePrf(closure) {
      const p = this.radar.prf;
      if (p !== 'INTL') return p;
      return closure > 0 ? 'HI' : 'MED';
    }

    maxDetect(rel, t) {
      const D = C.detection;
      const prf = this.radar.mode === 'VS' ? 'HI' : this.effectivePrf(rel.closure);
      const f = prf === 'HI' ? (rel.closure > 0 ? D.hiFactor : D.hiTailFactor) : D.medFactor;
      return D.baseNm * Math.pow(t.rcs, D.rcsExponent) * f * (this.radar.eccm ? D.eccmFactor : 1);
    }

    // Notch: el blanco vuela a 90° de la línea de visión (de costado, "beaming"). Su velocidad radial
    // respecto al suelo es ~0, el Doppler lo confunde con el eco del suelo y el radar lo descarta.
    inNotch(rel) { return Math.abs(rel.tgtRadial) < C.detection.notchKt; }

    // ---- modos y ajustes de barrido ----
    cycleMode() {
      const r = this.radar;
      if (r.mode === 'STT') return;
      const next = { RWS: 'TWS', TWS: 'VS', VS: 'RWS' }[r.mode];
      this.setSearchMode(next);
    }

    setSearchMode(m) {
      const r = this.radar;
      if (m === 'VS' || r.mode === 'VS') r.contacts = {}; // en VS no hay distancia: no se mezclan ecos
      r.mode = r.searchMode = m;
      r.spot = null;
      r.ls = r.dt2 = null;
      if (m === 'TWS') {
        r.centering = 'AUTO';
        this.fitTws('enter');
      }
    }

    // TWS limita barras/azimut para mantener los trackfiles al día.
    // Al entrar se mantienen las barras y se reduce el azimut (140°/1B pasa a 80°/2B).
    // Al cambiar uno de los dos, se reduce el otro si hace falta.
    fitTws(changed) {
      const r = this.radar;
      const max = C.display.twsMaxAz;
      if (changed === 'enter' && r.bars < 2) { r.bars = 2; r.az = Math.min(r.az, 80); }
      if (r.bars < 2) r.bars = 2;
      if (r.az > max[r.bars]) {
        if (changed === 'az') {
          const ok = C.display.barsOptions.filter((b) => b >= 2 && max[b] >= r.az);
          r.bars = ok.length ? ok[ok.length - 1] : 2;
        } else {
          const opts = C.display.azScans.filter((a) => a <= max[r.bars]);
          r.az = opts[opts.length - 1];
        }
      }
      r.bar = 0;
    }

    cycleBars() {
      const r = this.radar;
      const opts = r.mode === 'TWS' ? C.display.barsOptions.filter((b) => b >= 2) : C.display.barsOptions;
      r.bars = opts[(opts.indexOf(r.bars) + 1) % opts.length];
      r.bar = 0;
      if (r.mode === 'TWS') this.fitTws('bars');
    }

    cycleAz() {
      const r = this.radar;
      const opts = r.mode === 'TWS' ? C.display.azScans.filter((a) => a <= 80) : C.display.azScans;
      r.az = opts[(opts.indexOf(r.az) + 1) % opts.length];
      if (r.mode === 'TWS') this.fitTws('az');
      r.bar = 0;
    }

    cyclePrf() {
      const r = this.radar;
      r.prf = { INTL: 'HI', HI: 'MED', MED: 'INTL' }[r.prf];
    }

    cycleCentering() {
      const r = this.radar;
      r.centering = r.centering === 'AUTO' ? 'MAN' : 'AUTO';
      if (r.centering === 'MAN') r.scanCenter = this.scanCenter();
    }

    reset() {
      const r = this.radar;
      const d = C.display;
      r.az = d.defaultAz;
      r.bars = d.defaultBars;
      r.bar = 0;
      r.elev = 0;
      r.scanCenter = 0;
      r.centering = 'AUTO';
      r.spot = null;
      r.prf = 'INTL';
      r.rangeIdx = d.defaultRangeIdx;
      if (r.mode === 'TWS') this.fitTws('enter');
      this.say(T.msg.reset, 1.5);
    }

    setPower(p) {
      this.radar.power = p;
      this.setStandby(p !== 'OPR');
    }

    setStandby(on) {
      this.radar.standby = on;
      if (on) this.breakLock();
    }

    setSil(on) {
      this.radar.sil = on;
      if (on) { this.breakLock(); this.say(T.msg.silOn); }
    }

    erase() {
      const r = this.radar;
      r.contacts = {};
      r.ls = r.dt2 = null;
      this.say(T.msg.erased, 1.2);
    }

    // ---- designación (TDC depress / undesignate) ----
    // id: blanco bajo el cursor (o null si está en zona vacía)
    designate(id) {
      const r = this.radar;
      if (r.mode === 'STT') return;
      if (id == null) return this.depressEmpty();
      if (r.mode === 'VS' || (r.mode === 'RWS' && !r.ltws)) return this.lock(id);
      // LTWS o TWS: primer pulso = L&S (soft lock), segundo sobre el mismo = STT
      if (r.ls === id) return this.lock(id);
      if (r.ls == null) { r.ls = id; this.say(T.msg.ls); return; }
      r.dt2 = id;
      this.say(T.msg.dt2);
    }

    depressEmpty() {
      const r = this.radar;
      if (r.mode === 'TWS' && r.centering === 'AUTO') {
        r.centering = 'BIAS';
        r.biasAz = r.tdc.az;
      } else if (r.mode === 'TWS' && r.centering === 'BIAS') {
        r.biasAz = r.tdc.az;
      } else {
        r.centering = 'MAN';
        r.scanCenter = r.tdc.az;
      }
      r.spot = null;
    }

    startSpot() {
      const r = this.radar;
      if (r.mode === 'STT' || r.mode === 'VS') return;
      r.spot = r.tdc.az;
      this.say('SPOT', 1.5);
    }

    undesignate() {
      const r = this.radar;
      if (r.mode === 'STT') return this.breakLock();
      if (r.spot !== null) { r.spot = null; return; }
      const ids = Object.keys(r.contacts).map(Number).sort((a, b) => r.contacts[a].rng - r.contacts[b].rng);
      if (!ids.length || r.ls == null) return;
      if (r.dt2 != null) { [r.ls, r.dt2] = [r.dt2, r.ls]; return; } // intercambia L&S y DT2
      r.ls = ids[(ids.indexOf(r.ls) + 1) % ids.length];                // o recorre los trackfiles
    }

    // AACQ: bloquea el blanco bajo el cursor o, si no hay, el más cercano
    aacq(id) {
      const r = this.radar;
      if (r.mode === 'STT') return;
      if (id != null) return this.lock(id);
      const ids = Object.keys(r.contacts).map(Number).sort((a, b) => r.contacts[a].rng - r.contacts[b].rng);
      if (!ids.length) return this.say(T.msg.noTarget);
      this.lock(ids[0]);
    }

    lock(id) {
      const r = this.radar;
      const c = r.contacts[id];
      if (!c) return;
      if (r.mode !== 'STT') r.searchMode = r.mode;
      r.mode = 'STT';
      r.stt = id;
      r.contacts = { [id]: c }; // en STT solo queda el trackfile fijado
      r.ls = id;
      r.dt2 = null;
      r.spot = null;
      r.sttNotchT = 0;
      r.nctrT = 0;
      r.iffT = r.iff[id] ? C.iff.timeS : 0;
      this.say(T.msg.locked);
    }

    breakLock(text) {
      const r = this.radar;
      if (r.mode !== 'STT') return;
      r.mode = r.searchMode;
      r.stt = null;
      r.contacts = {};
      r.ls = r.dt2 = null;
      r.bar = 0;
      if (r.mode === 'TWS') r.centering = 'MAN';
      if (text) this.say(text, 3);
    }

    sttToTws() {
      this.breakLock();
      this.setSearchMode('TWS');
    }

    // ---- bucle ----
    update(dt) {
      const r = this.radar;
      this.time += dt;
      r.msgT = Math.max(0, r.msgT - dt);

      this.own.hdg = wrap(this.own.hdg + this.own.turn * C.ownship.turnRateDegS * dt);
      const vo = vel(this.own.hdg, this.own.speed);
      this.own.x += (vo[0] / 3600) * dt;
      this.own.y += (vo[1] / 3600) * dt;
      for (const t of this.targets) {
        const v = vel(t.hdg, t.speed);
        t.x += (v[0] / 3600) * dt;
        t.y += (v[1] / 3600) * dt;
      }

      if (r.mode === 'STT') this.updateStt(dt);
      else if (this.emitting) this.sweep(dt);

      // Envejecer ecos
      const maxAge = r.mode === 'TWS' ? C.tws.trackDropS : C.rws.brickAgeS;
      for (const id of Object.keys(r.contacts)) {
        if (Number(id) !== r.stt && this.time - r.contacts[id].time > maxAge) delete r.contacts[id];
      }
      for (const k of ['ls', 'dt2']) {
        if (r[k] != null && !r.contacts[r[k]]) {
          r[k] = null;
          if (k === 'ls' && r.mode === 'TWS') r.centering = 'MAN';
        }
      }
    }

    // Centro del barrido en azimut, según el modo de centrado
    scanCenter() {
      const r = this.radar;
      const G = C.display.gimbalLimit;
      const half = this.halfAz;
      let c = r.scanCenter;
      if (r.spot !== null) c = r.spot;
      else if (r.mode === 'TWS' && r.ls != null && r.contacts[r.ls]) {
        const ls = this.predict(r.contacts[r.ls], this.time - r.contacts[r.ls].time).az;
        if (r.centering === 'AUTO') c = ls;
        else if (r.centering === 'BIAS') {
          // Desplaza hacia biasAz todo lo posible manteniendo L&S y DT2 dentro del barrido
          const m = C.tws.biasMarginDeg;
          let lo = ls - half + m;
          let hi = ls + half - m;
          if (r.dt2 != null && r.contacts[r.dt2]) {
            const d2 = this.predict(r.contacts[r.dt2], this.time - r.contacts[r.dt2].time).az;
            lo = Math.max(lo, d2 - half + m);
            hi = Math.min(hi, d2 + half - m);
          }
          c = lo <= hi ? clamp(r.biasAz, lo, hi) : ls;
        }
      }
      return clamp(c, -G + half, G - half);
    }

    sweep(dt) {
      const r = this.radar;
      const G = C.display.gimbalLimit;
      const c = this.scanCenter();
      const lo = Math.max(-G, c - this.halfAz);
      const hi = Math.min(G, c + this.halfAz);
      let a = clamp(r.antAz, lo, hi);
      const prev = a;
      a += r.dir * C.antenna.scanRateDegS * dt;
      if (a >= hi) { a = hi; r.dir = -1; r.bar = (r.bar + 1) % r.bars; }
      else if (a <= lo) { a = lo; r.dir = 1; r.bar = (r.bar + 1) % r.bars; }
      r.antAz = a;

      // En TWS con AUTO, la elevación se centra en la altitud del L&S
      if (r.mode === 'TWS' && r.centering === 'AUTO' && r.ls != null) {
        const t = this.targets.find((x) => x.id === r.ls);
        if (t) r.elev = clamp(this.rel(t).el, C.antenna.elevMin, C.antenna.elevMax);
      }

      const segLo = Math.min(prev, a);
      const segHi = Math.max(prev, a);
      const barEl = this.barEl(r.bar);
      for (const t of this.targets) {
        const rel = this.rel(t);
        if (rel.az < segLo || rel.az > segHi) continue;
        if (Math.abs(rel.el - barEl) > C.antenna.beamHalfDeg) continue;
        if (r.mode === 'VS') {
          if (rel.closure <= 0 || rel.closure > C.display.vsMaxClosureKt) continue;
        } else if (rel.rng > this.scale) continue;
        if (this.inNotch(rel) || rel.rng > this.maxDetect(rel, t)) continue;
        this.addContact(t, rel);
      }
    }

    addContact(t, rel) {
      const r = this.radar;
      if (r.mode === 'TWS' && !r.contacts[t.id] && Object.keys(r.contacts).length >= C.tws.maxFiles) return;
      const v = vel(t.hdg, t.speed);
      r.contacts[t.id] = {
        id: t.id, type: t.type, side: t.side, az: rel.az, rng: rel.rng, closure: rel.closure,
        alt: t.alt, hdg: t.hdg, speed: t.speed, mach: machOf(t.speed, t.alt),
        wx: t.x, wy: t.y, vx: v[0], vy: v[1], time: this.time,
      };
    }

    updateStt(dt) {
      const r = this.radar;
      const t = this.targets.find((x) => x.id === r.stt);
      if (!t || !this.emitting) return this.breakLock(t ? null : T.msg.lostRange);
      const rel = this.rel(t);
      if (rel.rng > this.maxDetect(rel, t) * C.detection.sttBoost || Math.abs(rel.az) > C.display.gimbalLimit) {
        return this.breakLock(T.msg.lostRange);
      }
      if (this.inNotch(rel)) {
        r.sttNotchT += dt;
        if (r.sttNotchT > C.detection.sttNotchGraceS) return this.breakLock(T.msg.lostNotch);
      } else {
        r.sttNotchT = 0;
      }
      r.antAz = rel.az;
      r.elev = clamp(rel.el, C.antenna.elevMin, C.antenna.elevMax);
      this.addContact(t, rel);
      r.nctrT = r.nctr && rel.rng <= C.nctr.maxNm ? r.nctrT + dt : 0;
      if (r.nctrT >= C.nctr.timeS) r.ident[t.id] = true;

      // IFF: interroga al blanco fijado; al responder se conoce si es aliado, hostil o desconocido
      if (!r.iff[t.id] && rel.rng <= C.iff.maxNm) {
        r.iffT += dt;
        if (r.iffT >= C.iff.timeS) {
          r.iff[t.id] = t.side;
          if (this.doneAt === null && this.targets.every((x) => r.iff[x.id])) this.doneAt = this.time;
          this.say(T.msg['iff' + t.side[0].toUpperCase() + t.side.slice(1)], 3);
        }
      }
    }

    // ---- lo que debe dibujar la pantalla ----
    // Cada elemento: { id, style, az, f (0..1 altura en pantalla), alpha, c, isLS, isDT2, ... }
    displayContacts() {
      const r = this.radar;
      const out = [];
      const cs = Object.values(r.contacts);
      const ranked = [...cs].sort((a, b) => a.rng - b.rng).map((c) => c.id);
      for (const c of cs) {
        const age = this.time - c.time;
        const base = { id: c.id, c, isLS: r.ls === c.id, isDT2: r.dt2 === c.id, ident: !!r.ident[c.id], iff: r.iff[c.id], iffPending: r.mode === 'STT' && r.stt === c.id && !r.iff[c.id] };
        if (r.mode === 'STT') {
          out.push({ ...base, style: 'stt', az: c.az, f: c.rng / this.scale, alpha: 1 });
        } else if (r.mode === 'VS') {
          out.push({ ...base, style: 'brick', az: c.az, f: c.closure / C.display.vsMaxClosureKt, alpha: this.fade(age) });
        } else if (r.mode === 'RWS') {
          out.push({ ...base, style: 'brick', az: c.az, f: c.rng / this.scale, alpha: this.fade(age) });
        } else {
          // TWS: el radar "adivina" dónde está ahora el blanco
          const p = this.predict(c, age);
          const v = this.predict(c, age + C.tws.vectorSec);
          const top = ranked.indexOf(c.id) < C.tws.hafuMax || base.isLS || base.isDT2;
          if (!top && !r.hits) continue;
          out.push({ ...base, style: top ? 'hafu' : 'brick', az: p.az, f: p.rng / this.scale, alpha: top ? 1 : this.fade(age), vec: { az: v.az, f: v.rng / this.scale } });
        }
      }
      return out;
    }

    fade(age) { return 1 - (1 - C.rws.brickFadeMin) * Math.min(1, age / C.rws.brickAgeS); }

    predict(c, secs) {
      const x = c.wx + (c.vx / 3600) * secs;
      const y = c.wy + (c.vy / 3600) * secs;
      const dx = x - this.own.x;
      const dy = y - this.own.y;
      return { az: wrap(Math.atan2(dx, dy) * R2D - this.own.hdg), rng: Math.hypot(dx, dy) };
    }

    get nctrDone() { const r = this.radar; return r.mode === 'STT' && r.ident[r.stt]; }
  }

  window.RadarSim = Sim;
})();
