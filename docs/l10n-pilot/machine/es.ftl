### Pebble Pit pilot, version B: machine translation, es.
### Engine: Firefox Translations (Bergamot) via @browsermt/bergamot-translator 0.4.9 (wasm), model en-es 2.1 from Mozilla's Remote Settings registry.
### Unedited except: the first letter takes the English case; title-gamename is not sent (the game's name).

# rescue sheet heading, end of first half
saved-word = ¿Se Acabó?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = ¡salvaste a tu esposa en el <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Felizmente Siempre Después

# demo end sheet line
demoend-why = no puedo salvar a tu esposa todavía.

# second-half end sheet line
freed-why = salvaste a tu marido del vientre de la serpiente.

# second-half end sheet line
freed-end = ¡ese es el final, siéntete libre de seguir matando a la serpiente y cultivando en la superficie!

# saves page paste box cancel
held-nevermind = nunca me importa

# pause sheet footer hint
held-keys = esc holds · ← → mira alrededor · mantener el espacio para saltar una escena

# window close button label
modal-close =
    .aria-label = ¡cerra

# pause sheet reply, store fallback
said-fellback = el último salvamento no se cargaría; este es el anterior

# pause sheet reply, yard open elsewhere
said-yielded = este patio está abierto en otra pestaña; ese está siendo salvado

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = no guardar: el almacenamiento de este sitio está lleno ({ $used } mb utilizado, { $ours } kb del nuestro). copiar un guardado todavía funciona

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = no se pudo cargar: { $message }

# save row age
slots-since-min = hace { $m } min

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
         [one] hace un día
         [many] hace { $d } días
        *[other] { $d } días atrás
    }

# save row item
slots-row-crew = { $n } tripulantes

# saves button label on both fronts
held-slotsbtn-label = salvadas · { $n } de { $total }

# achievements page, nothing earned
held-record-none = aún no has hecho nada.

# cloud section under recovery code
cloud-writedown = escribe esto: trae tus patios de vuelta a un nuevo dispositivo

# cloud section reply, 503
cloud-why-resting = la nube está descansando; inténtalo de nuevo más tarde

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = demasiados intentos de aquí hoy; intenta mañana

# cloud section button, first press
cloud-btn-newcode-armed = ¿secha otros dispositivos?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = Salvado { $since }

# settings dark switch
set-dark-on = oscuro: encendido

# settings motion switch
set-motion-less = movimiento: menos

# settings note where fullscreen unavailable
set-fullscreen-note = para toda la pantalla, agregue esta página a la pantalla de inicio

# controls page action column
ctl-rightleft-do = recoge a los trabajadores

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = una roca. un agujero. unas pocas personas entre ellos.

# landing page main button
title-play = jugar

# story line, first step
obj-rock = ¡desenterra la roca para salvar a tu esposa!

# story line, wooden roof barrier
obj-props = ¿quizás construir un techo de madera se detendrá en la próxima roca?

# story line, arch barrier
obj-arch = tratemos de construir un arco del mineral y la piedra minados. seguramente eso es lo suficientemente resistente.

# story line, wizards' barrier
obj-dome = sin opciones, veamos si los asistentes pueden ayudar.

# story line, deep half
obj-portal = conjura un portal al abismo, ¿qué hay ahí abajo?

# story line, final step
obj-free = libera a tu marido del vientre de la serpiente

# objective card cancel while building
obj-barrier-cancel = cancelar ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = mantenga <span data-l10n-name="key"></span> para saltar

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = ¡DÉJELO

# the house's board and the crew window, with no crew yet
crew-empty = nadie vive aquí todavía

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }h { $m }m

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }o

# achievement name
ach-gotout-name = salvaste a tu esposa

# toast and achievements card name
ach-firstgrain-name = ¿hacer dinero

# achievement name
ach-firsthire-name = has construido pilones adicionales

# achievement name
ach-firsthat-name = eres un mago cuadrado

# achievement name
ach-firstbrew-name = hola, vendedor de pociones

# achievement name
ach-dizzy-name = síndrome del bebé sacudido

# achievement name
ach-muckrain-name = nunca llueve pero se vierte

# achievement name
ach-tablebeaten-name = estamos tan de vuelta

# achievement name
ach-tableruin-name = es hora de obtener un préstamo

# achievement name
ach-bird-name = ¡sal de mi tierra

# achievement note
ach-catchall-note = arroncen una mano llena de polvo, en su punto más grande, y atrapan cada grano

# achievement name
ach-rifttorn-name = la grieta rota, el almacenamiento se resuelve

