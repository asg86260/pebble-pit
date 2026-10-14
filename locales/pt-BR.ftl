### Pebble Pit, em português: Brazilian Portuguese (pt-BR), você, Brazilian
### vocabulary and spelling throughout.
###
### Drafted by Claude (Opus 5.5) on 2026-10-13 to locales/STYLE.md; not yet
### reviewed by a native speaker.
###
### Same ids, same order and same groups as locales/en.ftl; the comment over
### each message is the English file's. A message the English marks as the
### owner's placeholder is left out, so the English shows.

## Sheets

# rescue sheet heading, end of first half
saved-word = Acabou?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = você resgatou sua esposa em <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Felizes para Sempre

# demo end sheet heading
demoend-word = a demo acaba aqui!

# demo end sheet line
demoend-why = ainda não dá pra resgatar sua esposa.

# demo end store link (if STORE_URL)
demoend-store = pra lista de desejos!

# demo end dismiss button
demoend-keep = seguir jogando

# free-build teaser end sheet heading
teaseend-word = continua no jogo completo!

# teaser end store link (if STORE_URL)
teaseend-store = pegue o jogo completo

# teaser end dismiss button
teaseend-keep = seguir jogando

# second-half end sheet heading
freed-word = ok, agora acabou

# second-half end sheet line
freed-why = você resgatou seu marido da barriga da serpente.

# second-half end sheet line
freed-end = é o fim, fique à vontade pra continuar matando a serpente e plantando na superfície!

# second-half end sheet line
freed-thanks = obrigado!

# second-half end dismiss button
freed-keep = seguir jogando

# crash sheet heading
crashed-word = parou

# crash sheet button
crashed-copysave = copiar save

# pause sheet heading
held-word = pausado

# pause sheet button
held-resume = continuar

# pause sheet button (relabelled from JS)
held-slotsbtn = saves

# saves page heading
held-slots-word = saves

# saves page button
held-savecopy = copiar save

# saves page button
held-loadsave = carregar save

# saves page paste box confirm
held-loadit = carregar

# saves page paste box cancel
held-nevermind = deixa pra lá

# saves page back button
held-slotsback = voltar

# pause sheet button (relabelled from JS)
held-recordbtn = conquistas

# achievements page heading
held-record-word = conquistas

# achievements page back
held-recordback = voltar

# pause sheet button (also src/indexpage.js:24)
held-indexbtn = índice

# index page heading
held-index-word = índice

# index page back
held-indexback = voltar

# pause sheet button to landing page
held-titlebtn = voltar ao título

# pause sheet button, desktop build only
held-quit = sair do jogo

# pause sheet footer hint
held-keys = esc pausa · ← → olhar em volta · segure espaço pra pular uma cena

# window close button label
modal-close =
    .aria-label = fechar

# pause sheet reply, desktop export ok
said-saved = salvo

# pause sheet reply, desktop export failed
said-notsaved = não salvo

# pause sheet reply, store fallback
said-fellback = o último save não carregou; este é o anterior

# pause sheet reply, unreadable save
said-broken = não deu pra ler seu último save. copiar um save entrega ele pra você

# pause sheet reply, yard open elsewhere
said-yielded = este pátio está aberto em outra aba; quem salva é aquela

# pause sheet reply, storage blocked
said-unsaved-blocked = não está salvando: seu navegador bloqueia o armazenamento nesta página. copiar um save ainda funciona

# sheet reply after loading a save
said-loaded = carregado

# sheet reply, pasted text invalid
said-notasave = isso não é um save

# crash sheet line when error has no message
crashed-why-fallback = algo deu errado

# save row age
slots-since-now = agora mesmo

# save row age
slots-since-min = há { $m } min

# save row age
slots-since-h = há { $h } h

# save row item
slots-row-rock = rocha { $n }

# save row item
slots-row-crew = { $n } pessoas

# save row item for open slot in play
slots-row-playing = jogando

# save row, no yard
slots-row-empty = vazio

# save row, broken blob
slots-row-unreadable = ilegível

# saves button label on both fronts
held-slotsbtn-label = saves · { $n } de { $total }

# empty save row after first press
slots-arm = começar um pátio novo?

# sheet reply after opening empty slot
slots-said-new = um pátio novo

# sheet reply after opening a slot
slots-said-loaded = carregado

# save row delete cross label
slots-del-aria = apagar

# achievements button label with count
held-recordbtn-label = conquistas · { $count } de { $total }

# achievements page, nothing earned
held-record-none = você ainda não fez nada.

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
        [one] há um dia
       *[other] há { $d } dias
    }

# saves row delete confirm
slots-confirm-yes = apagar

# saves row delete cancel
slots-confirm-no = voltar

# sheet reply, copy with no save
said-copyout-none = nada salvo ainda

# sheet reply when clipboard unavailable
said-copyout-window = em window.__save

# saves page cloud section heading
cloud-head = saves na nuvem

# cloud section button
cloud-btn-linkcode = digitar um código de vínculo

# cloud section button
cloud-btn-recovery = usar um código de recuperação

# cloud section button
cloud-btn-stop = desligar a nuvem

# cloud section reply after stop
cloud-said-off = a nuvem está desligada neste aparelho

# cloud section button
cloud-btn-enable = ativar a nuvem

# cloud section reply on failure (also cloud.js:768)
cloud-why-noanswer = a nuvem não respondeu

# cloud section, copy recovery code
cloud-btn-copy = copiar

# cloud section under recovery code
cloud-writedown = anote isto: traz seus pátios de volta num aparelho novo

# cloud section, another device ahead
cloud-btn-take = pegar esse

# cloud section, another device ahead
cloud-btn-keep = ficar com este

# cloud section reply (also :316)
cloud-said-kept = mantido

# cloud section above pairing code
cloud-pair-enter = no outro aparelho, digite

# cloud section, hide pairing code
cloud-btn-done = pronto

# cloud section button
cloud-btn-link = vincular um aparelho

# cloud section toggle
cloud-btn-hidecode = esconder código de recuperação

# cloud section toggle
cloud-btn-showcode = mostrar código de recuperação

# cloud section button
cloud-btn-newcode = novo código de recuperação

# cloud section button, first press
cloud-btn-newcode-armed = desconectar os outros aparelhos?

# link code box placeholder
cloud-box-linkph = ···-···

# recovery code box placeholder
cloud-box-recph = ····-····-····

# link code box label
cloud-box-aria-link = código de vínculo

# recovery code box label
cloud-box-aria-rec = código de recuperação

# cloud section reply, bad code
cloud-wrong = esse código não funcionou

# cloud section reply after linking
cloud-said-linked = vinculado

# cloud code entry confirm
cloud-btn-dolink = vincular

# cloud code entry cancel
cloud-btn-nevermind = deixa pra lá

# cloud code entry prompt
cloud-typing-link = o código do outro aparelho

# cloud code entry prompt
cloud-typing-rec = seu código de recuperação

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = tentativas demais daqui hoje; tente amanhã

# cloud section reply, 503
cloud-why-resting = a nuvem está descansando; tente mais tarde

# cloud section reply, 403
cloud-why-forbidden = a nuvem não conhece esta página

# the cloud's line in the landing page's foot bar: $state is one of the cloud-state lines below
# (with no state, it stands before the choose-a-yard button)
cloud-line = nuvem · { $state }

# cloud state: not turned on (in cloud-line, and alone in the saves page section)
cloud-state-off = desligada

# cloud state
cloud-state-out = desconectada

# cloud state
cloud-state-refused = um save foi recusado

# cloud state
cloud-state-offline = não salvo: offline

# cloud state
cloud-state-behind = mais novo em outro aparelho

# cloud state
cloud-state-newer = atualize pra pegar o save mais novo

# cloud state
cloud-state-big = grande demais pra nuvem

# cloud state
cloud-state-full = a nuvem está cheia

# cloud state
cloud-state-paused = pausada

# cloud state
cloud-state-conflict = escolha um pátio

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = salvo { $since }

# cloud state: on, nothing pushed yet
cloud-state-on = ligada

# link a device: the pairing code's countdown; $time is m:ss
cloud-pair-left = faltam { $time }

# choose a yard: this device's copy of slot $n; $here is the yard as a saves row says it
cloud-clash-here = este aparelho · { $n } · { $here }

# choose a yard: the cloud's copy of slot $n; $cloud is the yard as a saves row says it
cloud-clash-cloud = nuvem · { $n } · { $cloud }

