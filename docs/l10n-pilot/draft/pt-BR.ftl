### Pebble Pit pilot, version A: drafted by Claude (Opus 5.5) after locales/STYLE.md, pt-BR.
### A draft for a native reviewer, not a finished translation.


# rescue sheet heading, end of first half
saved-word = Acabou?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = você salvou sua quadresposa em <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Felizes para Sempre

# demo end sheet line
demoend-why = ainda não dá pra salvar sua quadresposa.

# second-half end sheet line
freed-why = você salvou seu quadresposo da barriga da serpente.

# second-half end sheet line
freed-end = é o fim, fique à vontade pra continuar matando a serpente e plantando na superfície!

# saves page paste box cancel
held-nevermind = deixa pra lá

# pause sheet footer hint
held-keys = esc pausa · ← → olhar em volta · segure espaço pra pular uma cena

# window close button label
modal-close =
    .aria-label = fechar

# pause sheet reply, store fallback
said-fellback = o último save não carregou; este é o anterior

# pause sheet reply, yard open elsewhere
said-yielded = este pátio está aberto em outra aba; quem salva é aquela

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = não está salvando: o armazenamento deste site está cheio ({ $used } mb usados, { $ours } kb nossos). copiar um save ainda funciona

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = não deu pra carregar: { $message }

# save row age
slots-since-min = há { $m } min

# saves row: how long ago it was saved, in whole days
slots-since-days =
    { $d ->
        [one] há um dia
       *[other] há { $d } dias
    }

# save row item
slots-row-crew = { $n } pessoas

# saves button label on both fronts
held-slotsbtn-label = saves · { $n } de { $total }

# achievements page, nothing earned
held-record-none = você ainda não fez nada.

# cloud section under recovery code
cloud-writedown = anote isto: traz seus pátios de volta num aparelho novo

# cloud section reply, 503
cloud-why-resting = a nuvem está descansando; tente mais tarde

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = tentativas demais daqui hoje; tente amanhã

# cloud section button, first press
cloud-btn-newcode-armed = desconectar os outros aparelhos?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = salvo { $since }

# settings dark switch
set-dark-on = escuro: sim

# settings motion switch
set-motion-less = movimento: menos

# settings note where fullscreen unavailable
set-fullscreen-note = pra tela cheia, adicione esta página à tela inicial

# controls page action column
ctl-rightleft-do = levantar trabalhadores

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = uma rocha. um buraco. umas pessoas no meio.

# landing page main button
title-play = jogar

# story line, first step
obj-rock = cave a rocha pra salvar sua quadresposa!

# story line, wooden roof barrier
obj-props = quem sabe um telhado de madeira segura a próxima rocha?

# story line, arch barrier
obj-arch = vamos tentar um arco com o minério e a pedra. com certeza aguenta.

# story line, wizards' barrier
obj-dome = sem opções, vamos ver se os magos ajudam.

# story line, deep half
obj-portal = conjure um portal pro abismo, o que tem lá embaixo?

# story line, final step
obj-free = liberte seu quadresposo da barriga da serpente

# objective card cancel while building
obj-barrier-cancel = cancelar ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = segure <span data-l10n-name="key"></span> pra pular

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = SOLTA

# the house's board and the crew window, with no crew yet
crew-empty = ninguém mora aqui ainda

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } h { $m } min

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }º

# achievement name
ach-gotout-name = você salvou sua quadresposa

# toast and achievements card name
ach-firstgrain-name = fazendo grana

# achievement name
ach-firsthire-name = você construiu pilões adicionais

# achievement name
ach-firsthat-name = você é um bruxo, quadradinho

# achievement name
ach-firstbrew-name = olá, vendedor de poções

# achievement name
ach-dizzy-name = síndrome do bebê sacudido

# achievement name
ach-muckrain-name = desgraça pouca é bobagem

# achievement name
ach-tablebeaten-name = voltamos com tudo

# achievement name
ach-tableruin-name = hora de pedir um empréstimo

# achievement name
ach-bird-name = sai do meu terreno

# achievement note
ach-catchall-note = jogue um punhado cheio de poeira, no máximo, e pegue cada grão

# achievement name
ach-rifttorn-name = a fenda aberta, o armazenamento resolvido

# achievement note
ach-rifttorn-note = encha o poço até abrir uma fenda interdimensional

