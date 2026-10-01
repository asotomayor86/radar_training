# Entrenador del radar del F/A-18C

Web estática (HTML + JS + CSS, sin compilar ni dependencias) para que los cadetes entiendan cómo funciona el radar AN/APG-73 del Hornet. Implementación original; la pantalla, los botones y el funcionamiento de los modos siguen la *Guía de Chuck para el F/A-18C de DCS* (parte 9, "Radar & Sensors"). La detección (alcances, notch) es una simplificación didáctica.

## Probarlo
Abre `index.html` en el navegador (funciona con doble clic, sin servidor).

## Probarlo en local sin caché
`python serve.py` y abre http://127.0.0.1:8080/index.html. El servidor no deja que el navegador guarde copias, y las direcciones de los archivos en `index.html` llevan una versión (`?v=...`): **al publicar cambios, cámbiala** para que los navegadores descarguen todos los archivos nuevos a la vez. Si la pantalla del radar sale en blanco tras una actualización, casi seguro es caché mezclada: recarga con **Ctrl+F5**.

**Fuentes sin bloqueo**: la hoja de Google Fonts se carga con `preload` en vez de bloquear la página. Antes, si esa petición tardaba o se colgaba, los scripts esperaban y **el radar no aparecía** hasta que terminara; ahora la página funciona igual con fuentes del sistema y las fuentes entran cuando llegan.

## Meterlo en la web del escuadrón
Sube la carpeta completa a tu hosting y enlázala con un iframe:

```html
<iframe src="/radar/index.html" style="width:100%;height:760px;border:0" title="Radar F/A-18C"></iframe>
```

## Qué tocar y dónde
| Quiero cambiar… | Archivo |
|---|---|
| Alcances, azimuts, barras, velocidad de barrido, ancho del haz, notch, NCTR, escenarios | `js/config.js` (todo comentado) |
| Textos, ayudas de botones y mandos, idioma | `js/i18n.js` |
| Qué botón hace qué (los 20 OSB) | `osbs()` en `js/ui.js` |
| Reglas de RWS/TWS/VS/STT, L&S/DT2, notch | `js/sim.js` |
| Mapa del instructor | `js/map.js` |
| Forma del bisel, botones, mandos | `housingSvg()` en `js/ui.js` y el bloque DDI de `css/style.css` |
| Colores y estilo de la web | `css/style.css` (variables al principio) |

## Bisel del DDI
Geometría medida sobre una **vista frontal recta** del DDI (plano de ensamblaje del proyecto OpenHornet, usado solo como referencia de medidas, sin copiar sus archivos) y contrastada con las fotos de la Guía de Chuck. Lienzo de 600 x 654 unidades (14 más que en el plano, para que el selector no se monte sobre la fila superior de botones), todo en porcentajes:
- Esquinas **redondeadas** (radio 22 unidades el contorno y 19 la superficie), las cuatro iguales: las de abajo en `housingSvg()` y las de arriba en `plateSvg()` (los triángulos de las esquinas).
- Carcasa con "tejado" plano y flancos diagonales a ~41° (SVG), placa del selector OFF/NIGHT/DAY (sin fondo distinto: mismo color que la carcasa) con su mando, tornillos, alojamientos hundidos para los 20 botones y placas alargadas de BRT/CONT, con la punta redondeada del lado que se ve.
- Pantalla de 432 x 432 (72 % del ancho) con esquinas muy redondeadas, marco interior y cristal.
- **Botones** (~40 unidades): cuadrado metálico gris azulado con un **círculo interior** casi completo (contorno oscuro fino, borde claro) y una ranura larga y fina con filo verdoso (vertical arriba y abajo, horizontal a los lados). Entre ellos, píldoras oscuras. Las filas superior e inferior van centradas; los laterales, algo más bajos que el centro de la pantalla.
- **Mandos BRT y CONT**: aro claro en la base, cuerpo azul con estrías radiales y tapa lisa gris azulada desplazada abajo y a la derecha, como en las fotos. Funcionan: arrastra o usa la rueda del ratón. El selector OFF/NIGHT/DAY también (clic en el mando o en la palabra).

