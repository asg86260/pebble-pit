### Pebble Pit pilot, version B: machine translation, fr.
### Engine: Firefox Translations (Bergamot) via @browsermt/bergamot-translator 0.4.9 (wasm), model en-fr 2.0 from Mozilla's Remote Settings registry.
### Unedited except: the first letter takes the English case; title-gamename is not sent (the game's name).

# rescue sheet heading, end of first half
saved-word = C'est Fini ?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = vous avez sauvé votre swife en <span data-l10n-name="time"></span> !

# rescue sheet dismiss button
saved-keepplaying = Heureusement Pour Toujours Après

# demo end sheet line
demoend-why = je ne peux pas encore sauver votre femme.

# second-half end sheet line
freed-why = vous avez sauvé votre mari du ventre du serpent.

# second-half end sheet line
freed-end = c'est la fin, n'hésitez pas à continuer à tuer le serpent et à cultiver à la surface!

# saves page paste box cancel
held-nevermind = peu importe

# pause sheet footer hint
held-keys = esc tient · ← → regarder sur · tenir l'espace pour sauter une scène

# window close button label
modal-close =
    .aria-label = proche

# pause sheet reply, store fallback
said-fellback = le dernier arrêt ne chargerait pas; c'est celui qui l'a précédé

# pause sheet reply, yard open elsewhere
said-yielded = cette cour est ouverte dans un autre onglet; celui-ci est sauvé

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = non sauvegarde: le stockage de ce site est complet ({ $used } mb utilisé, { $ours } kb de celui-ci nôtre). copier un sauvegarde fonctionne toujours

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = ne pouvait pas charger: { $message }

# save row age
slots-since-min = il y a { $m } min

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
         [one] il y a un jour
         [many] il y a { $d } jours
        *[other] il y a { $d } jours
    }

# save row item
slots-row-crew = { $n } équipage

# saves button label on both fronts
held-slotsbtn-label = sauvegardes · { $n } de { $total }

# achievements page, nothing earned
held-record-none = tu n'as encore rien fait.

# cloud section under recovery code
cloud-writedown = écrivez ceci: il ramène vos cours sur un nouvel appareil

# cloud section reply, 503
cloud-why-resting = le nuage se repose; essayez à nouveau plus tard

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = trop d'essais d'ici aujourd'hui; essayer demain

# cloud section button, first press
cloud-btn-newcode-armed = s'inscrire d'autres appareils ?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = sauvé { $since }

# settings dark switch
set-dark-on = sombre: sur

# settings motion switch
set-motion-less = motion: moins

# settings note where fullscreen unavailable
set-fullscreen-note = pour l'écran entier, ajoutez cette page à l'écran d'accueil

# controls page action column
ctl-rightleft-do = ramasser les travailleurs

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = un rocher, un trou, quelques personnes entre eux.

# landing page main button
title-play = jouer

# story line, first step
obj-rock = creusez le rocher pour sauver votre swife !

# story line, wooden roof barrier
obj-props = peut-être que construire un toit en bois arrêtera le prochain rocher ?

# story line, arch barrier
obj-arch = essayez de construire une arche à partir du minerai et de la pierre minés. sûrement c'est assez robuste.

# story line, wizards' barrier
obj-dome = hors options, voyons si les assistants peuvent aider.

# story line, deep half
obj-portal = conjurer un portail vers l'abîme, qu'y a-t-il là-bas ?

# story line, final step
obj-free = libérer ton mari du ventre du serpent

# objective card cancel while building
obj-barrier-cancel = annuler ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = tenir <span data-l10n-name="key"></span> pour sauter

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = LÂCE-LA

# the house's board and the crew window, with no crew yet
crew-empty = personne ne vit encore ici

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }h { $m }m

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n ->
         [one] { $n }ère
        *[other] { $n }ème
    }

# achievement name
ach-gotout-name = tu as sauvé ton swife

# toast and achievements card name
ach-firstgrain-name = faire de l'argent

# achievement name
ach-firsthire-name = vous avez construit des pylônes supplémentaires

# achievement name
ach-firsthat-name = vous êtes un magicien carré

# achievement name
ach-firstbrew-name = bonjour, vendeur de potion

# achievement name
ach-dizzy-name = syndrome du bébé secoué

# achievement name
ach-muckrain-name = il ne pleut jamais mais il coule

# achievement name
ach-tablebeaten-name = on est si de retour

# achievement name
ach-tableruin-name = le temps d'obtenir un prêt

# achievement name
ach-bird-name = descendre de ma terre

# achievement note
ach-catchall-note = jeter une main pleine de poussière, à son plus grand, et attraper chaque grain

