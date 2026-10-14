### Pebble Pit, en español: Spanish (es), one neutral file for Spain and
### Latin America (tú, no vosotros, no region-only words).
###
### Drafted by Claude (Opus 5.5) on 2026-10-13 to locales/STYLE.md; not yet
### reviewed by a native speaker.
###
### Same ids, same order and same groups as locales/en.ftl; the comment over
### each message is the English file's. A message the English marks as the
### owner's placeholder is left out, so the English shows.

## Sheets

# rescue sheet heading, end of first half
saved-word = ¿Se acabó?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = ¡rescataste a tu esposa en <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Felices para siempre

# demo end sheet heading
demoend-word = ¡hasta aquí llega la demo!

# demo end sheet line
demoend-why = todavía no puedes rescatar a tu esposa.

# demo end store link (if STORE_URL)
demoend-store = ¡a tu lista de deseos!

# demo end dismiss button
demoend-keep = seguir jugando

# free-build teaser end sheet heading
teaseend-word = ¡continuará en el juego completo!

# teaser end store link (if STORE_URL)
teaseend-store = consigue el juego completo

# teaser end dismiss button
teaseend-keep = seguir jugando

# second-half end sheet heading
freed-word = ok, ahora sí se acabó

# second-half end sheet line
freed-why = rescataste a tu esposo de la panza de la serpiente.

# second-half end sheet line
freed-end = ese es el final. ¡si quieres, sigue matando a la serpiente y cultivando en la superficie!

# second-half end sheet line
freed-thanks = ¡gracias!

# second-half end dismiss button
freed-keep = seguir jugando

# crash sheet heading
crashed-word = detenido

# crash sheet button
crashed-copysave = copiar partida

# pause sheet heading
held-word = en pausa

# pause sheet button
held-resume = seguir

# pause sheet button (relabelled from JS)
held-slotsbtn = partidas

# saves page heading
held-slots-word = partidas

# saves page button
held-savecopy = copiar partida

# saves page button
held-loadsave = cargar partida

# saves page paste box confirm
held-loadit = cargarla

# saves page paste box cancel
held-nevermind = mejor no

# saves page back button
held-slotsback = volver

# pause sheet button (relabelled from JS)
held-recordbtn = logros

# achievements page heading
held-record-word = logros

# achievements page back
held-recordback = volver

# pause sheet button (also src/indexpage.js:24)
held-indexbtn = índice

# index page heading
held-index-word = índice

# index page back
held-indexback = volver

# pause sheet button to landing page
held-titlebtn = volver al título

# pause sheet button, desktop build only
held-quit = salir al escritorio

# pause sheet footer hint
held-keys = esc pausa · ← → mirar · mantén espacio para saltar una escena

# window close button label
modal-close =
    .aria-label = cerrar

# pause sheet reply, desktop export ok
said-saved = guardado

# pause sheet reply, desktop export failed
said-notsaved = sin guardar

# pause sheet reply, store fallback
said-fellback = la última partida no cargaba; esta es la anterior

# pause sheet reply, unreadable save
said-broken = no se pudo leer tu última partida. copiar una partida te la entrega

# pause sheet reply, yard open elsewhere
said-yielded = este patio está abierto en otra pestaña; la que guarda es esa

# pause sheet reply, storage blocked
said-unsaved-blocked = no se guarda: tu navegador bloquea el almacenamiento en esta página. copiar una partida sigue funcionando

# sheet reply after loading a save
said-loaded = cargada

# sheet reply, pasted text invalid
said-notasave = eso no es una partida

# crash sheet line when error has no message
crashed-why-fallback = algo falló

# save row age
slots-since-now = recién

# save row age
slots-since-min = hace { $m } min

# save row age
slots-since-h = hace { $h } h

# save row item
slots-row-rock = roca { $n }

# save row item
slots-row-crew = { $n } obreros

# save row item for open slot in play
slots-row-playing = en juego

# save row, no yard
slots-row-empty = vacía

# save row, broken blob
slots-row-unreadable = ilegible

# saves button label on both fronts
held-slotsbtn-label = partidas · { $n } de { $total }

# empty save row after first press
slots-arm = ¿empezar otro patio?

# sheet reply after opening empty slot
slots-said-new = un patio nuevo

# sheet reply after opening a slot
slots-said-loaded = cargada

# save row delete cross label
slots-del-aria = borrar

# achievements button label with count
held-recordbtn-label = logros · { $count } de { $total }

# achievements page, nothing earned
held-record-none = todavía no hiciste nada.

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
        [one] hace un día
       *[other] hace { $d } días
    }

# saves row delete confirm
slots-confirm-yes = borrar

# saves row delete cancel
slots-confirm-no = volver

# sheet reply, copy with no save
said-copyout-none = nada guardado todavía

# sheet reply when clipboard unavailable
said-copyout-window = en window.__save

# saves page cloud section heading
cloud-head = partidas en la nube

# cloud section button
cloud-btn-linkcode = ingresar un código de enlace

# cloud section button
cloud-btn-recovery = usar un código de recuperación

# cloud section button
cloud-btn-stop = apagar la nube

# cloud section reply after stop
cloud-said-off = la nube está apagada en este dispositivo

# cloud section button
cloud-btn-enable = activar la nube

# cloud section reply on failure (also cloud.js:768)
cloud-why-noanswer = la nube no respondió

# cloud section, copy recovery code
cloud-btn-copy = copiar

# cloud section under recovery code
cloud-writedown = anótalo: trae tus patios de vuelta en otro dispositivo

# cloud section, another device ahead
cloud-btn-take = tomarla

# cloud section, another device ahead
cloud-btn-keep = quedarme con esta

# cloud section reply (also :316)
cloud-said-kept = conservada

# cloud section above pairing code
cloud-pair-enter = en el otro dispositivo, ingresa

# cloud section, hide pairing code
cloud-btn-done = listo

# cloud section button
cloud-btn-link = enlazar un dispositivo

# cloud section toggle
cloud-btn-hidecode = ocultar código de recuperación

# cloud section toggle
cloud-btn-showcode = mostrar código de recuperación

# cloud section button
cloud-btn-newcode = nuevo código de recuperación

# cloud section button, first press
cloud-btn-newcode-armed = ¿cerrar sesión en los otros dispositivos?

# link code box placeholder
cloud-box-linkph = ···-···

# recovery code box placeholder
cloud-box-recph = ····-····-····

# link code box label
cloud-box-aria-link = código de enlace

# recovery code box label
cloud-box-aria-rec = código de recuperación

# cloud section reply, bad code
cloud-wrong = ese código no funcionó

# cloud section reply after linking
cloud-said-linked = enlazado

# cloud code entry confirm
cloud-btn-dolink = enlazar

# cloud code entry cancel
cloud-btn-nevermind = mejor no

# cloud code entry prompt
cloud-typing-link = el código del otro dispositivo

# cloud code entry prompt
cloud-typing-rec = tu código de recuperación

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = demasiados intentos desde aquí hoy; prueba mañana

# cloud section reply, 503
cloud-why-resting = la nube está descansando; prueba más tarde

# cloud section reply, 403
cloud-why-forbidden = la nube no conoce esta página

# the cloud's line in the landing page's foot bar: $state is one of the cloud-state lines below
# (with no state, it stands before the choose-a-yard button)
cloud-line = nube · { $state }

# cloud state: not turned on (in cloud-line, and alone in the saves page section)
cloud-state-off = apagada

# cloud state
cloud-state-out = sesión cerrada

# cloud state
cloud-state-refused = se rechazó una partida

# cloud state
cloud-state-offline = sin guardar: sin conexión

# cloud state
cloud-state-behind = hay una más nueva en otro dispositivo

# cloud state
cloud-state-newer = actualiza para tomar la partida más nueva

# cloud state
cloud-state-big = demasiado grande para la nube

# cloud state
cloud-state-full = la nube está llena

# cloud state
cloud-state-paused = en pausa

# cloud state
cloud-state-conflict = elige un patio

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = guardado { $since }

# cloud state: on, nothing pushed yet
cloud-state-on = activa

# link a device: the pairing code's countdown; $time is m:ss
cloud-pair-left = quedan { $time }

# choose a yard: this device's copy of slot $n; $here is the yard as a saves row says it
cloud-clash-here = este dispositivo · { $n } · { $here }

# choose a yard: the cloud's copy of slot $n; $cloud is the yard as a saves row says it
cloud-clash-cloud = nube · { $n } · { $cloud }

