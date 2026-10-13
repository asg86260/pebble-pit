### Pebble Pit, en français (fr).
### Drafted by Claude (Opus 5.5) on 2026-10-13 to locales/STYLE.md; not yet
### reviewed by a native speaker.
###
### Translated from locales/en.ftl, same ids, same order, same groups. The
### English comment over each message says where it shows. Messages whose
### English is still an `[owner's words: ...]` placeholder are left out, so
### the English shows until the owner has written them.

## Sheets

# rescue sheet heading, end of first half
saved-word = C'est fini ?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = tu as sauvé ta femme en <span data-l10n-name="time"></span> !

# rescue sheet dismiss button
saved-keepplaying = Heureux pour toujours

# demo end sheet heading
demoend-word = c'est tout pour la démo !

# demo end sheet line
demoend-why = pas encore moyen de sauver ta femme.

# demo end store link (if STORE_URL)
demoend-store = ajoute-le à ta liste de souhaits !

# demo end dismiss button
demoend-keep = continuer

# free-build teaser end sheet heading
teaseend-word = la suite dans le jeu complet !

# teaser end store link (if STORE_URL)
teaseend-store = prends le jeu complet

# teaser end dismiss button
teaseend-keep = continuer

# second-half end sheet heading
freed-word = ok, là c'est fini

# second-half end sheet line
freed-why = tu as sauvé ton mari du ventre du serpent.

# second-half end sheet line
freed-end = c'est la fin, libre à toi de continuer à tuer le serpent et à cultiver en surface !

# second-half end sheet line
freed-thanks = merci !

# second-half end dismiss button
freed-keep = continuer

# crash sheet heading
crashed-word = arrêté

# crash sheet button
crashed-copysave = copier la sauvegarde

# pause sheet heading
held-word = en pause

# pause sheet button
held-resume = reprendre

# pause sheet button (relabelled from JS)
held-slotsbtn = sauvegardes

# saves page heading
held-slots-word = sauvegardes

# saves page button
held-savecopy = copier une sauvegarde

# saves page button
held-loadsave = charger une sauvegarde

# saves page paste box confirm
held-loadit = charger

# saves page paste box cancel
held-nevermind = laisse tomber

# saves page back button
held-slotsback = retour

# pause sheet button (relabelled from JS)
held-recordbtn = succès

# achievements page heading
held-record-word = succès

# achievements page back
held-recordback = retour

# pause sheet button (also src/indexpage.js:24)
held-indexbtn = index

# index page heading
held-index-word = index

# index page back
held-indexback = retour

# pause sheet button to landing page
held-titlebtn = retour au titre

# pause sheet button, desktop build only
held-quit = quitter le jeu

# pause sheet footer hint
held-keys = échap : pause · ← → regarder · maintiens espace : passer la scène

# window close button label
modal-close =
    .aria-label = fermer

# pause sheet reply, desktop export ok
said-saved = sauvegardé

# pause sheet reply, desktop export failed
said-notsaved = pas sauvegardé

# pause sheet reply, store fallback
said-fellback = la dernière sauvegarde ne se chargeait pas ; voici celle d'avant

# pause sheet reply, unreadable save
said-broken = ta dernière sauvegarde est illisible. copier une sauvegarde te la donne quand même

# pause sheet reply, yard open elsewhere
said-yielded = ce chantier est ouvert dans un autre onglet ; c'est celui-là qui sauvegarde

# pause sheet reply, storage blocked
said-unsaved-blocked = pas de sauvegarde : ton navigateur bloque le stockage sur cette page. copier une sauvegarde marche toujours

# sheet reply after loading a save
said-loaded = chargé

# sheet reply, pasted text invalid
said-notasave = ce n'est pas une sauvegarde

# crash sheet line when error has no message
crashed-why-fallback = quelque chose a planté

# save row age
slots-since-now = à l'instant

# save row age
slots-since-min = il y a { $m } min

# save row age
slots-since-h = il y a { $h } h

# save row item
slots-row-rock = rocher { $n }

# save row item
slots-row-crew = { $n } ouvriers

# save row item for open slot in play
slots-row-playing = en cours

# save row, no yard
slots-row-empty = vide

# save row, broken blob
slots-row-unreadable = illisible

# saves button label on both fronts
held-slotsbtn-label = sauvegardes · { $n } sur { $total }

# empty save row after first press
slots-arm = nouveau chantier ?

# sheet reply after opening empty slot
slots-said-new = un nouveau chantier

# sheet reply after opening a slot
slots-said-loaded = chargé

# save row delete cross label
slots-del-aria = supprimer

# achievements button label with count
held-recordbtn-label = succès · { $count } sur { $total }

# achievements page, nothing earned
held-record-none = tu n'as encore rien fait.

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
        [one] il y a un jour
       *[other] il y a { $d } jours
    }

# saves row delete confirm
slots-confirm-yes = supprimer

# saves row delete cancel
slots-confirm-no = retour

# sheet reply, copy with no save
said-copyout-none = rien de sauvegardé

# sheet reply when clipboard unavailable
said-copyout-window = dans window.__save

# index entry back button on phone
held-index-entryback = retour

# saves page cloud section heading
cloud-head = sauvegardes cloud

# cloud section button
cloud-btn-linkcode = entrer un code de liaison

# cloud section button
cloud-btn-recovery = utiliser un code de secours

# cloud section button
cloud-btn-stop = arrêter le cloud

# cloud section reply after stop
cloud-said-off = le cloud est coupé sur cet appareil

# cloud section button
cloud-btn-enable = activer la synchro cloud

# cloud section reply on failure (also cloud.js:768)
cloud-why-noanswer = le cloud n'a pas répondu

# cloud section, copy recovery code
cloud-btn-copy = copier

# cloud section under recovery code
cloud-writedown = note-le : il ramène tes chantiers sur un nouvel appareil

# cloud section, another device ahead
cloud-btn-take = la prendre

# cloud section, another device ahead
cloud-btn-keep = garder celle-ci

# cloud section reply (also :316)
cloud-said-kept = gardée

# cloud section above pairing code
cloud-pair-enter = sur l'autre appareil, entre

# cloud section, hide pairing code
cloud-btn-done = fini

# cloud section button
cloud-btn-link = lier un appareil

# cloud section toggle
cloud-btn-hidecode = cacher le code de secours

# cloud section toggle
cloud-btn-showcode = voir le code de secours

# cloud section button
cloud-btn-newcode = nouveau code de secours

# cloud section button, first press
cloud-btn-newcode-armed = déconnecter les autres appareils ?

# link code box placeholder
cloud-box-linkph = ···-···

# recovery code box placeholder
cloud-box-recph = ····-····-····

# link code box label
cloud-box-aria-link = code de liaison

# recovery code box label
cloud-box-aria-rec = code de secours

# cloud section reply, bad code
cloud-wrong = ce code n'a pas marché

# cloud section reply after linking
cloud-said-linked = lié

# cloud code entry confirm
cloud-btn-dolink = lier

# cloud code entry cancel
cloud-btn-nevermind = laisse tomber

# cloud code entry prompt
cloud-typing-link = le code sur l'autre appareil

# cloud code entry prompt
cloud-typing-rec = ton code de secours

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = trop d'essais d'ici aujourd'hui ; réessaie demain

# cloud section reply, 503
cloud-why-resting = le cloud se repose ; réessaie plus tard

# cloud section reply, 403
cloud-why-forbidden = le cloud ne connaît pas cette page

# the cloud's line in the landing page's foot bar: $state is one of the cloud-state lines below
# (with no state, it stands before the choose-a-yard button)
cloud-line = cloud · { $state }

# cloud state: not turned on (in cloud-line, and alone in the saves page section)
cloud-state-off = coupé

# cloud state
cloud-state-out = déconnecté

# cloud state
cloud-state-refused = une sauvegarde a été refusée

# cloud state
cloud-state-offline = pas sauvegardé : hors ligne

# cloud state
cloud-state-behind = plus récente sur un autre appareil

# cloud state
cloud-state-newer = mets à jour pour prendre la plus récente

# cloud state
cloud-state-big = trop gros pour le cloud

# cloud state
cloud-state-full = le cloud est plein

# cloud state
cloud-state-paused = en pause

# cloud state
cloud-state-conflict = choisis un chantier

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = sauvegardé { $since }

# cloud state: on, nothing pushed yet
cloud-state-on = activé

# link a device: the pairing code's countdown; $time is m:ss
cloud-pair-left = encore { $time }

# choose a yard: this device's copy of slot $n; $here is the yard as a saves row says it
cloud-clash-here = cet appareil · { $n } · { $here }