# a cloud button's answer: too many tries; $m is minutes to wait
cloud-why-wait = tentativas demais; tente de novo em { $m } min

# window title opened off the books
modal-books = as contas

# window title, crew list
modal-crew = quem mora aqui

## Settings

# pause sheet button
held-settingsbtn = ajustes

# settings page heading
held-settings-word = ajustes

# settings note where fullscreen unavailable
set-fullscreen-note = pra tela cheia, adicione esta página à tela inicial

# settings volume slider label
set-volume =
    .aria-label = volume

# settings button to controls page
set-controlsbtn = controles

# controls page heading
set-controls-word = controles

# controls page back
set-controlsback = voltar

# settings page back
set-settingsback = voltar

# settings motion switch
set-motion-less = movimento: menos

# settings motion switch
set-motion-full = movimento: todo

# settings touch switch (play only)
set-touch-on = toque: sim

# settings touch switch (play only)
set-touch-off = toque: não

# settings dark switch
set-dark-on = escuro: sim

# settings dark switch
set-dark-off = escuro: não

# settings sound switch
set-sound-off = som: não

# settings sound switch
set-sound-on = som: sim

# pause sheet line: a save from a newer build; $build is the build's name
said-newer = este save é de uma versão mais nova ({ $build })

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = não está salvando: o armazenamento deste site está cheio ({ $used } mb usados, { $ours } kb nossos). copiar um save ainda funciona

# pause sheet line: storage refused a save; $name is the browser's error name
said-unsaved-refused = não está salvando: o armazenamento recusou o save ({ $name }). copiar um save ainda funciona

# pause sheet line: storage refused a save, with no error to name
said-unsaved-refused-why = não está salvando: o armazenamento recusou o save. copiar um save ainda funciona

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = não deu pra carregar: { $message }

# controls page input column
ctl-leftclick-in = clique esquerdo

# controls page action column
ctl-leftclick-do = interagir

# controls page input column
ctl-rightclick-in = clique direito

# controls page action column
ctl-rightclick-do = focar trabalhadores

# controls page input column
ctl-rightleft-in = clique direito + clique esquerdo

# controls page action column
ctl-rightleft-do = levantar trabalhadores

# controls page input column
ctl-middle-in = clique do meio

# controls page action column
ctl-middle-do = mover a câmera

# controls page input column
ctl-wheel-in = rodinha do mouse

# controls page action column
ctl-wheel-do = mover a câmera

# controls page input column
ctl-arrows-in = ← → / a d

# controls page action column
ctl-arrows-do = mover a câmera

# controls page input column
ctl-digits-in = 1 – 9

# controls page action column
ctl-digits-do = pular pra um lugar

# settings fullscreen row
set-fullscreen-on = tela cheia: sim

# settings fullscreen row
set-fullscreen-off = tela cheia: não

# a sheet line: the save is on the clipboard; $n is its size in kilobytes
said-copyout-copied = { $n }kb copiados

## Title page

# browser tab title, landing
title-doctitle = Pebble Pit

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = uma rocha. um buraco. umas pessoas no meio.

# landing page main button
title-play = jogar

# landing page button (relabelled saves · n of 3)
title-slotsbtn = saves

# landing page button (relabelled, src/record.js:33)
title-recordbtn = conquistas

# landing page button
title-settingsbtn = ajustes

# landing page, desktop build only
title-quit = sair do jogo

# landing saves page heading
title-slots-word = saves

# landing saves page button
title-savecopy = copiar save

# landing saves page button
title-loadsave = carregar save

# landing paste confirm
title-loadit = carregar

# landing paste cancel
title-nevermind = deixa pra lá

# landing saves page back
title-slotsback = voltar

# landing achievements page heading
title-record-word = conquistas

# landing achievements page back
title-recordback = voltar

# landing settings page heading
title-settings-word = ajustes

# landing settings to controls
title-controlsbtn = controles

# landing settings back
title-settingsback = voltar

# landing controls page heading
title-controls-word = controles

# landing controls back
title-controlsback = voltar

# landing cloud conflict page heading
title-conflict-word = escolha um pátio

# landing cloud conflict back
title-conflictback = voltar

# landing foot link
title-link-itch = itch

# landing foot link
title-link-github = github

# under play, empty open slot
title-playlabel-new = um pátio novo

# landing achievements page, nothing earned
title-record-none = nada ainda

# title foot bar conflict link
cloud-foot-choose = escolha um pátio

# landing reply, bad paste
title-said-notasave = isso não é um save

# landing reply after load
title-said-loaded = carregado

# landing reply after deleting open slot
title-said-erased = apagado

## Objectives

# label before story line
obj-next = agora

# story line, first step
obj-rock = cave a rocha pra resgatar sua esposa!

# intro quest item
obj-rock-q-chip = cave a rocha

# intro quest item
obj-rock-q-pickup = pegue uma pedrinha

# intro quest item
obj-rock-q-toss = jogue a pedrinha no poço

# story line after first fall
obj-falling = cave a rocha de novo!

# story line, wooden roof barrier
obj-props = quem sabe um telhado de madeira segura a próxima rocha?

# story line, net barrier
obj-net = nada. tente pegar a rocha e frear ela

# story line, arch barrier
obj-arch = vamos tentar um arco com o minério e a pedra que tiramos. com certeza aguenta.

# story line, wizards' barrier
obj-dome = sem opções, vamos ver se os magos ajudam.

# story line before rescue
obj-rescue = resgate sua esposa

# story line, second half
obj-drown = afogue o poço

# story line after snatch
obj-tower = construa a torre dos magos

# story line after snatch
obj-talk = fale com os magos sobre o que acabou de acontecer

# story line, deep half
obj-portal = conjure um portal pro abismo, o que tem lá embaixo?

# story line, final step
obj-free = liberte seu marido da barriga da serpente

# objective card cancel while building
obj-barrier-cancel = cancelar ×{ $n }

## Other

# browser tab title, game page
play-doctitle = Pebble Pit

# skip hint during cutscene, desktop (skiphint.js:27)
other-skip-desk = segure espaço pra pular

# top-edge mess tag
other-messtag-muck = lama

# top-edge mess tag
other-messtag-poop = cocô

# floating button over bench site
other-raise = construir a bancada

# phone pause button label
other-pause =
    .aria-label = pausar

title-recordbtn-label = conquistas · { $count } de { $total }

# corner fullscreen button tooltip
other-fullscreen-title-on = sair da tela cheia

# corner fullscreen button tooltip
other-fullscreen-title-off = tela cheia

# crew-fade corner button label
other-corner-show = mostrar a equipe

# crew-fade corner button label
other-corner-fade = esmaecer a equipe

# crew-fade corner button label
other-corner-hide = esconder a equipe

# way corner button tip
other-corner-up = subir pro pátio

# way corner button tip
other-corner-down = descer pras profundezas

# queue card line hover
other-queue-site-yard = o pátio

# queue card line hover
other-queue-site-sphere = a esfera

# queue card, nobody working
other-queue-queued = na fila

# board footer toggle
other-hidedone-show = mostrar concluídos

# board footer toggle
other-hidedone-hide = ocultar concluídos

# the queue card: the first in line to be built after the one going up
queue-place-next = próximo

# the house's board and the crew window, with no crew yet
crew-empty = ninguém mora aqui ainda

# a station's name: its board's title, the pointer's label, the queue card
station-bench = a bancada

# skip hint during cutscene, phone
other-skip-touch = segure pra pular

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = segure <span data-l10n-name="key"></span> pra pular

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee, idle (drawn in the sign's own pixel capitals)
casino-sign = CASINO

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

## Notices

# toast-shaped card, another device ahead
note-cloud-name = mais novo em outro aparelho

# toast-shaped card, another device ahead
note-cloud-note = veja em saves

## Numbers

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } h { $m } min

# how long a yard has been played, under an hour
played-m = { $m } min

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }º

## Achievements

# toast and achievements card name
ach-firstgrain-name = fazendo grana

# toast and achievements card note
ach-firstgrain-note = jogue uma pedrinha no poço

# achievement name
ach-firstrock-name = melhor continuar cavando

# achievement note
ach-firstrock-note = limpe a primeira rocha

# achievement name
ach-gotout-name = você resgatou sua esposa

# achievement note
ach-gotout-note = chega de rochas, você conseguiu.

# achievement name
ach-firsthire-name = você construiu pilões adicionais

# achievement note
ach-firsthire-note = construa outra casa

# achievement name
ach-firstshard-name = o primeiro minério

