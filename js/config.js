/*
 * CONFIGURACIÓN DEL RADAR — aquí están todos los números que se pueden ajustar.
 * Distancias en millas náuticas (NM), altitudes en pies (ft), velocidades en nudos (kt),
 * ángulos en grados.
 *
 * Los valores de "pantalla" (alcances, azimut, barras, límites de TWS...) siguen la
 * Guía de Chuck del F/A-18C. Los de "detección" (alcance, notch...) son una
 * simplificación pensada para enseñar, no datos reales.
 */
window.RadarConfig = {
  // Tu avión
  ownship: {
    alt: 20000,
    speedKt: 420,
    turnRateDegS: 4,        // velocidad de giro con A / D
  },

  // Pantalla y opciones de los botones
  display: {
    azHalfView: 70,         // la pantalla muestra de -70° a +70° (140° en total)
    gimbalLimit: 70,        // límite mecánico de la antena
    ranges: [5, 10, 20, 40, 80, 160],
    defaultRangeIdx: 3,
    azScans: [20, 40, 60, 80, 140], // ancho total del barrido (botón inferior)
    defaultAz: 80,
    barsOptions: [1, 2, 4, 6],
    defaultBars: 4,
    // TWS limita el volumen de barrido: para cada nº de barras, el azimut máximo
    twsMaxAz: { 2: 80, 4: 40, 6: 20 },
    spotAz: 22,             // ancho del barrido en modo SPOT (spotlight)
    vsMaxClosureKt: 2400,   // velocidad de cierre en lo alto de la pantalla en VS
    vsAltRangeNm: 40,       // en VS los números de altitud se dan a esta distancia
    showHoverData: false,   // ayuda didáctica (NO existe en el avión real): datos del blanco bajo el TDC en RWS
  },

  // La antena
  antenna: {
    scanRateDegS: 80,       // velocidad del barrido horizontal
    barSpacingDeg: 3.67,    // separación vertical entre barras (4 barras ≈ ±7.5°)
    beamHalfDeg: 2.0,       // semiancho VERTICAL del haz
    beamAzHalfDeg: 3.0,     // semiancho HORIZONTAL del haz (el cono estrecho del mapa del instructor)       // semiancho vertical del haz: un blanco se ve si cae dentro
    elevMin: -60,
    elevMax: 60,
    elevRateDegS: 20,       // velocidad al subir/bajar la antena con W / S
  },

  // Detección (simplificada)
  detection: {
    baseNm: 70,             // alcance contra un blanco "normal" (rcs = 1), en PRF MED
    rcsExponent: 0.25,      // cuánto influye el tamaño del blanco (alcance ~ rcs^0.25)
    hiFactor: 1.3,          // PRF HI: mucho alcance si el blanco se acerca...
    hiTailFactor: 0.6,      // ...y poco si se aleja
    medFactor: 0.85,        // PRF MED: alcance medio en cualquier aspecto
    notchKt: 100,           // "notch": blancos cuya velocidad radial respecto al suelo (a lo largo de la línea de visión) es menor que esto, es decir, que vuelan a ~90° de ella, desaparecen
    eccmFactor: 0.9,        // con ECCM activado el radar pierde algo de alcance (página DATA)
    sttBoost: 1.25,         // en STT el radar apunta fijo y llega más lejos
    sttNotchGraceS: 2.5,    // segundos que aguanta el lock dentro del notch antes de perderlo
  },

  rws: {
    brickAgeS: 8,           // segundos hasta que un brick se borra si no se refresca
    brickFadeMin: 0.25,     // opacidad mínima antes de borrarse
  },

  tws: {
    maxFiles: 10,           // máximo de trackfiles
    hafuMax: 8,             // los 8 más cercanos se ven como símbolo; el resto como brick (con HITS)
    vectorSec: 40,          // longitud de la línea de velocidad (segundos de vuelo)
    trackDropS: 12,         // segundos sin refrescar hasta perder el trackfile
    biasMarginDeg: 2,       // margen al desplazar el centro del barrido (BIAS)
  },

  // Arma seleccionada: solo se muestra en el botón superior derecho del radar (ej. "9M 2")
  weapon: { label: '9M', count: 2 },

  // IFF: al hacer STT el radar interroga al blanco y, al responder, su símbolo pasa a aliado / hostil / desconocido
  iff: {
    timeS: 1.5,             // segundos que tarda la interrogación
    maxNm: 60,              // alcance máximo de la interrogación
  },

  nctr: {
    maxNm: 25,              // alcance máximo para identificar el tipo de avión
    timeS: 4,               // segundos de "escucha" hasta identificarlo
  },

  tdc: {
    azRateDegS: 45,         // velocidad del cursor (flechas) en horizontal
    rngRatePerS: 0.6,       // y en vertical (fracción de pantalla por segundo)
    spotHoldS: 0.8,         // pulsación larga en zona vacía => SPOT
  },

  /*
   * Escenarios. Cada blanco:
   *   type: nombre (lo muestra NCTR)   rangeNm / bearing: dónde empieza (bearing 0 = delante)
   *   alt: altitud   hdg: rumbo   speed: velocidad   rcs: tamaño (1 = caza normal, 4 = bombardero...)
   *   side: 'hostile' (por defecto), 'friend' o 'unknown' (el IFF no lo identifica)
   */
  scenarios: {
    facil: {
      name: 'Fácil — un solo blanco de frente',
      targets: [
        { type: 'Su-27', rangeNm: 50, bearing: 5, alt: 22000, hdg: 185, speed: 450, rcs: 1 },
      ],
    },
    normal: {
      name: 'Normal — grupo de cuatro',
      targets: [
        { type: 'MiG-29', rangeNm: 45, bearing: -10, alt: 24000, hdg: 170, speed: 450, rcs: 1 },
        { type: 'MiG-29', rangeNm: 47, bearing: 0, alt: 26000, hdg: 175, speed: 450, rcs: 1 },
        { type: 'Su-27', rangeNm: 52, bearing: 12, alt: 18000, hdg: 190, speed: 460, rcs: 1.2 },
        { type: 'B-52', rangeNm: 70, bearing: 25, alt: 30000, hdg: 200, speed: 380, rcs: 4 },
      ],
    },
    notch: {
      name: 'Notch — un blanco que se "esconde"',
      targets: [
        // Cruza a 90° de tu línea de visión (rumbo = marcación + 90°): cae en el notch y el radar no lo ve
        { type: 'Su-27', rangeNm: 30, bearing: 50, alt: 20000, hdg: 140, speed: 450, rcs: 1 },
        // Este sí se acerca y se ve
        { type: 'MiG-29', rangeNm: 55, bearing: -15, alt: 20000, hdg: 170, speed: 450, rcs: 1 },
      ],
    },
    mezcla: {
      name: 'Con amigo — distinguir aliados (IFF y NCTR)',
      targets: [
        // Amigo que vuelve en sentido contrario: se acerca, así que el radar lo ve (un amigo que cruzara a 90° de tu línea de visión caería en el notch)
        { type: 'F-16', side: 'friend', rangeNm: 25, bearing: -20, alt: 20000, hdg: 140, speed: 450, rcs: 1 },
        { type: 'Su-27', rangeNm: 48, bearing: 8, alt: 21000, hdg: 185, speed: 450, rcs: 1.2 },
        { type: 'MiG-29', side: 'unknown', rangeNm: 52, bearing: 20, alt: 19000, hdg: 190, speed: 450, rcs: 1 }, // sin respuesta IFF: desconocido
      ],
    },
    dificil: {
      name: 'Difícil — varios niveles de altitud',
      targets: [
        { type: 'MiG-29', rangeNm: 35, bearing: -25, alt: 5000, hdg: 160, speed: 480, rcs: 1 },
        { type: 'Su-27', rangeNm: 50, bearing: 0, alt: 35000, hdg: 180, speed: 520, rcs: 1.2 },
        { type: 'Su-27', rangeNm: 28, bearing: 40, alt: 20000, hdg: 130, speed: 450, rcs: 1 },
        { type: 'MiG-31', rangeNm: 65, bearing: 10, alt: 40000, hdg: 185, speed: 600, rcs: 2 },
        { type: 'Su-25', rangeNm: 20, bearing: -45, alt: 2000, hdg: 90, speed: 300, rcs: 0.6 },
      ],
    },
  },
};