# choose a yard: the cloud's copy of slot $n; $cloud is the yard as a saves row says it
cloud-clash-cloud = cloud · { $n } · { $cloud }

# a cloud button's answer: too many tries; $m is minutes to wait
cloud-why-wait = trop d'essais ; réessaie dans { $m } min

# window title opened off the books
modal-books = les comptes

# window title, crew list
modal-crew = qui habite ici

## Settings

# pause sheet button
held-settingsbtn = réglages

# settings page heading
held-settings-word = réglages

# settings note where fullscreen unavailable
set-fullscreen-note = pour le plein écran, ajoute cette page à l'écran d'accueil

# settings volume slider label
set-volume =
    .aria-label = volume

# settings button to controls page
set-controlsbtn = commandes

# controls page heading
set-controls-word = commandes

# controls page back
set-controlsback = retour

# settings page back
set-settingsback = retour

# settings motion switch
set-motion-less = mouvement : réduit

# settings motion switch
set-motion-full = mouvement : complet

# settings touch switch (play only)
set-touch-on = tactile : oui

# settings touch switch (play only)
set-touch-off = tactile : non

# settings dark switch
set-dark-on = sombre : oui

# settings dark switch
set-dark-off = sombre : non

# settings sound switch
set-sound-off = son : non

# settings sound switch
set-sound-on = son : oui

# pause sheet line: a save from a newer build; $build is the build's name
said-newer = cette sauvegarde vient d'une version plus récente ({ $build })

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = pas de sauvegarde : le stockage de ce site est plein ({ $used } mo utilisés, dont { $ours } ko à nous). copier une sauvegarde marche toujours

# pause sheet line: storage refused a save; $name is the browser's error name
said-unsaved-refused = pas de sauvegarde : le stockage a refusé la sauvegarde ({ $name }). copier une sauvegarde marche toujours

# pause sheet line: storage refused a save, with no error to name
said-unsaved-refused-why = pas de sauvegarde : le stockage a refusé la sauvegarde. copier une sauvegarde marche toujours

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = chargement impossible : { $message }

# controls page input column
ctl-leftclick-in = clic gauche

# controls page action column
ctl-leftclick-do = interagir

# controls page input column
ctl-rightclick-in = clic droit

# controls page action column
ctl-rightclick-do = cibler les ouvriers

# controls page input column
ctl-rightleft-in = clic droit + clic gauche

# controls page action column
ctl-rightleft-do = soulever des ouvriers

# controls page input column
ctl-middle-in = clic molette

# controls page action column
ctl-middle-do = bouger la caméra

# controls page input column
ctl-wheel-in = molette

# controls page action column
ctl-wheel-do = bouger la caméra

# controls page input column
ctl-arrows-in = ← → / a d

# controls page action column
ctl-arrows-do = bouger la caméra

# controls page input column
ctl-digits-in = 1 – 9

# controls page action column
ctl-digits-do = sauter à un endroit

# settings fullscreen row
set-fullscreen-on = plein écran : oui

# settings fullscreen row
set-fullscreen-off = plein écran : non

# a sheet line: the save is on the clipboard; $n is its size in kilobytes
said-copyout-copied = { $n } ko copiés

## Title page

# browser tab title, landing
title-doctitle = Pebble Pit

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = un rocher. un trou. quelques gens entre les deux.

# landing page main button
title-play = jouer

# landing page button (relabelled saves · n of 3)
title-slotsbtn = sauvegardes

# landing page button (relabelled, src/record.js:33)
title-recordbtn = succès

# landing page button
title-settingsbtn = réglages

# landing page, desktop build only
title-quit = quitter le jeu

# landing saves page heading
title-slots-word = sauvegardes

# landing saves page button
title-savecopy = copier une sauvegarde

# landing saves page button
title-loadsave = charger une sauvegarde

# landing paste confirm
title-loadit = charger

# landing paste cancel
title-nevermind = laisse tomber

# landing saves page back
title-slotsback = retour

# landing achievements page heading
title-record-word = succès

# landing achievements page back
title-recordback = retour

# landing settings page heading
title-settings-word = réglages

# landing settings to controls
title-controlsbtn = commandes

# landing settings back
title-settingsback = retour

# landing controls page heading
title-controls-word = commandes

# landing controls back
title-controlsback = retour

# landing cloud conflict page heading
title-conflict-word = choisis un chantier

# landing cloud conflict back
title-conflictback = retour

# landing foot link
title-link-itch = itch

# landing foot link
title-link-github = github

# under play, empty open slot
title-playlabel-new = un nouveau chantier

# landing achievements page, nothing earned
title-record-none = rien pour l'instant

# title foot bar conflict link
cloud-foot-choose = choisis un chantier

# landing reply, bad paste
title-said-notasave = ce n'est pas une sauvegarde

# landing reply after load
title-said-loaded = chargé

# landing reply after deleting open slot
title-said-erased = effacé

## Objectives

# label before story line
obj-next = ensuite

# story line, first step
obj-rock = creuse le rocher pour sauver ta femme !

# intro quest item
obj-rock-q-chip = mine le rocher

# intro quest item
obj-rock-q-pickup = prends un caillou

# intro quest item
obj-rock-q-toss = lance le caillou dans la fosse

# story line after first fall
obj-falling = essaie encore de creuser le rocher !

# story line, wooden roof barrier
obj-props = peut-être qu'un toit en bois arrêtera le prochain rocher ?

# story line, net barrier
obj-net = raté, essaie d'attraper le rocher pour le ralentir

# story line, arch barrier
obj-arch = essayons une arche avec le minerai et la pierre. ça tiendra sûrement.

# story line, wizards' barrier
obj-dome = plus d'idées, voyons si les sorciers peuvent aider.

# story line before rescue
obj-rescue = sauve ta femme

# story line, second half
obj-drown = noie la fosse

# story line after snatch
obj-tower = construis la tour des sorciers

# story line after snatch
obj-talk = parle aux sorciers de ce qui vient de se passer

# story line, deep half
obj-portal = invoque un portail vers l'abîme, qu'y a-t-il en bas ?

# story line, final step
obj-free = libère ton mari du ventre du serpent

# objective card cancel while building
obj-barrier-cancel = annuler ×{ $n }

## Other

# browser tab title, game page
play-doctitle = Pebble Pit

# skip hint during cutscene, desktop (skiphint.js:27)
other-skip-desk = maintiens espace pour passer

# top-edge mess tag
other-messtag-muck = boue

# top-edge mess tag
other-messtag-poop = caca

# floating button over bench site
other-raise = construire l'établi

# phone pause button label
other-pause =
    .aria-label = pause

title-recordbtn-label = succès · { $count } sur { $total }

# corner fullscreen button tooltip
other-fullscreen-title-on = quitter le plein écran

# corner fullscreen button tooltip
other-fullscreen-title-off = plein écran

# crew-fade corner button label
other-corner-show = montrer les ouvriers

# crew-fade corner button label
other-corner-fade = estomper les ouvriers

# crew-fade corner button label
other-corner-hide = cacher les ouvriers

# way corner button tip
other-corner-up = remonter au chantier

# way corner button tip
other-corner-down = descendre aux profondeurs

# queue card line hover
other-queue-site-yard = le chantier

# queue card line hover
other-queue-site-sphere = la sphère

# queue card, nobody working
other-queue-queued = en attente

# board footer toggle
other-hidedone-show = montrer les finis

# board footer toggle
other-hidedone-hide = cacher les finis

# the queue card: the first in line to be built after the one going up
queue-place-next = ensuite

# the house's board and the crew window, with no crew yet
crew-empty = personne n'habite ici

# a station's name: its board's title, the pointer's label, the queue card
station-bench = l'établi

# skip hint during cutscene, phone
other-skip-touch = maintiens pour passer

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = maintiens <span data-l10n-name="key"></span> pour passer

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee, idle (drawn in the sign's own pixel capitals)
casino-sign = CASINO

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

## Notices

# toast-shaped card, another device ahead
note-cloud-name = plus récente sur un autre appareil

# toast-shaped card, another device ahead
note-cloud-note = réponse dans sauvegardes

## Numbers

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } h { $m } min

# how long a yard has been played, under an hour
played-m = { $m } min

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }{ $n ->
        [one] er
       *[other] e
    }

## Achievements

# toast and achievements card name
ach-firstgrain-name = faire du blé

# toast and achievements card note
ach-firstgrain-note = lance un caillou dans la fosse

# achievement name
ach-firstrock-name = mieux vaut creuser encore

# achievement note
ach-firstrock-note = dégage le premier rocher

# achievement name
ach-gotout-name = tu as sauvé ta femme

