### Pebble Pit pilot, version A: drafted by Claude (Opus 5.5) after locales/STYLE.md, es.
### A draft for a native reviewer, not a finished translation.


# rescue sheet heading, end of first half
saved-word = ¿Se acabó?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = ¡salvaste a tu cuadresposa en <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Felices para siempre

# demo end sheet line
demoend-why = todavía no puedes salvar a tu cuadresposa.

# second-half end sheet line
freed-why = salvaste a tu cuadresposo de la panza de la serpiente.

# second-half end sheet line
freed-end = ¡ese es el final, sigue matando a la serpiente y cultivando en la superficie si quieres!

# saves page paste box cancel
held-nevermind = mejor no

# pause sheet footer hint
held-keys = esc pausa · ← → mirar · mantén espacio para saltar una escena

# window close button label
modal-close =
    .aria-label = cerrar

# pause sheet reply, store fallback
said-fellback = la última partida no cargaba; esta es la anterior

# pause sheet reply, yard open elsewhere
said-yielded = este patio está abierto en otra pestaña; la que guarda es esa

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = no se guarda: el almacenamiento de este sitio está lleno ({ $used } mb usados, { $ours } kb nuestros). copiar una partida sigue funcionando

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = no se pudo cargar: { $message }

# save row age
slots-since-min = hace { $m } min

# saves row: how long ago it was saved, in whole days
slots-since-days =
    { $d ->
        [one] hace un día
       *[other] hace { $d } días
    }

# save row item
slots-row-crew = { $n } obreros

# saves button label on both fronts
held-slotsbtn-label = partidas · { $n } de { $total }

# achievements page, nothing earned
held-record-none = todavía no hiciste nada.

# cloud section under recovery code
cloud-writedown = anótalo: trae tus patios de vuelta en otro dispositivo

# cloud section reply, 503
cloud-why-resting = la nube está descansando; prueba más tarde

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = demasiados intentos desde aquí hoy; prueba mañana

# cloud section button, first press
cloud-btn-newcode-armed = ¿cerrar sesión en los otros dispositivos?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = guardado { $since }

# settings dark switch
set-dark-on = oscuro: sí

# settings motion switch
set-motion-less = movimiento: menos

# settings note where fullscreen unavailable
set-fullscreen-note = para la pantalla completa, agrega esta página a la pantalla de inicio

# controls page action column
ctl-rightleft-do = levantar obreros

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = una roca. un pozo. unos pocos en medio.

# landing page main button
title-play = jugar

# story line, first step
obj-rock = ¡pica la roca para salvar a tu cuadresposa!

# story line, wooden roof barrier
obj-props = ¿y si un techo de madera detiene la próxima roca?

# story line, arch barrier
obj-arch = probemos un arco con el mineral y la piedra. seguro que aguanta.

# story line, wizards' barrier
obj-dome = sin opciones, a ver si los magos pueden ayudar.

# story line, deep half
obj-portal = conjura un portal al abismo, ¿qué habrá ahí abajo?

# story line, final step
obj-free = libera a tu cuadresposo de la panza de la serpiente

# objective card cancel while building
obj-barrier-cancel = cancelar ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = mantén <span data-l10n-name="key"></span> para saltar

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = SUELTALO

# the house's board and the crew window, with no crew yet
crew-empty = aquí no vive nadie todavía

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } h { $m } min

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }.º

# achievement name
ach-gotout-name = salvaste a tu cuadresposa

# toast and achievements card name
ach-firstgrain-name = haciendo dinero

# achievement name
ach-firsthire-name = construiste pilones adicionales

# achievement name
ach-firsthat-name = eres un mago, cuadradito

# achievement name
ach-firstbrew-name = hola, vendedor de pociones

# achievement name
ach-dizzy-name = síndrome del bebé sacudido

# achievement name
ach-muckrain-name = llueve sobre mojado

# achievement name
ach-tablebeaten-name = volvimos con todo

# achievement name
ach-tableruin-name = hora de pedir un préstamo

# achievement name
ach-bird-name = fuera de mi terreno

# achievement note
ach-catchall-note = lanza un puñado lleno de polvo, al máximo, y atrapa cada grano

# achievement name
ach-rifttorn-name = la grieta abierta, el almacenamiento resuelto

# achievement note
ach-rifttorn-note = llena el pozo hasta abrir una grieta interdimensional

