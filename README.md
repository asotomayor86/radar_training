# Entrenador del radar del F/A-18C

Web estática (HTML + JS + CSS, sin compilar ni dependencias) para que los cadetes entiendan cómo funciona el radar AN/APG-73 del Hornet. Implementación original; la pantalla, los botones y el funcionamiento de los modos siguen la *Guía de Chuck para el F/A-18C de DCS* (parte 9, "Radar & Sensors"). La detección (alcances, notch) es una simplificación didáctica.

## Probarlo
Abre `index.html` en el navegador (funciona con doble clic, sin servidor).

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
- Carcasa con "tejado" plano y flancos diagonales a ~41° (SVG), placa del selector OFF/NIGHT/DAY (sin fondo distinto: mismo color que la carcasa) con su mando, tornillos, alojamientos hundidos para los 20 botones y placas alargadas de BRT/CONT, con la punta redondeada del lado que se ve.
- Pantalla de 432 x 432 (72 % del ancho) con esquinas muy redondeadas, marco interior y cristal.
- **Botones** (~40 unidades): cuadrado metálico gris azulado con un **círculo interior** casi completo (contorno oscuro fino, borde claro) y una ranura larga y fina con filo verdoso (vertical arriba y abajo, horizontal a los lados). Entre ellos, píldoras oscuras. Las filas superior e inferior van centradas; los laterales, algo más bajos que el centro de la pantalla.
- **Mandos BRT y CONT**: aro claro en la base, cuerpo azul con estrías radiales y tapa lisa gris azulada desplazada abajo y a la derecha, como en las fotos. Funcionan: arrastra o usa la rueda del ratón. El selector OFF/NIGHT/DAY también (clic en el mando o en la palabra).

## Ejercicios y aleatoriedad
Cada escenario tiene una **dificultad** (1–4: Fácil 1, Normal 2, Con amigo 2, Notch 3, Difícil 4). Al cargarlo o reiniciarlo, alcance, marcación, altitud, rumbo y velocidad de cada blanco varían al azar, y **la variación se multiplica por la dificultad** (ver `random` en `config.js`; con `enabled: false` los ejercicios son siempre iguales). Los blancos marcados con `beam` siguen volando de costado (en el notch) aunque cambie su marcación.

## Panel lateral
**Controles** (plegable, plegado por defecto: clic en el título para desplegar la lista de teclas y ratón) y el mapa del instructor, que se ajusta a la altura de la ventana para que se vea entero. Bajo el radar, sin marco, hay una fila con **Reiniciar**, el selector de escenario (ocupa el ancho que queda) y el botón **CON/SIN AWACS**, que juntos ocupan el ancho del radar.

## Ayudas flotantes
Al pasar el cursor por un botón del DDI, el selector o los mandos BRT/CONT aparece una ventana flotante con su nombre y qué hace (textos en `i18n.js`). Ya no hay un cuadro fijo en el panel lateral.

## Botones (OSB), como en la página RDR ATTK
Numeración real: 1–5 arriba (izq→der), 6–10 derecha (arriba→abajo), 11–15 abajo (der→izq), 16–20 izquierda (abajo→arriba).

| OSB | RWS / VS | TWS | STT |
|---|---|---|---|
| 1 | Barras (1/2/4/6) y barra actual | Barras (2/4/6) | — |
| 2 | SIL | SIL | SIL |
| 3 | ERASE | HITS | — |
| 4 | — | RAID (no implementado) | — |
| 5 | Arma (9M 2) | Arma | TWS (volver a TWS) |
| 6 / 7 | Escala ↑ / ↓ (5–160 NM) | igual | igual |
| 8 | SET (sin función conocida) | Centrado AUTO / MAN (/ BIAS) | — |
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

**Página DATA** (OSB 11): ECCM (19), COLOR (8), MSI (9), LTWS (10), BRA (14), DCLTR 1/2 (12) y RAID/1LOOK (7, sin función). ECCM reduce algo el alcance; LTWS funciona en RWS; BRA muestra marcación/distancia del cursor; el resto solo cambia de estado.

## Cómo funciona (resumen de la guía)
- **RWS**: un Enter sobre un brick = STT directo. Con **LTWS** (DATA) el primer Enter marca L&S (estrella), el siguiente blanco DT2 (rombo) y un segundo Enter sobre el L&S da STT.
- **TWS**: hasta 10 trackfiles, los 8 más cercanos como símbolo; barrido limitado (2B→80°, 4B→40°, 6B→20°; al entrar desde 140°/1B pasa a 80°/2B). Centrado **AUTO** sigue al L&S en azimut y elevación; **MAN** se fija con Enter en zona vacía; **BIAS** desplaza el centro sin perder L&S/DT2. Al perder el L&S pasa a MAN.
- **VS**: eje vertical = velocidad de cierre (0–2400 kt), sin distancia; solo blancos de frente.
- **IFF en STT**: al fijar un blanco el radar lo interroga (1,5 s, hasta 60 NM; parámetros en `iff` de `config.js`). Mientras tanto el símbolo sale amarillo con un «IFF» parpadeante; al responder pasa a **aliado** (verde), **hostil** (rojo) o **desconocido** (amarillo) según lo que sea el avión (`side` en los escenarios: `friend`, `hostile` o `unknown`) y sale el aviso «IFF: AMIGO / HOSTIL / DESCONOCIDO». El resultado se recuerda en TWS. NCTR solo añade el tipo de avión. El escenario «Con amigo» trae un aliado, un hostil y un desconocido.
- **STT**: descarta el resto de trackfiles, elevación bloqueada, Mach a la izquierda y altitud a la derecha; abajo, marcación/distancia al blanco y su número de traza. Esc (Undesignate) vuelve al último modo de búsqueda.
- **Notch**: el radar no ve un blanco que vuela a **90° de la línea de visión** (de costado, "beaming"): su velocidad radial respecto al suelo es ~0 y el Doppler lo confunde con el eco del suelo. Un blanco que se pone de costado en STT acaba perdiendo el lock.
- **Ratón**: un clic en la pantalla mueve el TDC al punto y lo pulsa (TDC depress), igual que Enter; mantenido 0,8 s sobre zona vacía activa SPOT.
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
- Los botones **SET** (OSB 8 en RWS) y **RDR PRI** (OSB 17) aparecen en las imágenes de la guía pero esta no describe su función; están dibujados y sin efecto en vez de inventar un comportamiento.
- No implementado: página AZ/EL, EXP, RAID, SURF, ACM (BST/VACQ/WACQ/GACQ), modos de helmet, IFF, datalink, círculo ASE en STT, LAR.
- El PRF "en uso" en INTL se muestra fijo; en el avión alterna.
- La caja de datos bajo el cursor en RWS es una ayuda didáctica que **no existe en el avión real**; está desactivada por defecto (`display.showHoverData` en `config.js`).
- Del entorno del DDI no se reproducen los paneles vecinos ni los mandos HOTAS (se probaron y se retiraron); los controles equivalentes están en el teclado: flechas (TDC), Enter, Esc, X, W/S, A/D, M.