# achievement note
ach-gotout-note = plus de rochers, tu as réussi.

# achievement name
ach-firsthire-name = tu as construit des pylônes supplémentaires

# achievement note
ach-firsthire-note = construis une autre maison

# achievement name
ach-firstshard-name = le premier minerai

# achievement note
ach-firstshard-note = remonte du minerai de la carrière

# achievement name
ach-firstspore-name = culture

# achievement note
ach-firstspore-note = fais pousser ta première récolte

# achievement name
ach-firstspark-name = de la magie dans l'air

# achievement note
ach-firstspark-note = gagne ta première étincelle

# achievement name
ach-holefull-name = la fosse est pleine

# achievement note
ach-holefull-note = remplis la fosse à ras bord

# achievement name
ach-rifttorn-name = la faille est ouverte, le stockage est réglé

# achievement note
ach-rifttorn-note = remplis la fosse jusqu'à ouvrir une faille interdimensionnelle

# achievement name
ach-drowned-name = la faille s'est agrandie

# achievement note
ach-drowned-note = tout un océan de stockage interdimensionnel.

# achievement name
ach-star-name = invoque une étoile

# achievement note
ach-star-note = fais descendre une étoile depuis la tour

# achievement name
ach-firsthat-name = t'es un sorcier, carré

# achievement note
ach-firsthat-note = termine un chapeau de sorcier à la tour

# achievement name
ach-firstbrew-name = bonjour, marchand de potions

# achievement note
ach-firstbrew-note = brasse une fournée à l'apothicaire

# achievement name
ach-firsttrade-name = premier chapeau

# achievement note
ach-firsttrade-note = achète à une station son premier chapeau

# achievement name
ach-alltrades-name = éduquer les masses

# achievement note
ach-alltrades-note = donne à chaque station son chapeau

# achievement name
ach-allbuilt-name = construction terminée

# achievement note
ach-allbuilt-note = tu as tout construit

# achievement name
ach-rift1e6-name = 1m par la faille

# achievement note
ach-rift1e6-note = envoie 1m de cailloux par la faille

# achievement name
ach-brew100-name = 100 fournées

# achievement note
ach-brew100-note = brasse 100 fournées

# achievement name
ach-lived1h-name = une heure d'affilée

# achievement note
ach-lived1h-note = garde un ouvrier sur la paie pendant une heure

# achievement name
ach-nobodyhired-name = zéro embauche

# achievement note
ach-nobodyhired-note = dégage tout un rocher sans personne sur la paie

# achievement name
ach-ownhand-name = à la force du poignet

# achievement note
ach-ownhand-note = dégage un rocher sans qu'un seul ouvrier y touche

# achievement name
ach-nevertouched-name = jamais touché

# achievement note
ach-nevertouched-note = dégage un rocher sans le frapper une seule fois toi-même

# achievement name
ach-underminute-name = un rocher en moins d'une minute

# achievement note
ach-underminute-note = dégage un rocher en moins d'une minute

# achievement name
ach-everyjob-name = tous les postes pourvus

# achievement note
ach-everyjob-note = mets au moins un ouvrier à chaque poste en même temps

# achievement name
ach-tablebeaten-name = on est trop de retour

# achievement note
ach-tablebeaten-note = ressors avec 50k de plus sur une seule main au casino

# achievement name
ach-tableruin-name = l'heure de prendre un crédit

# achievement note
ach-tableruin-note = ressors avec 50k de moins sur une seule main au casino

# achievement name
ach-bird-name = dégage de mon terrain

# achievement note
ach-bird-note = fais peur à un oiseau

# achievement name
ach-wholelot-name = pas un seul d'entre vous

# achievement note
ach-wholelot-note = fais peur à tous les oiseaux d'un même vol

# achievement name
ach-catchall-name = jongleur

# achievement note
ach-catchall-note = lance une pleine poignée de poussière, au plus gros, et rattrape chaque grain

# achievement name
ach-lifted-name = viens par ici, toi

# achievement note
ach-lifted-note = soulève un ouvrier

# achievement name
ach-shookload-name = vide tes poches

# achievement note
ach-shookload-note = secoue un ouvrier jusqu'à vider sa charge

# achievement name
ach-hatoff-name = chapeau bas

# achievement note
ach-hatoff-note = fais tomber le chapeau d'un ouvrier en le secouant

# achievement name
ach-dizzy-name = syndrome du bébé secoué

# achievement note
ach-dizzy-note = secoue un ouvrier jusqu'à l'étourdir

# achievement name
ach-muckrain-name = un malheur n'arrive jamais seul

# achievement note
ach-muckrain-note = tiens bon sous une pluie de boue

# achievement name: rocks cleared; $n is the count as written (10, 25, 50, 100)
ach-rocks-name = { $n } rochers

# achievement note: rocks cleared; $n is the count
ach-rocks-note = dégage { $n } rochers

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = dégage { $n } rochers, ça fait beaucoup de cailloux

# achievement name: pebbles banked; $n is the count, short (10k, 1m)
ach-pebbles-name = { $n } cailloux

# achievement note: pebbles banked; $n is the count, short
ach-pebbles-note = engrange { $n } cailloux

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } carrés

# achievement note: crew hired; $n is the count
ach-crew-note = embauche une équipe de { $n }

# achievement name: the first ore ladder rung
ach-ore0-name = 1k de minerai tiré de la carrière

# achievement name: the second ore ladder rung
ach-ore1-name = 10k de minerai

# achievement note: ore dug; $n is the count, short (1k, 10k)
ach-ore-note = extrais { $n } de minerai de la carrière

## Index

# index entry name
idx-dust-name = cailloux

# index entry text
idx-dust-text = taillés dans le rocher.

# index entry name
idx-shard-name = minerai

# index entry text
idx-shard-text = extrait de la carrière.

# index entry name
idx-spore-name = récoltes

# index entry text
idx-spore-text = poussées à la ferme.

# index entry name
idx-spark-name = étincelles

# index entry text
idx-spark-text = arrachées à l'étoile à coups d'éclairs par les sorciers.

# index entry name
idx-scale-name = écailles

# index entry text
idx-scale-text = broyées à partir de ce que lâche le serpent.

# index entry name
idx-crit-name = critiques

# index entry text
idx-crit-text = a une chance de faire plus de dégâts.

# index entry name
idx-rock-name = le rocher

# index entry text
idx-rock-text = a écrasé ta femme, on le mine pour ses précieux cailloux.

# index entry name
idx-pit-name = la fosse

# index entry text
idx-pit-text = jette tes cailloux, et tout le reste, là-dedans pour les stocker.

# index entry name
idx-rift-name = la faille

# index entry text
idx-rift-text = une concentration massive de cailloux a ouvert une faille dans la réalité ?

# index entry name
idx-abyss-name = l'abîme

# index entry text
idx-abyss-text = la faille a avalé trop de cailloux pour rester stable, et a englouti toute la fosse.

# index entry name
idx-muck-name = boue

# index entry text
idx-muck-text = la pollution corrompt l'écosystème et la pluie laisse derrière elle des tas de crasse.

# index entry name
idx-poop-name = caca

# index entry text
idx-poop-text = beurk.

# index entry name
idx-bird-name = oiseaux

# index entry text
idx-bird-text = des oiseaux normaux.

# index entry name
idx-house-name = la maison

# index entry text
idx-house-text = là où vivent les ouvriers.

# index entry name
idx-pollution-name = pollution

# index entry text
idx-pollution-text = le prix de l'industrie. miner, cultiver, extraire, ensorceler, tout ça crée une pollution qui salit l'air.

# index entry name
idx-star-name = l'étoile

# index entry text
idx-star-text = une vraie étoile créée par la magie des sorciers, foudroyée pour ses étincelles.

# index entry name
idx-balloon-name = ballon

# index entry text
idx-balloon-text = équipé d'un filtre à air qui nettoie la pollution des nuages.

# index entry name
idx-recycler-name = le recycleur

# index entry text
idx-recycler-text = concentre la pollution de l'air en cailloux utilisables.

# index entry name
idx-bench-name = l'établi

# index entry text
idx-bench-text = en gros, le bazar du coin. améliorations des porteurs, améliorations à la main, nouveaux bâtiments.

# index entry name
idx-shack-name = la cabane

# index entry text
idx-shack-text = boutique d'améliorations pour les mineurs.

# index entry name
idx-stats-name = les comptes

# index entry text
idx-stats-text = plein de stats sur ta partie : revenus, temps de jeu.

# index entry name
idx-farm-name = la ferme

# index entry text
idx-farm-text = des parcelles où poussent les récoltes.