# achievement note
ach-firstshard-note = traga minério da pedreira

# achievement name
ach-firstspore-name = cultivo

# achievement note
ach-firstspore-note = cultive sua primeira colheita

# achievement name
ach-firstspark-name = magia no ar

# achievement note
ach-firstspark-note = ganhe sua primeira faísca

# achievement name
ach-holefull-name = o poço está cheio

# achievement note
ach-holefull-note = encha o poço até a borda

# achievement name
ach-rifttorn-name = a fenda aberta, o armazenamento resolvido

# achievement note
ach-rifttorn-note = encha o poço até abrir uma fenda interdimensional

# achievement name
ach-drowned-name = a fenda cresceu

# achievement note
ach-drowned-note = um oceano inteiro de armazenamento interdimensional.

# achievement name
ach-star-name = conjure uma estrela

# achievement note
ach-star-note = chame uma estrela lá da torre

# achievement name
ach-firsthat-name = você é um bruxo, quadradinho

# achievement note
ach-firsthat-note = termine um chapéu de mago na torre

# achievement name
ach-firstbrew-name = olá, vendedor de poções

# achievement note
ach-firstbrew-note = prepare uma fornada na botica

# achievement name
ach-firsttrade-name = primeiro chapéu

# achievement note
ach-firsttrade-note = compre o primeiro chapéu de uma estação

# achievement name
ach-alltrades-name = educando as massas

# achievement note
ach-alltrades-note = equipe cada estação com seu chapéu

# achievement name
ach-allbuilt-name = construção concluída

# achievement note
ach-allbuilt-note = você construiu tudo

# achievement name
ach-rift1e6-name = 1m pela fenda

# achievement note
ach-rift1e6-note = mande 1m de pedrinhas pela fenda

# achievement name
ach-brew100-name = 100 fornadas

# achievement note
ach-brew100-note = prepare 100 fornadas

# achievement name
ach-lived1h-name = uma hora na folha

# achievement note
ach-lived1h-note = mantenha alguém na folha de pagamento por uma hora

# achievement name
ach-nobodyhired-name = ninguém contratado

# achievement note
ach-nobodyhired-note = limpe uma rocha inteira sem ninguém na folha

# achievement name
ach-ownhand-name = só com a sua mão

# achievement note
ach-ownhand-note = limpe uma rocha sem nenhum trabalhador encostar nela

# achievement name
ach-nevertouched-name = nem encostou

# achievement note
ach-nevertouched-note = limpe uma rocha sem dar um golpe sequer

# achievement name
ach-underminute-name = uma rocha em menos de um minuto

# achievement note
ach-underminute-note = limpe uma rocha em menos de um minuto

# achievement name
ach-everyjob-name = todos os postos ocupados

# achievement note
ach-everyjob-note = ponha pelo menos alguém em cada posto ao mesmo tempo

# achievement name
ach-tablebeaten-name = voltamos com tudo

# achievement note
ach-tablebeaten-note = saia 50k no lucro numa só mão no cassino

# achievement name
ach-tableruin-name = hora de pedir um empréstimo

# achievement note
ach-tableruin-note = saia 50k no prejuízo numa só mão no cassino

# achievement name
ach-bird-name = sai do meu terreno

# achievement note
ach-bird-note = assuste um pássaro

# achievement name
ach-wholelot-name = nem um de vocês

# achievement note
ach-wholelot-note = assuste todos os pássaros de um mesmo terreno

# achievement name
ach-catchall-name = malabarista

# achievement note
ach-catchall-note = jogue um punhado cheio de poeira, no máximo, e pegue cada grão

# achievement name
ach-lifted-name = vem cá, você

# achievement note
ach-lifted-note = levante um trabalhador

# achievement name
ach-shookload-name = esvazia os bolsos

# achievement note
ach-shookload-note = sacuda um trabalhador até cair a carga toda

# achievement name
ach-hatoff-name = tiro o chapéu

# achievement note
ach-hatoff-note = sacuda um trabalhador até o chapéu cair

# achievement name
ach-dizzy-name = síndrome do bebê sacudido

# achievement note
ach-dizzy-note = sacuda um trabalhador até tontear

# achievement name
ach-muckrain-name = desgraça pouca é bobagem

# achievement note
ach-muckrain-note = aguente uma chuva de lama

# achievement name: rocks cleared; $n is the count as written (10, 25, 50, 100)
ach-rocks-name = { $n } rochas

# achievement note: rocks cleared; $n is the count
ach-rocks-note = limpe { $n } rochas

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = limpe { $n } rochas, é pedra pra caramba

# achievement name: pebbles banked; $n is the count, short (10k, 1m)
ach-pebbles-name = { $n } pedrinhas

# achievement note: pebbles banked; $n is the count, short
ach-pebbles-note = deposite { $n } pedrinhas

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } quadrados

# achievement note: crew hired; $n is the count
ach-crew-note = contrate uma equipe de { $n }

# achievement name: the first ore ladder rung
ach-ore0-name = 1k de minério da cava

# achievement name: the second ore ladder rung
ach-ore1-name = 10k de minério

# achievement note: ore dug; $n is the count, short (1k, 10k)
ach-ore-note = tire { $n } de minério da pedreira

## Index

# index entry name
idx-dust-name = pedrinhas

# index entry text
idx-dust-text = tiradas da rocha na marra.

# index entry name
idx-shard-name = minério

# index entry text
idx-shard-text = tirado da pedreira.

# index entry name
idx-spore-name = colheitas

# index entry text
idx-spore-text = crescem na fazenda.

# index entry name
idx-spark-name = faíscas

# index entry text
idx-spark-text = os magos arrancam da estrela com raios.

# index entry name
idx-scale-name = escamas

# index entry text
idx-scale-text = trituradas do que a serpente solta.

# index entry name
idx-crit-name = críticos

# index entry text
idx-crit-text = têm chance de causar mais dano.

# index entry name
idx-rock-name = a rocha

# index entry text
idx-rock-text = esmagou sua esposa; é cavada atrás de pedrinhas valiosas.

# index entry name
idx-pit-name = o poço

# index entry text
idx-pit-text = jogue aqui suas pedrinhas, e o que mais quiser, pra guardar.

# index entry name
idx-rift-name = a fenda

# index entry text
idx-rift-text = pedrinha demais num lugar só abriu uma fenda na realidade?

# index entry name
idx-abyss-name = o abismo

# index entry text
idx-abyss-text = a fenda engoliu pedrinhas demais pra continuar estável e tragou o poço inteiro.

# index entry name
idx-muck-name = lama

# index entry text
idx-muck-text = a poluição corrompe o ecossistema e a chuva deixa montes de sujeira.

# index entry name
idx-poop-name = cocô

# index entry text
idx-poop-text = eca.

# index entry name
idx-bird-name = pássaros

# index entry text
idx-bird-text = pássaros normais.

# index entry name
idx-house-name = a casa

# index entry text
idx-house-text = onde os trabalhadores moram.

# index entry name
idx-pollution-name = poluição

# index entry text
idx-pollution-text = o preço da indústria. cavar, plantar, minerar, fazer magia: tudo polui e suja o ar.

# index entry name
idx-star-name = a estrela

# index entry text
idx-star-text = uma estrela de verdade, criada pela magia dos magos, detonada atrás de faíscas.

# index entry name
idx-balloon-name = balão

# index entry text
idx-balloon-text = equipado com um filtro de ar que limpa a poluição das nuvens.

# index entry name
idx-recycler-name = o reciclador

# index entry text
idx-recycler-text = concentra a poluição do ar em pedrinhas úteis.

# index entry name
idx-bench-name = a bancada

# index entry text
idx-bench-text = basicamente o armazém geral. melhorias de carga, melhorias manuais, construções novas.

# index entry name
idx-shack-name = o barracão

# index entry text
idx-shack-text = loja de melhorias pros mineradores.

# index entry name
idx-stats-name = as contas

# index entry text
idx-stats-text = guarda várias estatísticas do seu jogo: renda, tempo jogado.

# index entry name
idx-farm-name = a fazenda

# index entry text
idx-farm-text = canteiros onde crescem colheitas.

# index entry name
idx-quarry-name = a pedreira

# index entry text
idx-quarry-text = cave fundo atrás de minério.

# index entry name
idx-apothecary-name = a botica

# index entry text
idx-apothecary-text = onde as poções são preparadas.

# index entry name
idx-tower-name = a torre

# index entry text
idx-tower-text = lar dos magos.

# index entry name
idx-casino-name = o cassino

