### Pebble Pit pilot, version B: machine translation, pt-BR.
### Engine: Firefox Translations (Bergamot) via @browsermt/bergamot-translator 0.4.9 (wasm), model en-pt 2.1 from Mozilla's Remote Settings registry.
### Unedited except: the first letter takes the English case; title-gamename is not sent (the game's name).

# rescue sheet heading, end of first half
saved-word = Acabou?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = você salvou sua sqwife em <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Felizmente Para Sempre

# demo end sheet line
demoend-why = ainda não pode salvar a sua mulher.

# second-half end sheet line
freed-why = salvaste o teu marido da barriga da serpente.

# second-half end sheet line
freed-end = esse é o fim, sinta-se livre para continuar matando a serpente e a agricultura na superfície!

# saves page paste box cancel
held-nevermind = não importa

# pause sheet footer hint
held-keys = esc holds · ← → olhar sobre · manter espaço para pular uma cena

# window close button label
modal-close =
    .aria-label = fechar

# pause sheet reply, store fallback
said-fellback = o último save não carregaria; este é o anterior

# pause sheet reply, yard open elsewhere
said-yielded = este pátio está aberto em outra aba; esse está sendo salvo

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = não salvar: o armazenamento deste site está cheio ({ $used } mb usado, { $ours } kb dele nosso). copiar um save ainda funciona

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = não podia carregar: { $message }

# save row age
slots-since-min = { $m } min atrás

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
         [one] um dia atrás
         [many] { $d } dias atrás
        *[other] { $d } dias atrás
    }

# save row item
slots-row-crew = { $n } tripulantes

# saves button label on both fronts
held-slotsbtn-label = salvamentos · { $n } de { $total }

# achievements page, nothing earned
held-record-none = você ainda não fez nada.

# cloud section under recovery code
cloud-writedown = anote isso: ele traz seus pátios de volta em um novo dispositivo

# cloud section reply, 503
cloud-why-resting = a nuvem está descansando; tente novamente mais tarde

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = muitas tentativas daqui hoje; tente amanhã

# cloud section button, first press
cloud-btn-newcode-armed = assinar outros dispositivos?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = salvo { $since }

# settings dark switch
set-dark-on = escuro: on

# settings motion switch
set-motion-less = movimento: menos

# settings note where fullscreen unavailable
set-fullscreen-note = para toda a tela, adicione esta página à tela inicial

# controls page action column
ctl-rightleft-do = pegar trabalhadores

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = uma rocha. um buraco. algumas pessoas entre eles.

# landing page main button
title-play = jogar

# story line, first step
obj-rock = cavar o pedregulho para salvar sua sqwife!

# story line, wooden roof barrier
obj-props = talvez construir um telhado de madeira pare o próximo pedregulho?

# story line, arch barrier
obj-arch = vamos tentar construir um arco a partir do minério minerado e pedra. certamente isso é resistente o suficiente.

# story line, wizards' barrier
obj-dome = fora de opções, vamos ver se os assistentes podem ajudar.

# story line, deep half
obj-portal = conjurar um portal para o abismo, o que há lá em baixo?

# story line, final step
obj-free = liberte o seu marido da barriga da serpente

# objective card cancel while building
obj-barrier-cancel = cancelar ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = segure <span data-l10n-name="key"></span> para pular

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = SOLTAR

# the house's board and the crew window, with no crew yet
crew-empty = ninguém vive aqui ainda

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }h { $m }m

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }o

# achievement name
ach-gotout-name = você salvou sua sqwife

# toast and achievements card name
ach-firstgrain-name = fazer dinheiro

# achievement name
ach-firsthire-name = você construiu pilões adicionais

# achievement name
ach-firsthat-name = você é um mago quadrado

# achievement name
ach-firstbrew-name = olá, vendedor de poções

# achievement name
ach-dizzy-name = síndrome do bebê abalado

# achievement name
ach-muckrain-name = nunca chove mas derrama

# achievement name
ach-tablebeaten-name = estamos tão de volta

# achievement name
ach-tableruin-name = tempo para conseguir um empréstimo

# achievement name
ach-bird-name = sair da minha terra

# achievement note
ach-catchall-note = lançar uma mão cheia de poeira, no seu maior, e pegar cada grão

# achievement name
ach-rifttorn-name = a fenda rasgada, o armazenamento é resolvido