# index entry name
idx-quarry-name = la carrière

# index entry text
idx-quarry-text = creuse profond pour trouver du minerai.

# index entry name
idx-apothecary-name = l'apothicaire

# index entry text
idx-apothecary-text = là où on prépare les breuvages.

# index entry name
idx-tower-name = la tour

# index entry text
idx-tower-text = la maison des sorciers.

# index entry name
idx-casino-name = le casino

# index entry text
idx-casino-text = un casino à planche à clous.

# index entry name
idx-outhouse-name = le placard à balais

# index entry text
idx-outhouse-text = la maison des concierges.

# index entry name
idx-filter-name = le filtre à air

# index entry text
idx-filter-text = retire la pollution du ciel.

# index entry name
idx-ram-name = le bélier

# index entry text
idx-ram-text = découpe vite les rochers.

# index entry name
idx-jaw-name = la foreuse

# index entry text
idx-jaw-text = foreuse mécanique pour creuser vite.

# index entry name
idx-tiller-name = le motoculteur

# index entry text
idx-tiller-text = les tracteurs expédient les récoltes en un rien de temps.

# index entry name
idx-belt-name = le tapis

# index entry text
idx-belt-text = déverse tout seul les cailloux dans la fosse.

# index entry name
idx-sphere-name = la sphère

# index entry text
idx-sphere-text = une sphère de dyson pour récolter l'énergie de l'étoile.

# index entry name
idx-roomba-name = robots aspirateurs

# index entry text
idx-roomba-text = des aspirateurs automatiques pour nettoyer les saletés.

# index entry name
idx-driver-name = chariot élévateur

# index entry text
idx-driver-text = un chariot élévateur automatique pour transporter très vite des chargements.

# index entry name
idx-props-name = barrière en bois

# index entry text
idx-props-text = la tentative désespérée de retenir le rocher.

# index entry name
idx-net-name = le filet

# index entry text
idx-net-text = tresse des récoltes en un filet pour attraper et freiner le rocher.

# index entry name
idx-arch-name = l'arche

# index entry text
idx-arch-text = une solide arche de pierre et de métal pour tenter de retenir le rocher.

# index entry name
idx-dome-name = la barrière

# index entry text
idx-dome-text = une barrière d'énergie invoquée par les sorciers.

# index entry name
idx-deep-name = l'abîme

# index entry text
idx-deep-text = pas tout à fait l'espace, pas tout à fait l'océan, quelque chose entre les deux.

# index entry name
idx-portal-name = le portail

# index entry text
idx-portal-text = seul moyen d'entrer dans l'abîme et d'en sortir.

# index entry name
idx-crusher-name = le broyeur

# index entry text
idx-crusher-text = là où sont gardées les écailles des profondeurs.

# index entry name
idx-pods-name = les capsules

# index entry text
idx-pods-text = des capsules pour les ouvriers de l'abîme.

# index entry text
idx-haul-text = portent les cailloux jusqu'à la fosse.

# index entry name
idx-rockcrew-name = casseurs

# index entry text
idx-rockcrew-text = frappent le rocher.

# index entry name
idx-quarrycrew-name = mineurs

# index entry text
idx-quarrycrew-text = extraient le minerai de la carrière.

# index entry name
idx-farmcrew-name = fermiers

# index entry text
idx-farmcrew-text = cultivent les récoltes.

# index entry name
idx-purify-name = purificateurs

# index entry text
idx-purify-text = pilotent les ballons purificateurs pour nettoyer le ciel.

# index entry name
idx-stir-name = apothicaires

# index entry text
idx-stir-text = s'occupe d'une fournée de breuvages.

# index entry text
idx-janitor-text = nettoient le caca et la boue.

# index entry text
idx-wizard-text = des mages savants capables d'arracher des morceaux d'une étoile.

# index entry text
idx-build-text = montent les bâtiments et les machines.

# index entry name
idx-breaker-name = briseur

# index entry text
idx-breaker-text = bien plus efficace pour creuser le rocher.

# index entry name
idx-carter-name = charretier

# index entry text
idx-carter-text = les porteurs peuvent tirer une charrette pour doubler leur charge.

# index entry name
idx-blaster-name = artificier

# index entry text
idx-blaster-text = équipé de petits explosifs pour vraiment arracher le minerai.

# index entry name
idx-grower-name = jardinier

# index entry text
idx-grower-text = peut soigner les récoltes deux fois plus.

# index entry name
idx-brews-name = breuvages

# index entry text
idx-brews-text = des breuvages spéciaux de l'apothicaire.

# index entry text
idx-party-text = un groupe d'aventuriers courageux prêts à risquer leur vie pour vaincre le serpent.

# index entry name
idx-sqwife-name = ta femme

# index entry text
idx-sqwife-text = elle vivait sa vie, jusqu'à l'incident (ou aux incidents), coincée sous des rochers qui tombent du ciel sans fin. dingue.

# index entry name
idx-notices-name = succès

# index entry text
idx-notices-text = les grandes étapes du chantier.

# index entry name
idx-serpent-name = le serpent

# index entry text
idx-serpent-text = une sorte de bizarre créature serpentine des abysses qui habite l'abîme.

## Jobs

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = casseurs

# a job, as the boards, the crew and the index say it (the save's key is haulers)
job-haulers = porteurs

# a job, as the boards, the crew and the index say it (the save's key is quarriers)
job-quarriers = mineurs

# a job, as the boards, the crew and the index say it (the save's key is farmhands)
job-farmhands = fermiers

# a job, as the boards, the crew and the index say it (the save's key is scholars)
job-scholars = érudits

# a job, as the boards, the crew and the index say it (the save's key is purifiers)
job-purifiers = purificateurs

# a job, as the boards, the crew and the index say it (the save's key is stirrers)
job-stirrers = apothicaires

# a job, as the boards, the crew and the index say it (the save's key is janitors)
job-janitors = concierges

# a job, as the boards, the crew and the index say it (the save's key is wizards)
job-wizards = sorciers

# a job, as the boards, the crew and the index say it (the save's key is builders)
job-builders = bâtisseurs

# a job, as the boards, the crew and the index say it (the save's key is fighters)
job-fighters = combattants

# a job, as the boards, the crew and the index say it (the save's key is gatherers)
job-gatherers = cueilleurs

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = bâtisseurs du fond

## Boards

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit: so many a minute; $icon is the coin's mark (html)
unit-per-min = { $icon }/min

# a row's unit: so many a dig; $icon is the coin's mark (html)
unit-per-dig = { $icon }/fouille

# a row's unit: so many a harvest; $icon is the coin's mark (html)
unit-per-harvest = { $icon }/récolte

# a row's unit after its number: swings a second
unit-hits-s = coups/s

# a row's unit after its number: swings a second, from one
unit-hit-s = coup/s

# a row's unit after its number: throws a second
unit-throws-s = lancers/s

# a row's unit after its number: a wizard's bolts a minute
unit-bolts-min = éclairs/min

# a row's unit after its number: star cells a bolt knocks off
unit-cells-bolt = cellules/éclair

# a row's unit after its number: haze a balloon takes in a second
unit-motes-s = particules/s

# a row's unit after its number: farm plots
unit-plots = parcelles

# a row's unit after its number: the quarry's shovels
unit-shovels = pelles

# a row's unit after its number: the apothecary's pots
unit-pots = marmites

# a row's unit after its number: doses a batch
unit-doses = doses

# a unit after a number: seconds
unit-s = s

# a deep row's unit after its number: damage
unit-dmg = dég

# a deep row's unit after its number: damage a second
unit-dmg-s = dég/s

# a brew's unit after its percentage: how much faster
unit-faster = plus vite

# a brew's unit after its percentage: how much stronger
unit-stronger = plus fort

# a brew's unit after its number: crit chance
unit-crit = crit

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower = { $more ->
        [yes] { $left ->
            [one] achète encore { $left } jardinier pour débloquer
           *[other] achète encore { $left } jardiniers pour débloquer
        }
       *[no] { $left ->
            [one] achète { $left } jardinier pour débloquer
           *[other] achète { $left } jardiniers pour débloquer
        }
    }

# a machine's row until its station's set of blaster hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-blaster = { $more ->
        [yes] { $left ->
            [one] achète encore { $left } artificier pour débloquer
           *[other] achète encore { $left } artificiers pour débloquer
        }
       *[no] { $left ->
            [one] achète { $left } artificier pour débloquer
           *[other] achète { $left } artificiers pour débloquer
        }
    }

# a price in time, a minute or more: $n minutes
price-min = { $n } min

# a row's verb, before its gain: how much a hand holds
does-hold = tenir