# achievement note
ach-rifttorn-note = llene el pozo causando una grieta interdimensional

# achievement note
ach-drowned-note = un océano entero de almacenamiento interdimensional.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = despejó { $n } rocas, son muchas rocas

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } cuadrados

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = ¡los excavadores

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = los constructores profundos

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit after its number: swings a second
unit-hits-s = hits/s

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower = { $more ->
         [yes] { $left ->
             [one] comprar { $left } cultivador más para desbloquear
             [many] comprar { $left } cultivadores más para desbloquear
            *[other] comprar { $left } cultivadores más para desbloquear
        }
        *[no] { $left ->
             [one] comprar { $left } cultivador para desbloquear
             [many] comprar { $left } cultivadores para desbloquear
            *[other] comprar { $left } cultivadores para desbloquear
        }
    }

# the bench: your carry ladder
row-carry = cantidad de carry

# the bench: holding a handful throws it by itself
row-autotoss = aferrar a tirar

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = preparar impulsos temporales para sus trabajadores

# the bench: what the casino is for, under its name
row-unlockcasino-note = una mesa que toma una participación y paga el doble o nada

# the bench: what the closet is for, under its name
row-unlockouthouse-note = ya has visto suficiente caca, vamos a limpiarla

# the bench: what the air filter is for, under its name
row-unlockfilter-note = vende los globos que sacan la bruma del cielo y lee el cielo

# the tower: the last barrier's line
row-dome-note = todo lo del suelo ha fallado. lo que queda no es del suelo

# the bench: the net's line
row-net-note = ¿eso no funcionó, intentar atrapar la roca con una red?

# what the breaker hat does
kit-breaker-does = dos veces la mordida

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, a los { $place } años

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = el carnero golpea { $n }x más fuerte

# the strip at a card's foot: buy another copy behind the one being built
card-another = + otro

# a finished ladder, where its price would go
card-done = ¿lo hecho

# the tower: an enchantment's name
spell-gmo = modificar genéticamente los cultivos

# the tower: the enchantment's line
spell-thrift-note = cada casa a partir de ahora es un 75% más barata

# the tower: the enchantment's line
spell-drive-note = cada máquina en el patio corre un 50% más rápido

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = cada perno golpea { $next } celdas de la estrella en lugar de { $now }

# the tower: a wizard's line
row-wizard-note = vuela hacia arriba y cierra la estrella para chispas, y convoca una nueva cuando el cielo está vacío

# the janitor's closet: the roomba's line
row-roomba-note = conduce al desorden en el patio abierto y lo trae a casa; un conserje los cuida, y fuman

# the air filter: the recycler's line
row-recycler-note = lo que atrapan los globos se derrumba como guijarros en lugar de lodo

# a brew's name: the speed one, priced in crops
tonic-stew = estofado abundante

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } s

# the apothecary's keep-brewing setting: on
row-potkeep-on = lote tras lote

# the bench: the forklift's line
row-driver-note = una carretilla elevadora que se conduce a sí misma: llega al pozo sin nadie a bordo, y fuma

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = necesita una cantera

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party = { $nth ->
         [0] Los { $who }
         [1] El segundo { $who }
         [2] El tercero { $who }
         [3] El cuarto { $who }
        *[other] Los { $who } indefinidos
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot = { $nth ->
         [0] una estación
         [1] una segunda estación
         [2] una tercera estación
         [3] una cuarta estación
        *[other] una estación indefinida
    }

# the apothecary's board with nothing on it
station-apothecary-empty = la olla se mantiene fría

# the janitor's closet's board with nothing on it
station-outhouse-empty = las escobas están todas en sus ganchos

# the crusher's pile-full mark, on a hover
station-crusher-full = el suelo está lleno de escamas

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = en tu mano

# a body's card, doing: what its step is (idle)
crew-now-idle = nada mucho

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = minding { $name }

# a body's card, age: under a minute
crew-card-new = nuevo hoy

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } en { $over }

# the books: the sky full in, while the filter is winning
books-due-never = no a este ritmo

# the books: a line
books-tally-under = sqwife bajo la roca para

# the books: a line
books-tally-saved = la esposa salvada en

# the hover over the counter above the pit
hover-counter = guijarros en el pozo: lo que todo cuesta

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } hecho

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = quien sea más cercano

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Dale a tu fiesta { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = Toma { $lo }-{ $hi } más daño

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Convertirse en un { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = reset – reembolsa todo

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Artista Marcial

# a fighter's tile: dazed, its hover
serp-dazed = Aturdido: arrojado, viendo estrellas

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Elige a tu luchador
