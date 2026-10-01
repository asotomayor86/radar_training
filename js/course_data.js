/* Contenido del curso: sesiones y pasos. Cada paso tiene título, texto (html), la figura que se muestra (fig),
   los mandos bajo la figura (ctls) y, opcionalmente, un aviso (done) que aparece al cumplir doneFlag.
   Fuentes: vídeo del escuadrón, Guía de Chuck del F/A-18C y cambios de DCS (ED 2.9.27 en adelante).
   Para añadir una sesión basta con añadir un objeto a SESSIONS. */
(function () {
  const R = (id, label, min, max, step, val, unit, signed) => ({ id, label, type: 'range', min, max, step, val, unit, signed });
  const SEG = (id, label, options, val, fmt) => ({ id, label, type: 'seg', options, val, fmt });
  const TOG = (id, label, val) => ({ id, label, type: 'toggle', val });
  const BTN = (label, action) => ({ id: 'btn_' + action, type: 'btn', label: '', action, btn: label });
  const note = (t) => `<p class="cv-note">${t}</p>`;
  const ok = (t) => `<p class="cv-note ok">${t}</p>`;
  const deg = (v) => v + '°';

  const SESSIONS = [
    // ------------------------------------------------------------------------------------------------------
    {
      title: 'El radar como un cono',
      practice: 'facil',
      steps: [
        {
          title: 'Un haz en forma de cono',
          fig: { type: 'side', cone: true },
          html: `
            <p>El radar del Hornet no ve «todo el cielo». La antena emite un haz con forma de <b>cono</b> que sale de la nariz de tu avión.</p>
            <p>En el dibujo lo ves de perfil: tú a la izquierda, la <b>distancia</b> hacia la derecha y la <b>altitud</b> hacia arriba (en <i>ángeles</i>: 1 ángel = 1.000 ft).</p>
            <p>Solo los aviones que quedan <b>dentro del cono</b> aparecen en tu radar. Fíjate en que el cono se ensancha con la distancia.</p>
            ${note('El eje vertical está muy exagerado para que se vea bien: en la realidad el cono es mucho más fino.')}`,
        },
        {
          title: 'Cuánta altura ve a cada distancia',
          fig: { type: 'side', cone: true, cursor: true, drag: true },
          ctls: [R('dist', 'Distancia del cursor', 5, 80, 1, 70, ' NM')],
          html: `
            <p>Mueve el cursor de distancia (arrastrando sobre el dibujo o con el control) y mira qué altitudes cubre el cono a cada distancia.</p>
            <p>Lejos, el cono es ancho: abarca muchos ángeles. Cerca de ti es estrecho: un avión justo delante, pero algo más alto o más bajo, <b>puede quedar fuera</b>.</p>
            <p>En el radar real pasa lo mismo, y por eso el cursor TDC te da dos cifras, la altitud <b>mínima</b> y la <b>máxima</b> que cubre el haz a la distancia donde lo pongas. Úsalas para saber si tu blanco «cabe».</p>
            ${note('Los números son orientativos: en DCS no son exactos, pero sirven para entender cómo funciona.')}`,
        },
        {
          title: 'Apuntar el cono arriba y abajo',
          fig: { type: 'side', cone: true, cursor: true, targets: true, challenge: true },
          ctls: [R('elev', 'Elevación de la antena', -6, 6, 0.1, 0, '°', true)],
          doneFlag: 'both',
          done: ok('Has visto a los dos, pero nunca a la vez. La solución son las <b>barras de elevación</b> (sesión 2): varias pasadas del cono, una sobre otra.'),
          html: `
            <p>Hay dos MiG: uno alto y lejano, otro bajo y más cercano. Con la antena a nivel, el cono pasa entre los dos y <b>no ves ninguno</b>.</p>
            <p>Puedes inclinar el cono con la <b>rueda de elevación</b> (en esta herramienta, las teclas <b>W / S</b> o la rueda del ratón sobre el radar). Mueve el control de elevación y consigue ver a cada uno.</p>
            <p>¿Puedes ver a los dos a la vez? Con un solo cono no: al subir pierdes al bajo y al bajar pierdes al alto.</p>`,
        },
        {
          title: 'La antena viaja con tu avión',
          fig: { type: 'side', cone: true, cursor: true, targets: true },
          ctls: [R('elev', 'Elevación de la antena', -6, 6, 0.1, 0, '°', true), R('pitch', 'Cabeceo de tu avión', -6, 6, 0.1, 0, '°', true)],
          html: `
            <p>La antena va montada en el avión: si subes el morro, <b>el cono sube contigo</b>; si lo bajas, baja.</p>
            <p>Sube el morro con el control de cabeceo y verás cómo el cono se aleja de los blancos. Para volver a verlos tienes que <b>compensar</b> con la elevación de la antena en sentido contrario.</p>
            <p>Regla práctica: cada vez que cambias de actitud o los blancos cambian de altitud, <b>revisa la elevación de la antena</b>.</p>`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'side', cone: true, cursor: true, targets: true, drag: true },
          ctls: [R('dist', 'Distancia del cursor', 5, 80, 1, 70, ' NM'), R('elev', 'Elevación de la antena', -6, 6, 0.1, 0, '°', true), R('pitch', 'Cabeceo de tu avión', -6, 6, 0.1, 0, '°', true)],
          html: `
            <ul>
              <li>El radar ve por un <b>cono</b>, no por una pantalla entera.</li>
              <li>El cono cubre <b>más altura lejos</b> y menos cerca.</li>
              <li>El cursor del radar te dice las altitudes mínima y máxima que cubre a esa distancia.</li>
              <li>Con la <b>elevación</b> inclinas el cono hacia arriba o hacia abajo, pero un solo cono no ve a todos los blancos a la vez.</li>
              <li>La antena <b>viaja con el avión</b>: si cambias de actitud, compensa con la elevación.</li>
            </ul>
            <p>Prueba todos los controles en el dibujo y, cuando quieras, pasa a practicarlo en el simulador real.</p>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'Barras de elevación',
      practice: 'normal',
      steps: [
        {
          title: 'Una barra es una pasada',
          fig: { type: 'side', cone: true, sweep: true },
          ctls: [SEG('bars', 'Barras', [1, 2, 4, 6], 1)],
          html: `
            <p>El cono de la sesión anterior es <b>una barra</b>: una pasada horizontal del radar a una altura determinada.</p>
            <p>El radar puede apilar varias barras, una encima de otra: <b>1, 2, 4 o 6</b>. Cambia el número y verás cómo crece la altura cubierta.</p>
            <p>Las barras no se barren a la vez: el radar hace primero la primera, luego la segunda, y así hasta la última, y vuelve a empezar. La barra que está barriendo en ese instante es la más clara.</p>
            ${note('En el DDI, el botón de la esquina superior izquierda muestra las barras y la barra en curso, por ejemplo «4B 2». El triángulo de la izquierda de la pantalla marca la elevación de la antena y baja con cada barra.')}`,
        },
        {
          title: 'Más barras, más altura',
          fig: { type: 'side', cone: true, sweep: true, cursor: true, targets: true },
          ctls: [SEG('bars', 'Barras', [1, 2, 4, 6], 1), R('elev', 'Elevación de la antena', -6, 6, 0.1, 0, '°', true)],
          html: `
            <p>Recuperamos a los dos MiG: uno alto y otro bajo. Con <b>1 barra</b> no puedes ver a los dos a la vez.</p>
            <p>Sube a <b>2 barras</b>: ya cubres los dos, aunque con poco margen. Con <b>4 barras</b> te sobra altura, y <b>6</b> es el máximo del Hornet.</p>
            <p>Mueve también la elevación: con varias barras puedes seguir inclinando el cono arriba o abajo para colocar la «ventana» de altura donde están tus blancos.</p>`,
        },
        {
          title: 'Cuando un blanco se escapa',
          fig: { type: 'side', cone: true, sweep: true, cursor: true, targets: true, escape: true },
          ctls: [SEG('bars', 'Barras', [1, 2, 4, 6], 2), R('alt1', 'Altitud del MiG-1', 20, 50, 1, 40, ' ángeles')],
          doneFlag: 'recovered',
          done: ok('Eso es justo lo que pasa en una intercepción: el blanco cambia de altitud y se sale de tus barras. Subir a más barras (o recolocar la antena) lo recupera.'),
          html: `
            <p>Estás en <b>2 barras</b> y ves a los dos MiG. Ahora el MiG-1 <b>asciende</b>: sube su altitud con el control.</p>
            <p>Llega un momento en que sale por arriba del haz y <b>lo pierdes</b>. Sube a 4 barras o recoloca la antena y vuelve a aparecer.</p>
            <p>Moraleja: tus barras tienen que cubrir la altitud <b>de los blancos, no la tuya</b>. Si los blancos cambian de altitud, hay que recolocar el cono.</p>`,
        },
        {
          title: 'El precio de usar muchas barras',
          fig: { type: 'side', cone: true, sweep: true, targets: true, period: true },
          ctls: [SEG('bars', 'Barras', [1, 2, 4, 6], 1)],
          html: `
            <p>Si 6 barras cubren tanto, ¿por qué no usarlas siempre? Porque el radar tarda en recorrerlas.</p>
            <p>Cada barra lleva unos 2-3 segundos (aquí, 2,5 s). Con 6 barras pueden pasar <b>unos 15 s</b> hasta que el radar vuelve a mirar la altura de un blanco. Mientras tanto, el eco envejece y puede parpadear o desaparecer.</p>
            <p>Con pocas barras el radar actualiza más a menudo, pero ves menos altura. Hay que elegir <b>las barras justas</b> para la altitud de los blancos que esperas.</p>
            ${note('Tiempos orientativos, tomados del vídeo del escuadrón; en el simulador de DCS dependen también del azimut.')}`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'side', cone: true, sweep: true, cursor: true, targets: true, period: true },
          ctls: [SEG('bars', 'Barras', [1, 2, 4, 6], 4), R('elev', 'Elevación de la antena', -6, 6, 0.1, 0, '°', true)],
          html: `
            <ul>
              <li>Una barra es una pasada horizontal; el radar apila <b>1, 2, 4 o 6</b>.</li>
              <li>Más barras = <b>más altura</b>, pero <b>más tiempo</b> hasta volver a mirar cada altura.</li>
              <li>Elige las barras según la <b>altitud de los blancos</b>, no según la tuya.</li>
              <li>Si un blanco cambia de altitud, recoloca la antena o sube de barras.</li>
              <li>Aun con 6 barras, <b>sigue haciendo falta mover la antena</b> arriba y abajo.</li>
            </ul>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'Azimut, alcance y orientación de la pantalla',
      practice: 'facil',
      steps: [
        {
          title: 'La pantalla del radar',
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', chips: 'seen', az: 80, scale: 80 },
          html: `
            <p>A la izquierda ves la <b>pantalla del radar</b> y a la derecha la misma situación <b>vista desde arriba</b>, tal como es en realidad.</p>
            <p>En la pantalla, el eje <b>horizontal</b> es el azimut (de −70° a +70°, 140° en total) y el eje <b>vertical</b> es la distancia: tú abajo, lo más lejano arriba. <b>Tu rumbo apunta hacia arriba.</b></p>
            <p>La zona oscura es lo que barre el radar y la línea brillante es el barrido. Cada vez que cruza un avión, éste se dibuja como un <b>brick</b> (ladrillo) que se va apagando hasta que el barrido vuelve a pasar.</p>`,
        },
        {
          title: 'Azimut: cuánto cielo barres',
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', chips: 'seen', period: true, clickCenter: true, az: 80, scale: 80 },
          ctls: [SEG('az', 'Azimut', [20, 40, 60, 80, 140], 80, deg), SEG('bars', 'Barras', [1, 2, 4, 6], 1), R('center', 'Centro del barrido', -60, 60, 1, 0, '°', true)],
          html: `
            <p>El <b>azimut</b> es el ancho del barrido: <b>20, 40, 60, 80 o 140°</b>. Cambia el valor y mira cómo se ensancha o se estrecha la zona.</p>
            <p>Estrecho = el radar vuelve antes a cada zona, pero <b>miras menos cielo</b>. Ancho = ves más cielo, pero <b>tarda más</b> en refrescar.</p>
            <p>Combina azimut y barras: el tiempo entre barridos es aproximadamente <b>barras × azimut ÷ velocidad del barrido</b>. Mira el valor bajo el dibujo.</p>
            <p>Para <b>mover el barrido</b> a un lado se pulsa el TDC (depress) en esa zona de la pantalla; aquí puedes hacer clic en la pantalla o usar el control «Centro».</p>`,
        },
        {
          title: 'La escala no es el alcance',
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', chips: 'seen', az: 140, scale: 80 },
          ctls: [SEG('scale', 'Escala (NM)', [5, 10, 20, 40, 80, 160], 80)],
          html: `
            <p>Con las flechas de escala cambias cuántas millas náuticas muestra la pantalla: <b>5, 10, 20, 40, 80 o 160 NM</b>.</p>
            <p>OJO: eso es solo el <b>zoom de la pantalla</b>, no el alcance del radar. Poner 160 NM no te hace ver a 160 NM: el radar detecta hasta donde detecta (la línea discontinua roja del dibujo, un valor didáctico).</p>
            <p>El avión «D» está a 110 NM: aunque pongas 160 NM, no se ve. Por el contrario, con escala 5 NM verás con mucho detalle, pero casi sin contactos.</p>`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', chips: 'seen', period: true, clickCenter: true, az: 80, scale: 80 },
          ctls: [SEG('az', 'Azimut', [20, 40, 60, 80, 140], 80, deg), SEG('bars', 'Barras', [1, 2, 4, 6], 1), SEG('scale', 'Escala (NM)', [5, 10, 20, 40, 80, 160], 80)],
          html: `
            <ul>
              <li>Pantalla: <b>azimut en horizontal, distancia en vertical</b>, tu rumbo hacia arriba.</li>
              <li>Cada eco es un <b>brick</b> que se apaga hasta el siguiente barrido.</li>
              <li>Azimut estrecho = refresco rápido pero poco cielo; azimut ancho = mucho cielo pero lento.</li>
              <li>Tiempo entre barridos ≈ barras × azimut ÷ velocidad del barrido.</li>
              <li>La <b>escala</b> es zoom de pantalla, <b>no</b> alcance del radar.</li>
            </ul>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'Los botones del DDI, uno a uno',
      practice: 'facil',
      steps: [
        {
          title: 'Fila superior',
          fig: { type: 'osb', hl: [1, 2, 3, 5] },
          doneFlag: 'all',
          done: ok('Has repasado todos los botones señalados de esta zona.'),
          html: `
            <p>Los 20 botones del borde de la pantalla se llaman <b>OSB</b>. Se numeran del 1 al 20 en el sentido contrario a las agujas del reloj, empezando por arriba a la izquierda. Aquí tienes la página del radar; los botones resaltados son los de este paso.</p>
            <p><b>Barras (OSB 1):</b> muestra las barras y la barra en curso.<br><b>SIL (2):</b> silencia el radar. Los contactos se van perdiendo poco a poco; al reactivarlo hace un barrido completo.<br><b>ERASE (3):</b> borra los ecos.<br><b>Arma (5):</b> arma seleccionada y cantidad (AMRAAM 120C, Sparrow 7M, Sidewinder 9M).</p>
            <p>Pulsa los botones resaltados para leer su descripción.</p>`,
        },
        {
          title: 'Columna derecha',
          fig: { type: 'osb', hl: [6, 7, 8, 9, 10] },
          doneFlag: 'all',
          done: ok('Ya conoces la columna derecha.'),
          html: `
            <p><b>Flechas ↑ ↓ (6 y 7):</b> escala de distancia: 5, 10, 20, 40, 80 y 160 NM.</p>
            <p><b>SET (8):</b> guarda las barras y el azimut del arma seleccionada: así, cada arma recuerda su configuración (por ejemplo, AMRAAM en 4 barras y 20°).</p>
            <p><b>RSET (9):</b> devuelve el radar a sus ajustes por defecto.</p>
            <p><b>NCTR (10):</b> reconocimiento no cooperativo del tipo de avión (lo verás en la sesión de STT).</p>`,
        },
        {
          title: 'Fila inferior y columna izquierda',
          fig: { type: 'osb', hl: [11, 12, 14, 15, 16, 17, 18, 20] },
          doneFlag: 'all',
          done: ok('Has repasado la fila inferior y la columna izquierda.'),
          html: `
            <p><b>DATA (11):</b> abre la página de opciones (sesión 5). <b>Azimut (14):</b> 20, 40, 60, 80 o 140°.</p>
            <p><b>Modo (20):</b> cambia entre RWS, TWS y VS. <b>PRF (16):</b> frecuencia de pulsos.</p>
            <p>⚠ <b>CHAN (12)</b> y <b>MODE (15)</b>, <b>SURF (18)</b> y <b>RDR PRI (17)</b> existen en el avión pero <b>no tienen función en esta herramienta</b>.</p>
            ${note('Si pasas el ratón por el radar real de la izquierda, cada botón muestra una ayuda con su función.')}`,
        },
        {
          title: 'PRF: HI, MED e INTL',
          fig: { type: 'osb', hl: [16] },
          html: `
            <p>El <b>PRF</b> es la frecuencia con la que emite el radar. Tiene tres opciones:</p>
            <p><b>HI:</b> ve muy lejos a los blancos que se <b>acercan</b>, pero casi nada a los que se <b>alejan</b>.<br><b>MED:</b> ve a todos los blancos con menos alcance.<br><b>INTL:</b> alterna y elige automáticamente.</p>
            <p>La recomendación habitual es dejarlo en <b>INTL</b>. La línea de arriba del botón indica el PRF que está en uso.</p>`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'osb', hl: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 14, 16, 20] },
          html: `
            <ul>
              <li>Los OSB están numerados del 1 al 20; su función depende de la <b>página</b> activa.</li>
              <li><b>Barras</b> y <b>azimut</b> determinan qué miras; <b>escala</b>, cómo lo ves.</li>
              <li><b>SET</b> y <b>RSET</b>: guardar / restablecer la configuración.</li>
              <li><b>PRF</b>: lo mejor, INTL.</li>
              <li>CHAN, MODE, SURF y RDR PRI no funcionan aquí.</li>
            </ul>
            <p>Practica con el simulador: pasa el ratón por cada botón para ver su ayuda.</p>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'Página DATA',
      practice: 'normal',
      steps: [
        {
          title: 'Qué hay en DATA',
          fig: { type: 'osb', page: 'data', hl: [1, 7, 8, 9, 10, 12, 14, 19] },
          doneFlag: 'all',
          done: ok('Has repasado las opciones de DATA.'),
          html: `
            <p>El botón <b>DATA</b> (OSB 11) abre un submenú del radar. Al pulsarlo, algunos botones cambian de función:</p>
            <p><b>AGE:</b> cuánto se conservan los ecos. <b>LTWS:</b> activa el seguimiento «latente» en RWS. <b>MSI:</b> integración de varias fuentes. <b>COLOR, DCLTR:</b> aspecto de la pantalla. <b>BRA:</b> marcación, distancia y altitud al cursor. <b>ECCM:</b> contramedidas.</p>
            <p>⚠ En esta herramienta no tienen efecto <b>ECCM</b>, <b>COLOR</b>, <b>DCLTR</b>, <b>MSI</b> y <b>RAID 1LOOK</b>; sí funcionan <b>AGE</b>, <b>LTWS</b> y <b>BRA</b>. Pulsa los botones resaltados para leer su descripción.</p>`,
        },
        {
          title: 'AGE: cuánto vive un eco',
          fig: { type: 'scope', preset: 'age', plan: true, mode: 'rws', az: 40, scale: 80, age: 8 },
          ctls: [SEG('age', 'AGE (segundos)', [2, 4, 8, 16, 32], 8)],
          html: `
            <p>El avión «A» sale del barrido por la derecha mientras el «B» se queda dentro. Mira cuánto tiempo sigue pintado el eco de «A» <b>después</b> de salir.</p>
            <p><b>AGE</b> es el tiempo que se conserva un eco sin refrescar: <b>2, 4, 8, 16 o 32 s</b>. Con un valor bajo, los ecos desaparecen enseguida (a veces incluso entre barridos). Con un valor alto, ves <b>fantasmas</b>: ecos de aviones que ya no están donde los ves.</p>
            <p>La recomendación habitual es <b>8 s</b>. Los ecos van perdiendo brillo conforme envejecen.</p>`,
        },
        {
          title: 'BRA: marcación y distancia',
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', bra: true, az: 140, scale: 80 },
          ctls: [TOG('bra', 'BRA', true)],
          html: `
            <p>Con <b>BRA</b> activado, el radar te da la <b>marcación</b>, la <b>distancia</b> y la <b>altitud</b> desde tu avión hasta el cursor.</p>
            <p>Pasa el cursor por la pantalla del radar: verás las cifras bajo el dibujo. Es útil para cantar la posición de un blanco por radio o para comparar su distancia con la de otro.</p>
            ${note('La marcación se da respecto al norte. En el avión real también puede mostrarse respecto a un punto de referencia (Bullseye), que esta herramienta no simula.')}`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'osb', page: 'data', hl: [1, 10, 14] },
          html: `
            <ul>
              <li>DATA cambia la función de varios botones.</li>
              <li><b>AGE 8</b> es un buen equilibrio entre ecos que desaparecen y ecos fantasma.</li>
              <li><b>BRA</b> da marcación, distancia y altitud al cursor.</li>
              <li><b>LTWS</b> y <b>MSI</b> los verás más adelante; el resto de opciones no están simuladas.</li>
            </ul>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'RWS: buscar y ver',
      practice: 'facil',
      steps: [
        {
          title: 'Bricks: ecos sin identidad',
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', info: 'brick', chips: 'seen', az: 140, scale: 80 },
          html: `
            <p><b>RWS</b> (Range While Search) es el modo de búsqueda básico. Cada contacto se dibuja como un <b>brick</b>: un ladrillo verde que solo indica que hay <b>algo</b> en esa marcación y a esa distancia.</p>
            <p>Haz clic en un brick: verás que no sabes nada más. No hay altitud, ni velocidad, ni identidad. El radar solo te dice «ahí hay un eco».</p>
            <p>Para saber más de un contacto necesitas un modo que lo <b>siga</b>: LTWS, TWS o STT.</p>`,
        },
        {
          title: 'Ecos que envejecen',
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', chips: 'seen', az: 40, scale: 80, bars: 4 },
          ctls: [SEG('bars', 'Barras', [1, 2, 4, 6], 4), SEG('az', 'Azimut', [20, 40, 60, 80, 140], 40, deg), SEG('age', 'AGE (s)', [2, 4, 8, 16, 32], 8)],
          html: `
            <p>Cada brick se <b>apaga poco a poco</b> hasta que el barrido vuelve a pasar sobre ese avión. Con muchas barras y azimut ancho, el barrido tarda en volver y los ecos pueden llegar a desaparecer antes.</p>
            <p>Si aprietas el barrido (menos barras, azimut más estrecho) los ecos se mantienen brillantes; si lo aflojas, parpadean.</p>
            ${note('Novedad de DCS 2.9.28: los bricks crudos <b>no se estabilizan en el espacio</b>: se quedan donde el radar los vio y no se corrigen con tus giros hasta el siguiente barrido.')}`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', info: 'brick', chips: 'seen', az: 80, scale: 80 },
          html: `
            <ul>
              <li>RWS es el modo de <b>búsqueda</b>: detecta a larga distancia y actualiza rápido.</li>
              <li>Muestra <b>bricks</b>: solo posición. Sin altitud, Mach ni identidad.</li>
              <li>Los ecos envejecen entre barridos; AGE controla cuánto.</li>
              <li>Para saber más hay que pasar a LTWS, TWS o STT.</li>
            </ul>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'LTWS y los track files',
      practice: 'mezcla',
      steps: [
        {
          title: 'Activar LTWS',
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', info: 'symbol', az: 140, scale: 80 },
          ctls: [TOG('ltws', 'LTWS', false)],
          html: `
            <p><b>LTWS</b> (Latent TWS) se activa en la página DATA mientras estás en RWS. Sigues buscando como en RWS, pero el radar guarda un <b>track file</b> de cada contacto.</p>
            <p>Activa LTWS y pasa el cursor por encima de un brick (o haz clic): se convierte en un <b>símbolo</b> con el <b>Mach</b> a la izquierda y la <b>altitud</b> a la derecha.</p>
            <p>El símbolo amarillo en forma de «cajita» indica <b>IFF ambiguo</b>: todavía no sabemos si es amigo o enemigo.</p>`,
        },
        {
          title: 'L&S y DT2',
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', designate: true, info: 'symbol', chips: 'tracks', az: 140, scale: 80 },
          ctls: [TOG('ltws', 'LTWS', true)],
          doneFlag: 'both',
          done: ok('Ya tienes un L&S (estrella) y un DT2 (rombo).'),
          html: `
            <p>Con LTWS puedes marcar dos contactos: haz clic en un contacto y se convierte en el <b>L&S</b> (<i>Launch &amp; Steering</i>), el blanco principal, con una <b>estrella</b>. Haz clic en otro y será el <b>DT2</b> (<i>Designated Target 2</i>), con un <b>rombo</b>.</p>
            <p>El L&S es el blanco al que apuntarás tus armas y el DT2 es el segundo candidato. Más adelante verás cómo intercambiarlos con el botón NWS.</p>`,
        },
        {
          title: 'LTWS no es para disparar',
          end: true,
          fig: { type: 'scope', preset: 'three', plan: true, mode: 'rws', designate: true, info: 'symbol', chips: 'tracks', az: 80, scale: 80, initLS: 'B' },
          ctls: [TOG('ltws', 'LTWS', true)],
          html: `
            <p>En LTWS tienes la información de los track files, pero <b>no hay soporte de disparo</b>: el radar no te da la zona de lanzamiento de las armas. LTWS es <b>conciencia de la situación</b>, no un modo de ataque.</p>
            <p>Para disparar con soporte de radar necesitas <b>TWS</b> o <b>STT</b>.</p>
            <ul>
              <li>LTWS = RWS + track files (se activa en DATA).</li>
              <li>Muestra Mach, altitud e IFF; permite marcar L&S y DT2.</li>
              <li>No ofrece soporte de disparo.</li>
            </ul>
            ${note('Novedad de DCS 2.9.27: los botones MSI y LTWS de la página DATA son funcionales y el radar integra otras fuentes de datos.')}`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'STT: el lock',
      practice: 'notch',
      steps: [
        {
          title: 'Fijar un blanco',
          fig: { type: 'scope', preset: 'stt', plan: true, mode: 'rws', focus: 'A', az: 140, scale: 80, initSel: 'A' },
          ctls: [BTN('Fijar blanco (STT)', 'lock'), BTN('Soltar (RTS)', 'release')],
          doneFlag: 'locked',
          done: ok('Fíjate: al fijar, los demás contactos <b>desaparecen</b> de tu pantalla. El radar ha concentrado toda su potencia en un solo blanco.'),
          html: `
            <p><b>STT</b> (<i>Single Target Track</i>) es el «lock duro»: el radar concentra <b>toda su potencia en un único blanco</b> y lo sigue de forma continua.</p>
            <p>Pulsa <b>Fijar blanco</b>. El símbolo lleva una estrella y muestra el Mach y la altitud del blanco. Es lo que necesitan los misiles <b>AIM-7 y AIM-120</b> para guiarse.</p>
            <p>El precio: <b>dejas de ver todos los demás contactos</b>, y mientras tanto otros aviones pueden acercarse sin que lo notes.</p>`,
        },
        {
          title: 'Soltar el lock',
          fig: { type: 'scope', preset: 'stt', plan: true, mode: 'rws', focus: 'A', az: 140, scale: 80, initSel: 'A' },
          ctls: [BTN('Fijar blanco (STT)', 'lock'), BTN('Soltar (RTS)', 'release')],
          doneFlag: 'released',
          done: ok('Al soltar, el radar vuelve a buscar y tus contactos reaparecen en cuanto el barrido pasa por ellos.'),
          html: `
            <p>Para soltar el lock: el botón <b>RTS</b> (<i>Return To Search</i>) del DDI, o el botón <b>NWS</b> del stick (<i>Undesignate</i>; en esta herramienta, la tecla <b>Esc</b>).</p>
            <p>El radar vuelve al último modo de búsqueda y reconstruye la pantalla poco a poco. Prueba a fijar y soltar varias veces.</p>
            ${note('Novedad de DCS: el AIM-120 también provoca un lock automático (AACQ → STT), igual que el AIM-7, cuando se dispara. En la herramienta, la tecla <b>X</b> hace AACQ sobre el blanco bajo el cursor.')}`,
        },
        {
          title: 'El notch',
          fig: { type: 'scope', preset: 'stt', plan: true, mode: 'rws', focus: 'A', az: 140, scale: 80, initSel: 'A' },
          ctls: [R('ang', 'Rumbo del blanco (0° = hacia ti)', 0, 180, 1, 0, '°'), BTN('Fijar blanco (STT)', 'lock'), BTN('Soltar (RTS)', 'release')],
          doneFlag: 'notchLost',
          done: ok('Has perdido el lock por el notch: el blanco volaba de costado a tu línea de visión y el radar no lo distinguía del suelo.'),
          html: `
            <p>El radar de pulsos Doppler distingue los blancos por su <b>velocidad de acercamiento o alejamiento</b>. Un avión que vuela <b>de costado</b> (a unos 90° de tu línea de visión) casi no se acerca ni se aleja: su velocidad radial es casi cero y el radar lo confunde con el suelo. Es el <b>notch</b>.</p>
            <p>Fija el blanco y mueve el rumbo hasta unos <b>90°</b>. Si permanece en el notch más de unos segundos, <b>pierdes el lock</b> («PERDIDO: NOTCH»).</p>
            <p>Defensa típica del enemigo: girar a 90° de tu línea de visión. Tu respuesta: cambiar de rumbo para sacarlo del notch.</p>`,
        },
        {
          title: 'NCTR: ¿qué avión es?',
          fig: { type: 'scope', preset: 'stt', plan: true, mode: 'rws', focus: 'A', az: 140, scale: 80, initSel: 'A' },
          ctls: [R('tr', 'Distancia del blanco', 10, 60, 1, 40, ' NM'), TOG('nctr', 'NCTR', true), BTN('Fijar blanco (STT)', 'lock'), BTN('Soltar (RTS)', 'release')],
          html: `
            <p><b>NCTR</b> (<i>Non-Cooperative Target Recognition</i>) permite conocer el <b>tipo de avión</b> a partir de su firma radar. Solo funciona con el blanco fijado en STT y a <b>menos de 25 NM</b>.</p>
            <p>Fija el blanco, activa NCTR y acerca el blanco por debajo de 25 NM: tras unos segundos de «escucha», el símbolo muestra el tipo bajo él. Antes aparece «???».</p>
            ${note('Al fijar un blanco, el radar además lo <b>interroga por IFF</b> y el símbolo cambia de color (lo verás en la sesión 9).')}`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'scope', preset: 'stt', plan: true, mode: 'rws', focus: 'A', az: 140, scale: 80, initSel: 'A' },
          ctls: [R('ang', 'Rumbo del blanco', 0, 180, 1, 0, '°'), R('tr', 'Distancia del blanco', 10, 60, 1, 40, ' NM'), TOG('nctr', 'NCTR', true), BTN('Fijar blanco (STT)', 'lock'), BTN('Soltar (RTS)', 'release')],
          html: `
            <ul>
              <li>STT concentra el radar en <b>un solo blanco</b>: máxima precisión, para AIM-7 y AIM-120.</li>
              <li>Pierdes de vista <b>todos los demás</b>.</li>
              <li>Se suelta con <b>RTS</b> o con <b>NWS (Undesignate)</b>.</li>
              <li>El <b>notch</b> (blanco a 90° de tu línea de visión) puede hacerte perder el lock.</li>
              <li>NCTR muestra el tipo de avión a menos de 25 NM.</li>
            </ul>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'IFF: amigo o enemigo',
      practice: 'mezcla',
      steps: [
        {
          title: 'Los símbolos',
          fig: {
            type: 'scope', preset: 'iff', plan: true, mode: 'sym', az: 140, scale: 80,
            legend: [
              { k: 'brick', t: 'Brick: eco sin identidad' },
              { k: 'unknown', t: 'Cajita amarilla: ambiguo, no ha respondido' },
              { k: 'friend', t: 'Medio círculo verde: amigo (responde al IFF)' },
              { k: 'hostile', t: 'Rombo rojo: hostil' },
              { k: 'friend', ls: true, t: 'Estrella: L&S, el blanco principal' },
              { k: 'unknown', dt2: true, t: 'Rombo pequeño: DT2, el segundo blanco' },
            ],
          },
          html: `
            <p>El <b>IFF</b> (<i>Identification Friend or Foe</i>) interroga a un avión y espera su respuesta. Según el resultado, el track file cambia de símbolo (estos símbolos se llaman <b>HAFU</b>).</p>
            <p>A la derecha tienes la leyenda. El que ves ahora en pantalla, la «cajita» amarilla, significa <b>ambiguo</b>: el radar aún no ha obtenido respuesta.</p>
            <p>Un blanco ambiguo <b>no es necesariamente enemigo</b>: puede que sea un amigo al que aún no has interrogado, o que esté fuera del sector de interrogación.</p>`,
        },
        {
          title: 'Alcance y ángulo del IFF',
          fig: { type: 'scope', preset: 'iff', plan: true, mode: 'sym', focus: 'F', iffCone: true, chips: 'iff', az: 140, scale: 80, initSel: 'F' },
          ctls: [R('tr', 'Distancia del avión «F»', 10, 70, 1, 30, ' NM'), R('tb', 'Marcación del avión «F»', -60, 60, 1, 10, '°', true), BTN('Interrogar IFF', 'iff'), BTN('Repetir', 'again')],
          doneFlag: 'iffBoth',
          done: ok('Has visto las dos caras: dentro del sector responde (círculo) y fuera se queda ambiguo (cajita).'),
          html: `
            <p>El IFF solo interroga <b>dentro de un sector</b>: hasta unas <b>45 NM</b> y a <b>±30°</b> de tu morro (el sector azul del dibujo).</p>
            <p>Interroga al avión «F» dentro del sector: tras unos instantes pasa a <b>amigo</b>. Después mueve «F» fuera (más de 45 NM o más de 30° a un lado), pulsa <b>Repetir</b> y vuelve a interrogar: no hay respuesta y se queda como <b>cajita</b>.</p>
            <p>También puedes hacer clic en otro avión (por ejemplo «X», que está a −45°) para interrogarlo.</p>
            ${note('En la herramienta, cuando el blanco responde, el símbolo pasa a amigo (círculo verde) u hostil (rombo rojo). En el avión real el IFF se interroga automáticamente al fijar un blanco en STT, o con el cursor sobre una traza en TWS/LTWS.')}`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'scope', preset: 'iff', plan: true, mode: 'sym', focus: 'F', iffCone: true, chips: 'iff', az: 140, scale: 80, initSel: 'F' },
          ctls: [R('tr', 'Distancia de «F»', 10, 70, 1, 30, ' NM'), R('tb', 'Marcación de «F»', -60, 60, 1, 10, '°', true), BTN('Interrogar IFF', 'iff'), BTN('Repetir', 'again')],
          html: `
            <ul>
              <li>Círculo = <b>amigo</b>. Cajita = <b>ambiguo</b>. Rombo rojo = <b>hostil</b>.</li>
              <li>Alcance: <b>45 NM</b>. Ángulo: <b>±30°</b> del morro.</li>
              <li>Sin respuesta ≠ enemigo: <b>identifica antes de disparar</b>.</li>
              <li>Se interroga al fijar (STT) o con el cursor sobre la traza (TWS/LTWS).</li>
            </ul>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'El botón NWS (Undesignate)',
      practice: 'normal',
      steps: [
        {
          title: 'Primera pulsación',
          fig: { type: 'scope', preset: 'nws', plan: true, mode: 'sym', designate: true, chips: 'tracks', az: 140, scale: 80 },
          ctls: [BTN('NWS (Undesignate)', 'nws'), BTN('RSET', 'rset')],
          doneFlag: 'nws1',
          done: ok('La primera pulsación marca como L&S la traza más cercana.'),
          html: `
            <p>En el stick hay un botón (el «pinky switch», que también hace de <b>NWS</b>) que en el radar actúa como <b>Undesignate</b>. En esta herramienta es la tecla <b>Esc</b>; aquí, el botón «NWS».</p>
            <p>Sin ningún blanco marcado, la primera pulsación marca como <b>L&S</b> (estrella) la traza <b>más cercana</b>. Los números dentro de los símbolos indican el orden por distancia (1 = el más cercano).</p>
            <p>También puedes marcar con un clic en un contacto (es el equivalente al <b>TDC depress</b>).</p>`,
        },
        {
          title: 'Recorrer las trazas',
          fig: { type: 'scope', preset: 'nws', plan: true, mode: 'sym', designate: true, chips: 'tracks', az: 140, scale: 80, initLS: 'A' },
          ctls: [BTN('NWS (Undesignate)', 'nws'), BTN('RSET', 'rset')],
          doneFlag: 'cycle',
          done: ok('Cada pulsación pasa el L&S a la siguiente traza (1, 2, 3… y vuelta al principio).'),
          html: `
            <p>Con un L&S marcado y <b>sin DT2</b>, cada pulsación del NWS pasa el L&S a la <b>siguiente traza</b>: 1, 2, 3… y vuelve a empezar. Es la forma rápida de «recorrer» los blancos sin tocar el cursor.</p>
            <p><b>RSET</b> lo deja todo a cero (sin L&S ni DT2) para empezar otra vez.</p>`,
        },
        {
          title: 'L&S y DT2: intercambiar',
          fig: { type: 'scope', preset: 'nws', plan: true, mode: 'sym', designate: true, chips: 'tracks', az: 140, scale: 80, initLS: 'A' },
          ctls: [BTN('NWS (Undesignate)', 'nws'), BTN('RSET', 'rset')],
          doneFlag: 'swap',
          done: ok('Con L&S y DT2 marcados, el NWS los <b>intercambia</b>.'),
          html: `
            <p>Haz clic en otro contacto: pasa a ser el <b>DT2</b> (rombo).</p>
            <p>Con L&S y DT2 a la vez, cada pulsación del NWS <b>los intercambia</b>: el DT2 pasa a ser el blanco principal y viceversa. Así puedes saltar entre tus dos blancos favoritos sin perder ninguno.</p>`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'scope', preset: 'nws', plan: true, mode: 'sym', designate: true, chips: 'tracks', az: 140, scale: 80 },
          ctls: [BTN('NWS (Undesignate)', 'nws'), BTN('RSET', 'rset')],
          html: `
            <ul>
              <li>Sin marcas: NWS marca como L&S la traza <b>más cercana</b>.</li>
              <li>Con L&S: NWS recorre las trazas.</li>
              <li>Con L&S y DT2: NWS los <b>intercambia</b>.</li>
              <li>En STT: NWS <b>suelta el lock</b>.</li>
              <li>RSET lo deja todo a cero.</li>
            </ul>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'TWS: seguimiento múltiple',
      practice: 'mezcla',
      steps: [
        {
          title: 'Un símbolo para cada blanco',
          fig: { type: 'scope', preset: 'tws', plan: true, mode: 'tws', designate: true, zone: true, chips: 'tracks', az: 40, scale: 80, bars: 4 },
          html: `
            <p><b>TWS</b> (<i>Track While Scan</i>) sigue a <b>varios blancos a la vez</b> mientras sigue barriendo: hasta <b>10 track files</b>. A diferencia de STT, no pierdes de vista el resto.</p>
            <p>Los <b>8 más cercanos</b> se dibujan como símbolo, con su número de orden. El resto aparecen como una <b>«+» amarilla</b> de baja prioridad (novedad de DCS 2.9.27).</p>
            <p>A diferencia de LTWS, TWS <b>permite disparar</b> con soporte de radar. Es el modo habitual en BVR.</p>`,
        },
        {
          title: 'Límites de barras y azimut',
          fig: { type: 'scope', preset: 'tws', plan: true, mode: 'tws', designate: true, zone: true, chips: 'tracks', az: 80, scale: 80, bars: 4 },
          ctls: [SEG('bars', 'Barras', [2, 4, 6], 4), SEG('az', 'Azimut', [20, 40, 60, 80], 80, deg)],
          doneFlag: 'barsChanged',
          done: ok('Fíjate: al subir las barras, el azimut máximo baja solo.'),
          html: `
            <p>TWS necesita revisitar rápido cada traza, y por eso <b>limita</b> el volumen de barrido según las barras:</p>
            <ul>
              <li><b>2 barras</b> → hasta <b>80°</b> de azimut.</li>
              <li><b>4 barras</b> → hasta <b>40°</b>.</li>
              <li><b>6 barras</b> → hasta <b>20°</b>.</li>
            </ul>
            <p>Cambia las barras: aunque tengas 80° puesto, el barrido real se limita al máximo que permite TWS (verás el aviso y la zona que se estrecha).</p>`,
        },
        {
          title: 'Centrado: AUTO, MAN y BIAS',
          fig: { type: 'scope', preset: 'tws', plan: true, mode: 'tws', designate: true, zone: true, chips: 'tracks', az: 40, scale: 80, bars: 4, initLS: 'c' },
          ctls: [SEG('centering', 'Centrado', ['AUTO', 'MAN'], 'AUTO'), R('center', 'Centro (MAN)', -60, 60, 1, 0, '°', true)],
          doneFlag: 'centered',
          done: ok('Ya has movido el centrado del barrido.'),
          html: `
            <p>El botón de la derecha del DDI (<b>AUTO / MAN</b>) decide dónde se centra el barrido:</p>
            <ul>
              <li><b>AUTO</b>: el barrido <b>sigue al L&S</b>, en azimut y elevación. Solo funciona si hay un L&S.</li>
              <li><b>MAN</b>: lo centras tú, con un TDC depress en una zona vacía (aquí, un clic en un hueco, o el control «Centro»).</li>
              <li><b>BIAS</b>: estando en AUTO, un TDC depress en zona vacía <b>desplaza</b> el barrido hacia ese punto sin perder L&S ni DT2.</li>
            </ul>
            <p>Si pierdes el L&S, el radar pasa solo a <b>MAN</b>. Prueba a hacer clic en zonas vacías de la pantalla.</p>`,
        },
        {
          title: 'L&S, DT2 y zona de disparo',
          fig: { type: 'scope', preset: 'tws', plan: true, mode: 'tws', designate: true, zone: true, chips: 'tracks', az: 40, scale: 80, bars: 4 },
          ctls: [SEG('centering', 'Centrado', ['AUTO', 'MAN'], 'AUTO'), BTN('NWS (Undesignate)', 'nws'), BTN('RSET', 'rset')],
          doneFlag: 'dt2',
          done: ok('Con L&S y DT2 marcados, TWS puede mantenerte el apoyo de radar sobre los dos blancos.'),
          html: `
            <p>En TWS puedes tener <b>un L&S</b> (estrella) y <b>un DT2</b> (rombo). Haz clic en un contacto para marcar el L&S y en otro para el DT2.</p>
            <p>Con el L&S marcado, el radar calcula la <b>zona de lanzamiento</b> del arma: <b>Rmax</b>, el alcance máximo, y <b>Rne</b>, el alcance de «no escape» (a esa distancia el blanco ya no puede huir del misil). Aparecen como dos marcas a la altura del blanco, y como dos arcos en la vista desde arriba.</p>
            <p>Si el blanco se aleja o no se acerca, esas distancias se acortan.</p>
            ${note('Valores didácticos de AMRAAM; el alcance real depende de altitud, velocidad y aspecto.')}`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'scope', preset: 'tws', plan: true, mode: 'tws', designate: true, zone: true, chips: 'tracks', az: 40, scale: 80, bars: 4 },
          ctls: [SEG('bars', 'Barras', [2, 4, 6], 4), SEG('az', 'Azimut', [20, 40, 60, 80], 40, deg), SEG('centering', 'Centrado', ['AUTO', 'MAN'], 'AUTO')],
          html: `
            <ul>
              <li>TWS sigue hasta <b>10 trazas</b> mientras busca; <b>8</b> con símbolo y el resto como «+».</li>
              <li>Permite <b>disparar con apoyo del radar</b> (L&S) sin fijar en STT.</li>
              <li>Límites: 2B→80°, 4B→40°, 6B→20°.</li>
              <li>Centrado: <b>AUTO</b> (sigue al L&S), <b>MAN</b>, <b>BIAS</b>.</li>
              <li>Un L&S + un DT2; NWS los recorre e intercambia.</li>
              <li>Zona de disparo: Rmax y Rne a la altura del blanco.</li>
            </ul>
            ${note('Novedades de DCS 2.9.27-2.9.28: MSI integra otras fuentes, las trazas de baja prioridad se muestran como «+», y los ecos crudos no se estabilizan en el espacio.')}`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'Casos especiales: RAID, SPOT y ACM',
      practice: 'dificil',
      steps: [
        {
          title: 'RAID: separar blancos juntos',
          fig: { type: 'scope', preset: 'raid', mode: 'tws', plan: true, az: 80, bars: 2, scale: 80, initLS: 'A', designate: true },
          ctls: [TOG('raid', 'SCAN RAID', false)],
          doneFlag: 'raidSplit',
          done: ok('El zoom de RAID ha separado a los dos aviones que antes se veían como un solo eco.'),
          html: `
            <p>A veces dos aviones vuelan tan juntos que el radar los ve como <b>uno solo</b> (en la pantalla, los dos bricks «A» y «B» se solapan).</p>
            <p><b>RAID</b> (tecla R) sirve para <b>separarlos</b>. En TWS, con un L&S marcado, entra en <b>SCAN RAID</b>: un barrido estrecho de <b>22°</b> y 3 barras, centrado en el L&S, con una vista de 22° × 10 NM.</p>
            <p>Activa el SCAN RAID y verás los dos aviones por separado. Se sale con RTS, Undesignate, RSET o volviendo a pulsar RAID.</p>
            ${note('En STT existe también RAID SAM: ecos crudos con su altitud alrededor del blanco fijado, que se refrescan cada 3,5 s (una «M» es un grupo que no se separa).')}`,
        },
        {
          title: 'SPOT, ACM y otros',
          fig: {
            type: 'cards', hint: 'Pulsa una tarjeta para leer su explicación.',
            items: [
              { title: 'SPOT', sub: 'Enter largo en zona vacía', text: 'Barrido de <b>22°</b> centrado en el cursor. Se activa con un TDC depress mantenido (0,8 s) en una zona vacía y se sale con Undesignate. Sirve para mirar con más frecuencia una zona concreta.' },
              { title: 'AACQ', sub: 'Tecla X', text: 'Lock automático: fija el blanco bajo el cursor o, si no hay ninguno, el más cercano. Pasa directamente a STT.' },
              { title: 'VS', sub: 'Velocidad frente a azimut', text: 'Modo de búsqueda en el que la pantalla muestra la <b>velocidad de cierre</b> en vertical en lugar de la distancia. Se cambia con el botón de modo (RWS → TWS → VS).' },
              { title: 'ACM', sub: 'BST / VACQ / WACQ / GACQ', text: 'Modos de combate cercano del radar. <b>⚠ No están implementados en esta herramienta.</b> Estudiarlos exigiría un curso aparte.' },
              { title: 'SURF', sub: 'Aire-superficie', text: 'Cambia la página del radar a aire-superficie. <b>⚠ No implementado.</b>' },
            ],
          },
          doneFlag: 'all',
          done: ok('Ya conoces los casos especiales del radar.'),
          html: `
            <p>Además de RWS, LTWS, TWS y STT, el radar tiene otras funciones. Algunas están simuladas en esta herramienta y otras no; te lo señalo en cada tarjeta.</p>
            <p>Pulsa cada tarjeta para leer su explicación.</p>`,
        },
        {
          title: 'Resumen',
          end: true,
          fig: { type: 'scope', preset: 'raid', mode: 'tws', plan: true, az: 80, bars: 2, scale: 80, initLS: 'A', designate: true },
          ctls: [TOG('raid', 'SCAN RAID', false)],
          html: `
            <ul>
              <li><b>RAID</b> separa grupos que el radar ve como un solo eco (TWS con L&S).</li>
              <li><b>SPOT</b> concentra el barrido en 22° alrededor del cursor.</li>
              <li><b>AACQ</b> fija el blanco más cercano o el del cursor.</li>
              <li>ACM y SURF no están implementados todavía.</li>
            </ul>`,
        },
      ],
    },

    // ------------------------------------------------------------------------------------------------------
    {
      title: 'Táctica básica en BVR',
      practice: 'dificil',
      steps: [
        {
          title: 'El flujo de un encuentro',
          fig: {
            type: 'cards', hint: 'Pulsa cada paso del flujo para leer qué hacer.',
            items: [
              { title: 'Mira', sub: 'Barras, azimut y escala', text: 'Coloca el radar para <b>ver lo que esperas</b>: azimut hacia donde viene la amenaza, barras y elevación acordes a la altitud de los blancos, y una escala que muestre la zona de interés.' },
              { title: 'Detecta', sub: 'RWS / LTWS', text: 'Busca con RWS (o LTWS si quieres track files) y observa los bricks. Mantén un barrido rápido: no uses más barras ni más azimut de los necesarios.' },
              { title: 'Identifica', sub: 'IFF / NCTR', text: 'Interroga con IFF (≤ 45 NM y ±30° del morro) y, si hace falta, usa NCTR (≤ 25 NM) para conocer el tipo. <b>No dispares nunca sin identificar.</b>' },
              { title: 'Elige objetivo', sub: 'L&S y DT2', text: 'Marca el L&S (el más peligroso o el más cercano) y un DT2. Usa NWS para recorrer o intercambiar. En TWS el radar te da su zona de disparo.' },
              { title: 'Sigue o fija', sub: 'TWS o STT', text: 'Con <b>TWS</b> mantienes la conciencia de la situación sobre todos los blancos. Fija en <b>STT</b> solo cuando haga falta, sabiendo que pierdes de vista a los demás.' },
              { title: 'Dispara y vigila', sub: 'Rmax, Rne y notch', text: 'Dispara dentro de Rmax, mejor en el Rne si puedes. Mientras el misil vuela, <b>cuida el notch</b> y la elevación de la antena; si el blanco gira a 90°, cámbiale el rumbo para no perderlo.' },
            ],
          },
          doneFlag: 'all',
          done: ok('Ya conoces el flujo completo: Mira → Detecta → Identifica → Elige → Sigue/Fija → Dispara.'),
          html: `
            <p>Todo lo que has aprendido se resume en un flujo que repetirás en cada intercepción:</p>
            <p><b>Mira → Detecta → Identifica → Elige objetivo → Sigue o fija → Dispara y vigila.</b></p>
            <p>Pulsa cada paso para leer cómo aplicarlo con el radar del Hornet.</p>`,
        },
        {
          title: 'Errores típicos',
          end: true,
          fig: {
            type: 'cards', hint: 'Pulsa un error para ver cómo evitarlo.',
            items: [
              { title: '6 barras siempre', sub: 'Mucha altura, refresco lento', text: 'Con 6 barras tardas unos 15 s en volver a mirar cada altura. Usa las barras que necesites para la altitud de los blancos.' },
              { title: 'Escala 160 = alcance', sub: 'La escala es zoom', text: 'Poner 160 NM no hace que veas a 160 NM. Es solo la escala de la pantalla.' },
              { title: 'Disparar sin identificar', sub: 'Cajita ≠ enemigo', text: 'Un contacto ambiguo puede ser un amigo. Interroga (IFF) antes de disparar.' },
              { title: 'Fijar STT demasiado pronto', sub: 'Pierdes a los demás', text: 'En STT dejas de ver el resto de contactos. Mejor TWS hasta el último momento.' },
              { title: 'Olvidar la elevación', sub: 'La antena viaja con el avión', text: 'Si cabeceas o el blanco cambia de altitud, recoloca la antena o te saldrás del cono.' },
              { title: 'Ignorar el notch', sub: 'Blanco a 90°', text: 'Si el blanco se pone de costado, el radar puede perderlo. Cambia tu rumbo para sacarlo del notch.' },
            ],
          },
          html: `
            <p>Estos son los errores más habituales de los pilotos nuevos con el radar del Hornet. Pulsa cada uno para ver cómo evitarlo.</p>
            <p>Cuando quieras, pon en práctica todo el curso en el escenario más difícil.</p>`,
        },
      ],
    },
  ];

  window.RadarCourseData = { SESSIONS };
})();