# index entry text
idx-casino-text = um cassino de tabuleiro de pinos.

# index entry name
idx-outhouse-name = o quartinho da limpeza

# index entry text
idx-outhouse-text = lar dos zeladores.

# index entry name
idx-filter-name = o filtro de ar

# index entry text
idx-filter-text = tira a poluição do céu.

# index entry name
idx-ram-name = o aríete

# index entry text
idx-ram-text = parte rochas em pedaços, rápido.

# index entry name
idx-jaw-name = a broca

# index entry text
idx-jaw-text = broca mecânica pra escavar rápido.

# index entry name
idx-tiller-name = o arado

# index entry text
idx-tiller-text = os tratores dão conta das colheitas rapidinho.

# index entry name
idx-belt-name = a esteira

# index entry text
idx-belt-text = joga pedrinhas no poço sozinha.

# index entry name
idx-sphere-name = a esfera

# index entry text
idx-sphere-text = uma esfera de dyson pra colher a energia da estrela.

# index entry name
idx-roomba-name = aspiradores robô

# index entry text
idx-roomba-text = aspiradores automáticos que limpam a bagunça.

# index entry name
idx-driver-name = empilhadeira

# index entry text
idx-driver-text = empilhadeira automática que leva cargas de recursos bem rápido.

# index entry name
idx-props-name = barreira de madeira

# index entry text
idx-props-text = a tentativa desesperada de segurar a rocha.

# index entry name
idx-net-name = a rede

# index entry text
idx-net-text = trance colheitas numa rede pra pegar a rocha e frear ela.

# index entry name
idx-arch-name = o arco

# index entry text
idx-arch-text = um arco firme de pedra e metal pra tentar segurar a rocha.

# index entry name
idx-dome-name = a barreira

# index entry text
idx-dome-text = uma barreira de energia conjurada pelos magos.

# index entry name
idx-deep-name = o abismo

# index entry text
idx-deep-text = nem bem espaço, nem bem oceano: algo no meio.

# index entry name
idx-portal-name = o portal

# index entry text
idx-portal-text = o único jeito de entrar e sair do abismo.

# index entry name
idx-crusher-name = o triturador

# index entry text
idx-crusher-text = onde ficam guardadas as escamas das profundezas.

# index entry name
idx-pods-name = as cápsulas

# index entry text
idx-pods-text = cápsulas pros trabalhadores abissais.

# index entry text
idx-haul-text = levam pedrinhas pro poço.

# index entry name
idx-rockcrew-name = britadores

# index entry text
idx-rockcrew-text = batem na rocha.

# index entry name
idx-quarrycrew-name = mineradores

# index entry text
idx-quarrycrew-text = tiram minério da pedreira.

# index entry name
idx-farmcrew-name = agricultores

# index entry text
idx-farmcrew-text = cuidam das colheitas.

# index entry name
idx-purify-name = purificadores de ar

# index entry text
idx-purify-text = pilotam os balões purificadores pra limpar o céu.

# index entry name
idx-stir-name = boticários

# index entry text
idx-stir-text = cuidam de uma fornada de poções.

# index entry text
idx-janitor-text = limpam o cocô e a lama.

# index entry text
idx-wizard-text = estudiosos da magia, capazes de arrancar pedaços de uma estrela.

# index entry text
idx-build-text = erguem construções e máquinas.

# index entry name
idx-breaker-name = quebrador

# index entry text
idx-breaker-text = bate muito mais forte ao cavar a rocha.

# index entry name
idx-carter-name = carroceiro

# index entry text
idx-carter-text = carregadores podem puxar uma carroça e levar o dobro.

# index entry name
idx-blaster-name = dinamitador

# index entry text
idx-blaster-text = equipado com explosivos pequenos pra escavar minério de verdade.

# index entry name
idx-grower-name = cultivador

# index entry text
idx-grower-text = cuida das colheitas em dobro.

# index entry name
idx-brews-name = poções

# index entry text
idx-brews-text = poções especiais da botica.

# index entry text
idx-party-text = um grupo corajoso de aventureiros dispostos a arriscar a vida pra derrotar a serpente.

# index entry name
idx-sqwife-name = sua esposa

# index entry text
idx-sqwife-text = vivia a vida dela até o incidente (ou os incidentes), presa sob rochas que caem do céu sem parar. loucura.

# index entry name
idx-notices-name = conquistas

# index entry text
idx-notices-text = os marcos do pátio.

# index entry name
idx-serpent-name = a serpente

# index entry text
idx-serpent-text = uma criatura abissal esquisita, tipo uma cobra, que habita o abismo.

## Jobs

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = britadores

# a job, as the boards, the crew and the index say it (the save's key is haulers)
job-haulers = carregadores

# a job, as the boards, the crew and the index say it (the save's key is quarriers)
job-quarriers = mineradores

# a job, as the boards, the crew and the index say it (the save's key is farmhands)
job-farmhands = agricultores

# a job, as the boards, the crew and the index say it (the save's key is scholars)
job-scholars = estudiosos

# a job, as the boards, the crew and the index say it (the save's key is purifiers)
job-purifiers = purificadores de ar

# a job, as the boards, the crew and the index say it (the save's key is stirrers)
job-stirrers = boticários

# a job, as the boards, the crew and the index say it (the save's key is janitors)
job-janitors = zeladores

# a job, as the boards, the crew and the index say it (the save's key is wizards)
job-wizards = magos

# a job, as the boards, the crew and the index say it (the save's key is builders)
job-builders = construtores

# a job, as the boards, the crew and the index say it (the save's key is fighters)
job-fighters = lutadores

# a job, as the boards, the crew and the index say it (the save's key is gatherers)
job-gatherers = coletores

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = construtores do fundo

## Boards

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit: so many a minute; $icon is the coin's mark (html)
unit-per-min = { $icon }/min

# a row's unit: so many a dig; $icon is the coin's mark (html)
unit-per-dig = { $icon }/pazada

# a row's unit: so many a harvest; $icon is the coin's mark (html)
unit-per-harvest = { $icon }/colheita

# a row's unit after its number: swings a second
unit-hits-s = golpes/s

# a row's unit after its number: swings a second, from one
unit-hit-s = golpe/s

# a row's unit after its number: throws a second
unit-throws-s = jogadas/s

# a row's unit after its number: a wizard's bolts a minute
unit-bolts-min = raios/min

# a row's unit after its number: star cells a bolt knocks off
unit-cells-bolt = células/raio

# a row's unit after its number: haze a balloon takes in a second
unit-motes-s = ciscos/s

# a row's unit after its number: farm plots
unit-plots = canteiros

# a row's unit after its number: the quarry's shovels
unit-shovels = pás

# a row's unit after its number: the apothecary's pots
unit-pots = caldeirões

# a row's unit after its number: doses a batch
unit-doses = doses

# a unit after a number: seconds
unit-s = s

# a deep row's unit after its number: damage
unit-dmg = dano

# a deep row's unit after its number: damage a second
unit-dmg-s = dano/s

# a brew's unit after its percentage: how much faster
unit-faster = mais rápido

# a brew's unit after its percentage: how much stronger
unit-stronger = mais forte

# a brew's unit after its number: crit chance
unit-crit = crítico

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower = { $more ->
        [yes] { $left ->
            [one] compre mais { $left } cultivador pra desbloquear
           *[other] compre mais { $left } cultivadores pra desbloquear
        }
       *[no] { $left ->
            [one] compre { $left } cultivador pra desbloquear
           *[other] compre { $left } cultivadores pra desbloquear
        }
    }

# a machine's row until its station's set of blaster hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-blaster = { $more ->
        [yes] { $left ->
            [one] compre mais { $left } dinamitador pra desbloquear
           *[other] compre mais { $left } dinamitadores pra desbloquear
        }
       *[no] { $left ->
            [one] compre { $left } dinamitador pra desbloquear
           *[other] compre { $left } dinamitadores pra desbloquear
        }
    }

# a price in time, a minute or more: $n minutes
price-min = { $n } min

# a row's verb, before its gain: how much a hand holds
does-hold = segura

# the bench: your carry ladder
row-carry = carga

# a row's verb, before its gain: swings
does-hit = bate

# the bench: your swing pace ladder
row-speed = golpe automático

# a row's verb, before its gain: throws
does-throw = joga

# the bench: how often a held hand lets go
row-toss = ritmo de jogada

# a row's verb, before its gain: how far a throw carries
does-reach = alcança

# the bench: how far a handful carries
row-reach = alcance da jogada

