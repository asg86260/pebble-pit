### Pebble Pit pilot, version A: drafted by Claude (Opus 5.5) after locales/STYLE.md, fr.
### A draft for a native reviewer, not a finished translation.


# rescue sheet heading, end of first half
saved-word = C'est fini ?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = tu as sauvé ta carrépouse en <span data-l10n-name="time"></span> !

# rescue sheet dismiss button
saved-keepplaying = Heureux pour toujours

# demo end sheet line
demoend-why = pas encore moyen de sauver ta carrépouse.

# second-half end sheet line
freed-why = tu as sauvé ton carrémari du ventre du serpent.

# second-half end sheet line
freed-end = c'est la fin, libre à toi de continuer à tuer le serpent et à cultiver en surface !

# saves page paste box cancel
held-nevermind = laisse tomber

# pause sheet footer hint
held-keys = échap met en pause · ← → regarder autour · maintiens espace pour passer une scène

# window close button label
modal-close =
    .aria-label = fermer

# pause sheet reply, store fallback
said-fellback = la dernière sauvegarde ne se chargeait pas ; voici celle d'avant

# pause sheet reply, yard open elsewhere
said-yielded = ce chantier est ouvert dans un autre onglet ; c'est celui-là qui sauvegarde

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = pas de sauvegarde : le stockage de ce site est plein ({ $used } mo utilisés, dont { $ours } ko à nous). copier une sauvegarde marche toujours

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = chargement impossible : { $message }

# save row age
slots-since-min = il y a { $m } min

# saves row: how long ago it was saved, in whole days
slots-since-days =
    { $d ->
        [one] il y a un jour
       *[other] il y a { $d } jours
    }

# save row item
slots-row-crew = { $n } ouvriers

# saves button label on both fronts
held-slotsbtn-label = sauvegardes · { $n } sur { $total }

# achievements page, nothing earned
held-record-none = tu n'as encore rien fait.

# cloud section under recovery code
cloud-writedown = note-le : il ramène tes chantiers sur un nouvel appareil

# cloud section reply, 503
cloud-why-resting = le cloud se repose ; réessaie plus tard

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = trop d'essais d'ici aujourd'hui ; réessaie demain

# cloud section button, first press
cloud-btn-newcode-armed = déconnecter les autres appareils ?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = sauvegardé { $since }

# settings dark switch
set-dark-on = sombre : oui

# settings motion switch
set-motion-less = mouvement : réduit

# settings note where fullscreen unavailable
set-fullscreen-note = pour le plein écran, ajoute cette page à l'écran d'accueil

# controls page action column
ctl-rightleft-do = soulever des ouvriers

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = un rocher. un trou. quelques gens entre les deux.

# landing page main button
title-play = jouer

# story line, first step
obj-rock = creuse le rocher pour sauver ta carrépouse !

# story line, wooden roof barrier
obj-props = peut-être qu'un toit en bois arrêtera le prochain rocher ?

# story line, arch barrier
obj-arch = essayons une arche avec le minerai et la pierre. ça tiendra sûrement.

# story line, wizards' barrier
obj-dome = plus d'idées, voyons si les sorciers peuvent aider.

# story line, deep half
obj-portal = invoque un portail vers l'abîme, qu'y a-t-il en bas ?

# story line, final step
obj-free = libère ton carrémari du ventre du serpent

# objective card cancel while building
obj-barrier-cancel = annuler ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = maintiens <span data-l10n-name="key"></span> pour passer

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = LACHE TOUT

# the house's board and the crew window, with no crew yet
crew-empty = personne n'habite ici

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } h { $m } min

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal =
    { $n ->
        [one] { $n }er
       *[other] { $n }e
    }

# achievement name
ach-gotout-name = tu as sauvé ta carrépouse

# toast and achievements card name
ach-firstgrain-name = faire du blé

# achievement name
ach-firsthire-name = tu as construit des pylônes supplémentaires

# achievement name
ach-firsthat-name = t'es un sorcier, carré

# achievement name
ach-firstbrew-name = bonjour, marchand de potions

# achievement name
ach-dizzy-name = syndrome du bébé secoué

# achievement name
ach-muckrain-name = un malheur n'arrive jamais seul

# achievement name
ach-tablebeaten-name = on est trop de retour

# achievement name
ach-tableruin-name = l'heure de prendre un crédit

# achievement name
ach-bird-name = dégage de mon terrain

# achievement note
ach-catchall-note = lance une pleine poignée de poussière, au plus gros, et rattrape chaque grain

# achievement name
ach-rifttorn-name = la faille est ouverte, le stockage est réglé