# a cloud button's answer: too many tries; $m is minutes to wait
cloud-why-wait = demasiados intentos; prueba de nuevo en { $m } min

# window title opened off the books
modal-books = las cuentas

# window title, crew list
modal-crew = quién vive aquí

## Settings

# pause sheet button
held-settingsbtn = ajustes

# settings page heading
held-settings-word = ajustes

# settings note where fullscreen unavailable
set-fullscreen-note = para la pantalla completa, agrega esta página a la pantalla de inicio

# settings volume slider label
set-volume =
    .aria-label = volumen

# settings button to controls page
set-controlsbtn = controles

# controls page heading
set-controls-word = controles

# controls page back
set-controlsback = volver

# settings page back
set-settingsback = volver

# settings motion switch
set-motion-less = movimiento: menos

# settings motion switch
set-motion-full = movimiento: todo

# settings touch switch (play only)
set-touch-on = táctil: sí

# settings touch switch (play only)
set-touch-off = táctil: no

# settings dark switch
set-dark-on = oscuro: sí

# settings dark switch
set-dark-off = oscuro: no

# settings sound switch
set-sound-off = sonido: no

# settings sound switch
set-sound-on = sonido: sí

# pause sheet line: a save from a newer build; $build is the build's name
said-newer = esta partida es de una versión más nueva ({ $build })

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = no se guarda: el almacenamiento de este sitio está lleno ({ $used } mb usados, { $ours } kb nuestros). copiar una partida sigue funcionando

# pause sheet line: storage refused a save; $name is the browser's error name
said-unsaved-refused = no se guarda: el almacenamiento rechazó la partida ({ $name }). copiar una partida sigue funcionando

# pause sheet line: storage refused a save, with no error to name
said-unsaved-refused-why = no se guarda: el almacenamiento rechazó la partida. copiar una partida sigue funcionando

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = no se pudo cargar: { $message }

# controls page input column
ctl-leftclick-in = clic izquierdo

# controls page action column
ctl-leftclick-do = interactuar

# controls page input column
ctl-rightclick-in = clic derecho

# controls page action column
ctl-rightclick-do = enfocar obreros

# controls page input column
ctl-rightleft-in = clic derecho + clic izquierdo

# controls page action column
ctl-rightleft-do = levantar obreros

# controls page input column
ctl-middle-in = clic central

# controls page action column
ctl-middle-do = mover la cámara

# controls page input column
ctl-wheel-in = rueda del ratón

# controls page action column
ctl-wheel-do = mover la cámara

# controls page input column
ctl-arrows-in = ← → / a d

# controls page action column
ctl-arrows-do = mover la cámara

# controls page input column
ctl-digits-in = 1 – 9

# controls page action column
ctl-digits-do = saltar a un lugar

# settings fullscreen row
set-fullscreen-on = pantalla completa: sí

# settings fullscreen row
set-fullscreen-off = pantalla completa: no

# a sheet line: the save is on the clipboard; $n is its size in kilobytes
said-copyout-copied = copiados { $n }kb

## Title page

# browser tab title, landing
title-doctitle = Pebble Pit

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = una roca. un pozo. unos pocos en medio.

# landing page main button
title-play = jugar

# landing page button (relabelled saves · n of 3)
title-slotsbtn = partidas

# landing page button (relabelled, src/record.js:33)
title-recordbtn = logros

# landing page button
title-settingsbtn = ajustes

# landing page, desktop build only
title-quit = salir al escritorio

# landing saves page heading
title-slots-word = partidas

# landing saves page button
title-savecopy = copiar partida

# landing saves page button
title-loadsave = cargar partida

# landing paste confirm
title-loadit = cargarla

# landing paste cancel
title-nevermind = mejor no

# landing saves page back
title-slotsback = volver

# landing achievements page heading
title-record-word = logros

# landing achievements page back
title-recordback = volver

# landing settings page heading
title-settings-word = ajustes

# landing settings to controls
title-controlsbtn = controles

# landing settings back
title-settingsback = volver

# landing controls page heading
title-controls-word = controles

# landing controls back
title-controlsback = volver

# landing cloud conflict page heading
title-conflict-word = elige un patio

# landing cloud conflict back
title-conflictback = volver

# landing foot link
title-link-itch = itch

# landing foot link
title-link-github = github

# under play, empty open slot
title-playlabel-new = un patio nuevo

# landing achievements page, nothing earned
title-record-none = nada todavía

# title foot bar conflict link
cloud-foot-choose = elige un patio

# landing reply, bad paste
title-said-notasave = eso no es una partida

# landing reply after load
title-said-loaded = cargada

# landing reply after deleting open slot
title-said-erased = borrada

## Objectives

# label before story line
obj-next = ahora

# story line, first step
obj-rock = ¡pica la roca para rescatar a tu esposa!

# intro quest item
obj-rock-q-chip = pica la roca

# intro quest item
obj-rock-q-pickup = toma una piedrita

# intro quest item
obj-rock-q-toss = tira la piedrita al pozo

# story line after first fall
obj-falling = ¡vuelve a picar la roca!

# story line, wooden roof barrier
obj-props = ¿y si un techo de madera detiene la próxima roca?

# story line, net barrier
obj-net = nada. prueba a atrapar la roca y frenarla

# story line, arch barrier
obj-arch = probemos un arco con el mineral y la piedra que sacamos. seguro que aguanta.

# story line, wizards' barrier
obj-dome = sin opciones, a ver si los magos pueden ayudar.

# story line before rescue
obj-rescue = rescata a tu esposa

# story line, second half
obj-drown = inunda el pozo

# story line after snatch
obj-tower = construye la torre de los magos

# story line after snatch
obj-talk = habla con los magos de lo que acaba de pasar

# story line, deep half
obj-portal = conjura un portal al abismo, ¿qué habrá ahí abajo?

# story line, final step
obj-free = libera a tu esposo de la panza de la serpiente

# objective card cancel while building
obj-barrier-cancel = cancelar ×{ $n }

## Other

# browser tab title, game page
play-doctitle = Pebble Pit

# skip hint during cutscene, desktop (skiphint.js:27)
other-skip-desk = mantén espacio para saltar

# top-edge mess tag
other-messtag-muck = lodo

# top-edge mess tag
other-messtag-poop = caca

# floating button over bench site
other-raise = construir el banco

# phone pause button label
other-pause =
    .aria-label = pausa

title-recordbtn-label = logros · { $count } de { $total }

# corner fullscreen button tooltip
other-fullscreen-title-on = salir de pantalla completa

# corner fullscreen button tooltip
other-fullscreen-title-off = pantalla completa

# crew-fade corner button label
other-corner-show = mostrar obreros

# crew-fade corner button label
other-corner-fade = atenuar obreros

# crew-fade corner button label
other-corner-hide = ocultar obreros

# way corner button tip
other-corner-up = subir al patio

# way corner button tip
other-corner-down = bajar a las profundidades

# queue card line hover
other-queue-site-yard = el patio

# queue card line hover
other-queue-site-sphere = la esfera

# queue card, nobody working
other-queue-queued = en cola

# board footer toggle
other-hidedone-show = mostrar terminados

# board footer toggle
other-hidedone-hide = ocultar terminados

# the queue card: the first in line to be built after the one going up
queue-place-next = siguiente

# the house's board and the crew window, with no crew yet
crew-empty = aquí no vive nadie todavía

# a station's name: its board's title, the pointer's label, the queue card
station-bench = el banco

# skip hint during cutscene, phone
other-skip-touch = mantén para saltar

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = mantén <span data-l10n-name="key"></span> para saltar

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee, idle (drawn in the sign's own pixel capitals)
casino-sign = CASINO

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

## Notices

# toast-shaped card, another device ahead
note-cloud-name = hay una más nueva en otro dispositivo

# toast-shaped card, another device ahead
note-cloud-note = mira en partidas

## Numbers

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } h { $m } min

# how long a yard has been played, under an hour
played-m = { $m } min

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }.º

## Achievements

# toast and achievements card name
ach-firstgrain-name = haciendo dinero

# toast and achievements card note
ach-firstgrain-note = tira una piedrita al pozo

# achievement name
ach-firstrock-name = mejor sigue picando

# achievement note
ach-firstrock-note = despeja la primera roca

# achievement name
ach-gotout-name = rescataste a tu esposa

# achievement note
ach-gotout-note = no más rocas, lo lograste.

# achievement name
ach-firsthire-name = construiste pilones adicionales