# a row's verb, before its gain: what a swing takes
does-per-swing = por golpe

# the bench: what a swing of yours takes
row-pick = dano da picareta

# the bench: holding a handful throws it by itself
row-autotoss = segurar pra jogar

# the bench: holding the pointer on the boulder swings by itself
row-auto = segurar pra cavar

# a row's verb, before its gain: how much a body carries
does-carry = carrega

# the bench: the haulers' load ladder
row-haulcarry = carga do carregador

# a row's verb, before its gain: walking pace
does-walk = anda

# the bench: the haulers' pace ladder
row-haulpace = ritmo do carregador

# a row's verb, before its gain: crits
does-crit = crítico

# the bench: the chance a hit is a crit
row-critchance = chance de crítico

# the bench: how much more a crit takes
row-critmult = dano crítico

# the shack: the diggers' swing pace ladder
row-rockhandspeed = ritmo do golpe

# the shack: what a digger's swing takes
row-rockhandpick = dano da picareta do britador

# the bench: the row that puts up the apothecary
row-unlockapothecary = construir a botica

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = prepare reforços temporários pros seus quadrabalhadores

# the bench: what the apothecary row gives, where a gain would go
row-unlockapothecary-blurb = tônicos pra equipe

# the bench: the row that puts up the casino
row-unlockcasino = construir o cassino

# the bench: what the casino is for, under its name
row-unlockcasino-note = uma mesa que pega uma aposta e paga o dobro ou nada

# the bench: what the casino row gives, where a gain would go
row-unlockcasino-blurb = dobro ou nada

# the bench: the row that puts up the farm
row-unlockfarm = construir a fazenda

# the bench: what the farm is for, under its name
row-unlockfarm-note = plante umas colheitas

# the bench: what the farm row gives, where a gain would go
row-unlockfarm-blurb = planta colheitas

# the bench: the row that puts up the air filter
row-unlockfilter = construir o filtro de ar

# the bench: what the air filter is for, under its name
row-unlockfilter-note = vende os balões que tiram a névoa do céu de volta, e lê o céu

# the bench: what the air filter row gives, where a gain would go
row-unlockfilter-blurb = limpa o céu

# the bench: the row that puts up the janitor's closet
row-unlockouthouse = construir o quartinho da limpeza

# the bench: what the closet is for, under its name
row-unlockouthouse-note = você já viu cocô demais, vamos limpar

# the bench: what the closet row gives, where a gain would go
row-unlockouthouse-blurb = cocô, limpo

# the bench: the row that puts up the quarry
row-unlockquarry = construir a pedreira

# the bench: what the quarry is for, under its name
row-unlockquarry-note = comece a cavar minério

# the bench: what the quarry row gives, where a gain would go
row-unlockquarry-blurb = cava minério

# the bench: the row that puts up the shack
row-unlockshack = construir o barracão

# the bench: what the shack is for, under its name
row-unlockshack-note = Melhorias de escavação

# the bench: what the shack row gives, where a gain would go
row-unlockshack-blurb = equipamento pra rocha

# the bench: the row that puts up the tower
row-unlocktower = descobrir a torre

# the bench: what the tower is for, under its name
row-unlocktower-note = invoque uns magos

# the bench: the first barrier against the boulder
row-props = barreira de madeira

# the bench: the wooden barrier's line
row-props-note = construa rápido uma barreira pra salvar sua esposa

# the bench: the second barrier
row-net = a rede

# the bench: the net's line
row-net-note = não deu certo, tentar pegar a rocha com uma rede?

# the bench: the third barrier
row-arch = talhar o arco

# the bench: the arch's line
row-arch-note = ainda não aguenta. vamos construir um arco de pedra.

# the tower: the last barrier, the wizards'
row-dome = será que os magos sabem?

# the tower: the last barrier's line
row-dome-note = tudo o que é do chão falhou. o que resta não é do chão

# a hat's name: the diggers' (its row, the index, the crew)
kit-breaker = quebrador

# what the breaker hat does
kit-breaker-does = o dobro da mordida

# where the breaker hat is worn
kit-breaker-place = a rocha

# a hat's name: the haulers' cart
kit-carter = carroceiro

# what the cart does
kit-carter-does = o dobro da carga

# where the cart is used
kit-carter-place = o poço

# a hat's name: the miners'
kit-blaster = dinamitador

# what the blaster hat does
kit-blaster-does = o dobro de viagens

# where the blaster hat is worn
kit-blaster-place = a pedreira

# a hat's name: the farmers'
kit-grower = cultivador

# what the grower hat does
kit-grower-does = o dobro de cuidado

# where the grower hat is worn
kit-grower-place = a fazenda

# the bench: a forklift that drives itself
row-driver = empilhadeira

# the bench: the forklift's line
row-driver-note = uma empilhadeira que se dirige sozinha: leva a carga até o poço sem ninguém a bordo, e solta fumaça

# the bench: the forklifts' load ladder
row-liftload = carga da empilhadeira

# a row's verb, before its gain: driving pace
does-drive = dirige

# the bench: the forklifts' pace ladder
row-liftpace = ritmo da empilhadeira

# a heading on the bench's board: your own ladders
sect-you = você

# a heading on the bench's board: the crit ladders
sect-luck = golpes de sorte

# a heading on the bench's board: the haulers' gear
sect-haulers = os carregadores

# a heading on the bench's board: the rows that put up a new place
sect-build = construir

# the house's board: buy another house to hire somebody
row-house = outra casa

# the ribbon on every goal card: the barrier the story is on
goal-title = resgatando sua esposa

# a card greyed out: its next rung costs crops, and there is no farm yet
needs-spore = faltam colheitas

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = falta uma pedreira

# a card greyed out: its next rung costs a spark, and none has been earned
needs-spark = falta uma faísca

# a card greyed out: its next rung costs a scale, and the deep is not open
needs-scale = falta uma escama

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, { $place }

# the shack: the ram's tuning ladder
row-tuneram = golpe do aríete

# the ram's tuning ladder, its line; $n is how many times harder a rung makes it
row-tuneram-note = o aríete bate { $n }x mais forte

# a heading on any board over the rows no section names
sect-and = e

# a card the yard is at: somebody is building it (the strip's word with nothing to hand back; the gain line's word)
card-building = em obra

# the strip at a card's foot: buy another copy behind the one being built
card-another = + outro

# a card in line: nobody is at it yet
card-queued = na fila

# a finished ladder, where its price would go
card-done = pronto

# the tower: an enchantment's name
spell-drive = acelerar as máquinas

# the tower: the enchantment's line
spell-drive-note = toda máquina do pátio roda 50% mais rápido

# the tower: an enchantment's name
spell-luck = enriquecer a pedreira

# the tower: the enchantment's line
spell-luck-note = cada pazada na pedreira traz 25% mais minério

# the tower: an enchantment's name
spell-gmo = modificar geneticamente as colheitas

# the tower: the enchantment's line
spell-gmo-note = toda colheita fica 25% maior

# the tower: an enchantment's name
spell-thrift = baratear as casas

# the tower: the enchantment's line
spell-thrift-note = toda casa daqui pra frente sai 75% mais barata

# the tower: an enchantment's name
spell-sweep = apressar os zeladores

# the tower: the enchantment's line
spell-sweep-note = os zeladores varrem e andam duas vezes mais rápido

# the tower: how often a wizard throws
row-wizspeed = conjuração mais rápida

# the tower: how often a wizard throws, its line; $pct is the rise a rung
row-wizspeed-note = cada mago lança um raio na estrela { $pct }% mais vezes

# a row's verb, before its gain: a wizard's casting
does-cast = conjura

# the tower: how much of the star a bolt takes
row-wizpower = raios mais pesados

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = cada raio arranca { $next } células da estrela em vez de { $now }

# the tower: a wizard's hat
row-wizard = invocar um mago

# the tower: a wizard's line
row-wizard-note = voa e despedaça a estrela com raios atrás de faíscas, e chama uma nova quando o céu fica vazio

# the tower: the sphere's line
row-sphere-note = capture a energia de uma estrela

# the tower: the sphere's tuning ladder
row-tunesphere = luz da esfera

# the tower: the sphere's tuning ladder, its line; $n is how many times the light
row-tunesphere-note = a esfera pega { $n }x a luz

# the tower: the barrier the wizards pour
row-dome-tower = conjurar a barreira

# the tower: the barrier's line
row-dome-tower-note = nada passa por essa coisa.

# the tower: the way down to the deep
row-portal = conjurar o portal