# the bench: your carry ladder
row-carry = charge portée

# a row's verb, before its gain: swings
does-hit = frapper

# the bench: your swing pace ladder
row-speed = frappe auto

# a row's verb, before its gain: throws
does-throw = lancer

# the bench: how often a held hand lets go
row-toss = cadence de lancer

# a row's verb, before its gain: how far a throw carries
does-reach = portée

# the bench: how far a handful carries
row-reach = portée de lancer

# a row's verb, before its gain: what a swing takes
does-per-swing = par coup

# the bench: what a swing of yours takes
row-pick = dégâts de pioche

# the bench: holding a handful throws it by itself
row-autotoss = maintenir pour lancer

# the bench: holding the pointer on the boulder swings by itself
row-auto = maintenir pour miner

# a row's verb, before its gain: how much a body carries
does-carry = porter

# the bench: the haulers' load ladder
row-haulcarry = charge des porteurs

# a row's verb, before its gain: walking pace
does-walk = marcher

# the bench: the haulers' pace ladder
row-haulpace = vitesse des porteurs

# a row's verb, before its gain: crits
does-crit = crit

# the bench: the chance a hit is a crit
row-critchance = chance de crit

# the bench: how much more a crit takes
row-critmult = dégâts crit

# the shack: the diggers' swing pace ladder
row-rockhandspeed = vitesse de frappe

# the shack: what a digger's swing takes
row-rockhandpick = pioche des casseurs

# the bench: the row that puts up the apothecary
row-unlockapothecary = construire l'apothicaire

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = brasse des boosts temporaires pour tes carrouvriers

# the bench: what the apothecary row gives, where a gain would go
row-unlockapothecary-blurb = des toniques

# the bench: the row that puts up the casino
row-unlockcasino = construire le casino

# the bench: what the casino is for, under its name
row-unlockcasino-note = une table qui prend une mise et paie double ou rien

# the bench: what the casino row gives, where a gain would go
row-unlockcasino-blurb = quitte ou double

# the bench: the row that puts up the farm
row-unlockfarm = construire la ferme

# the bench: what the farm is for, under its name
row-unlockfarm-note = cultive un peu

# the bench: what the farm row gives, where a gain would go
row-unlockfarm-blurb = cultiver

# the bench: the row that puts up the air filter
row-unlockfilter = construire le filtre à air

# the bench: what the air filter is for, under its name
row-unlockfilter-note = vend les ballons qui retirent la brume du ciel, et lit le ciel

# the bench: what the air filter row gives, where a gain would go
row-unlockfilter-blurb = dégage le ciel

# the bench: the row that puts up the janitor's closet
row-unlockouthouse = construire le placard à balais

# the bench: what the closet is for, under its name
row-unlockouthouse-note = t'as vu assez de caca, on nettoie

# the bench: what the closet row gives, where a gain would go
row-unlockouthouse-blurb = caca, nettoyé

# the bench: the row that puts up the quarry
row-unlockquarry = construire la carrière

# the bench: what the quarry is for, under its name
row-unlockquarry-note = commence à creuser pour du minerai

# the bench: what the quarry row gives, where a gain would go
row-unlockquarry-blurb = du minerai

# the bench: the row that puts up the shack
row-unlockshack = construire la cabane

# the bench: what the shack is for, under its name
row-unlockshack-note = Améliorations pour creuser

# the bench: what the shack row gives, where a gain would go
row-unlockshack-blurb = matos du rocher

# the bench: the row that puts up the tower
row-unlocktower = découvrir la tour

# the bench: what the tower is for, under its name
row-unlocktower-note = invoque quelques sorciers

# the bench: the first barrier against the boulder
row-props = barrière en bois

# the bench: the wooden barrier's line
row-props-note = construis vite une barrière pour sauver ta femme

# the bench: the second barrier
row-net = le filet

# the bench: the net's line
row-net-note = ça n'a pas marché, essayer d'attraper le rocher avec un filet ?

# the bench: the third barrier
row-arch = tailler l'arche

# the bench: the arch's line
row-arch-note = toujours pas assez solide. construisons une arche en pierre.

# the tower: the last barrier, the wizards'
row-dome = les sorciers sauraient peut-être ?

# the tower: the last barrier's line
row-dome-note = tout ce qui vient du sol a échoué. ce qui reste ne vient pas du sol

# a hat's name: the diggers' (its row, the index, the crew)
kit-breaker = briseur

# what the breaker hat does
kit-breaker-does = deux fois le mordant

# where the breaker hat is worn
kit-breaker-place = le rocher

# a hat's name: the haulers' cart
kit-carter = charretier

# what the cart does
kit-carter-does = deux fois la charge

# where the cart is used
kit-carter-place = la fosse

# a hat's name: the miners'
kit-blaster = artificier

# what the blaster hat does
kit-blaster-does = deux fois plus de trajets

# where the blaster hat is worn
kit-blaster-place = la carrière

# a hat's name: the farmers'
kit-grower = jardinier

# what the grower hat does
kit-grower-does = deux fois plus de soins

# where the grower hat is worn
kit-grower-place = la ferme

# the bench: a forklift that drives itself
row-driver = chariot élévateur

# the bench: the forklift's line
row-driver-note = un chariot élévateur qui roule seul : il va à la fosse sans personne à bord, et il fume

# the bench: the forklifts' load ladder
row-liftload = charge du chariot

# a row's verb, before its gain: driving pace
does-drive = rouler

# the bench: the forklifts' pace ladder
row-liftpace = vitesse du chariot

# a heading on the bench's board: your own ladders
sect-you = toi

# a heading on the bench's board: the crit ladders
sect-luck = coups de chance

# a heading on the bench's board: the haulers' gear
sect-haulers = les porteurs

# a heading on the bench's board: the rows that put up a new place
sect-build = construire

# the house's board: buy another house to hire somebody
row-house = une autre maison

# the ribbon on every goal card: the barrier the story is on
goal-title = sauver ta femme

# a card greyed out: its next rung costs crops, and there is no farm yet
needs-spore = faut des récoltes

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = faut une carrière

# a card greyed out: its next rung costs a spark, and none has been earned
needs-spark = faut une étincelle

# a card greyed out: its next rung costs a scale, and the deep is not open
needs-scale = faut une écaille

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
# (fr: "à $place" would contract with the article the place name carries, à le/à la, so the place stands after a comma)
kit-note = { $name } : { $does }, { $place }

# the shack: the ram's tuning ladder
row-tuneram = frappe du bélier

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = le bélier frappe { $n }x plus fort

# a heading on any board over the rows no section names
sect-and = et

# a card the yard is at: somebody is building it (the strip's word with nothing to hand back; the gain line's word)
card-building = en chantier

# the strip at a card's foot: buy another copy behind the one being built
card-another = + un autre

# a card in line: nobody is at it yet
card-queued = en attente

# a finished ladder, where its price would go
card-done = fini

# the tower: an enchantment's name
spell-drive = accélérer les machines

# the tower: the enchantment's line
spell-drive-note = chaque machine du chantier tourne 50 % plus vite

# the tower: an enchantment's name
spell-luck = enrichir la carrière

# the tower: the enchantment's line
spell-luck-note = chaque fouille dans la carrière remonte 25 % de minerai en plus

# the tower: an enchantment's name
spell-gmo = modifier génétiquement les récoltes

# the tower: the enchantment's line
spell-gmo-note = chaque récolte est 25 % plus grosse

# the tower: an enchantment's name
spell-thrift = brader les maisons

# the tower: the enchantment's line
spell-thrift-note = chaque maison désormais 75 % moins chère

# the tower: an enchantment's name
spell-sweep = presser les concierges

# the tower: the enchantment's line
spell-sweep-note = les concierges pellettent et marchent deux fois plus vite

# the tower: how often a wizard throws
row-wizspeed = sorts plus rapides

# the tower: how often a wizard throws, its line; $pct is the rise a rung
row-wizspeed-note = chaque sorcier lance un éclair sur l'étoile { $pct } % plus souvent

# a row's verb, before its gain: a wizard's casting
does-cast = lancer

# the tower: how much of the star a bolt takes
row-wizpower = éclairs plus lourds

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = chaque éclair arrache { $next } cellules à l'étoile au lieu de { $now }

# the tower: a wizard's hat
row-wizard = invoquer un sorcier

# the tower: a wizard's line
row-wizard-note = s'envole et brise l'étoile à coups d'éclairs pour des étincelles, et en appelle une autre quand le ciel est vide

# the tower: the sphere's line
row-sphere-note = capture l'énergie d'une étoile