# achievement note
ach-firsthire-note = construye otra casa

# achievement name
ach-firstshard-name = el primer mineral

# achievement note
ach-firstshard-note = sube mineral de la cantera

# achievement name
ach-firstspore-name = cultivo

# achievement note
ach-firstspore-note = cultiva tu primera cosecha

# achievement name
ach-firstspark-name = magia en el aire

# achievement note
ach-firstspark-note = consigue tu primera chispa

# achievement name
ach-holefull-name = el pozo está lleno

# achievement note
ach-holefull-note = llena el pozo hasta el borde

# achievement name
ach-rifttorn-name = la grieta abierta, el almacenamiento resuelto

# achievement note
ach-rifttorn-note = llena el pozo hasta abrir una grieta interdimensional

# achievement name
ach-drowned-name = la grieta se agrandó

# achievement note
ach-drowned-note = todo un océano de almacenamiento interdimensional.

# achievement name
ach-star-name = conjura una estrella

# achievement note
ach-star-note = haz bajar una estrella desde la torre

# achievement name
ach-firsthat-name = eres un mago, cuadradito

# achievement note
ach-firsthat-note = termina un sombrero de mago en la torre

# achievement name
ach-firstbrew-name = hola, vendedor de pociones

# achievement note
ach-firstbrew-note = prepara una tanda en la botica

# achievement name
ach-firsttrade-name = primer sombrero

# achievement note
ach-firsttrade-note = cómprale a una estación su primer sombrero

# achievement name
ach-alltrades-name = educando a las masas

# achievement note
ach-alltrades-note = equipa cada estación con su sombrero

# achievement name
ach-allbuilt-name = construcción completa

# achievement note
ach-allbuilt-note = construiste todo

# achievement name
ach-rift1e6-name = 1m por la grieta

# achievement note
ach-rift1e6-note = manda 1m de piedritas por la grieta

# achievement name
ach-brew100-name = 100 tandas

# achievement note
ach-brew100-note = prepara 100 tandas

# achievement name
ach-lived1h-name = una hora en nómina

# achievement note
ach-lived1h-note = mantén a alguien en nómina durante una hora

# achievement name
ach-nobodyhired-name = nadie contratado

# achievement note
ach-nobodyhired-note = despeja una roca entera sin nadie en nómina

# achievement name
ach-ownhand-name = solo con tu mano

# achievement note
ach-ownhand-note = despeja una roca sin que la toque ni un obrero

# achievement name
ach-nevertouched-name = ni la tocaste

# achievement note
ach-nevertouched-note = despeja una roca sin darle ni un golpe tú

# achievement name
ach-underminute-name = una roca en menos de un minuto

# achievement note
ach-underminute-note = despeja una roca en menos de un minuto

# achievement name
ach-everyjob-name = todos los puestos cubiertos

# achievement note
ach-everyjob-note = pon al menos a alguien en cada puesto a la vez

# achievement name
ach-tablebeaten-name = volvimos con todo

# achievement note
ach-tablebeaten-note = gana 50k en una sola mano en el casino

# achievement name
ach-tableruin-name = hora de pedir un préstamo

# achievement note
ach-tableruin-note = pierde 50k en una sola mano en el casino

# achievement name
ach-bird-name = fuera de mi terreno

# achievement note
ach-bird-note = asusta a un pájaro

# achievement name
ach-wholelot-name = ni uno solo

# achievement note
ach-wholelot-note = asusta a todos los pájaros de un mismo terreno

# achievement name
ach-catchall-name = malabarista

# achievement note
ach-catchall-note = lanza un puñado lleno de polvo, al máximo, y atrapa cada grano

# achievement name
ach-lifted-name = ven aquí, tú

# achievement note
ach-lifted-note = levanta a un obrero

# achievement name
ach-shookload-name = vacía los bolsillos

# achievement note
ach-shookload-note = sacúdele a un obrero toda la carga

# achievement name
ach-hatoff-name = me quito el sombrero

# achievement note
ach-hatoff-note = sacude a un obrero hasta que se le caiga el sombrero

# achievement name
ach-dizzy-name = síndrome del bebé sacudido

# achievement note
ach-dizzy-note = marea a un obrero a sacudidas

# achievement name
ach-muckrain-name = llueve sobre mojado

# achievement note
ach-muckrain-note = aguanta una lluvia de lodo

# achievement name: rocks cleared; $n is the count as written (10, 25, 50, 100)
ach-rocks-name = { $n } rocas

# achievement note: rocks cleared; $n is the count
ach-rocks-note = despeja { $n } rocas

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = despeja { $n } rocas, son muchas piedras

# achievement name: pebbles banked; $n is the count, short (10k, 1m)
ach-pebbles-name = { $n } piedritas

# achievement note: pebbles banked; $n is the count, short
ach-pebbles-note = deposita { $n } piedritas

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } cuadrados

# achievement note: crew hired; $n is the count
ach-crew-note = contrata una cuadrilla de { $n }

# achievement name: the first ore ladder rung
ach-ore0-name = 1k de mineral del tajo

# achievement name: the second ore ladder rung
ach-ore1-name = 10k de mineral

# achievement note: ore dug; $n is the count, short (1k, 10k)
ach-ore-note = saca { $n } de mineral de la cantera

## Index

# index entry name
idx-dust-name = piedritas

# index entry text
idx-dust-text = sacadas a golpes de la roca.

# index entry name
idx-shard-name = mineral

# index entry text
idx-shard-text = sacado de la cantera.

# index entry name
idx-spore-name = cosechas

# index entry text
idx-spore-text = crecen en la granja.

# index entry name
idx-spark-name = chispas

# index entry text
idx-spark-text = los magos se las arrancan a la estrella a rayos.

# index entry name
idx-scale-name = escamas

# index entry text
idx-scale-text = trituradas de lo que suelta la serpiente.

# index entry name
idx-crit-name = críticos

# index entry text
idx-crit-text = tiene probabilidad de hacer más daño.

# index entry name
idx-rock-name = la roca

# index entry text
idx-rock-text = aplastó a tu esposa; se pica para sacar valiosas piedritas.

# index entry name
idx-pit-name = el pozo

# index entry text
idx-pit-text = tira aquí tus piedritas, y lo que sea, para guardarlas.

# index entry name
idx-rift-name = la grieta

# index entry text
idx-rift-text = ¿tantas piedritas juntas abrieron una grieta en la realidad?

# index entry name
idx-abyss-name = el abismo

# index entry text
idx-abyss-text = la grieta se tragó demasiadas piedritas para seguir estable y engulló el pozo entero.

# index entry name
idx-muck-name = lodo

# index entry text
idx-muck-text = la contaminación corrompe el ecosistema y la lluvia deja montones de mugre.

# index entry name
idx-poop-name = caca

# index entry text
idx-poop-text = puaj.

# index entry name
idx-bird-name = pájaros

# index entry text
idx-bird-text = pájaros normales.

# index entry name
idx-house-name = la casa

# index entry text
idx-house-text = donde viven los obreros.

# index entry name
idx-pollution-name = contaminación

# index entry text
idx-pollution-text = el precio de la industria. picar, cultivar, sacar mineral, hacer magia: todo contamina y ensucia el aire.

# index entry name
idx-star-name = la estrella

# index entry text
idx-star-text = una estrella de verdad, creada con la magia de los magos, que se revienta para sacar chispas.

# index entry name
idx-balloon-name = globo

# index entry text
idx-balloon-text = lleva un filtro de aire que limpia la contaminación de las nubes.

# index entry name
idx-recycler-name = el reciclador

# index entry text
idx-recycler-text = concentra la contaminación del aire en piedritas útiles.

# index entry name
idx-bench-name = el banco

# index entry text
idx-bench-text = básicamente la tienda general. mejoras de carga, mejoras manuales, edificios nuevos.

# index entry name
idx-shack-name = la caseta

# index entry text
idx-shack-text = tienda de mejoras para los mineros.

# index entry name
idx-stats-name = las cuentas

# index entry text
idx-stats-text = guarda varias estadísticas de tu partida: ingresos, tiempo jugado.

# index entry name
idx-farm-name = la granja

# index entry text
idx-farm-text = parcelas donde crecen cosechas.

# index entry name
idx-quarry-name = la cantera

# index entry text
idx-quarry-text = cava hondo para sacar mineral.

# index entry name
idx-apothecary-name = la botica

# index entry text
idx-apothecary-text = donde se preparan los brebajes.

# index entry name
idx-tower-name = la torre