## RAID
Tecla **R** o botón 4 (RAID): en **TWS con un L&S** entra en **SCAN RAID**, un barrido de 22° y 3 barras centrado en el L&S, con una vista de 22° × 10 NM alrededor de él (el L&S en el centro, el resto de ecos como bricks en bruto); el B-sweep queda congelado en el azimut del L&S, y barras, azimut, escala, centrado, HITS y EXP no están disponibles. En **STT** entra en **RAID SAM**: ecos en bruto con su altitud en miles de pies alrededor del blanco fijado (a menos de 5 NM), refrescados cada 3,5 s, y una «M» si dos ecos están a menos de 1 NM y no se separan. Se sale con RTS (botón 20), Undesignate, RSET o pulsando RAID otra vez; si se pierde el L&S, también. Parámetros en `raid` de `config.js`. No están los blancos fuera de la vista dibujados en el borde, ni el AIM-120 en SCAN RAID.

## Ejercicios y aleatoriedad
Cada escenario tiene una **dificultad** (1–4: Fácil 1, Normal 2, Con amigo 2, Notch 3, Difícil 4). Al cargarlo o reiniciarlo, alcance, marcación, altitud, rumbo y velocidad de cada blanco varían al azar, y **la variación se multiplica por la dificultad** (ver `random` en `config.js`; con `enabled: false` los ejercicios son siempre iguales). Los blancos marcados con `beam` siguen volando de costado (en el notch) aunque cambie su marcación.

## Panel lateral
**Controles** (plegable, plegado por defecto: clic en el título para desplegar la lista de teclas y ratón) y el mapa del instructor, que se ajusta a la altura de la ventana para que se vea entero. Bajo el radar, sin marco, hay una fila con **Reiniciar**, el selector de escenario (ocupa el ancho que queda) y el botón **CON/SIN AWACS**, que juntos ocupan el ancho del radar.

## Botones CURSO y EJERCICIOS
Dos botones **triangulares continuos con el marco** (mismo gris, degradado y borde exterior que la carcasa, sin franja entre ambos, de modo que el conjunto se ve como un rectángulo y la ranura del bisel queda como detalle de la superficie), en las esquinas superiores: **CURSO** a la izquierda y **EJERCICIOS** a la derecha. Sus enlaces se configuran en `links` de `config.js` (`curso` y `ejercicios`). Si se dejan vacíos, **CURSO no hace nada** y **EJERCICIOS lleva al selector de ejercicios** bajo el radar. Al pasar el cursor por encima salen sus ayudas flotantes (textos en `plates` de `i18n.js`). La forma está en `plateSvg()` de `ui.js` y el texto usa el grafismo de las placas del marco: Barlow Condensed en negrita, blanco hueso, con relieve grabado, **dentro de una placa negra con borde** (ajustada al tamaño del texto) e inclinado siguiendo el borde del chaflán. **Al pasar el cursor**, el triángulo toma un fondo amarillo algo oscurecido (`#a38a2f` en `style.css`) y la placa del texto sigue negra.

## Curso de introducción
La placa **CURSO** cambia la fila de bajo el radar: aparece un desplegable con las **13 sesiones** y el botón **Abrir**. El contenido se muestra **superpuesto al radar y al mapa** (real y lateral) hasta la fila de controles; **EJERCICIOS** devuelve la fila de Reiniciar / escenario / AWACS. Cerrar la ventana no cambia de modo; «Practicar en el simulador» (último paso de cada sesión) la cierra y carga el escenario recomendado (`practice` en `course_data.js`).

- `js/course_data.js`: **el contenido** (sesiones, pasos, textos, mandos). Para editar o añadir una sesión basta con tocar este archivo.
- `js/course_figs.js`: figuras interactivas: perfil del cono con barras (`side`), pantalla del radar + vista desde arriba (`scope`: bricks, LTWS, STT con notch/NCTR, IFF, NWS, TWS, RAID), panel de botones del DDI (`osb`) y tarjetas (`cards`). Los parámetros vienen de `config.js` (barras de 3,67°, 80°/s de barrido, notch de 100 kt, IFF de 45 NM/±30°, TWS 2B→80°/4B→40°/6B→20°, RAID de 22° x 10 NM); los 2,5 s por barra son didácticos.
- `js/course.js`: la ventana (pasos, mandos, avisos al cumplir un reto). Los textos de la interfaz están en `course` de `i18n.js`.