# achievement note
ach-rifttorn-note = remplis la fosse jusqu'à ouvrir une faille interdimensionnelle

# achievement note
ach-drowned-note = tout un océan de stockage interdimensionnel.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = dégage { $n } rochers, ça fait beaucoup de cailloux

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } carrés

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = casseurs

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = bâtisseurs du fond

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit after its number: swings a second
unit-hits-s = coups/s

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower =
    { $more ->
        [yes]
            { $left ->
                [one] achète encore { $left } jardinier pour débloquer
               *[other] achète encore { $left } jardiniers pour débloquer
            }
       *[no]
            { $left ->
                [one] achète { $left } jardinier pour débloquer
               *[other] achète { $left } jardiniers pour débloquer
            }
    }

# the bench: your carry ladder
row-carry = charge portée

# the bench: holding a handful throws it by itself
row-autotoss = maintenir pour lancer

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = brasse des boosts temporaires pour tes carrouvriers

# the bench: what the casino is for, under its name
row-unlockcasino-note = une table qui prend une mise et paie double ou rien

# the bench: what the closet is for, under its name
row-unlockouthouse-note = t'as vu assez de caca, on nettoie

# the bench: what the air filter is for, under its name
row-unlockfilter-note = vend les ballons qui retirent la brume du ciel, et lit le ciel

# the tower: the last barrier's line
row-dome-note = tout ce qui vient du sol a échoué. ce qui reste ne vient pas du sol

# the bench: the net's line
row-net-note = ça n'a pas marché, essayer d'attraper le rocher avec un filet ?

# what the breaker hat does
kit-breaker-does = deux fois le mordant

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name } : { $does }, { $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = le bélier frappe { $n }x plus fort

# the strip at a card's foot: buy another copy behind the one being built
card-another = + un autre

# a finished ladder, where its price would go
card-done = fini

# the tower: an enchantment's name
spell-gmo = modifier génétiquement les récoltes

# the tower: the enchantment's line
spell-thrift-note = chaque maison désormais 75 % moins chère

# the tower: the enchantment's line
spell-drive-note = chaque machine du chantier tourne 50 % plus vite

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = chaque éclair arrache { $next } cellules à l'étoile au lieu de { $now }

# the tower: a wizard's line
row-wizard-note = s'envole et brise l'étoile à coups d'éclairs pour des étincelles, et en appelle une autre quand le ciel est vide

# the janitor's closet: the roomba's line
row-roomba-note = roule jusqu'au bazar dans le chantier et le ramène ; un concierge les surveille, et ils fument

# the air filter: the recycler's line
row-recycler-note = ce que les ballons attrapent retombe en cailloux au lieu de boue

# a brew's name: the speed one, priced in crops
tonic-stew = ragoût copieux

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v } % { $unit }, { $secs } s

# the apothecary's keep-brewing setting: on
row-potkeep-on = fournée après fournée

# the bench: the forklift's line
row-driver-note = un chariot élévateur qui roule seul : il va à la fosse sans personne à bord, et il fume

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = il faut une carrière

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party =
    { $nth ->
        [0] le { $who }
        [1] le deuxième { $who }
        [2] le troisième { $who }
        [3] le quatrième { $who }
       *[other] le undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] une station
        [1] une deuxième station
        [2] une troisième station
        [3] une quatrième station
       *[other] une undefined station
    }

# the apothecary's board with nothing on it
station-apothecary-empty = la marmite est froide

# the janitor's closet's board with nothing on it
station-outhouse-empty = les balais sont tous à leurs crochets

# the crusher's pile-full mark, on a hover
station-crusher-full = le sol est plein d'écailles

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = dans ta main

# a body's card, doing: what its step is (idle)
crew-now-idle = pas grand-chose

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = surveille { $name }

# a body's card, age: under a minute
crew-card-new = tout neuf

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } en { $over }

# the books: the sky full in, while the filter is winning
books-due-never = pas à ce rythme

# the books: a line
books-tally-under = carrépouse sous le rocher depuis

# the books: a line
books-tally-saved = carrépouse sauvée en

# the hover over the counter above the pit
hover-counter = cailloux dans la fosse : ce que tout coûte

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } : fini

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = au plus proche

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Donne à ton groupe { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = subit { $lo }-{ $hi } de dégâts en plus

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n } : { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Devenir { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = réinitialiser – tout est remboursé

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Artiste martial

# a fighter's tile: dazed, its hover
serp-dazed = Sonné : déséquilibré, voit des étoiles

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Choisis ton combattant