# index entry text
idx-tower-text = hogar de los magos.

# index entry name
idx-casino-name = el casino

# index entry text
idx-casino-text = un casino de tablero con clavos.

# index entry name
idx-outhouse-name = el cuarto de limpieza

# index entry text
idx-outhouse-text = hogar de los conserjes.

# index entry name
idx-filter-name = el filtro de aire

# index entry text
idx-filter-text = saca la contaminación del cielo.

# index entry name
idx-ram-name = el ariete

# index entry text
idx-ram-text = parte rocas en trozos, rápido.

# index entry name
idx-jaw-name = el taladro

# index entry text
idx-jaw-text = taladro mecánico para excavar rápido.

# index entry name
idx-tiller-name = el arado

# index entry text
idx-tiller-text = los tractores despachan las cosechas en un momento.

# index entry name
idx-belt-name = la cinta

# index entry text
idx-belt-text = echa piedritas al pozo sola.

# index entry name
idx-sphere-name = la esfera

# index entry text
idx-sphere-text = una esfera de dyson para cosechar la energía de la estrella.

# index entry name
idx-roomba-name = aspiradoras robot

# index entry text
idx-roomba-text = aspiradoras automáticas que limpian el desorden.

# index entry name
idx-driver-name = montacargas

# index entry text
idx-driver-text = montacargas automático que lleva cargas de recursos muy rápido.

# index entry name
idx-props-name = barrera de madera

# index entry text
idx-props-text = el intento desesperado de frenar la roca.

# index entry name
idx-net-name = la red

# index entry text
idx-net-text = teje cosechas en una red para atrapar y frenar la roca.

# index entry name
idx-arch-name = el arco

# index entry text
idx-arch-text = un arco firme de piedra y metal para intentar frenar la roca.

# index entry name
idx-dome-name = la barrera

# index entry text
idx-dome-text = una barrera de energía conjurada por los magos.

# index entry name
idx-deep-name = el abismo

# index entry text
idx-deep-text = no del todo espacio, no del todo océano: algo en medio.

# index entry name
idx-portal-name = el portal

# index entry text
idx-portal-text = la única forma de entrar y salir del abismo.

# index entry name
idx-crusher-name = la trituradora

# index entry text
idx-crusher-text = donde se guardan las escamas de las profundidades.

# index entry name
idx-pods-name = las cápsulas

# index entry text
idx-pods-text = cápsulas para los obreros abisales.

# index entry text
idx-haul-text = llevan piedritas al pozo.

# index entry name
idx-rockcrew-name = picadores

# index entry text
idx-rockcrew-text = le dan golpes a la roca.

# index entry name
idx-quarrycrew-name = mineros

# index entry text
idx-quarrycrew-text = sacan mineral de la cantera.

# index entry name
idx-farmcrew-name = granjeros

# index entry text
idx-farmcrew-text = cultivan las cosechas.

# index entry name
idx-purify-name = purificadores de aire

# index entry text
idx-purify-text = pilotan los globos purificadores para limpiar el cielo.

# index entry name
idx-stir-name = boticarios

# index entry text
idx-stir-text = a cargo de una tanda de brebajes.

# index entry text
idx-janitor-text = limpian la caca y el lodo.

# index entry text
idx-wizard-text = sabios de la magia, capaces de arrancarle pedazos a una estrella.

# index entry text
idx-build-text = levantan edificios y máquinas.

# index entry name
idx-breaker-name = rompedor

# index entry text
idx-breaker-text = pega mucho más fuerte al picar la roca.

# index entry name
idx-carter-name = carretero

# index entry text
idx-carter-text = los cargadores pueden tirar de un carro y llevar el doble.

# index entry name
idx-blaster-name = dinamitero

# index entry text
idx-blaster-text = lleva pequeños explosivos para sacar mineral de verdad.

# index entry name
idx-grower-name = cultivador

# index entry text
idx-grower-text = atiende las cosechas el doble.

# index entry name
idx-brews-name = brebajes

# index entry text
idx-brews-text = brebajes especiales de la botica.

# index entry text
idx-party-text = un valiente grupo de aventureros dispuestos a arriesgar la vida para derrotar a la serpiente.

# index entry name
idx-sqwife-name = tu esposa

# index entry text
idx-sqwife-text = vivía su vida hasta el incidente (o los incidentes), atrapada bajo rocas que caen del cielo sin fin. una locura.

# index entry name
idx-notices-name = logros

# index entry text
idx-notices-text = los hitos del patio.

# index entry name
idx-serpent-name = la serpiente

# index entry text
idx-serpent-text = una criatura abisal rara, como una culebra, que habita el abismo.

## Jobs

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = picadores

# a job, as the boards, the crew and the index say it (the save's key is haulers)
job-haulers = cargadores

# a job, as the boards, the crew and the index say it (the save's key is quarriers)
job-quarriers = mineros

# a job, as the boards, the crew and the index say it (the save's key is farmhands)
job-farmhands = granjeros

# a job, as the boards, the crew and the index say it (the save's key is scholars)
job-scholars = eruditos

# a job, as the boards, the crew and the index say it (the save's key is purifiers)
job-purifiers = purificadores de aire

# a job, as the boards, the crew and the index say it (the save's key is stirrers)
job-stirrers = boticarios

# a job, as the boards, the crew and the index say it (the save's key is janitors)
job-janitors = conserjes

# a job, as the boards, the crew and the index say it (the save's key is wizards)
job-wizards = magos

# a job, as the boards, the crew and the index say it (the save's key is builders)
job-builders = constructores

# a job, as the boards, the crew and the index say it (the save's key is fighters)
job-fighters = luchadores

# a job, as the boards, the crew and the index say it (the save's key is gatherers)
job-gatherers = recolectores

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = constructores del fondo

## Boards

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit: so many a minute; $icon is the coin's mark (html)
unit-per-min = { $icon }/min

# a row's unit: so many a dig; $icon is the coin's mark (html)
unit-per-dig = { $icon }/palada

# a row's unit: so many a harvest; $icon is the coin's mark (html)
unit-per-harvest = { $icon }/cosecha

# a row's unit after its number: swings a second
unit-hits-s = golpes/s

# a row's unit after its number: swings a second, from one
unit-hit-s = golpe/s

# a row's unit after its number: throws a second
unit-throws-s = tiros/s

# a row's unit after its number: a wizard's bolts a minute
unit-bolts-min = rayos/min

# a row's unit after its number: star cells a bolt knocks off
unit-cells-bolt = celdas/rayo

# a row's unit after its number: haze a balloon takes in a second
unit-motes-s = motas/s

# a row's unit after its number: farm plots
unit-plots = parcelas

# a row's unit after its number: the quarry's shovels
unit-shovels = palas

# a row's unit after its number: the apothecary's pots
unit-pots = ollas

# a row's unit after its number: doses a batch
unit-doses = dosis

# a unit after a number: seconds
unit-s = s

# a deep row's unit after its number: damage
unit-dmg = daño

# a deep row's unit after its number: damage a second
unit-dmg-s = daño/s

# a brew's unit after its percentage: how much faster
unit-faster = más rápido

# a brew's unit after its percentage: how much stronger
unit-stronger = más fuerte

# a brew's unit after its number: crit chance
unit-crit = crítico

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower = { $more ->
        [yes] { $left ->
            [one] compra { $left } cultivador más para desbloquear
           *[other] compra { $left } cultivadores más para desbloquear
        }
       *[no] { $left ->
            [one] compra { $left } cultivador para desbloquear
           *[other] compra { $left } cultivadores para desbloquear
        }
    }

# a machine's row until its station's set of blaster hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-blaster = { $more ->
        [yes] { $left ->
            [one] compra { $left } dinamitero más para desbloquear
           *[other] compra { $left } dinamiteros más para desbloquear
        }
       *[no] { $left ->
            [one] compra { $left } dinamitero para desbloquear
           *[other] compra { $left } dinamiteros para desbloquear
        }
    }

# a price in time, a minute or more: $n minutes
price-min = { $n } min

# a row's verb, before its gain: how much a hand holds
does-hold = agarra

# the bench: your carry ladder
row-carry = carga

# a row's verb, before its gain: swings
does-hit = golpea

# the bench: your swing pace ladder
row-speed = golpe automático

# a row's verb, before its gain: throws
does-throw = lanza

# the bench: how often a held hand lets go
row-toss = ritmo de tiro

# a row's verb, before its gain: how far a throw carries
does-reach = alcanza