# the tower: the portal's line
row-portal-note = um caminho pro abismo, mantido aberto.

# a heading on the tower's board: the spells
sect-enchantments = encantamentos

# a heading on the tower's board: the portal
sect-abyss = o abismo

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign (50%)
spell-drive-blurb = +{ $pct } velocidade

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-luck-blurb = +{ $pct } minério

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-gmo-blurb = +{ $pct } colheitas

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-thrift-blurb = { $pct } mais baratas

# the tower: what the enchantment gives, where a gain would go; $x is how many times
spell-sweep-blurb = { $x }x mais rápido

# the farm: what a harvest is worth, a ladder
row-crop = valor da colheita

# a row's verb, before its gain: tending plots
does-tend = cuida

# the farm: how often a plot is tended, a ladder
row-tend = ritmo do plantio

# the farm: break another plot
row-farmplot = outro canteiro

# the farm: the tiller's tuning ladder
row-tunetiller = ritmo do arado

# the farm: the tiller's tuning ladder, its line; $n is how many times faster
row-tunetiller-note = o arado trabalha { $n }x mais rápido

# a heading on the farm's board: what a plot pays
sect-crop = a colheita

# the quarry: what a dig turns up, a ladder
row-seam = minério por pazada

# a row's verb, before its gain: digging
does-dig = cava

# the quarry: how often a dig happens, a ladder
row-quarrypace = ritmo de mineração

# the quarry: another miner's shovel at the face
row-quarrybench = outra pá

# the quarry: the drill's tuning ladder
row-tunejaw = mordida da broca

# the quarry: the drill's tuning ladder, its line; $n is how many times harder
row-tunejaw-note = a broca morde { $n }x mais forte

# a heading on the quarry's board: what the hole pays
sect-ore = o minério

# a heading on the farm's board over who works the plots, with their headcount (the job's save key, as it has always read)
sect-farmhands = lavradores

# a heading on the quarry's board over who works the cut, with their headcount (the job's save key, as it has always read)
sect-quarriers = mineiros

# a row's verb, before its gain: a balloon's flight
does-fly = voa

# the air filter: how fast the balloons go from cloud to cloud
row-balloonspeed = velocidade do balão

# a row's verb, before its gain: what a balloon takes in
does-filter = filtra

# the air filter: how much haze a balloon draws
row-power = força do balão

# the air filter: another balloon
row-balloon = o balão

# the air filter: the balloon's line
row-balloon-note = anda pelas nuvens e deixa cair embaixo de si o que pega

# the air filter: the recycler
row-recycler = o reciclador

# the air filter: the recycler's line
row-recycler-note = o que os balões pegam cai como pedrinhas em vez de lama

# a heading on the air filter's board
sect-equipment = equipamento

# the janitor's closet: the second cap on the stand
row-loopost = outro boné

# the janitor's closet: another roomba
row-roomba = um aspirador

# the janitor's closet: the roomba's line
row-roomba-note = vai até a sujeira no pátio e traz pra casa; um zelador cuida deles, e eles soltam fumaça

# the janitor's closet: the roombas' tuning ladder
row-tuneroomba = potência de sucção

# the janitor's closet: the roombas' tuning ladder, its line; $n is how many times faster
row-tuneroomba-note = os aspiradores sugam { $n }x mais rápido

# a brew's name: the speed one, priced in crops
tonic-stew = ensopado reforçado

# a brew's name: the strength one, priced in ore
tonic-strong = poção forte

# a brew's name: the crit one, priced in sparks
tonic-brace = tônico revigorante

# the apothecary: keep the fires going, or let them die once a batch is dealt (a setting)
row-potkeep = seguir preparando

# the apothecary's keep-brewing setting: on
row-potkeep-on = fornada atrás de fornada

# the apothecary's keep-brewing setting: off
row-potkeep-off = só esta

# the apothecary: room for one more pot and its stirrer
row-anotherpot = outro caldeirão

# a row's verb, before its gain: how long a dose lasts
does-lasts = dura

# the apothecary: how long a dose lasts, a ladder
row-bufflength = concentração da poção

# the apothecary: doses a batch, a ladder
row-brewdoses = tamanho da fornada

# a heading on the apothecary's board over the pots, with the stirrers' headcount
sect-pot = o caldeirão

# a heading on the apothecary's board
sect-brewing = preparo

# a heading on the apothecary's board: one ladder a brew
sect-potency = potência

# a brew's potency row's verb, before its gain
does-faster = mais rápido

# a brew's potency row's verb, before its gain
does-stronger = mais forte

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } s

# what the crit brew does: $v points of crit chance for $secs seconds
tonic-gain-crit = +{ $v } crítico, { $secs } s

# the shack's heading over the diggers' gear, with their headcount
sect-diggers = britadores

## Machines

# a machine's name: the quarry's (the save's key is jaw)
machine-jaw = a broca

# a machine's name: the boulder's
machine-ram = o aríete

# a machine's name: the farm's
machine-tiller = o arado

# a machine's name: carries pebbles from the boulder to the hole
machine-belt = a esteira

# a machine's name: the shell round the star
machine-sphere = a esfera

# a machine's name: the janitor's closet's
machine-roomba = os aspiradores

## Stations

# a deep station's board with nothing on it yet
station-party-empty = nada pra aprender ainda

# a station's name: its board's title, the pointer's label, the queue card
station-casino = o cassino

# a station's name
station-filter = o filtro de ar

# the air filter's board with nothing on it
station-filter-empty = nada pra instalar

# a station's name
station-quarry = a pedreira

# the quarry's board with nothing on it
station-quarry-empty = a pedreira já chegou no fundo

# a station's name
station-farm = a fazenda

# the farm's board with nothing on it
station-farm-empty = a terra já está toda lavrada

# a station's name
station-apothecary = a botica

# the apothecary's board with nothing on it
station-apothecary-empty = o caldeirão está frio

# a station's name
station-tower = a torre

# the tower's board with nothing on it
station-tower-empty = nada se mexe aqui dentro ainda

# a station's name
station-shack = o barracão

# the shack's board with nothing on it
station-shack-empty = as ferramentas estão todas na rocha

# the bench's board with nothing on it
station-bench-empty = nada pra vender

# a station's name
station-outhouse = o quartinho da limpeza

# the janitor's closet's board with nothing on it
station-outhouse-empty = as vassouras estão todas nos ganchos

# a station's name
station-house = a casa

# a station's name: the noticeboard over the pit
station-stats = as contas

# the books with nothing on them
station-stats-empty = nada entrou ainda

# a station's name: the deep's purse
station-crusher = o triturador

# the crusher's pile-full mark, on a hover
station-crusher-full = o chão está cheio de escamas

# a station's name: the deep's houses
station-pods = as cápsulas

# the pods' board with nothing on it
station-pods-empty = nada pra construir