# the tower: the sphere's tuning ladder
row-tunesphere = rendement de la sphère

# the tower: the sphere's tuning ladder, its line; $n is how many times the light
row-tunesphere-note = la sphère capte { $n }x plus de lumière

# the tower: the barrier the wizards pour
row-dome-tower = invoquer la barrière

# the tower: the barrier's line
row-dome-tower-note = rien ne peut passer ce truc.

# the tower: the way down to the deep
row-portal = invoquer le portail

# the tower: the portal's line
row-portal-note = un passage vers l'abîme, tenu ouvert.

# a heading on the tower's board: the spells
sect-enchantments = enchantements

# a heading on the tower's board: the portal
sect-abyss = l'abîme

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign (50%)
spell-drive-blurb = +{ $pct } vitesse

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-luck-blurb = +{ $pct } minerai

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-gmo-blurb = +{ $pct } récoltes

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-thrift-blurb = { $pct } moins cher

# the tower: what the enchantment gives, where a gain would go; $x is how many times
spell-sweep-blurb = { $x }x plus vite

# the farm: what a harvest is worth, a ladder
row-crop = rendement

# a row's verb, before its gain: tending plots
does-tend = soigner

# the farm: how often a plot is tended, a ladder
row-tend = vitesse agricole

# the farm: break another plot
row-farmplot = une autre parcelle

# the farm: the tiller's tuning ladder
row-tunetiller = cadence du motoculteur

# the farm: the tiller's tuning ladder, its line; $n is how many times faster
row-tunetiller-note = le motoculteur travaille { $n }x plus vite

# a heading on the farm's board: what a plot pays
sect-crop = la récolte

# the quarry: what a dig turns up, a ladder
row-seam = rendement du minerai

# a row's verb, before its gain: digging
does-dig = creuser

# the quarry: how often a dig happens, a ladder
row-quarrypace = vitesse d'extraction

# the quarry: another miner's shovel at the face
row-quarrybench = une autre pelle

# the quarry: the drill's tuning ladder
row-tunejaw = mordant de la foreuse

# the quarry: the drill's tuning ladder, its line; $n is how many times harder
row-tunejaw-note = la foreuse mord { $n }x plus fort

# a heading on the quarry's board: what the hole pays
sect-ore = le minerai

# a heading on the farm's board over who works the plots, with their headcount (the job's save key, as it has always read)
sect-farmhands = fermiers

# a heading on the quarry's board over who works the cut, with their headcount (the job's save key, as it has always read)
sect-quarriers = carriers

# a row's verb, before its gain: a balloon's flight
does-fly = voler

# the air filter: how fast the balloons go from cloud to cloud
row-balloonspeed = vitesse des ballons

# a row's verb, before its gain: what a balloon takes in
does-filter = filtrer

# the air filter: how much haze a balloon draws
row-power = puissance des ballons

# the air filter: another balloon
row-balloon = le ballon

# the air filter: the balloon's line
row-balloon-note = chevauche les nuages et laisse tomber sous lui ce qu'il attrape

# the air filter: the recycler
row-recycler = le recycleur

# the air filter: the recycler's line
row-recycler-note = ce que les ballons attrapent retombe en cailloux au lieu de boue

# a heading on the air filter's board
sect-equipment = équipement

# the janitor's closet: the second cap on the stand
row-loopost = une autre casquette

# the janitor's closet: another roomba
row-roomba = un roomba

# the janitor's closet: the roomba's line
row-roomba-note = roule jusqu'au bazar dans le chantier et le ramène ; un concierge les surveille, et ils fument

# the janitor's closet: the roombas' tuning ladder
row-tuneroomba = aspiration des roombas

# the janitor's closet: the roombas' tuning ladder, its line; $n is how many times faster
row-tuneroomba-note = les roombas aspirent { $n }x plus vite

# a brew's name: the speed one, priced in crops
tonic-stew = ragoût copieux

# a brew's name: the strength one, priced in ore
tonic-strong = breuvage costaud

# a brew's name: the crit one, priced in sparks
tonic-brace = tonique vivifiant

# the apothecary: keep the fires going, or let them die once a batch is dealt (a setting)
row-potkeep = continuer à brasser

# the apothecary's keep-brewing setting: on
row-potkeep-on = fournée après fournée

# the apothecary's keep-brewing setting: off
row-potkeep-off = juste celle-ci

# the apothecary: room for one more pot and its stirrer
row-anotherpot = une autre marmite

# a row's verb, before its gain: how long a dose lasts
does-lasts = dure

# the apothecary: how long a dose lasts, a ladder
row-bufflength = concentration

# the apothecary: doses a batch, a ladder
row-brewdoses = taille des fournées

# a heading on the apothecary's board over the pots, with the stirrers' headcount
sect-pot = la marmite

# a heading on the apothecary's board
sect-brewing = brassage

# a heading on the apothecary's board: one ladder a brew
sect-potency = puissance

# a brew's potency row's verb, before its gain
does-faster = plus vite

# a brew's potency row's verb, before its gain
does-stronger = plus fort

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v } % { $unit }, { $secs } s

# what the crit brew does: $v points of crit chance for $secs seconds
tonic-gain-crit = +{ $v } crit, { $secs } s

# the shack's heading over the diggers' gear, with their headcount
sect-diggers = casseurs

## Machines

# a machine's name: the quarry's (the save's key is jaw)
machine-jaw = la foreuse

# a machine's name: the boulder's
machine-ram = le bélier

# a machine's name: the farm's
machine-tiller = le motoculteur

# a machine's name: carries pebbles from the boulder to the hole
machine-belt = le tapis

# a machine's name: the shell round the star
machine-sphere = la sphère

# a machine's name: the janitor's closet's
machine-roomba = les roombas

## Stations

# a deep station's board with nothing on it yet
station-party-empty = encore rien à apprendre

# a station's name: its board's title, the pointer's label, the queue card
station-casino = le casino

# a station's name
station-filter = le filtre à air

# the air filter's board with nothing on it
station-filter-empty = rien à installer

# a station's name
station-quarry = la carrière

# the quarry's board with nothing on it
station-quarry-empty = la carrière est aussi profonde que possible

# a station's name
station-farm = la ferme

# the farm's board with nothing on it
station-farm-empty = tout le sol est retourné

# a station's name
station-apothecary = l'apothicaire

# the apothecary's board with nothing on it
station-apothecary-empty = la marmite est froide

# a station's name
station-tower = la tour

# the tower's board with nothing on it
station-tower-empty = rien ne bouge ici pour l'instant

# a station's name
station-shack = la cabane

# the shack's board with nothing on it
station-shack-empty = les outils sont tous au rocher

# the bench's board with nothing on it
station-bench-empty = rien à vendre

# a station's name
station-outhouse = le placard à balais

# the janitor's closet's board with nothing on it
station-outhouse-empty = les balais sont tous à leurs crochets

# a station's name
station-house = la maison

# a station's name: the noticeboard over the pit
station-stats = les comptes

# the books with nothing on them
station-stats-empty = rien n'est encore rentré

# a station's name: the deep's purse
station-crusher = le broyeur

# the crusher's pile-full mark, on a hover
station-crusher-full = le sol est plein d'écailles

# a station's name: the deep's houses
station-pods = les capsules

# the pods' board with nothing on it
station-pods-empty = rien à construire