# the bench: how far a handful carries
row-reach = alcance de tiro

# a row's verb, before its gain: what a swing takes
does-per-swing = por golpe

# the bench: what a swing of yours takes
row-pick = daño del pico

# the bench: holding a handful throws it by itself
row-autotoss = mantener para lanzar

# the bench: holding the pointer on the boulder swings by itself
row-auto = mantener para picar

# a row's verb, before its gain: how much a body carries
does-carry = carga

# the bench: the haulers' load ladder
row-haulcarry = carga del cargador

# a row's verb, before its gain: walking pace
does-walk = camina

# the bench: the haulers' pace ladder
row-haulpace = ritmo del cargador

# a row's verb, before its gain: crits
does-crit = crítico

# the bench: the chance a hit is a crit
row-critchance = % de crítico

# the bench: how much more a crit takes
row-critmult = daño crítico

# the shack: the diggers' swing pace ladder
row-rockhandspeed = ritmo de golpe

# the shack: what a digger's swing takes
row-rockhandpick = daño del pico del picador

# the bench: the row that puts up the apothecary
row-unlockapothecary = construir la botica

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = prepara refuerzos temporales para tus cuadrobreros

# the bench: what the apothecary row gives, where a gain would go
row-unlockapothecary-blurb = tónicos para la cuadrilla

# the bench: the row that puts up the casino
row-unlockcasino = construir el casino

# the bench: what the casino is for, under its name
row-unlockcasino-note = una mesa que toma una apuesta y paga doble o nada

# the bench: what the casino row gives, where a gain would go
row-unlockcasino-blurb = doble o nada

# the bench: the row that puts up the farm
row-unlockfarm = construir la granja

# the bench: what the farm is for, under its name
row-unlockfarm-note = cultiva unas cosechas

# the bench: what the farm row gives, where a gain would go
row-unlockfarm-blurb = cultiva cosechas

# the bench: the row that puts up the air filter
row-unlockfilter = construir el filtro de aire

# the bench: what the air filter is for, under its name
row-unlockfilter-note = vende los globos que sacan la neblina del cielo, y lee el cielo

# the bench: what the air filter row gives, where a gain would go
row-unlockfilter-blurb = despeja el cielo

# the bench: the row that puts up the janitor's closet
row-unlockouthouse = construir el cuarto de limpieza

# the bench: what the closet is for, under its name
row-unlockouthouse-note = ya viste bastante caca, a limpiarla

# the bench: what the closet row gives, where a gain would go
row-unlockouthouse-blurb = caca, limpia

# the bench: the row that puts up the quarry
row-unlockquarry = construir la cantera

# the bench: what the quarry is for, under its name
row-unlockquarry-note = empieza a sacar mineral

# the bench: what the quarry row gives, where a gain would go
row-unlockquarry-blurb = saca mineral

# the bench: the row that puts up the shack
row-unlockshack = construir la caseta

# the bench: what the shack is for, under its name
row-unlockshack-note = Mejoras para picar

# the bench: what the shack row gives, where a gain would go
row-unlockshack-blurb = equipo para la roca

# the bench: the row that puts up the tower
row-unlocktower = descubrir la torre

# the bench: what the tower is for, under its name
row-unlocktower-note = invoca a unos magos

# the bench: the first barrier against the boulder
row-props = barrera de madera

# the bench: the wooden barrier's line
row-props-note = levanta rápido una barrera para rescatar a tu esposa

# the bench: the second barrier
row-net = la red

# the bench: the net's line
row-net-note = no funcionó, ¿atrapar la roca con una red?

# the bench: the third barrier
row-arch = tallar el arco

# the bench: the arch's line
row-arch-note = todavía no aguanta. construyamos un arco de piedra.

# the tower: the last barrier, the wizards'
row-dome = ¿quizá los magos sepan?

# the tower: the last barrier's line
row-dome-note = todo lo del suelo ha fallado. lo que queda no es del suelo

# a hat's name: the diggers' (its row, the index, the crew)
kit-breaker = rompedor

# what the breaker hat does
kit-breaker-does = el doble de mordida

# where the breaker hat is worn
kit-breaker-place = la roca

# a hat's name: the haulers' cart
kit-carter = carretero

# what the cart does
kit-carter-does = el doble de carga

# where the cart is used
kit-carter-place = el pozo

# a hat's name: the miners'
kit-blaster = dinamitero

# what the blaster hat does
kit-blaster-does = el doble de viajes

# where the blaster hat is worn
kit-blaster-place = la cantera

# a hat's name: the farmers'
kit-grower = cultivador

# what the grower hat does
kit-grower-does = el doble de cuidados

# where the grower hat is worn
kit-grower-place = la granja

# the bench: a forklift that drives itself
row-driver = montacargas

# the bench: the forklift's line
row-driver-note = un montacargas que va solo: lleva la carga al pozo sin nadie a bordo, y echa humo

# the bench: the forklifts' load ladder
row-liftload = carga del montacargas

# a row's verb, before its gain: driving pace
does-drive = avanza

# the bench: the forklifts' pace ladder
row-liftpace = ritmo del montacargas

# a heading on the bench's board: your own ladders
sect-you = tú

# a heading on the bench's board: the crit ladders
sect-luck = golpes de suerte

# a heading on the bench's board: the haulers' gear
sect-haulers = los cargadores

# a heading on the bench's board: the rows that put up a new place
sect-build = construir

# the house's board: buy another house to hire somebody
row-house = otra casa

# the ribbon on every goal card: the barrier the story is on
goal-title = rescatar a tu esposa

# a card greyed out: its next rung costs crops, and there is no farm yet
needs-spore = faltan cosechas

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = falta una cantera

# a card greyed out: its next rung costs a spark, and none has been earned
needs-spark = falta una chispa

# a card greyed out: its next rung costs a scale, and the deep is not open
needs-scale = falta una escama

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, en { $place }

# the shack: the ram's tuning ladder
row-tuneram = golpe del ariete

# the ram's tuning ladder, its line; $n is how many times harder a rung makes it
row-tuneram-note = el ariete golpea { $n }x más fuerte

# a heading on any board over the rows no section names
sect-and = y

# a card the yard is at: somebody is building it (the strip's word with nothing to hand back; the gain line's word)
card-building = en obra

# the strip at a card's foot: buy another copy behind the one being built
card-another = + otro

# a card in line: nobody is at it yet
card-queued = en cola

# a finished ladder, where its price would go
card-done = listo

# the tower: an enchantment's name
spell-drive = acelerar las máquinas

# the tower: the enchantment's line
spell-drive-note = cada máquina del patio va 50 % más rápido

# the tower: an enchantment's name
spell-luck = enriquecer la cantera

# the tower: the enchantment's line
spell-luck-note = cada palada en la cantera saca 25 % más mineral

# the tower: an enchantment's name
spell-gmo = modificar genéticamente las cosechas

# the tower: the enchantment's line
spell-gmo-note = cada cosecha es 25 % más grande

# the tower: an enchantment's name
spell-thrift = abaratar las casas

# the tower: the enchantment's line
spell-thrift-note = cada casa desde ahora cuesta 75 % menos

# the tower: an enchantment's name
spell-sweep = acelerar a los conserjes

# the tower: the enchantment's line
spell-sweep-note = los conserjes palean y caminan el doble de rápido

# the tower: how often a wizard throws
row-wizspeed = conjuro más rápido

# the tower: how often a wizard throws, its line; $pct is the rise a rung
row-wizspeed-note = cada mago le lanza un rayo a la estrella un { $pct } % más seguido

# a row's verb, before its gain: a wizard's casting
does-cast = conjura

# the tower: how much of the star a bolt takes
row-wizpower = rayos más pesados

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = cada rayo arranca { $next } celdas a la estrella en vez de { $now }

# the tower: a wizard's hat
row-wizard = invocar un mago

# the tower: a wizard's line
row-wizard-note = sube volando y parte la estrella a rayos para sacar chispas, y llama a otra cuando el cielo queda vacío

# the tower: the sphere's line
row-sphere-note = captura la energía de una estrella

# the tower: the sphere's tuning ladder
row-tunesphere = luz de la esfera

# the tower: the sphere's tuning ladder, its line; $n is how many times the light
row-tunesphere-note = la esfera atrapa { $n }x la luz

# the tower: the barrier the wizards pour
row-dome-tower = conjurar la barrera

# the tower: the barrier's line
row-dome-tower-note = nada puede pasar esta cosa.