# the lab's board title, still in the page's markup (the lab itself is gone)
station-lab = o laboratório

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (An eighth like-named station reads "undefined": what the code said before the words moved here, kept by the owner; the deep has seven.)
station-party = { $nth ->
        [0] o { $who }
        [1] o segundo { $who }
        [2] o terceiro { $who }
        [3] o quarto { $who }
        [4] o quinto { $who }
        [5] o sexto { $who }
        [6] o sétimo { $who }
       *[other] o undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (an eighth reads "undefined", as the code said)
station-party-lot = { $nth ->
        [0] uma estação
        [1] uma segunda estação
        [2] uma terceira estação
        [3] uma quarta estação
        [4] uma quinta estação
        [5] uma sexta estação
        [6] uma sétima estação
       *[other] uma undefined estação
    }

## Crew

# the crew window: where a body is, standing at its station (rockhands)
crew-at-rockhands = na rocha

# the crew window: where a body is, standing at its station (haulers)
crew-at-haulers = no poço

# the crew window: where a body is, standing at its station (quarriers)
crew-at-quarriers = na pedreira

# the crew window: where a body is, standing at its station (farmhands)
crew-at-farmhands = nos canteiros

# the crew window: where a body is, standing at its station (purifiers)
crew-at-purifiers = no filtro de ar

# the crew window: where a body is, standing at its station (janitors)
crew-at-janitors = limpando

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = na sua mão

# the crew window and a body's card: where a body is (falling)
crew-where-falling = no ar

# the crew window and a body's card: where a body is (home)
crew-where-home = em casa

# the crew window and a body's card: where a body is (basket)
crew-where-basket = lá em cima num balão

# the crew window and a body's card: where a body is (yard)
crew-where-yard = no pátio

# the crew window and a body's card: where a body is (resting)
crew-where-resting = no intervalo

# the crew window and a body's card: where a body is (walking)
crew-where-walking = a caminho

# the crew window and a body's card: where a body is (deep)
crew-where-deep = nas profundezas

# a body's card, doing: at its job with no step to name (rockhands)
crew-does-rockhands = cavando a rocha

# a body's card, doing: at its job with no step to name (quarriers)
crew-does-quarriers = minerando a pedreira

# a body's card, doing: at its job with no step to name (farmhands)
crew-does-farmhands = plantando

# a body's card, doing: at its job with no step to name (scholars)
crew-does-scholars = pesquisando

# a body's card, doing: at its job with no step to name (purifiers)
crew-does-purifiers = limpando o ar

# a body's card, doing: at its job with no step to name (janitors)
crew-does-janitors = jogando pá

# a body's card, doing: at its job with no step to name (haulers)
crew-does-haulers = transportando

# a body's card, doing: what its step is (seek)
crew-now-seek = procurando pedrinhas

# a body's card, doing: what its step is (dump)
crew-now-dump = despejando uma carga

# a body's card, doing: what its step is (muck)
crew-now-muck = recolhendo sujeira

# a body's card, doing: what its step is (cut)
crew-now-cut = cavando na pedreira

# a body's card, doing: what its step is (up)
crew-now-up = subindo

# a body's card, doing: what its step is (down)
crew-now-down = descendo

# a body's card, doing: what its step is (tend)
crew-now-tend = cuidando de um canteiro

# a body's card, doing: what its step is (home)
crew-now-home = indo pra casa

# a body's card, doing: what its step is (idle)
crew-now-idle = nada demais

# a body's card, doing: what its step is (in)
crew-now-in = lá dentro

# a body's card, doing: what its step is (aloft)
crew-now-aloft = lá em cima no balão

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = operando { $name }

# a body's card, doing: what its step is (to)
crew-now-to = indo pra lá

# a body's card, doing: what its step is (kit)
crew-now-kit = se equipando na bancada

# a body's card, doing: what its step is (build)
crew-now-build = construindo

# a body's card, doing: what its step is (working)
crew-now-working = trabalhando

# a body with no name, on its card and in the crew window
crew-somebody = alguém

# a body's card: the label before how long it has been here (a column of ten in monospace)
crew-card-age = idade

# a body's card, age: under a minute
crew-card-new = chegou hoje

# a body's card, age: $mins minutes
crew-card-mins = { $mins } min

# a body's card: the label before what it is doing (a column of ten in monospace)
crew-card-doing = fazendo

# a heading in the crew window over the yard's crew
crew-sect-yard = o pátio

# a heading in the crew window over the deep's crew
crew-sect-deep = as profundezas

# a heading on the house's board, and the window it opens
crew-sect-crew = a equipe

## The books

# the books: a coin, before its rate
books-dust = pedrinhas

# the books: a coin, before its rate
books-shard = minério

# the books: a coin, before its rate
books-spore = colheitas

# the books: a coin, before its rate
books-spark = faíscas

# the books: the window the rates are taken over, in minutes ($n may be ½)
books-over-min = { $n } min

# the books: the row that steps the window the rates are taken over
books-over = média de

# the books: the window, in a rate's note (nothing in the last half minute)
# (pt-BR: each window carries its own preposition, "no"/"nos", which books-got cannot add)
books-last-half = no último meio minuto

# the books: the window, in a rate's note
books-last-one = no último minuto

# the books: the window, in a rate's note; $n minutes, more than one
books-last-mins = nos últimos { $n } minutos

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } { $over }

# the books: a rate's note when nothing came in
books-nothing = nada

# the books: a line
books-dirt-mach = das máquinas

# the books: a line
books-dirt-dust = da rocha

# the books: a line
books-dirt-shard = da pedreira

# the books: a line
books-dirt-spore = da fazenda

# the books: the sky full in, while the filter is winning
books-due-never = não nesse ritmo

# the books: a line
books-sky-trend = poluição

# the books: a line
books-sky-up = lançada, por minuto

# the books: a line
books-sky-down = retirada, por minuto

# the books: a line
books-sky-haze = o céu está

# the books: how full the sky is; $pct with its sign
books-sky-full = { $pct } cheio

# the books: a line
books-sky-due = cheio em

# the books: a line
books-sky-rains = pancadas de chuva aguentadas

# the books: a line
books-sky-muck = lama largada por aí

# the books: a line
books-working = trabalhando

# the books: a line
books-idle = à toa

# the books: a line
books-best-mined = o máximo tirado da rocha

# the books: a line
books-best-quarried = o máximo minerado

# the books: a line
books-best-farmed = o máximo colhido

# the books: a line
books-best-stored = o máximo jogado no poço

# the books: a line
books-best-tidied = o máximo limpo

# the books: the longest on one clock, an hour or more; $n hours to a tenth
books-hours = { $n } h

# the books: the longest on one clock, under an hour; $n minutes
books-mins = { $n } min

# the books: a line
books-eldest = mais tempo na folha

# the books: a line
books-tally-rocks = rochas limpas

# the books: a line
books-tally-banked = pedrinhas depositadas

# the books: a line
books-tally-ore = minério tirado

# the books: a coin earned over the whole game; $coin is books-shard, books-spore or books-spark
books-tally-earned = { $coin }, no total

# the books: a line
books-tally-rift = pela fenda

# the books: a line
books-tally-brews = fornadas preparadas

# the books: a line
books-tally-hats = chapéus terminados

# the books: a line
books-tally-crew = na folha

# the books: a line
books-tally-notes = conquistas ganhas

# the books: a line
books-tally-under = sua esposa, sob a rocha por

# the books: a line
books-tally-saved = sua esposa, resgatada em

# a heading in the books, and on the noticeboard
books-sect-income = renda, por segundo

# a heading in the books
books-sect-sky = o céu

# a heading in the books
books-sect-crew = a equipe

# a heading in the books
books-sect-tally = a contagem

# the noticeboard: the way into the books (off the board for now)
books-open = abrir as contas

# the noticeboard: how long this yard has been played
books-playtime = tempo de jogo

## Hover

# the hover on a deep station whose Recruit still waits on its first choice
hover-choose = escolha um lutador

# the hover over a grain of ore
hover-ore = minério

# the hover over a crop, a grain of it or a grown plot
hover-crop = colheita

# the hover over a spark
hover-spark = faísca

# the hover over a pebble
hover-pebble = pedrinha

# the hover over the drowned pit
hover-abyss = o abismo

# the hover over the rift
hover-rift = a fenda

# the hover over poop on the ground
hover-poop = cocô

# the hover over muck on the ground
hover-muck = lama

# the hover over a body, as the job it does (its type, rockhand)
hover-rockhand = britador

# the hover over a body, as the job it does (its type, hauler)
hover-hauler = carregador

# the hover over a body, as the job it does (its type, quarrier)
hover-quarrier = minerador

# the hover over a body, as the job it does (its type, farmhand)
hover-farmhand = agricultor

# the hover over a body, as the job it does (its type, scholar)
hover-scholar = estudioso

# the hover over a body, as the job it does (its type, purifier)
hover-purifier = purificador

# the hover over a body, as the job it does (its type, stirrer)
hover-stirrer = boticário

# the hover over a body, as the job it does (its type, janitor)
hover-janitor = zelador

# the hover over a body, as the job it does (its type, wizard)
hover-wizard = mago

# the hover over a body, as the job it does (its type, builder)
hover-builder = construtor

# the hover over a body, as the job it does (its type, fighter)
hover-fighter = lutador

# the hover over a body, as the job it does (its type, gatherer)
hover-gatherer = coletor

# the hover over a body, as the job it does (its type, delver)
hover-delver = construtor do fundo

# the hover over the portal, from the deep
hover-portal-up = o portal — subir pro pátio

# the hover over the portal, from the yard
hover-portal-down = o portal — descer pras profundezas

# the hover over the serpent
hover-serpent = a serpente

# the hover over the crew's houses
hover-house = casa

# the hover over the boulder
hover-rock = rocha

# the hover over a bird
hover-bird = pássaro

# the hover over a balloon
hover-balloon = balão

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the air filter's gauge: the sky filling faster than it is cleaned
hover-dial-worse = piorando

# the air filter's gauge: the sky cleaned faster than it fills
hover-dial-better = melhorando