# achievement note
ach-drowned-note = um oceano inteiro de armazenamento interdimensional.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = limpe { $n } rochas, é pedra pra caramba

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } quadrados

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = britadores

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = construtores das profundezas

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
                [one] compre mais { $left } cultivador pra desbloquear
               *[other] compre mais { $left } cultivadores pra desbloquear
            }
       *[no]
            { $left ->
                [one] compre { $left } cultivador pra desbloquear
               *[other] compre { $left } cultivadores pra desbloquear
            }
    }

# the bench: your carry ladder
row-carry = carga

# the bench: holding a handful throws it by itself
row-autotoss = segurar pra jogar

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = prepare reforços temporários pros seus quadrabalhadores

# the bench: what the casino is for, under its name
row-unlockcasino-note = uma mesa que pega uma aposta e paga o dobro ou nada

# the bench: what the closet is for, under its name
row-unlockouthouse-note = você já viu cocô demais, vamos limpar

# the bench: what the air filter is for, under its name
row-unlockfilter-note = vende os balões que tiram a névoa do céu de volta, e lê o céu

# the tower: the last barrier's line
row-dome-note = tudo o que é do chão falhou. o que resta não é do chão

# the bench: the net's line
row-net-note = não deu certo, tentar pegar a rocha com uma rede?

# what the breaker hat does
kit-breaker-does = o dobro da mordida

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, { $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = o aríete bate { $n }x mais forte

# the strip at a card's foot: buy another copy behind the one being built
card-another = + outro

# a finished ladder, where its price would go
card-done = pronto

# the tower: an enchantment's name
spell-gmo = modificar geneticamente as colheitas

# the tower: the enchantment's line
spell-thrift-note = toda casa daqui pra frente sai 75% mais barata

# the tower: the enchantment's line
spell-drive-note = toda máquina do pátio roda 50% mais rápido

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = cada raio arranca { $next } células da estrela em vez de { $now }

# the tower: a wizard's line
row-wizard-note = voa e despedaça a estrela com raios atrás de faíscas, e chama uma nova quando o céu fica vazio

# the janitor's closet: the roomba's line
row-roomba-note = vai até a sujeira no pátio e traz pra casa; um zelador cuida deles, e eles soltam fumaça

# the air filter: the recycler's line
row-recycler-note = o que os balões pegam cai como pedrinhas em vez de lama

# a brew's name: the speed one, priced in crops
tonic-stew = ensopado reforçado

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } s

# the apothecary's keep-brewing setting: on
row-potkeep-on = fornada atrás de fornada

# the bench: the forklift's line
row-driver-note = uma empilhadeira que se dirige sozinha: leva a carga até o poço sem ninguém a bordo, e solta fumaça

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = precisa de uma pedreira

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party =
    { $nth ->
        [0] o { $who }
        [1] o segundo { $who }
        [2] o terceiro { $who }
        [3] o quarto { $who }
       *[other] o undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] uma estação
        [1] uma segunda estação
        [2] uma terceira estação
        [3] uma quarta estação
       *[other] uma undefined estação
    }

# the apothecary's board with nothing on it
station-apothecary-empty = o caldeirão está frio

# the janitor's closet's board with nothing on it
station-outhouse-empty = as vassouras estão todas nos ganchos

# the crusher's pile-full mark, on a hover
station-crusher-full = o chão está cheio de escamas

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = na sua mão

# a body's card, doing: what its step is (idle)
crew-now-idle = nada demais

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = cuidando de { $name }

# a body's card, age: under a minute
crew-card-new = novo hoje

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } em { $over }

# the books: the sky full in, while the filter is winning
books-due-never = não nesse ritmo

# the books: a line
books-tally-under = quadresposa sob a rocha por

# the books: a line
books-tally-saved = quadresposa salva em

# the hover over the counter above the pit
hover-counter = pedrinhas no poço: é com isso que se paga tudo

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names }: pronto

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = quem estiver mais perto

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Dê ao seu grupo { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = sofre { $lo }-{ $hi } mais dano

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Vire { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = reiniciar – devolve tudo

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Artista marcial

# a fighter's tile: dazed, its hover
serp-dazed = Atordoado: sem equilíbrio, vendo estrelas

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Escolha seu lutador