# the lab's board title, still in the page's markup (the lab itself is gone)
station-lab = le labo

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
# (fr: no article and no ordinal word, since both would have to agree with the fighter's name, le/la/l', and
# a name put in cannot carry its gender: the count follows the name instead, as n° 2)
station-party = { $nth ->
        [0] { $who }
        [1] { $who } n° 2
        [2] { $who } n° 3
        [3] { $who } n° 4
       *[other] { $who } n° undefined
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot = { $nth ->
        [0] une station
        [1] une deuxième station
        [2] une troisième station
        [3] une quatrième station
       *[other] une undefined station
    }

## Crew

# the crew window: where a body is, standing at its station (rockhands)
crew-at-rockhands = sur le rocher

# the crew window: where a body is, standing at its station (haulers)
crew-at-haulers = à la fosse

# the crew window: where a body is, standing at its station (quarriers)
crew-at-quarriers = dans la carrière

# the crew window: where a body is, standing at its station (farmhands)
crew-at-farmhands = aux parcelles

# the crew window: where a body is, standing at its station (purifiers)
crew-at-purifiers = au filtre à air

# the crew window: where a body is, standing at its station (janitors)
crew-at-janitors = fait le ménage

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = dans ta main

# the crew window and a body's card: where a body is (falling)
crew-where-falling = en l'air

# the crew window and a body's card: where a body is (home)
crew-where-home = à la maison

# the crew window and a body's card: where a body is (basket)
crew-where-basket = là-haut en ballon

# the crew window and a body's card: where a body is (yard)
crew-where-yard = dans le chantier

# the crew window and a body's card: where a body is (resting)
crew-where-resting = en pause

# the crew window and a body's card: where a body is (walking)
crew-where-walking = en chemin

# the crew window and a body's card: where a body is (deep)
crew-where-deep = au fond

# a body's card, doing: at its job with no step to name (rockhands)
crew-does-rockhands = creuse le rocher

# a body's card, doing: at its job with no step to name (quarriers)
crew-does-quarriers = mine la carrière

# a body's card, doing: at its job with no step to name (farmhands)
crew-does-farmhands = cultive

# a body's card, doing: at its job with no step to name (scholars)
crew-does-scholars = étudie

# a body's card, doing: at its job with no step to name (purifiers)
crew-does-purifiers = nettoie l'air

# a body's card, doing: at its job with no step to name (janitors)
crew-does-janitors = pellette

# a body's card, doing: at its job with no step to name (haulers)
crew-does-haulers = transporte

# a body's card, doing: what its step is (seek)
crew-now-seek = cherche des cailloux

# a body's card, doing: what its step is (dump)
crew-now-dump = vide un chargement

# a body's card, doing: what its step is (muck)
crew-now-muck = pellette la saleté

# a body's card, doing: what its step is (cut)
crew-now-cut = creuse dans la carrière

# a body's card, doing: what its step is (up)
crew-now-up = remonte

# a body's card, doing: what its step is (down)
crew-now-down = descend

# a body's card, doing: what its step is (tend)
crew-now-tend = soigne une parcelle

# a body's card, doing: what its step is (home)
crew-now-home = rentre

# a body's card, doing: what its step is (idle)
crew-now-idle = pas grand-chose

# a body's card, doing: what its step is (in)
crew-now-in = dedans

# a body's card, doing: what its step is (aloft)
crew-now-aloft = là-haut en ballon

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = surveille { $name }

# a body's card, doing: what its step is (to)
crew-now-to = y va

# a body's card, doing: what its step is (kit)
crew-now-kit = s'équipe à l'établi

# a body's card, doing: what its step is (build)
crew-now-build = construit

# a body's card, doing: what its step is (working)
crew-now-working = travaille

# a body with no name, on its card and in the crew window
crew-somebody = quelqu'un

# a body's card: the label before how long it has been here (a column of ten in monospace)
crew-card-age = âge

# a body's card, age: under a minute
crew-card-new = aujourd'hui

# a body's card, age: $mins minutes
crew-card-mins = { $mins } min

# a body's card: the label before what it is doing (a column of ten in monospace)
crew-card-doing = activité

# a heading in the crew window over the yard's crew
crew-sect-yard = le chantier

# a heading in the crew window over the deep's crew
crew-sect-deep = les profondeurs

# a heading on the house's board, and the window it opens
crew-sect-crew = l'équipe

## The books

# the books: a coin, before its rate
books-dust = cailloux

# the books: a coin, before its rate
books-shard = minerai

# the books: a coin, before its rate
books-spore = récoltes

# the books: a coin, before its rate
books-spark = étincelles

# the books: the window the rates are taken over, in minutes ($n may be ½)
books-over-min = { $n } min

# the books: the row that steps the window the rates are taken over
books-over = moyenne sur

# the books: the window, in a rate's note (nothing in the last half minute)
books-last-half = la dernière demi-minute

# the books: the window, in a rate's note
books-last-one = la dernière minute

# the books: the window, in a rate's note; $n minutes, more than one
books-last-mins = les { $n } dernières minutes

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } sur { $over }

# the books: a rate's note when nothing came in
books-nothing = rien

# the books: a line
books-dirt-mach = des machines

# the books: a line
books-dirt-dust = du rocher

# the books: a line
books-dirt-shard = de la carrière

# the books: a line
books-dirt-spore = de la ferme

# the books: the sky full in, while the filter is winning
books-due-never = pas à ce rythme

# the books: a line
books-sky-trend = pollution

# the books: a line
books-sky-up = émise, par minute

# the books: a line
books-sky-down = retirée, par minute

# the books: a line
books-sky-haze = le ciel est

# the books: how full the sky is; $pct with its sign
books-sky-full = plein à { $pct }

# the books: a line
books-sky-due = plein dans

# the books: a line
books-sky-rains = averses essuyées

# the books: a line
books-sky-muck = boue qui traîne

# the books: a line
books-working = au travail

# the books: a line
books-idle = inactifs

# the books: a line
books-best-mined = le plus au rocher

# the books: a line
books-best-quarried = le plus de minerai

# the books: a line
books-best-farmed = le plus de récoltes

# the books: a line
books-best-stored = le plus dans la fosse

# the books: a line
books-best-tidied = le plus de boue nettoyée

# the books: the longest on one clock, an hour or more; $n hours to a tenth
books-hours = { $n } h

# the books: the longest on one clock, under an hour; $n minutes
books-mins = { $n } min

# the books: a line
books-eldest = plus long service

# the books: a line
books-tally-rocks = rochers dégagés

# the books: a line
books-tally-banked = cailloux engrangés

# the books: a line
books-tally-ore = minerai extrait

# the books: a coin earned over the whole game; $coin is books-shard, books-spore or books-spark
# (fr: "gagné" would have to agree with the coin, masculine or feminine, singular or plural, so it reads "in all")
books-tally-earned = { $coin }, en tout

# the books: a line
books-tally-rift = par la faille

# the books: a line
books-tally-brews = fournées brassées

# the books: a line
books-tally-hats = chapeaux terminés

# the books: a line
books-tally-crew = sur la paie

# the books: a line
books-tally-notes = succès obtenus

# the books: a line
books-tally-under = femme sous le rocher depuis

# the books: a line
books-tally-saved = femme sauvée en

# a heading in the books, and on the noticeboard
books-sect-income = revenu par seconde

# a heading in the books
books-sect-sky = le ciel

# a heading in the books
books-sect-crew = l'équipe

# a heading in the books
books-sect-tally = le bilan

# the noticeboard: the way into the books (off the board for now)
books-open = ouvrir les comptes

# the noticeboard: how long this yard has been played
books-playtime = temps de jeu

## Hover

# the hover on a deep station whose Recruit still waits on its first choice
hover-choose = choisis un combattant

# the hover over a grain of ore
hover-ore = minerai

# the hover over a crop, a grain of it or a grown plot
hover-crop = récolte

# the hover over a spark
hover-spark = étincelle

# the hover over a pebble
hover-pebble = caillou

# the hover over the drowned pit
hover-abyss = l'abîme

# the hover over the rift
hover-rift = la faille

# the hover over poop on the ground
hover-poop = caca

# the hover over muck on the ground
hover-muck = boue

# the hover over a body, as the job it does (its type, rockhand)
hover-rockhand = casseur

# the hover over a body, as the job it does (its type, hauler)
hover-hauler = porteur

# the hover over a body, as the job it does (its type, quarrier)
hover-quarrier = mineur

# the hover over a body, as the job it does (its type, farmhand)
hover-farmhand = fermier

# the hover over a body, as the job it does (its type, scholar)
hover-scholar = érudit

# the hover over a body, as the job it does (its type, purifier)
hover-purifier = purificateur

# the hover over a body, as the job it does (its type, stirrer)
hover-stirrer = apothicaire

# the hover over a body, as the job it does (its type, janitor)
hover-janitor = concierge

# the hover over a body, as the job it does (its type, wizard)
hover-wizard = sorcier

# the hover over a body, as the job it does (its type, builder)
hover-builder = bâtisseur

# the hover over a body, as the job it does (its type, fighter)
hover-fighter = combattant

# the hover over a body, as the job it does (its type, gatherer)
hover-gatherer = cueilleur

# the hover over a body, as the job it does (its type, delver)
hover-delver = bâtisseur du fond

# the hover over the portal, from the deep
hover-portal-up = le portail — remonter au chantier

# the hover over the portal, from the yard
hover-portal-down = le portail — descendre aux profondeurs

# the hover over the serpent
hover-serpent = le serpent

# the hover over the crew's houses
hover-house = maison

# the hover over the boulder
hover-rock = rocher

# the hover over a bird
hover-bird = oiseau

# the hover over a balloon
hover-balloon = ballon

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the air filter's gauge: the sky filling faster than it is cleaned
hover-dial-worse = ça empire

# the air filter's gauge: the sky cleaned faster than it fills
hover-dial-better = ça s'améliore