Sesiones: 1 El radar como un cono · 2 Barras de elevación · 3 Azimut, alcance y orientación · 4 Botones del DDI · 5 Página DATA · 6 RWS · 7 LTWS y track files · 8 STT · 9 IFF · 10 NWS (Undesignate) · 11 TWS · 12 RAID, SPOT y ACM · 13 Táctica básica en BVR. Lo que no está simulado (CHAN/MODE, ECCM, ACM, SURF, Bullseye) se señala con ⚠ en el texto.

## Ayudas flotantes
Al pasar el cursor por un botón del DDI, el selector o los mandos BRT/CONT aparece una ventana flotante con su nombre y qué hace (textos en `i18n.js`). Ya no hay un cuadro fijo en el panel lateral.

## Botones (OSB), como en la página RDR ATTK
Numeración real: 1–5 arriba (izq→der), 6–10 derecha (arriba→abajo), 11–15 abajo (der→izq), 16–20 izquierda (abajo→arriba).

| OSB | RWS / VS | TWS | STT |
|---|---|---|---|
| 1 | Barras (1/2/4/6) y barra actual | Barras (2/4/6) | — |
| 2 | SIL | SIL | SIL |
| 3 | ERASE | HITS | — |
| 4 | — | RAID (SCAN RAID, necesita L&S) | RAID (RAID SAM) |
| 5 | Arma (clic o teclas 1/2/3) | Arma | TWS (volver a TWS) |
| 6 / 7 | Escala ↑ / ↓ (5–160 NM) | igual | igual |
| 8 | SET (guarda barras y azimut del arma) | Centrado AUTO / MAN (/ BIAS) | — |
| 9 | RSET | RSET | RSET |
| 10 | NCTR | NCTR | NCTR |
| 11 | DATA | DATA | DATA |
| 12 | CHAN (sin efecto) | igual | igual |
| 14 | Azimut 20/40/60/80/140° | Azimut (máx. según barras) | — |
| 15 | MODE (sin efecto) | EXP (no implementado) | EXP (no implementado) |
| 16 | PRF (INTL / HI / MED) | igual | igual |
| 17 | RDR PRI (sin función conocida) | igual | igual |
| 18 | SURF (aire-superficie, no implementado) | igual | igual |
| 19 | — | — | — |
| 20 | Modo: RWS → TWS → VS | igual | RTS (volver a la búsqueda) |

**OPR / C11** (arriba a la izquierda) es solo el estado del radar y su canal, no un botón. El radar arranca en OPR; SIL (OSB 2) lo silencia.

**Cursor de elevación** (flecha del borde izquierdo): indica la **barra que se está barriendo**, por lo que salta de barra en barra con cada barrido; en STT sigue la elevación del blanco.

**SET y armas** (según el vídeo del escuadrón): **SET** guarda las barras y el azimut del arma seleccionada; al elegir otra arma y volver, el radar recupera esa configuración. Armas: teclas 1 (120C), 2 (7M), 3 (9M) o clic en el botón superior derecho. **AGE** (página DATA, arriba a la izquierda): 2, 4, 8, 16 o 32 s que se conserva un eco o una traza; por defecto 8.

**Página DATA** (OSB 11): AGE (1), ECCM (19), COLOR (8), MSI (9), LTWS (10), BRA (14), DCLTR 1/2 (12) y RAID/1LOOK (7, sin función). ECCM solo cambia de estado (en DCS no está simulado); LTWS funciona en RWS; BRA muestra marcación/distancia del cursor; el resto solo cambia de estado.

