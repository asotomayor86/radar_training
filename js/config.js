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
    ageOptions: [2, 4, 8, 16, 32], // segundos que se conserva un eco o una traza sin refrescar (botón AGE de la página DATA)
    defaultAgeIdx: 2,       // 8 s, el valor que recomiendan
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
    slewRateDegS: 80,       // velocidad máxima con la que la antena se reposiciona en azimut (cambio de centro, lock...)
    slewTolDeg: 3,          // la antena solo se reposiciona si está más de estos grados fuera de la ventana de barrido
    elevSlewDegS: 40,       // idem en elevación (cuando el radar la manda solo: STT, TWS en AUTO)
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
    sttBoost: 1.25,         // en STT el radar apunta fijo y llega más lejos
    sttNotchGraceS: 2.5,    // segundos que aguanta el lock dentro del notch antes de perderlo
  },

  rws: {
    // (el tiempo que se conserva un eco lo elige el botón AGE de la página DATA: ver display.ageOptions)
    brickFadeMin: 0.25,     // opacidad mínima antes de borrarse
  },

  tws: {
    maxFiles: 10,           // máximo de trackfiles
    hafuMax: 8,             // los 8 más cercanos se ven como símbolo; el resto como brick (con HITS)
    vectorSec: 10,          // segundos de vuelo con los que se calcula la DIRECCIÓN del vector de velocidad
    vectorPx: 11,           // longitud del vector en la pantalla (fija, medida en capturas del vídeo del escuadrón)
    vectorGapPx: 7,         // distancia del centro del símbolo a la que nace el vector (su borde inferior)
    biasMarginDeg: 2,       // margen al desplazar el centro del barrido (BIAS)
  },

  // Arma seleccionada: solo se muestra en el botón superior derecho del radar (ej. "9M 2")
  // Armas (teclas 1, 2, 3 o clic en el botón 5). Con SET se guarda la configuración de barras y azimut de cada una.
  weapons: {
    // rmaxNm: alcance máximo contra un blanco que se acerca de frente; rneNm: fracción de ese alcance que es "sin escape";
    // rminNm: alcance mínimo. VALORES DIDÁCTICOS: la guía no da cifras; el alcance real varía con altitud, velocidad y aspecto.
    '120': { label: '120C', count: 4, rmaxNm: 40, rneFrac: 0.4, rminNm: 2 },   // AIM-120 AMRAAM
    '7M': { label: '7M', count: 2, rmaxNm: 22, rneFrac: 0.4, rminNm: 1.5 },    // AIM-7M Sparrow
    '9M': { label: '9M', count: 2, rmaxNm: 10, rneFrac: 0.4, rminNm: 0.5 },    // AIM-9M Sidewinder
  },
  // El alcance máximo depende del aspecto del blanco, medido por su velocidad de cierre (kt): de frente (cierre alto) es el máximo
  // y a medida que el blanco se pone de costado y luego se va «a frío» (cierre ~0 o negativo) decae mucho, porque el misil tiene que
  // alcanzarlo en una persecución: rmax = base * (aspectMin + (1 - aspectMin) * k^curve), con k = cierre / cierreRef entre 0 y 1.
  // aspectMin = fracción que queda con el blanco huyendo; curve > 1 hace que la caída empiece pronto (de costado ya ~40 %).
  // VALORES DIDÁCTICOS: ni la guía ni DCS publican cifras; el alcance real también depende de altitud y velocidad del lanzador.
  launchZone: { aspectMin: 0.25, curve: 1.5, closureRefKt: 900 },
  defaultWeapon: '9M',

  // RAID (Guía de Chuck, págs. 213 y 226)
  //  - SCAN RAID (TWS con L&S): barrido de 22° y 3 barras centrado en el L&S; la pantalla muestra 22° x 10 NM alrededor de él
  //  - RAID SAM (STT): barrido pequeño alrededor del blanco fijado; solo ecos en bruto con su altitud, cada 3,5 s
  raid: {
    azDeg: 22,              // ancho de la vista y del barrido de SCAN RAID
    rangeNm: 10,            // alto de la vista de SCAN RAID (± la mitad a cada lado del L&S)
    bars: 3,
    samRadiusNm: 5,         // en RAID SAM, blancos a menos de esta distancia del fijado
    samUpdateS: 3.5,        // los ecos de RAID SAM se refrescan cada 3,5 s
    samMergeNm: 1,          // dos ecos más juntos que esto no se separan y salen como una "M"
  },

  // Círculo del centro de la pantalla (ASE / LAR): siempre centrado; grande cuando el L&S o el blanco fijado está dentro del
  // alcance máximo del arma y pequeño cuando no lo está. Radios en píxeles del lienzo del DDI (el marco mide ~380).
  // growPxS: velocidad (px por segundo) a la que crece o se encoge: un movimiento rápido pero gradual.
  ase: { inRangePx: 65, outRangePx: 13, growPxS: 140 },

  // Enlaces de las placas CURSO y EJERCICIOS del marco. Si se dejan vacíos, CURSO no hace nada y EJERCICIOS lleva al
  // selector de ejercicios que hay bajo el radar.
  links: { curso: '', ejercicios: '' },

  // Tamaño de los iconos de las trazas (1 = tamaño base). Aumenta símbolos, bricks y «+» y también el grosor de sus líneas, pero no los textos.
  iconScale: 1.25,

  // IFF: al hacer STT el radar interroga al blanco y, al responder, su símbolo pasa a aliado / hostil / desconocido
  iff: {
    timeS: 1.5,             // segundos que tarda la interrogación
    maxNm: 45,              // alcance máximo de la interrogación (según el vídeo del escuadrón)
    azHalfDeg: 30,          // y solo interroga a ±30° del morro
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

  // Aleatoriedad: cada vez que se carga un escenario, los blancos varían ligeramente. Cada valor es la variación
  // máxima (±) POR NIVEL DE DIFICULTAD: en un escenario de dificultad 3 varía el triple que en uno de dificultad 1.
  random: {
    enabled: true,
    rangeNm: 3,
    bearingDeg: 2.5,
    altFt: 1000,
    hdgDeg: 3,
    speedKt: 12,
  },

  /*
   * Escenarios. Cada blanco:
   *   type: nombre (lo muestra NCTR)   rangeNm / bearing: dónde empieza (bearing 0 = delante)
   *   alt: altitud   hdg: rumbo   speed: velocidad   rcs: tamaño (1 = caza normal, 4 = bombardero...)
   *   side: 'hostile' (por defecto), 'friend' o 'unknown' (el IFF no lo identifica)
   *   beam: 1 o -1 => rumbo = marcación ± 90° (vuela de costado, cae en el notch) aunque la marcación varíe al azar
   * Cada escenario tiene una dificultad (1-4): multiplica la aleatoriedad de `random` (ver más abajo).
   */
  scenarios: {
    facil: {
      difficulty: 1,
      name: 'Fácil — un solo blanco de frente',
      targets: [
        { type: 'Su-27', rangeNm: 50, bearing: 5, alt: 22000, hdg: 185, speed: 450, rcs: 1 },
      ],
    },
    normal: {
      difficulty: 2,
      name: 'Normal — grupo de cuatro',
      targets: [
        { type: 'MiG-29', rangeNm: 45, bearing: -10, alt: 24000, hdg: 170, speed: 450, rcs: 1 },
        { type: 'MiG-29', rangeNm: 47, bearing: 0, alt: 26000, hdg: 175, speed: 450, rcs: 1 },
        { type: 'Su-27', rangeNm: 52, bearing: 12, alt: 18000, hdg: 190, speed: 460, rcs: 1.2 },
        { type: 'B-52', rangeNm: 70, bearing: 25, alt: 30000, hdg: 200, speed: 380, rcs: 4 },
      ],
    },
    notch: {
      difficulty: 3,
      name: 'Notch — un blanco que se "esconde"',
      targets: [
        // Cruza a 90° de tu línea de visión (rumbo = marcación + 90°): cae en el notch y el radar no lo ve
        { type: 'Su-27', rangeNm: 30, bearing: 50, alt: 20000, beam: 1, speed: 450, rcs: 1 },
        // Este sí se acerca y se ve
        { type: 'MiG-29', rangeNm: 55, bearing: -15, alt: 20000, hdg: 170, speed: 450, rcs: 1 },
      ],
    },
    mezcla: {
      difficulty: 2,
      name: 'Con amigo — distinguir aliados (IFF y NCTR)',
      targets: [
        // Amigo que vuelve en sentido contrario: se acerca, así que el radar lo ve (un amigo que cruzara a 90° de tu línea de visión caería en el notch)
        { type: 'F-16', side: 'friend', rangeNm: 25, bearing: -20, alt: 20000, hdg: 140, speed: 450, rcs: 1 },
        { type: 'Su-27', rangeNm: 48, bearing: 8, alt: 21000, hdg: 185, speed: 450, rcs: 1.2 },
        { type: 'MiG-29', side: 'unknown', rangeNm: 52, bearing: 20, alt: 19000, hdg: 190, speed: 450, rcs: 1 }, // sin respuesta IFF: desconocido
      ],
    },
    dificil: {
      difficulty: 4,
      name: 'Difícil — varios niveles de altitud',
      targets: [
        { type: 'MiG-29', rangeNm: 35, bearing: -25, alt: 5000, hdg: 160, speed: 480, rcs: 1 },
        { type: 'Su-27', rangeNm: 50, bearing: 0, alt: 35000, hdg: 180, speed: 520, rcs: 1.2 },
        { type: 'Su-27', rangeNm: 28, bearing: 40, alt: 20000, beam: 1, speed: 450, rcs: 1 },
        { type: 'MiG-31', rangeNm: 65, bearing: 10, alt: 40000, hdg: 185, speed: 600, rcs: 2 },
        { type: 'Su-25', rangeNm: 20, bearing: -45, alt: 2000, hdg: 90, speed: 300, rcs: 0.6 },
      ],
    },
  },
};