# the tower: the way down to the deep
row-portal = conjurar el portal

# the tower: the portal's line
row-portal-note = un camino abierto hacia el abismo.

# a heading on the tower's board: the spells
sect-enchantments = encantamientos

# a heading on the tower's board: the portal
sect-abyss = el abismo

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign (50%)
spell-drive-blurb = +{ $pct } velocidad

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-luck-blurb = +{ $pct } mineral

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-gmo-blurb = +{ $pct } cosechas

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-thrift-blurb = { $pct } más baratas

# the tower: what the enchantment gives, where a gain would go; $x is how many times
spell-sweep-blurb = { $x }x más rápido

# the farm: what a harvest is worth, a ladder
row-crop = valor de cosecha

# a row's verb, before its gain: tending plots
does-tend = cuida

# the farm: how often a plot is tended, a ladder
row-tend = ritmo de cultivo

# the farm: break another plot
row-farmplot = otra parcela

# the farm: the tiller's tuning ladder
row-tunetiller = ritmo del arado

# the farm: the tiller's tuning ladder, its line; $n is how many times faster
row-tunetiller-note = el arado trabaja { $n }x más rápido

# a heading on the farm's board: what a plot pays
sect-crop = la cosecha

# the quarry: what a dig turns up, a ladder
row-seam = mineral por palada

# a row's verb, before its gain: digging
does-dig = cava

# the quarry: how often a dig happens, a ladder
row-quarrypace = ritmo de minado

# the quarry: another miner's shovel at the face
row-quarrybench = otra pala

# the quarry: the drill's tuning ladder
row-tunejaw = mordida del taladro

# the quarry: the drill's tuning ladder, its line; $n is how many times harder
row-tunejaw-note = el taladro muerde { $n }x más fuerte

# a heading on the quarry's board: what the hole pays
sect-ore = el mineral

# a heading on the farm's board over who works the plots, with their headcount (the job's save key, as it has always read)
sect-farmhands = peones

# a heading on the quarry's board over who works the cut, with their headcount (the job's save key, as it has always read)
sect-quarriers = canteros

# a row's verb, before its gain: a balloon's flight
does-fly = vuela

# the air filter: how fast the balloons go from cloud to cloud
row-balloonspeed = velocidad del globo

# a row's verb, before its gain: what a balloon takes in
does-filter = filtra

# the air filter: how much haze a balloon draws
row-power = potencia del globo

# the air filter: another balloon
row-balloon = el globo

# the air filter: the balloon's line
row-balloon-note = recorre las nubes y deja caer debajo lo que atrapa

# the air filter: the recycler
row-recycler = el reciclador

# the air filter: the recycler's line
row-recycler-note = lo que atrapan los globos cae como piedritas en vez de lodo

# a heading on the air filter's board
sect-equipment = equipo

# the janitor's closet: the second cap on the stand
row-loopost = otra gorra

# the janitor's closet: another roomba
row-roomba = una aspiradora

# the janitor's closet: the roomba's line
row-roomba-note = va hasta el desorden del patio y lo trae a casa; un conserje las cuida, y echan humo

# the janitor's closet: the roombas' tuning ladder
row-tuneroomba = potencia de succión

# the janitor's closet: the roombas' tuning ladder, its line; $n is how many times faster
row-tuneroomba-note = las aspiradoras aspiran { $n }x más rápido

# a brew's name: the speed one, priced in crops
tonic-stew = guiso contundente

# a brew's name: the strength one, priced in ore
tonic-strong = brebaje fuerte

# a brew's name: the crit one, priced in sparks
tonic-brace = tónico vigorizante

# the apothecary: keep the fires going, or let them die once a batch is dealt (a setting)
row-potkeep = seguir preparando

# the apothecary's keep-brewing setting: on
row-potkeep-on = tanda tras tanda

# the apothecary's keep-brewing setting: off
row-potkeep-off = solo esta

# the apothecary: room for one more pot and its stirrer
row-anotherpot = otra olla

# a row's verb, before its gain: how long a dose lasts
does-lasts = dura

# the apothecary: how long a dose lasts, a ladder
row-bufflength = concentración del brebaje

# the apothecary: doses a batch, a ladder
row-brewdoses = tamaño de tanda

# a heading on the apothecary's board over the pots, with the stirrers' headcount
sect-pot = la olla

# a heading on the apothecary's board
sect-brewing = preparación

# a heading on the apothecary's board: one ladder a brew
sect-potency = potencia

# a brew's potency row's verb, before its gain
does-faster = más rápido

# a brew's potency row's verb, before its gain
does-stronger = más fuerte

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v } % { $unit }, { $secs } s

# what the crit brew does: $v points of crit chance for $secs seconds
tonic-gain-crit = +{ $v } crítico, { $secs } s

# the shack's heading over the diggers' gear, with their headcount
sect-diggers = picadores

## Machines

# a machine's name: the quarry's (the save's key is jaw)
machine-jaw = el taladro

# a machine's name: the boulder's
machine-ram = el ariete

# a machine's name: the farm's
machine-tiller = el arado

# a machine's name: carries pebbles from the boulder to the hole
machine-belt = la cinta

# a machine's name: the shell round the star
machine-sphere = la esfera

# a machine's name: the janitor's closet's
machine-roomba = las aspiradoras

## Stations

# a deep station's board with nothing on it yet
station-party-empty = nada que aprender todavía

# a station's name: its board's title, the pointer's label, the queue card
station-casino = el casino

# a station's name
station-filter = el filtro de aire

# the air filter's board with nothing on it
station-filter-empty = nada que instalar

# a station's name
station-quarry = la cantera

# the quarry's board with nothing on it
station-quarry-empty = la cantera ya no da para más hondo

# a station's name
station-farm = la granja

# the farm's board with nothing on it
station-farm-empty = ya está todo el suelo labrado

# a station's name
station-apothecary = la botica

# the apothecary's board with nothing on it
station-apothecary-empty = la olla está fría

# a station's name
station-tower = la torre

# the tower's board with nothing on it
station-tower-empty = aquí dentro todavía no se mueve nada

# a station's name
station-shack = la caseta

# the shack's board with nothing on it
station-shack-empty = las herramientas están todas en la roca

# the bench's board with nothing on it
station-bench-empty = nada que vender

# a station's name
station-outhouse = el cuarto de limpieza

# the janitor's closet's board with nothing on it
station-outhouse-empty = las escobas están todas en sus ganchos

# a station's name
station-house = la casa

# a station's name: the noticeboard over the pit
station-stats = las cuentas

# the books with nothing on them
station-stats-empty = todavía no ha entrado nada

# a station's name: the deep's purse
station-crusher = la trituradora

# the crusher's pile-full mark, on a hover
station-crusher-full = el suelo está lleno de escamas

# a station's name: the deep's houses
station-pods = las cápsulas

# the pods' board with nothing on it
station-pods-empty = nada que construir