## Cómo funciona (resumen de la guía)
- **RWS**: un Enter sobre un brick = STT directo. Con **LTWS** (DATA) el primer Enter marca L&S (estrella), el siguiente blanco DT2 (rombo) y un segundo Enter sobre el L&S da STT.
- **TWS**: hasta 10 trackfiles, los 8 más cercanos como símbolo; barrido limitado (2B→80°, 4B→40°, 6B→20°; al entrar desde 140°/1B pasa a 80°/2B). Centrado **AUTO** sigue al L&S en azimut y elevación; **MAN** se fija con Enter en zona vacía; **BIAS** desplaza el centro sin perder L&S/DT2. Al perder el L&S pasa a MAN.
- **Cambios recientes de ED aplicados** (registro oficial de cambios, DCS 2.9.27 y 2.9.28, junio–julio de 2026): las **trazas de baja prioridad** (rango 9 en adelante) se dibujan como un pequeño **«+»** amarillo, sin vector ni datos (la guía de SimTuts de enero de 2026 lo confirma); y los **bricks en bruto no están estabilizados en el espacio**: se quedan fijos en la pantalla donde se detectaron aunque gires.
- **Vectores de TWS**: un palito corto de **longitud fija en pantalla** (16 px, `tws.vectorPx`; no depende de la escala) que solo indica hacia dónde va el blanco, como en las capturas del vídeo del escuadrón. El **BRA** sale a la altura medida en esas capturas (≈ 8,6 % de la altura del marco sobre el borde inferior).
- **Tracks de TWS** (según capturas del vídeo): cada símbolo lleva su **número de traza** (por cercanía); el L&S lleva una estrella con el Mach a la izquierda y la altitud a la derecha; en el borde derecho, un **«>» con la velocidad de cierre** del L&S a su distancia. La flecha de elevación del borde izquierdo va sola, sin cifra.
- **Marcado de contactos** (Guía de Chuck, págs. 195–227): en RWS sin LTWS, el TDC sobre un brick da **STT** directo. Con **LTWS** o en **TWS**, el 1.º pulso marca el **L&S** (estrella), otro blanco el **DT2** (rombo) y un pulso sobre el L&S da STT. **Undesignate** (el «pinky switch», tecla Esc): sin L&S marca la traza más cercana como L&S; con DT2 intercambia L&S y DT2; si no, recorre el L&S por las trazas en orden de rango; en STT suelta el lock. Con LTWS o TWS, **poner el cursor sobre una traza lanza una interrogación IFF automática** (TUC, 1,5 s, hasta 45 NM y ±30°), igual que en STT.
- **Alcance de disparo**: junto al L&S (amarillo) y al DT2 (verde), una barra vertical exactamente a su azimut, **siempre verde** (sea hostil o no el blanco), con tres travesaños iguales: alcance mínimo, sin escape y máximo. El máximo depende del **aspecto** (velocidad de cierre): de frente es el máximo y baja pronto al ponerse de costado y mucho a frío (con el AMRAAM didáctico: 40 NM a 900 kt de cierre, ~20 NM a 450 kt y 10 NM si el blanco huye), con `aspectMin` y `curve` en `launchZone`. **Las cifras son didácticas** (`weapons` y `launchZone` en `config.js`): la guía no las da.
- **Círculo del centro** (ASE/LAR): con un L&S (TWS o LTWS) o un blanco fijado (STT), un círculo **siempre centrado en la pantalla**: grande si el blanco está dentro del alcance máximo del arma y pequeño si no, y **cambia de tamaño de forma gradual** (unos 0,4 s, `growPxS` en `ase` de `config.js`). La regla me la dio el usuario viendo el radar; no la he podido contrastar con una fuente escrita. No dibujo el punto verde (la guía de Chuck lo llama «steering cue dot»), porque no sé cómo se calcula su posición.
- **Centrado en TWS** (Guía de Chuck, pág. 212, y vídeo del escuadrón): **MAN** fija el centro del barrido donde pulsas el TDC en zona vacía (el barrido no sigue al cursor). **AUTO** lo centra en el L&S, en azimut y elevación, y solo existe con un L&S: **al entrar en TWS (sin L&S) el centrado es MAN**, al marcar un L&S pasa solo a AUTO, y si se pierde vuelve a MAN. En AUTO, pulsar en vacío entra en **BIAS**: desplaza el centro hacia ese punto todo lo que puede sin perder el L&S ni el DT2 dentro del barrido (por eso con 4 barras y 40° la antena se mueve como mucho unos 18° desde el L&S).
- **VS**: eje vertical = velocidad de cierre (0–2400 kt), sin distancia; solo blancos de frente.
- **IFF en STT**: al fijar un blanco el radar lo interroga (1,5 s, hasta 45 NM y ±30° del morro, como cuenta el vídeo del escuadrón; parámetros en `iff` de `config.js`). Mientras tanto el símbolo sale amarillo con un «IFF» parpadeante; al responder pasa a **aliado** (verde), **hostil** (rojo) o **desconocido** (amarillo) según lo que sea el avión (`side` en los escenarios: `friend`, `hostile` o `unknown`) y sale el aviso «IFF: AMIGO / HOSTIL / DESCONOCIDO». El resultado se recuerda en TWS. NCTR solo añade el tipo de avión. El escenario «Con amigo» trae un aliado, un hostil y un desconocido.
- **STT**: descarta el resto de trackfiles, elevación bloqueada, Mach a la izquierda y altitud a la derecha; abajo, marcación/distancia al blanco y su número de traza. Esc (Undesignate) vuelve al último modo de búsqueda.
- **Notch**: el radar no ve un blanco que vuela a **90° de la línea de visión** (de costado, "beaming"): su velocidad radial respecto al suelo es ~0 y el Doppler lo confunde con el eco del suelo. Un blanco que se pone de costado en STT acaba perdiendo el lock.
- **Ratón**: un clic en la pantalla mueve el TDC al punto y lo pulsa (TDC depress), igual que Enter; mantenido 0,8 s sobre zona vacía activa SPOT.
- **Barrido con L&S en AUTO**: la ventana de barrido sigue al L&S y se mueve un poco cada fotograma; la antena solo se reposiciona si está a más de `slewTolDeg` (3°) fuera de ella, y si no sigue barriendo (antes quedaba atascada en el borde y dejaba de barrer).
- **La antena nunca salta**: cuando el nuevo centro del barrido la deja fuera de su ventana (por ejemplo, barriendo a 20° de un lado y pulsando el TDC en el otro), o al fijar un blanco en STT, la antena se **desplaza** hacia su nueva posición con una velocidad máxima (`slewRateDegS`, 80°/s en azimut; `elevSlewDegS`, 40°/s en elevación cuando el radar la manda solo: STT y TWS en AUTO). Durante ese desplazamiento no se registran ecos. El cono del haz del mapa del instructor lo refleja.
- **AACQ** (X): lock al blanco bajo el cursor o al más cercano. **SPOT**: Enter mantenido 0,8 s en zona vacía → barrido de 22° sobre el cursor.
- Los números amarillos junto al TDC son las altitudes (miles de pies) que cubre el haz a esa distancia.