# achievement note
ach-rifttorn-note = preencher o poço causando uma fenda inter-dimensional

# achievement note
ach-drowned-note = todo um oceano de armazenamento interdimensional.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = claros { $n } pedregulhos, isso é um monte de rochas

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } quadrados

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = escavadores

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = construtores profundos

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
             [one] comprar mais { $left } produtor para desbloquear
             [many] comprar { $left } mais produtores para desbloquear
            *[other] comprar mais { $left } produtores para desbloquear
        }
        *[no] { $left ->
             [one] comprar { $left } produtor para desbloquear
             [many] comprar { $left } produtores para desbloquear
            *[other] comprar { $left } produtores para desbloquear
        }
    }

# the bench: your carry ladder
row-carry = transportar quantidade

# the bench: holding a handful throws it by itself
row-autotoss = segure para arrecado

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = preparar impulsos temporários para seus trabalhadores quadrados

# the bench: what the casino is for, under its name
row-unlockcasino-note = uma mesa que leva uma estaca e paga o dobro ou nada

# the bench: what the closet is for, under its name
row-unlockouthouse-note = você já viu cocô suficiente, deixa limpá-lo

# the bench: what the air filter is for, under its name
row-unlockfilter-note = vende os balões que puxam a névoa de volta do céu, e lê o céu

# the tower: the last barrier's line
row-dome-note = tudo do chão falhou. o que resta não é do chão

# the bench: the net's line
row-net-note = que não funcionou, tentar pegar a rocha com uma rede?

# what the breaker hat does
kit-breaker-does = duas vezes a mordida

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, aos { $place } anos

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = o carneiro atinge { $n }x com mais força

# the strip at a card's foot: buy another copy behind the one being built
card-another = + outro

# a finished ladder, where its price would go
card-done = feito

# the tower: an enchantment's name
spell-gmo = modificar geneticamente as culturas

# the tower: the enchantment's line
spell-thrift-note = cada casa a partir de agora é 75% mais barato

# the tower: the enchantment's line
spell-drive-note = cada máquina no pátio corre 50% mais rápido

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = cada parafuso derruba { $next } células da estrela em vez de { $now }

# the tower: a wizard's line
row-wizard-note = voa para cima e aparafusa a estrela à parte para faíscas, e convoca uma nova quando o céu está vazio

# the janitor's closet: the roomba's line
row-roomba-note = dirige para a bagunça no pátio aberto e a traz para casa; um zelador cuida deles, e eles fumam

# the air filter: the recycler's line
row-recycler-note = o que os balões pegam vem para baixo como seixos em vez de lama

# a brew's name: the speed one, priced in crops
tonic-stew = guisado saudável

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } s

# the apothecary's keep-brewing setting: on
row-potkeep-on = lote após o lote

# the bench: the forklift's line
row-driver-note = uma empilhadeira que se conduz: transporta para o poço sem ninguém a bordo, e fuma

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = precisa de uma pedreira

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party = { $nth ->
         [0] do { $who }
         [1] o segundo { $who }
         [2] o terceiro { $who }
         [3] o quarto { $who }
        *[other] o indefinido { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot = { $nth ->
         [0] uma estação
         [1] uma segunda estação
         [2] uma terceira estação
         [3] uma quarta estação
        *[other] uma estação indefinida
    }

# the apothecary's board with nothing on it
station-apothecary-empty = a panela está fria

# the janitor's closet's board with nothing on it
station-outhouse-empty = as vassouras estão todas em seus ganchos

# the crusher's pile-full mark, on a hover
station-crusher-full = o chão está cheio de escalas

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = em sua mão

# a body's card, doing: what its step is (idle)
crew-now-idle = nada de muito

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = minding { $name }

# a body's card, age: under a minute
crew-card-new = novo hoje

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } em { $over }

# the books: the sky full in, while the filter is winning
books-due-never = não neste ritmo

# the books: a line
books-tally-under = sqwife sob a rocha para

# the books: a line
books-tally-saved = sqwife salvo em

# the hover over the counter above the pit
hover-counter = seixos no poço: o que tudo custa

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } feito

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = quem estiver mais próximo

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Dê a sua festa { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = leva { $lo }-{ $hi } mais danos

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Torne-se um { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = reset – reembolsa tudo

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Artista Marcial

# a fighter's tile: dazed, its hover
serp-dazed = Atordoado: jogado fora, vendo estrelas

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Escolha o seu lutador