# the lab's board title, still in the page's markup (the lab itself is gone)
station-lab = el laboratorio

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (An eighth like-named station reads "undefined": what the code said before the words moved here, kept by the owner; the deep has seven.)
station-party = { $nth ->
        [0] el { $who }
        [1] el segundo { $who }
        [2] el tercer { $who }
        [3] el cuarto { $who }
        [4] el quinto { $who }
        [5] el sexto { $who }
        [6] el séptimo { $who }
       *[other] el undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (an eighth reads "undefined", as the code said)
station-party-lot = { $nth ->
        [0] una estación
        [1] una segunda estación
        [2] una tercera estación
        [3] una cuarta estación
        [4] una quinta estación
        [5] una sexta estación
        [6] una séptima estación
       *[other] una undefined estación
    }

## Crew

# the crew window: where a body is, standing at its station (rockhands)
crew-at-rockhands = en la roca

# the crew window: where a body is, standing at its station (haulers)
crew-at-haulers = en el pozo

# the crew window: where a body is, standing at its station (quarriers)
crew-at-quarriers = en la cantera

# the crew window: where a body is, standing at its station (farmhands)
crew-at-farmhands = en las parcelas

# the crew window: where a body is, standing at its station (purifiers)
crew-at-purifiers = en el filtro de aire

# the crew window: where a body is, standing at its station (janitors)
crew-at-janitors = limpiando

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = en tu mano

# the crew window and a body's card: where a body is (falling)
crew-where-falling = en el aire

# the crew window and a body's card: where a body is (home)
crew-where-home = en casa

# the crew window and a body's card: where a body is (basket)
crew-where-basket = arriba en un globo

# the crew window and a body's card: where a body is (yard)
crew-where-yard = en el patio

# the crew window and a body's card: where a body is (resting)
crew-where-resting = en un descanso

# the crew window and a body's card: where a body is (walking)
crew-where-walking = en camino

# the crew window and a body's card: where a body is (deep)
crew-where-deep = en las profundidades

# a body's card, doing: at its job with no step to name (rockhands)
crew-does-rockhands = picando la roca

# a body's card, doing: at its job with no step to name (quarriers)
crew-does-quarriers = minando la cantera

# a body's card, doing: at its job with no step to name (farmhands)
crew-does-farmhands = cultivando

# a body's card, doing: at its job with no step to name (scholars)
crew-does-scholars = investigando

# a body's card, doing: at its job with no step to name (purifiers)
crew-does-purifiers = limpiando el aire

# a body's card, doing: at its job with no step to name (janitors)
crew-does-janitors = paleando

# a body's card, doing: at its job with no step to name (haulers)
crew-does-haulers = transportando

# a body's card, doing: what its step is (seek)
crew-now-seek = buscando piedritas

# a body's card, doing: what its step is (dump)
crew-now-dump = vaciando una carga

# a body's card, doing: what its step is (muck)
crew-now-muck = paleando mugre

# a body's card, doing: what its step is (cut)
crew-now-cut = cavando en la cantera

# a body's card, doing: what its step is (up)
crew-now-up = subiendo

# a body's card, doing: what its step is (down)
crew-now-down = bajando

# a body's card, doing: what its step is (tend)
crew-now-tend = cuidando una parcela

# a body's card, doing: what its step is (home)
crew-now-home = volviendo a casa

# a body's card, doing: what its step is (idle)
crew-now-idle = nada en especial

# a body's card, doing: what its step is (in)
crew-now-in = dentro

# a body's card, doing: what its step is (aloft)
crew-now-aloft = arriba en el globo

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = atendiendo { $name }

# a body's card, doing: what its step is (to)
crew-now-to = yendo para allá

# a body's card, doing: what its step is (kit)
crew-now-kit = equipándose en el banco

# a body's card, doing: what its step is (build)
crew-now-build = construyendo

# a body's card, doing: what its step is (working)
crew-now-working = trabajando

# a body with no name, on its card and in the crew window
crew-somebody = alguien

# a body's card: the label before how long it has been here (a column of ten in monospace)
crew-card-age = edad

# a body's card, age: under a minute
crew-card-new = llegó hoy

# a body's card, age: $mins minutes
crew-card-mins = { $mins } min

# a body's card: the label before what it is doing (a column of ten in monospace)
crew-card-doing = haciendo

# a heading in the crew window over the yard's crew
crew-sect-yard = el patio

# a heading in the crew window over the deep's crew
crew-sect-deep = las profundidades

# a heading on the house's board, and the window it opens
crew-sect-crew = la cuadrilla

## The books

# the books: a coin, before its rate
books-dust = piedritas

# the books: a coin, before its rate
books-shard = mineral

# the books: a coin, before its rate
books-spore = cosechas

# the books: a coin, before its rate
books-spark = chispas

# the books: the window the rates are taken over, in minutes ($n may be ½)
books-over-min = { $n } min

# the books: the row that steps the window the rates are taken over
books-over = promedio de

# the books: the window, in a rate's note (nothing in the last half minute)
books-last-half = el último medio minuto

# the books: the window, in a rate's note
books-last-one = el último minuto

# the books: the window, in a rate's note; $n minutes, more than one
books-last-mins = los últimos { $n } minutos

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } en { $over }

# the books: a rate's note when nothing came in
books-nothing = nada

# the books: a line
books-dirt-mach = de las máquinas

# the books: a line
books-dirt-dust = de la roca

# the books: a line
books-dirt-shard = de la cantera

# the books: a line
books-dirt-spore = de la granja

# the books: the sky full in, while the filter is winning
books-due-never = no a este ritmo

# the books: a line
books-sky-trend = contaminación

# the books: a line
books-sky-up = echada, por minuto

# the books: a line
books-sky-down = sacada, por minuto

# the books: a line
books-sky-haze = el cielo está

# the books: how full the sky is; $pct with its sign
books-sky-full = lleno al { $pct }

# the books: a line
books-sky-due = lleno en

# the books: a line
books-sky-rains = chaparrones aguantados

# the books: a line
books-sky-muck = lodo por ahí

# the books: a line
books-working = trabajando

# the books: a line
books-idle = ociosos

# the books: a line
books-best-mined = lo más sacado de la roca

# the books: a line
books-best-quarried = lo más minado

# the books: a line
books-best-farmed = lo más cosechado

# the books: a line
books-best-stored = lo más echado al pozo

# the books: a line
books-best-tidied = lo más limpiado

# the books: the longest on one clock, an hour or more; $n hours to a tenth
books-hours = { $n } h

# the books: the longest on one clock, under an hour; $n minutes
books-mins = { $n } min

# the books: a line
books-eldest = más tiempo en nómina

# the books: a line
books-tally-rocks = rocas despejadas

# the books: a line
books-tally-banked = piedritas depositadas

# the books: a line
books-tally-ore = mineral sacado

# the books: a coin earned over the whole game; $coin is books-shard, books-spore or books-spark
books-tally-earned = { $coin }, en total

# the books: a line
books-tally-rift = por la grieta

# the books: a line
books-tally-brews = tandas preparadas

# the books: a line
books-tally-hats = sombreros terminados

# the books: a line
books-tally-crew = en nómina

# the books: a line
books-tally-notes = logros conseguidos

# the books: a line
books-tally-under = tu esposa, bajo la roca durante

# the books: a line
books-tally-saved = tu esposa, rescatada en

# a heading in the books, and on the noticeboard
books-sect-income = ingresos, por segundo

# a heading in the books
books-sect-sky = el cielo

# a heading in the books
books-sect-crew = la cuadrilla

# a heading in the books
books-sect-tally = el recuento

# the noticeboard: the way into the books (off the board for now)
books-open = abrir las cuentas

# the noticeboard: how long this yard has been played
books-playtime = tiempo jugado

## Hover

# the hover on a deep station whose Recruit still waits on its first choice
hover-choose = elige un luchador

# the hover over a grain of ore
hover-ore = mineral

# the hover over a crop, a grain of it or a grown plot
hover-crop = cosecha

# the hover over a spark
hover-spark = chispa

# the hover over a pebble
hover-pebble = piedrita

# the hover over the drowned pit
hover-abyss = el abismo

# the hover over the rift
hover-rift = la grieta

# the hover over poop on the ground
hover-poop = caca

# the hover over muck on the ground
hover-muck = lodo

# the hover over a body, as the job it does (its type, rockhand)
hover-rockhand = picador

# the hover over a body, as the job it does (its type, hauler)
hover-hauler = cargador

# the hover over a body, as the job it does (its type, quarrier)
hover-quarrier = minero

# the hover over a body, as the job it does (its type, farmhand)
hover-farmhand = granjero

# the hover over a body, as the job it does (its type, scholar)
hover-scholar = erudito

# the hover over a body, as the job it does (its type, purifier)
hover-purifier = purificador

# the hover over a body, as the job it does (its type, stirrer)
hover-stirrer = boticario

# the hover over a body, as the job it does (its type, janitor)
hover-janitor = conserje

# the hover over a body, as the job it does (its type, wizard)
hover-wizard = mago

# the hover over a body, as the job it does (its type, builder)
hover-builder = constructor

# the hover over a body, as the job it does (its type, fighter)
hover-fighter = luchador

# the hover over a body, as the job it does (its type, gatherer)
hover-gatherer = recolector

# the hover over a body, as the job it does (its type, delver)
hover-delver = constructor del fondo

# the hover over the portal, from the deep
hover-portal-up = el portal — subir al patio

# the hover over the portal, from the yard
hover-portal-down = el portal — bajar a las profundidades

# the hover over the serpent
hover-serpent = la serpiente

# the hover over the crew's houses
hover-house = casa

# the hover over the boulder
hover-rock = roca

# the hover over a bird
hover-bird = pájaro

# the hover over a balloon
hover-balloon = globo

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the air filter's gauge: the sky filling faster than it is cleaned
hover-dial-worse = empeorando

# the air filter's gauge: the sky cleaned faster than it fills
hover-dial-better = mejorando

# the air filter's gauge: neither
hover-dial-steady = estable