# achievement note
ach-drowned-note = todo un océano de almacenamiento interdimensional.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = despeja { $n } rocas, son muchas piedras

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } cuadrados

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = picadores

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = constructores del fondo

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit after its number: swings a second
unit-hits-s = golpes/s

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower =
    { $more ->
        [yes]
            { $left ->
                [one] compra { $left } cultivador más para desbloquear
               *[other] compra { $left } cultivadores más para desbloquear
            }
       *[no]
            { $left ->
                [one] compra { $left } cultivador para desbloquear
               *[other] compra { $left } cultivadores para desbloquear
            }
    }

# the bench: your carry ladder
row-carry = carga

# the bench: holding a handful throws it by itself
row-autotoss = mantener para lanzar

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = prepara refuerzos temporales para tus cuadrobreros

# the bench: what the casino is for, under its name
row-unlockcasino-note = una mesa que toma una apuesta y paga doble o nada

# the bench: what the closet is for, under its name
row-unlockouthouse-note = ya viste bastante caca, a limpiarla

# the bench: what the air filter is for, under its name
row-unlockfilter-note = vende los globos que sacan la neblina del cielo, y lee el cielo

# the tower: the last barrier's line
row-dome-note = todo lo del suelo ha fallado. lo que queda no es del suelo

# the bench: the net's line
row-net-note = no funcionó, ¿atrapar la roca con una red?

# what the breaker hat does
kit-breaker-does = el doble de mordida

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, { $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = el ariete golpea { $n }x más fuerte

# the strip at a card's foot: buy another copy behind the one being built
card-another = + otro

# a finished ladder, where its price would go
card-done = listo

# the tower: an enchantment's name
spell-gmo = modificar genéticamente las cosechas

# the tower: the enchantment's line
spell-thrift-note = cada casa desde ahora cuesta 75 % menos

# the tower: the enchantment's line
spell-drive-note = cada máquina del patio va 50 % más rápido

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = cada rayo arranca { $next } celdas a la estrella en vez de { $now }

# the tower: a wizard's line
row-wizard-note = sube volando y parte la estrella a rayos para sacar chispas, y llama a otra cuando el cielo queda vacío

# the janitor's closet: the roomba's line
row-roomba-note = va hasta el desorden del patio y lo trae a casa; un conserje los cuida, y echan humo

# the air filter: the recycler's line
row-recycler-note = lo que atrapan los globos cae como piedritas en vez de lodo

# a brew's name: the speed one, priced in crops
tonic-stew = guiso contundente

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v } % { $unit }, { $secs } s

# the apothecary's keep-brewing setting: on
row-potkeep-on = tanda tras tanda

# the bench: the forklift's line
row-driver-note = un montacargas que se maneja solo: lleva la carga al pozo sin nadie a bordo, y echa humo

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = falta una cantera

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party =
    { $nth ->
        [0] el { $who }
        [1] el segundo { $who }
        [2] el tercer { $who }
        [3] el cuarto { $who }
       *[other] el undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] una estación
        [1] una segunda estación
        [2] una tercera estación
        [3] una cuarta estación
       *[other] una undefined estación
    }

# the apothecary's board with nothing on it
station-apothecary-empty = la olla está fría

# the janitor's closet's board with nothing on it
station-outhouse-empty = las escobas están todas en sus ganchos

# the crusher's pile-full mark, on a hover
station-crusher-full = el suelo está lleno de escamas

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = en tu mano

# a body's card, doing: what its step is (idle)
crew-now-idle = nada en especial

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = cuida { $name }

# a body's card, age: under a minute
crew-card-new = nuevo hoy

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } en { $over }

# the books: the sky full in, while the filter is winning
books-due-never = no a este ritmo

# the books: a line
books-tally-under = cuadresposa bajo la roca durante

# the books: a line
books-tally-saved = cuadresposa salvada en

# the hover over the counter above the pit
hover-counter = piedritas en el pozo: con esto se paga todo

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names }: listo

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = al que esté más cerca

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Dale a tu grupo { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = recibe { $lo }-{ $hi } más de daño

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Conviértete en { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = reiniciar – se devuelve todo

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Artista marcial

# a fighter's tile: dazed, its hover
serp-dazed = Aturdido: desequilibrado, viendo estrellas

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Elige a tu luchador