# achievement name
ach-rifttorn-name = la faille déchirée, le stockage est résolu

# achievement note
ach-rifttorn-note = remplir la fosse provoquant une faille interdimensionnelle

# achievement note
ach-drowned-note = tout un océan de stockage inter-dimensionnel.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = clair { $n } rochers, ça fait beaucoup de roches

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } carrés

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = creuseurs

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = des constructeurs profonds

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
             [one] acheter { $left } cultivateur de plus à déverrouiller
             [many] acheter { $left } cultivateurs de plus à débloquer
            *[other] acheter { $left } cultivateurs de plus à débloquer
        }
        *[no] { $left ->
             [one] acheter { $left } cultivateur à débloquer
             [many] acheter { $left } cultivateurs à déverrouiller
            *[other] acheter { $left } cultivateurs à déverrouiller
        }
    }

# the bench: your carry ladder
row-carry = porter le montant

# the bench: holding a handful throws it by itself
row-autotoss = tenir à toss

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = brasser des boosts temporaires pour vos travailleurs

# the bench: what the casino is for, under its name
row-unlockcasino-note = une table qui prend une mise en jeu et paie le double ou rien

# the bench: what the closet is for, under its name
row-unlockouthouse-note = vous avez vu assez de caca, laissez le nettoyer

# the bench: what the air filter is for, under its name
row-unlockfilter-note = vend les ballons qui tirent la brume du ciel, et lit le ciel

# the tower: the last barrier's line
row-dome-note = tout du terrain a échoué. ce qui reste n'est pas du sol

# the bench: the net's line
row-net-note = ça n'a pas marché, essayer d'attraper le rocher avec un filet ?

# what the breaker hat does
kit-breaker-does = deux fois la morsure

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, à { $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = le bélier frappe { $n }x plus fort

# the strip at a card's foot: buy another copy behind the one being built
card-another = + une autre

# a finished ladder, where its price would go
card-done = fait

# the tower: an enchantment's name
spell-gmo = modifier génétiquement les cultures

# the tower: the enchantment's line
spell-thrift-note = chaque maison à partir de maintenant est 75% moins cher

# the tower: the enchantment's line
spell-drive-note = chaque machine dans la cour fonctionne 50% plus vite

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = chaque boulon fait tomber { $next } cellules de l'étoile au lieu de { $now }

# the tower: a wizard's line
row-wizard-note = vole et boulonne l'étoile pour les étincelles, et en convoque une nouvelle quand le ciel est vide

# the janitor's closet: the roomba's line
row-roomba-note = conduit au désordre sur la cour ouverte et le ramène à la maison; un concierge les occupe, et ils fument

# the air filter: the recycler's line
row-recycler-note = ce que les ballons attrapent descend comme des cailloux au lieu de boue

# a brew's name: the speed one, priced in crops
tonic-stew = ragoût copieux

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } a

# the apothecary's keep-brewing setting: on
row-potkeep-on = lot après lot

# the bench: the forklift's line
row-driver-note = un chariot élévateur qui conduit lui-même: il se dirige vers la fosse avec personne à bord, et fume

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = besoin d'une carrière

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party = { $nth ->
         [0] le { $who }
         [1] le deuxième { $who }
         [2] Le troisième { $who }
         [3] Le quatrième { $who }
        *[other] les { $who } non définis
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot = { $nth ->
         [0] une station
         [1] une deuxième station
         [2] une troisième station
         [3] une quatrième station
        *[other] une station indéfinie
    }

# the apothecary's board with nothing on it
station-apothecary-empty = le pot est froid

# the janitor's closet's board with nothing on it
station-outhouse-empty = les balais sont tous sur leurs crochets

# the crusher's pile-full mark, on a hover
station-crusher-full = le sol est plein d'écailles

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = dans ta main

# a body's card, doing: what its step is (idle)
crew-now-idle = rien de grand

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = attention { $name }

# a body's card, age: under a minute
crew-card-new = nouveau aujourd'hui

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } en { $over }

# the books: the sky full in, while the filter is winning
books-due-never = pas à ce rythme

# the books: a line
books-tally-under = swife sous le rocher pour

# the books: a line
books-tally-saved = swife sauvée dans

# the hover over the counter above the pit
hover-counter = cailloux dans la fosse: ce que tout coûte

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } fait

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = celui qui est le plus proche

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Donnez votre fête { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = prend { $lo }-{ $hi } dégâts supplémentaires

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Devenir un { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = reset – tout rembourser

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Artiste Martial

# a fighter's tile: dazed, its hover
serp-dazed = Désarré: jeté, voyant des étoiles

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Choisissez votre combattant