# the hover over the counter above the pit
hover-counter = piedritas en el pozo: con esto se paga todo

# the air filter's gauge: the needle in the first band
hover-dial-clean = limpio

# the air filter's gauge: the needle in the middle band
hover-dial-dirty = sucio

# the air filter's gauge: the needle in the last band
hover-dial-filthy = mugriento

# the hover on a pile-full mark: a station's pile has nowhere left to go
hover-pile-full = montón lleno

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names }: listo

# the hover on a done mark whose rows have no names
hover-done-work = trabajo listo

# the casino's lever, by name (its hover and the pad's label)
lever-arm = la palanca

# a pot's picker: the brew it is set to, when it is set to none
pot-nothing = nada

# a pot's picker: the heading over who the brew is for
pot-for = para

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = al que esté más cerca

## The deep

# a brawler's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-brawler-fork = Pega más fuerte, aprende combos

# the brawler's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move = Combos

# what the brawler's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move-does = encadena golpes

# the brawler's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap = K.O.

# what the brawler's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap-does = { $stun }

# a sword's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sword-fork = Domina la espada

# the sword's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-move = Torbellino

# what the sword's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-move-does = corte más pesado

# the sword's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap = Puntos débiles

# what the sword's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap-does = { $bleed }

# a monk's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-monk-fork = Concentra tu chi

# the monk's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-move = Respira hondo

# what the monk's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-move-does = chi más rápido

# the monk's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap = Agua quieta

# what the monk's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap-does = { $stun }

# a martial's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-martial-fork = Golpea más rápido y remata antes

# the martial's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-move = Floritura

# what the martial's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-move-does = remates más rápidos

# the martial's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap = Arenga

# what the martial's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap-does = { $haste } al grupo

# a ranger's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-ranger-fork = Apunta a los puntos débiles

# the ranger's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move = Tiro certero

# what the ranger's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move-does = flecha cargada

# the ranger's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap = Tiro inmovilizador

# what the ranger's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap-does = { $stun }

# a assassin's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-assassin-fork = Golpea rápido y preciso

# the assassin's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move = Ejecución

# what the assassin's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move-does = castiga las heridas

# the assassin's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap = Dentado

# what the assassin's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap-does = { $bleed }

# a hexer's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-hexer-fork = Lanza maleficios que debilitan

# the hexer's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move = Marchitar

# what the hexer's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move-does = la serpiente recibe más daño

# the hexer's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap = Atadura

# what the hexer's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap-does = { $held }, { $exposed }

# a sapper's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sapper-fork = Aprende explosivos

# the sapper's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move = Bombas pegajosas

# what the sapper's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move-does = se pegan y revientan

# the sapper's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap = Par

# what the sapper's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap-does = dos bombas, { $stun }

# a mage's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-mage-fork = Canaliza rayos poderosos

# the mage's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-move = Ensanche

# what the mage's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-move-does = rayo más ancho

# the mage's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap = Termita

# what the mage's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap-does = quema la armadura

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Dale a tu grupo { $inspired }

# the bard's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-move = Himno

# what the bard's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-move-does = { $inspired } doble

# the bard's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap = Ritmo

# what the bard's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap-does = { $haste } al grupo

# a status, by name (bold in a line, under its icon)
status-stun = Aturdido

# a status, by name
status-bleed = Sangrado

# a status, by name
status-haste = Prisa

# a status, by name
status-held = Atado

# a status, by name
status-exposed = Expuesto

# a status, by name
status-inspired = Inspirado

# what Stun does, after its name
status-stun-does = no se mueve ni se cura

# what Bleed does, after its name
status-bleed-does = daño con el tiempo

# what Haste does, after its name; $pct with its sign
status-haste-does = ataca { $pct } más rápido

# what Held does, after its name
status-held-does = no puede curarse

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = recibe { $lo }-{ $hi } más de daño

# what Inspired does, after its name
status-inspired-does = pega más fuerte

# a status's hover line: $name (status-…) and what it does
status-line = { $name }: { $does }

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# a status's label under its icon when $n of it are on
status-label-n = { $name } x{ $n }

# a base fighter's line: the altar's (the Fighter)
base-altar-does = Lanza puñetazos

# a base fighter's line: the well's (the Novice)
base-well-does = Practica artes marciales

# a base fighter's line: the armory's (the Scout)
base-armory-does = Dispara flechas

# a base fighter's line: the circle's (the Adept)
base-circle-does = Lanza maleficios

# a base fighter's line: the spire's (the Apprentice)
base-spire-does = Dispara rayos

# the Recruit's line, before its first choice
recruit-does = un golpe suave

# the Bard's line with nobody else fighting
rail-alone = no hay nadie más a quien cantarle

# a class that needs company, before there is any
rail-locked = se abre con una segunda estación

# a station's board at the fork: the heading over the two classes
rail-fork-ask = Especialízate

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Elige a tu luchador

# a rung's number in its class's unit; $unit is unit-dmg or unit-dmg-s
rail-worth = { $n } { $unit }

# a rung's number for a class written in percent (the Bard)
rail-worth-pct = +{ $n } %

# a pip's hover line on a station's tree: $name (a fighter, a move) and $what (its number, or a few words)
rail-line = { $name }: { $what }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Conviértete en { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = reiniciar – se devuelve todo

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-brawler = Peleador

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sword = Espadachín

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-monk = Monje

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Artista marcial

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-ranger = Guardabosques

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-assassin = Asesino

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-hexer = Brujo

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sapper = Zapador

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-mage = Mago

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-bard = Bardo

# a base fighter's name: the altar's, below the fork
base-altar = Luchador

# a base fighter's name: the well's
base-well = Novicio

# a base fighter's name: the armory's
base-armory = Explorador

# a base fighter's name: the circle's
base-circle = Adepto

# a base fighter's name: the spire's
base-spire = Aprendiz

# every station's first fighter, before its first choice
class-recruit = Recluta

# the serpent's lash, its tile's hover while it waits
serp-lash-calm = Latigazo: aturde a quien ataque cuerpo a cuerpo

# the serpent's lash, its tile's hover while it is warned
serp-lash-coming = Latigazo en camino

# the serpent's lash, its tile's hover while it is on
serp-lash-on = Latigazo: aturde a quien ataque cuerpo a cuerpo

# the serpent's lash, its tile's hover once answered
serp-lash-stopped = Latigazo: frenado

# the serpent's cloak, warned
serp-sink-coming = Manto en camino

# the serpent's cloak, on
serp-sink-on = Manto: fuera de alcance

# the serpent's constrict, warned
serp-orb-coming = Constricción en camino

# the serpent's constrict, on
serp-orb-on = Constricción

# the serpent's constrict, answered
serp-orb-stopped = Constricción

# a fighter's tile: dazed, its hover
serp-dazed = Mareado: desequilibrado, viendo estrellas

# a fighter's tile: constricted, its hover
serp-constricted = Constreñido

# the serpent's barrier, its tile's hover
serp-barrier = Barrera: absorbe el daño explosivo

# the serpent's ward, its tile's hover
serp-ward = Protección: daño mágico a la mitad

# the serpent's plates, its tile's hover
serp-plates = Placas: daño físico a la mitad

# the lash's tile, its label
serp-lash = Latigazo

# the cloak's tile, its label
serp-sink = Manto

# the constrict's tile, its label
serp-orb = Constricción

# a fighter's dazed tile, its label
serp-dazed-name = Mareado

# a fighter's constricted tile, its label
serp-constricted-name = Constreñido

# the barrier's tile, its label
serp-barrier-name = Barrera

# the ward's tile, its label
serp-ward-name = Protección

# the plates' tile, its label
serp-plates-name = Placas

# the pods: one more of the crew, living down here
row-pod = otra cápsula

# the pods: the pod's line
row-pod-note = una cápsula en el otro extremo de las profundidades: uno más de la cuadrilla, viviendo aquí abajo

# a deep station's board: the heading over its one fighter, with the count
rail-fighter = el luchador

# the deep: the build of a new fighter's station (the queue card names it)
row-raise-station = levantar una estación

# the deep's build button: the first station costs no fang
build-free = gratis

# the serpent's level after the pips on its bar, from level 2 on; $n is the level.
# [owner's words: a level label, e.g. "Lv 7"] -- until then the bare number. Drawn in the pixel number font
# (NUM_FONT), which draws only the glyphs it has: words want their letters drawn into the font
serp-level = { $n }
