/*
 * Mapa del instructor: la "verdad" que el radar no te cuenta.
 * Arriba: vista desde arriba con la posición real de cada avión y la cuña que barre la antena.
 * Abajo: vista lateral (distancia contra altitud) con la altura que cubre el haz.
 */
(function () {
  const C = window.RadarConfig;
  const T = window.RadarText;
  const D2R = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FT_PER_NM = 6076.12;
  const W = 300;
  const H = 540;                 // arriba W x W, abajo W x (H - W): la vista lateral es el 80 % de la superior
  const MONO = 'ui-monospace, Consolas, monospace';
  const INK = '#b8c7bd';
  const LINE = 'rgba(120,220,150,0.22)';
  const WEDGE = 'rgba(70,255,114,0.13)';
  const BEAM = 'rgba(70,255,114,0.42)';
  const YELLOW = '#ffe14d';
  const HOSTILE = '#ff6b5e';
  const FRIEND = '#5ee08a';
  const UNKNOWN = '#ffe14d';
  const GRAY = '#8d9691';          // contacto aún sin identificar
  const NOTCH = '#e0b24a';

  class InstructorMap {
    constructor(canvas, sim) {
      this.canvas = canvas;
      this.sim = sim;
      const dpr = Math.max(window.devicePixelRatio || 1, 2); // el mapa se muestra más grande que su tamaño lógico
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      this.ctx = canvas.getContext('2d');
      this.ctx.scale(dpr, dpr);
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', T.map.aria);
    }

    marker(x, y, side, size = 5.4) {
      const ctx = this.ctx;
      ctx.fillStyle = side === 'hostile' ? HOSTILE : side === 'friend' ? FRIEND : side === 'unknown' ? UNKNOWN : side === 'own' ? INK : GRAY;
      ctx.beginPath();
      if (side === 'friend') ctx.arc(x, y, size, 0, Math.PI * 2);
      else { ctx.moveTo(x, y - size); ctx.lineTo(x + size, y + size); ctx.lineTo(x - size, y + size); ctx.closePath(); }
      ctx.fill();
    }

    // Lo que se sabe de un avión: null hasta que el IFF (al fijarlo en STT) responde; luego 'friend', 'hostile' o 'unknown'
    idOf(t) { return this.sim.radar.iff[t.id] || null; }

    // ¿Está el avión dentro del barrido horizontal de la antena? (en STT, solo el blanco fijado)
    scanned(o) {
      const s = this.sim;
      const r = s.radar;
      if (!s.emitting) return false;
      if (r.mode === 'STT') return o.t.id === r.stt;
      return Math.abs(o.rel.az - s.scanCenter()) <= s.halfAz;
    }

    render() {
      const s = this.sim;
      const r = s.radar;
      const ctx = this.ctx;
      const scale = s.scale;
      const L = s.targets.map((t) => ({ t, rel: s.rel(t) }));
      // CON AWACS se ve siempre la posición real de todos. SIN AWACS solo se ven los aviones que el radar detecta
      // en este momento y los que ya has identificado (esos se ven siempre).
      const known = (t) => s.awacs || !!r.iff[t.id] || !!r.contacts[t.id];
      const visible = L.filter((o) => known(o.t) && o.rel.rng <= scale && Math.abs(o.rel.az) <= 90);

      ctx.save();
      ctx.fillStyle = '#0b0d0c';
      ctx.fillRect(0, 0, W, H);
      ctx.font = `10px ${MONO}`;
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 1;

      // ---- Vista superior ----
      const gx = W / 2;
      const gy = 0.94 * W;
      const m = 0.86 * W;
      const pt = (az, rng) => ({ x: gx + (rng / scale) * m * Math.sin(az * D2R), y: gy - (rng / scale) * m * Math.cos(az * D2R) });

      const stt = r.mode === 'STT' && r.stt != null ? L.find((o) => o.t.id === r.stt) : null;

      // Cuña que barre la antena
      if (s.emitting && r.mode !== 'STT') {
        const c = s.scanCenter();
        ctx.fillStyle = WEDGE;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.arc(gx, gy, m, (c - s.halfAz) * D2R - Math.PI / 2, (c + s.halfAz) * D2R - Math.PI / 2);
        ctx.closePath();
        ctx.fill();
      }
      // Anillos de distancia y línea central
      ctx.strokeStyle = LINE;
      for (const f of [0.25, 0.5, 0.75, 1]) { ctx.beginPath(); ctx.arc(gx, gy, f * m, Math.PI, 2 * Math.PI); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - m); ctx.stroke();
      // El haz: un cono estrecho (ancho del haz en azimut) que se mueve de lado a lado dentro del cono grande
      if (s.emitting) {
        const az = stt ? stt.rel.az : r.antAz;
        const hw = C.antenna.beamAzHalfDeg;
        ctx.fillStyle = BEAM;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.arc(gx, gy, m, (az - hw) * D2R - Math.PI / 2, (az + hw) * D2R - Math.PI / 2);
        ctx.closePath();
        ctx.fill();
      }
      // Marcas de distancia (NM) de los anillos, sobre la línea central; iguales a las de la vista lateral
      ctx.strokeStyle = 'rgba(184,199,189,0.6)';
      ctx.fillStyle = 'rgba(184,199,189,0.8)';
      ctx.lineWidth = 1;
      ctx.font = `9px ${MONO}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.beginPath();
      for (const f of [0.25, 0.5, 0.75, 1]) { const ry = gy - f * m; ctx.moveTo(gx - 3, ry); ctx.lineTo(gx + 3, ry); }
      ctx.stroke();
      for (const f of [0.25, 0.5, 0.75, 1]) ctx.fillText(String(+(scale * f).toFixed(2)), gx + 6, gy - f * m);
      ctx.font = `10px ${MONO}`;

      // El TDC (los dos "brackets" amarillos de la pantalla): se ve cómo se mueve en azimut y en distancia
      const tdcOn = r.mode !== 'STT';
      if (tdcOn && r.mode !== 'VS') {
        const tp = pt(r.tdc.az, r.tdc.rng * scale);
        ctx.strokeStyle = 'rgba(255,225,77,0.4)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(tp.x, tp.y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tp.x - 5, tp.y - 8); ctx.lineTo(tp.x - 5, tp.y + 8);
        ctx.moveTo(tp.x + 5, tp.y - 8); ctx.lineTo(tp.x + 5, tp.y + 8);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // Aviones: posición real, rumbo y velocidad (1 minuto de vuelo) y altitud en miles de pies
      for (const { t, rel } of visible) {
        const p = pt(rel.az, rel.rng);
        const id = this.idOf(t);
        const col = id === 'hostile' ? HOSTILE : id === 'unknown' ? UNKNOWN : id === 'friend' ? FRIEND : GRAY;
        const a = (t.hdg - s.own.hdg) * D2R;
        const len = (t.speed / 60 / scale) * m;
        ctx.strokeStyle = col;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.sin(a) * len, p.y - Math.cos(a) * len); ctx.stroke();
        this.marker(p.x, p.y, id);
        ctx.fillStyle = INK;
        ctx.textAlign = 'left';
        ctx.fillText(String(Math.round(t.alt / 1000)), p.x + 9, p.y);
        // Dentro del barrido pero con velocidad de cierre casi nula: el radar no lo ve (notch)
        if (s.inNotch(rel) && this.scanned({ t, rel })) {
          ctx.fillStyle = NOTCH;
          ctx.fillText('NOTCH', p.x + 9, p.y + 11);
        }
      }
      this.marker(gx, gy, 'own');
      ctx.fillStyle = INK;
      ctx.textAlign = 'left';
      ctx.fillText(`${T.map.truth} · ${scale} NM`, 9, 12);
      // A la derecha: aviones del ejercicio que aún no se han identificado
      const pending = s.targets.filter((t) => !this.idOf(t)).length;
      ctx.textAlign = 'right';
      ctx.fillStyle = pending ? NOTCH : FRIEND;
      // Al terminar, junto al aviso sale el tiempo que se ha tardado desde el inicio del ejercicio
      const clock = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
      ctx.fillText(pending ? `${T.map.unidentified}: ${pending}` : `${T.map.allIdentified}  ${clock(s.doneAt ?? s.time)}`, W - 9, 12);

      // ---- Vista lateral ----
      const k = H - W;
      const x0 = 0.05 * W;
      const xw = 0.9 * W;
      const X = (rng) => x0 + (rng / scale) * xw;
      // Escala vertical que depende del alcance: el cono de las SEIS barras (la cobertura máxima) con la antena
      // recta cabe siempre entero en el gráfico. El centro es la altitud de tu avión.
      const halfSix = ((6 - 1) / 2) * C.antenna.barSpacingDeg + C.antenna.beamHalfDeg;
      const hMax = scale * FT_PER_NM * Math.tan(halfSix * D2R);
      const Y = (alt) => W + 0.5 * k - ((alt - s.own.alt) / hMax) * 0.40 * k;
      ctx.strokeStyle = LINE;
      ctx.beginPath(); ctx.moveTo(0, W); ctx.lineTo(W, W); ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.rect(0, W, W, k); ctx.clip();

      const oy = Y(s.own.alt);
      if (s.emitting && (r.mode === 'RWS' || r.mode === 'TWS' || r.mode === 'VS')) {
        // Altura que cubre el haz al llegar al borde de la escala
        const span = s.elevSpan;
        const hi = s.own.alt + scale * FT_PER_NM * Math.tan((r.elev + span) * D2R);
        const lo = s.own.alt + scale * FT_PER_NM * Math.tan((r.elev - span) * D2R);
        ctx.fillStyle = WEDGE;
        ctx.beginPath(); ctx.moveTo(X(0), oy); ctx.lineTo(X(scale), Y(hi)); ctx.lineTo(X(scale), Y(lo)); ctx.closePath(); ctx.fill();
        const altAt = (deg) => s.own.alt + scale * FT_PER_NM * Math.tan(deg * D2R);
        // El haz: un cono estrecho (semiancho del haz) que salta de barra en barra en cada barrido
        const be = s.barEl(r.bar);
        const bh = C.antenna.beamHalfDeg;
        ctx.fillStyle = BEAM;
        ctx.beginPath();
        ctx.moveTo(X(0), oy);
        ctx.lineTo(X(scale), Y(altAt(be + bh)));
        ctx.lineTo(X(scale), Y(altAt(be - bh)));
        ctx.closePath();
        ctx.fill();
      }
      if (stt && s.emitting) {
        // En STT el haz apunta al blanco: mismo cono estrecho, centrado en su elevación
        const alt = (deg) => s.own.alt + scale * FT_PER_NM * Math.tan(deg * D2R);
        const bh = C.antenna.beamHalfDeg;
        ctx.fillStyle = BEAM;
        ctx.beginPath();
        ctx.moveTo(X(0), oy);
        ctx.lineTo(X(scale), Y(alt(stt.rel.el + bh)));
        ctx.lineTo(X(scale), Y(alt(stt.rel.el - bh)));
        ctx.closePath();
        ctx.fill();
      }
      // La línea amarilla del TDC: va hacia delante y hacia atrás con su distancia y sus extremos son la altitud
      // máxima y mínima (miles de pies) que el haz cubre a esa distancia, los mismos números que junto al TDC
      if (tdcOn) {
        const alts = s.tdcAltitudes();
        const tx = X(r.mode === 'VS' ? C.display.vsAltRangeNm : r.tdc.rng * scale);
        const yTop = Y(alts.top * 1000);
        const yBot = Y(alts.bottom * 1000);
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(tx, yTop); ctx.lineTo(tx, yBot);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(tx - 3, yTop); ctx.lineTo(tx + 3, yTop);
        ctx.moveTo(tx - 3, yBot); ctx.lineTo(tx + 3, yBot);
        ctx.stroke();
        ctx.fillStyle = YELLOW;
        ctx.font = `10px ${MONO}`;
        ctx.textAlign = 'left';
        const lx = Math.min(tx + 7, W - 28);
        ctx.fillText(String(Math.round(alts.top)), lx, clamp(yTop - 6, W + 22, H - 8));
        ctx.fillText(String(Math.round(alts.bottom)), lx, clamp(yBot + 7, W + 22, H - 8));
      }

      // La vista lateral solo muestra lo que está dentro del barrido horizontal: fuera del azimut desaparece
      for (const o of visible) if (this.scanned(o)) this.marker(X(o.rel.rng), Y(o.t.alt), this.idOf(o.t), 4.6);
      this.marker(X(0), oy, 'own', 4.6);

      // Marcas de distancia (NM) en el borde inferior, en los mismos cuartos que los anillos de la vista superior;
      // las cifras cambian con la escala del radar
      ctx.strokeStyle = 'rgba(184,199,189,0.6)';
      ctx.fillStyle = 'rgba(184,199,189,0.8)';
      ctx.lineWidth = 1;
      ctx.font = `9px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.beginPath();
      for (let i = 0; i <= 4; i++) { const tx = X((scale * i) / 4); ctx.moveTo(tx, H - 19); ctx.lineTo(tx, H - 14); }
      ctx.stroke();
      for (let i = 0; i <= 4; i++) {
        const label = String(+((scale * i) / 4).toFixed(2));
        ctx.fillText(i === 0 ? `${label} NM` : label, X((scale * i) / 4), H - 7);
      }
      ctx.restore();

      ctx.fillStyle = INK;
      ctx.textAlign = 'left';
      ctx.fillText(T.map.side, 9, W + 12);
      ctx.restore();
    }
  }

  window.RadarMap = InstructorMap;
})();