## Mapa del instructor
Panel lateral con el mapa del instructor, sin título ni botón (la tecla **M** lo oculta y lo muestra). Muestra lo que el radar no cuenta:
- **Identificación**: los contactos salen **en gris** (triángulo gris) hasta que los identificas. Se identifican con el IFF al fijarlos en STT; entonces pasan, también en el mapa, a **aliado** (círculo verde), **hostil** (triángulo rojo) o **desconocido** (triángulo amarillo). Arriba a la derecha, en la misma línea que «REAL · distancia», el mapa avisa de cuántos aviones **quedan sin identificar** en el ejercicio («SIN IDENTIFICAR: n»). Al identificar el último sale «TODOS IDENTIFICADOS» con el **tiempo** (mm:ss) que se ha tardado desde el inicio del ejercicio, congelado.
- **CON AWACS / SIN AWACS** (botón bajo el radar, cambia de texto al pulsarlo): con AWACS (ayuda, por defecto) se ve siempre la posición real de todos los aviones. Sin AWACS no se ve ninguno hasta que el radar lo detecta; mientras el eco exista se ve (en gris) y si lo pierdes desaparece, salvo que ya lo hayas identificado: entonces se ve siempre. El modo se conserva al reiniciar.
- **Vista superior**: posición **real** de cada avión, su altitud, rumbo y velocidad. Los anillos de distancia llevan sus cifras (NM) sobre la línea central, las mismas que las marcas de la vista lateral. El cono tenue es todo el barrido y el **cono brillante y estrecho es el haz**, que se mueve de lado a lado dentro de él (en STT apunta al blanco).
- **Vista lateral** (distancia contra altitud): la cuña tenue es la altura que cubre el barrido y el **cono brillante es el haz**, que salta de barra en barra (1, 2, 4 o 6). Solo aparecen los aviones que están dentro de tu barrido horizontal; un avión que se sale del azimut desaparece de esta vista. Sin rejilla ni cifras de altitud, pero con **marcas de distancia** (NM) en el borde inferior, en los mismos cuartos que los anillos de la vista superior y que cambian con la escala; la vista lateral ocupa el 80 % de la altura de la superior y su escala vertical depende del alcance: con la antena recta, el cono de las **seis barras** (la cobertura máxima) cabe siempre entero (ocupa del 10 % al 90 % de la altura con cualquier escala); si subes o bajas la antena, el cono puede salirse. La altura del mapa se ajusta para que su tarjeta termine a la altura de la base del botón de reiniciar.
- **TDC (los brackets amarillos)**: en la vista superior se ve cómo se mueve en azimut y en distancia (brackets amarillos y una línea de puntos desde tu avión). En la vista lateral, una **línea amarilla vertical, fina y discontinua,** va hacia delante y hacia atrás con la distancia del TDC, y sus extremos marcan la altitud máxima y mínima (miles de pies) que el haz cubre a esa distancia: son los mismos números que salen junto al TDC en la pantalla.
- **NOTCH**: etiqueta ámbar junto a un avión dentro del barrido que el radar no ve por estar de costado.