# the air filter's gauge: neither
hover-dial-steady = estável

# the hover over the counter above the pit
hover-counter = pedrinhas no poço: é com isso que se paga tudo

# the air filter's gauge: the needle in the first band
hover-dial-clean = limpo

# the air filter's gauge: the needle in the middle band
hover-dial-dirty = sujo

# the air filter's gauge: the needle in the last band
hover-dial-filthy = imundo

# the hover on a pile-full mark: a station's pile has nowhere left to go
hover-pile-full = pilha cheia

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names }: pronto

# the hover on a done mark whose rows have no names
hover-done-work = trabalho pronto

# the casino's lever, by name (its hover and the pad's label)
lever-arm = a alavanca

# a pot's picker: the brew it is set to, when it is set to none
pot-nothing = nada

# a pot's picker: the heading over who the brew is for
pot-for = para

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = quem estiver mais perto

## The deep

# a brawler's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-brawler-fork = Bata mais forte, aprenda combos

# the brawler's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move = Combos

# what the brawler's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move-does = encadeia socos

# the brawler's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap = Nocaute

# what the brawler's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap-does = { $stun }

# a sword's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sword-fork = Domine a espada

# the sword's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-move = Redemoinho

# what the sword's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-move-does = corte mais pesado

# the sword's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap = Pontos fracos

# what the sword's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap-does = { $bleed }

# a monk's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-monk-fork = Concentre seu chi

# the monk's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-move = Fôlego fundo

# what the monk's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-move-does = chi mais rápido

# the monk's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap = Água parada

# what the monk's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap-does = { $stun }

# a martial's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-martial-fork = Bata mais rápido e finalize antes

# the martial's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-move = Floreio

# what the martial's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-move-does = golpes finais mais rápidos

# the martial's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap = Ânimo

# what the martial's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap-does = { $haste } pro grupo

# a ranger's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-ranger-fork = Mire nos pontos fracos

# the ranger's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move = Tiro certeiro

# what the ranger's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move-does = flecha carregada

# the ranger's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap = Tiro imobilizador

# what the ranger's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap-does = { $stun }

# a assassin's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-assassin-fork = Golpeie rápido e preciso

# the assassin's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move = Execução

# what the assassin's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move-does = pune as feridas

# the assassin's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap = Serrilhado

# what the assassin's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap-does = { $bleed }

# a hexer's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-hexer-fork = Lance maldições que enfraquecem

# the hexer's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move = Murchar

# what the hexer's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move-does = a serpente sofre mais dano

# the hexer's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap = Amarração

# what the hexer's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap-does = { $held }, { $exposed }

# a sapper's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sapper-fork = Aprenda explosivos

# the sapper's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move = Bombas grudentas

# what the sapper's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move-does = grudam e explodem

# the sapper's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap = Par

# what the sapper's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap-does = duas bombas, { $stun }

# a mage's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-mage-fork = Canalize feixes poderosos

# the mage's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-move = Ampliação

# what the mage's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-move-does = feixe mais largo

# the mage's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap = Termita

# what the mage's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap-does = queima a armadura

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Dê ao seu grupo { $inspired }

# the bard's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-move = Hino

# what the bard's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-move-does = { $inspired } em dobro

# the bard's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap = Ritmo

# what the bard's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap-does = { $haste } pro grupo

# a status, by name (bold in a line, under its icon)
status-stun = Atordoado

# a status, by name
status-bleed = Sangramento

# a status, by name
status-haste = Pressa

# a status, by name
status-held = Preso

# a status, by name
status-exposed = Exposto

# a status, by name
status-inspired = Inspirado

# what Stun does, after its name
status-stun-does = não se mexe nem se cura

# what Bleed does, after its name
status-bleed-does = dano ao longo do tempo

# what Haste does, after its name; $pct with its sign
status-haste-does = ataca { $pct } mais rápido

# what Held does, after its name
status-held-does = não pode se curar

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = sofre { $lo }-{ $hi } mais dano

# what Inspired does, after its name
status-inspired-does = bate mais forte

# a status's hover line: $name (status-…) and what it does
status-line = { $name }: { $does }

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# a status's label under its icon when $n of it are on
status-label-n = { $name } x{ $n }

# a base fighter's line: the altar's (the Fighter)
base-altar-does = Dá socos

# a base fighter's line: the well's (the Novice)
base-well-does = Pratica artes marciais

# a base fighter's line: the armory's (the Scout)
base-armory-does = Atira flechas

# a base fighter's line: the circle's (the Adept)
base-circle-does = Lança maldições

# a base fighter's line: the spire's (the Apprentice)
base-spire-does = Dispara feixes

# the Recruit's line, before its first choice
recruit-does = um soco leve

# the Bard's line with nobody else fighting
rail-alone = não tem mais ninguém pra quem cantar

# a class that needs company, before there is any
rail-locked = abre com uma segunda estação

# a station's board at the fork: the heading over the two classes
rail-fork-ask = Especialize-se

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Escolha seu lutador

# a rung's number in its class's unit; $unit is unit-dmg or unit-dmg-s
rail-worth = { $n } { $unit }

# a rung's number for a class written in percent (the Bard)
rail-worth-pct = +{ $n }%

# a pip's hover line on a station's tree: $name (a fighter, a move) and $what (its number, or a few words)
rail-line = { $name }: { $what }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Vire { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = reiniciar – devolve tudo

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-brawler = Brigão

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sword = Espadachim

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-monk = Monge

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Artista marcial

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-ranger = Patrulheiro

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-assassin = Assassino

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-hexer = Bruxo

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sapper = Sapador

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-mage = Mago

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-bard = Bardo

# a base fighter's name: the altar's, below the fork
base-altar = Lutador

# a base fighter's name: the well's
base-well = Novato

# a base fighter's name: the armory's
base-armory = Batedor

# a base fighter's name: the circle's
base-circle = Adepto

# a base fighter's name: the spire's
base-spire = Aprendiz

# every station's first fighter, before its first choice
class-recruit = Recruta

# the serpent's lash, its tile's hover while it waits
serp-lash-calm = Chicotada: atordoa quem ataca corpo a corpo

# the serpent's lash, its tile's hover while it is warned
serp-lash-coming = Chicotada vindo

# the serpent's lash, its tile's hover while it is on
serp-lash-on = Chicotada: atordoa quem ataca corpo a corpo

# the serpent's lash, its tile's hover once answered
serp-lash-stopped = Chicotada: parada

# the serpent's cloak, warned
serp-sink-coming = Manto vindo

# the serpent's cloak, on
serp-sink-on = Manto: fora de alcance

# the serpent's constrict, warned
serp-orb-coming = Constrição vindo

# the serpent's constrict, on
serp-orb-on = Constrição

# the serpent's constrict, answered
serp-orb-stopped = Constrição

# a fighter's tile: dazed, its hover
serp-dazed = Zonzo: sem equilíbrio, vendo estrelas

# a fighter's tile: constricted, its hover
serp-constricted = Constrito

# the serpent's barrier, its tile's hover
serp-barrier = Barreira: absorve dano explosivo

# the serpent's ward, its tile's hover
serp-ward = Proteção: dano mágico pela metade

# the serpent's plates, its tile's hover
serp-plates = Placas: dano físico pela metade

# the lash's tile, its label
serp-lash = Chicotada

# the cloak's tile, its label
serp-sink = Manto

# the constrict's tile, its label
serp-orb = Constrição

# a fighter's dazed tile, its label
serp-dazed-name = Zonzo

# a fighter's constricted tile, its label
serp-constricted-name = Constrito

# the barrier's tile, its label
serp-barrier-name = Barreira

# the ward's tile, its label
serp-ward-name = Proteção

# the plates' tile, its label
serp-plates-name = Placas

# the pods: one more of the crew, living down here
row-pod = outra cápsula

# the pods: the pod's line
row-pod-note = uma cápsula do outro lado das profundezas: mais um da equipe, morando aqui embaixo

# a deep station's board: the heading over its one fighter, with the count
rail-fighter = o lutador

# the deep: the build of a new fighter's station (the queue card names it)
row-raise-station = erguer uma estação

# the deep's build button: the first station costs no fang
build-free = grátis

# the serpent's level after the pips on its bar, from level 2 on; $n is the level.
# [owner's words: a level label, e.g. "Lv 7"] -- until then the bare number. Drawn in the pixel number font
# (NUM_FONT), which draws only the glyphs it has: words want their letters drawn into the font
serp-level = { $n }