# the air filter's gauge: neither
hover-dial-steady = ça se maintient

# the hover over the counter above the pit
hover-counter = cailloux dans la fosse : ce que tout coûte

# the air filter's gauge: the needle in the first band
hover-dial-clean = propre

# the air filter's gauge: the needle in the middle band
hover-dial-dirty = sale

# the air filter's gauge: the needle in the last band
hover-dial-filthy = crasseux

# the hover on a pile-full mark: a station's pile has nowhere left to go
hover-pile-full = le tas est plein

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } : fini

# the hover on a done mark whose rows have no names
hover-done-work = travail fini

# the casino's lever, by name (its hover and the pad's label)
lever-arm = le levier

# a pot's picker: the brew it is set to, when it is set to none
pot-nothing = rien

# a pot's picker: the heading over who the brew is for
pot-for = pour

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = au plus proche

## The deep

# a brawler's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-brawler-fork = Frappe plus fort, apprends des combos

# the brawler's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move = Combos

# what the brawler's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move-does = enchaîner les coups

# the brawler's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap = K.-O.

# what the brawler's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap-does = { $stun }

# a sword's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sword-fork = Maîtrise l'épée

# the sword's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-move = Tourbillon

# what the sword's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-move-does = entaille plus lourde

# the sword's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap = Points faibles

# what the sword's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap-does = { $bleed }

# a monk's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-monk-fork = Concentre ton chi

# the monk's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-move = Grande inspiration

# what the monk's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-move-does = chi plus rapide

# the monk's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap = Eau dormante

# what the monk's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap-does = { $stun }

# a martial's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-martial-fork = Frappe plus vite et achève plus tôt

# the martial's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-move = Panache

# what the martial's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-move-does = coups de grâce plus rapides

# the martial's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap = Ralliement

# what the martial's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap-does = { $haste } pour tous

# a ranger's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-ranger-fork = Vise les points faibles

# the ranger's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move = Tir visé

# what the ranger's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move-does = flèche chargée

# the ranger's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap = Tir clouant

# what the ranger's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap-does = { $stun }

# a assassin's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-assassin-fork = Frappe vite et juste

# the assassin's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move = Exécution

# what the assassin's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move-does = punit les blessures

# the assassin's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap = Dentelé

# what the assassin's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap-does = { $bleed }

# a hexer's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-hexer-fork = Lance des maléfices affaiblissants

# the hexer's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move = Flétrissure

# what the hexer's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move-does = le serpent subit plus de dégâts

# the hexer's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap = Entrave

# what the hexer's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap-does = { $held }, { $exposed }

# a sapper's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sapper-fork = Apprends les explosifs

# the sapper's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move = Bombes collantes

# what the sapper's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move-does = coller, puis boum

# the sapper's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap = Doublé

# what the sapper's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap-does = deux bombes, { $stun }

# a mage's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-mage-fork = Canalise de puissants rayons

# the mage's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-move = Élargissement

# what the mage's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-move-does = rayon plus large

# the mage's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap = Thermite

# what the mage's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap-does = brûle l'armure

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Rends ton groupe { $inspired }

# the bard's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-move = Hymne

# what the bard's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-move-does = { $inspired } doublé

# the bard's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap = Tempo

# what the bard's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap-does = { $haste } pour tous

# a status, by name (bold in a line, under its icon)
status-stun = Étourdi

# a status, by name
status-bleed = Saignement

# a status, by name
status-haste = Hâte

# a status, by name
status-held = Entravé

# a status, by name
status-exposed = Exposé

# a status, by name
status-inspired = Inspiré

# what Stun does, after its name
status-stun-does = immobile, ne se soigne plus

# what Bleed does, after its name
status-bleed-does = dégâts sur la durée

# what Haste does, after its name; $pct with its sign
status-haste-does = attaque { $pct } plus vite

# what Held does, after its name
status-held-does = soins bloqués

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = subit { $lo }-{ $hi } de dégâts en plus

# what Inspired does, after its name
status-inspired-does = frappe plus fort

# a status's hover line: $name (status-…) and what it does
status-line = { $name } : { $does }

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n } : { $does }

# a status's label under its icon when $n of it are on
status-label-n = { $name } x{ $n }

# a base fighter's line: the altar's (the Fighter)
base-altar-does = Donne des coups

# a base fighter's line: the well's (the Novice)
base-well-does = Pratique les arts martiaux

# a base fighter's line: the armory's (the Scout)
base-armory-does = Tire des flèches

# a base fighter's line: the circle's (the Adept)
base-circle-does = Jette des sorts

# a base fighter's line: the spire's (the Apprentice)
base-spire-does = Tire des rayons

# the Recruit's line, before its first choice
recruit-does = un petit coup de poing

# the Bard's line with nobody else fighting
rail-alone = personne d'autre pour qui chanter

# a class that needs company, before there is any
rail-locked = s'ouvre avec une deuxième station

# a station's board at the fork: the heading over the two classes
rail-fork-ask = Spécialise-toi

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Choisis ton combattant

# a rung's number in its class's unit; $unit is unit-dmg or unit-dmg-s
rail-worth = { $n } { $unit }

# a rung's number for a class written in percent (the Bard)
rail-worth-pct = +{ $n } %

# a pip's hover line on a station's tree: $name (a fighter, a move) and $what (its number, or a few words)
rail-line = { $name } : { $what }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Deviens { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = réinitialiser – tout est remboursé

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-brawler = Bagarreur

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sword = Épéiste

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-monk = Moine

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Artiste martial

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-ranger = Rôdeur

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-assassin = Assassin

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-hexer = Envoûteur

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sapper = Sapeur

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-mage = Mage

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-bard = Barde

# a base fighter's name: the altar's, below the fork
base-altar = Combattant

# a base fighter's name: the well's
base-well = Novice

# a base fighter's name: the armory's
base-armory = Éclaireur

# a base fighter's name: the circle's
base-circle = Adepte

# a base fighter's name: the spire's
base-spire = Apprenti

# every station's first fighter, before its first choice
class-recruit = Recrue

# the serpent's lash, its tile's hover while it waits
serp-lash-calm = Fouet : étourdit les attaquants au corps à corps

# the serpent's lash, its tile's hover while it is warned
serp-lash-coming = Fouet imminent

# the serpent's lash, its tile's hover while it is on
serp-lash-on = Fouet : étourdit les attaquants au corps à corps

# the serpent's lash, its tile's hover once answered
serp-lash-stopped = Fouet : stoppé

# the serpent's cloak, warned
serp-sink-coming = Voile imminent

# the serpent's cloak, on
serp-sink-on = Voile : hors de portée

# the serpent's constrict, warned
serp-orb-coming = Étreinte imminente

# the serpent's constrict, on
serp-orb-on = Étreinte

# the serpent's constrict, answered
serp-orb-stopped = Étreinte

# a fighter's tile: dazed, its hover
serp-dazed = Sonné : déséquilibré, voit des étoiles

# a fighter's tile: constricted, its hover
serp-constricted = Enserré

# the serpent's barrier, its tile's hover
serp-barrier = Barrière : absorbe les dégâts explosifs

# the serpent's ward, its tile's hover
serp-ward = Égide : dégâts magiques réduits de moitié

# the serpent's plates, its tile's hover
serp-plates = Plaques : dégâts physiques réduits de moitié

# the lash's tile, its label
serp-lash = Fouet

# the cloak's tile, its label
serp-sink = Voile

# the constrict's tile, its label
serp-orb = Étreinte

# a fighter's dazed tile, its label
serp-dazed-name = Sonné

# a fighter's constricted tile, its label
serp-constricted-name = Enserré

# the barrier's tile, its label
serp-barrier-name = Barrière

# the ward's tile, its label
serp-ward-name = Égide

# the plates' tile, its label
serp-plates-name = Plaques

# the pods: one more of the crew, living down here
row-pod = une autre capsule

# the pods: the pod's line
row-pod-note = une capsule de l'autre côté des profondeurs : un membre de l'équipe de plus, qui vit ici en bas

# a deep station's board: the heading over its one fighter, with the count
rail-fighter = le combattant

# the deep: the build of a new fighter's station (the queue card names it)
row-raise-station = ériger une station

# the deep's build button: the first station costs no fang
build-free = gratuit

# the serpent's level after the pips on its bar, from level 2 on; $n is the level.
# [owner's words: a level label, e.g. "Lv 7"] -- until then the bare number. Drawn in the pixel number font
# (NUM_FONT), which draws only the glyphs it has: words want their letters drawn into the font
serp-level = { $n }