## Estilo visual (alineado con el Hangar de MadDog)
Tomado de los estilos públicos de hangar.escuadronmaddog.com: fondo `#0a0c0f`, superficies `#12151a`/`#1a1f28`, dorado `#c9a84c` como único acento; **Bebas Neue** para títulos, **Barlow** para texto y **Barlow Condensed** en mayúsculas espaciadas para rótulos; bordes finos y esquinas casi rectas. Tema claro/oscuro con la misma clave `theme` de `localStorage`. El DDI conserva su aspecto de cabina en ambos temas. Fuentes de Google Fonts, como en el Hangar.

Como subdominio: el tema de `localStorage` es por origen, así que no se comparte con el Hangar automáticamente (haría falta una cookie en `.escuadronmaddog.com` en ambos sitios). La herramienta es estática y pública: si debe ser solo para miembros (acceso con Discord), eso se resuelve en el servidor o con un proxy de autenticación, no en estos archivos.

## Diferencias y cosas que no se han podido confirmar
- **RDR PRI** (OSB 17) aparece en las imágenes pero nadie lo explica en las fuentes que he podido leer; está dibujado y sin efecto.
- **Tamaño de los iconos**: `iconScale` en `config.js` (1,25 por defecto; 1 = tamaño base). Aumenta símbolos, bricks y «+» y el grosor de sus líneas, no los textos.
- **Botón HITS** (TWS): cambia de estado pero ya no oculta nada: con el cambio de ED las trazas de baja prioridad salen siempre como «+». Tampoco está modelado el AGE de la guía reciente («Improved Radar AGE Setting and Functionality», 2.9.0) ni el **Bullseye**, ni el círculo/LAR alrededor del L&S ni el número de traza de la parte inferior que se ven en capturas recientes (no he podido verificar qué significan).
- No implementado: página AZ/EL, EXP, RAID, SURF, ACM (BST/VACQ/WACQ/GACQ), modos de helmet, IFF, datalink, círculo ASE en STT, LAR.
- El PRF "en uso" en INTL se muestra fijo; en el avión alterna.
- La caja de datos bajo el cursor en RWS es una ayuda didáctica que **no existe en el avión real**; está desactivada por defecto (`display.showHoverData` en `config.js`).
- Del entorno del DDI no se reproducen los paneles vecinos ni los mandos HOTAS (se probaron y se retiraron); los controles equivalentes están en el teclado: flechas (TDC), Enter, Esc, X, W/S, A/D, M.
