### Pebble Pit pilot, version B: machine translation, de.
### Engine: Firefox Translations (Bergamot) via @browsermt/bergamot-translator 0.4.9 (wasm), model en-de 2.1 from Mozilla's Remote Settings registry.
### Unedited except: the first letter takes the English case; title-gamename is not sent (the game's name).

# rescue sheet heading, end of first half
saved-word = Ist Es Vorbei?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = du hast deine Frau in <span data-l10n-name="time"></span> gerettet!

# rescue sheet dismiss button
saved-keepplaying = Glücklich bis ans Ende

# demo end sheet line
demoend-why = ich kann deine Frau noch nicht retten.

# second-half end sheet line
freed-why = du hast deinen Mann vor dem Bauch der Schlange gerettet.

# second-half end sheet line
freed-end = das ist das Ende, fühlen Sie sich frei, die Schlange und Landwirtschaft an der Oberfläche zu töten!

# saves page paste box cancel
held-nevermind = es macht mir nie etwas

# pause sheet footer hint
held-keys = esc holds · ← → look about · Halteraum, um eine Szene zu überspringen

# window close button label
modal-close =
    .aria-label = schließen

# pause sheet reply, store fallback
said-fellback = die letzte Rettung würde nicht laden; dies ist die vor ihr

# pause sheet reply, yard open elsewhere
said-yielded = dieser Hof ist in einem anderen Tab geöffnet; dass einer gerettet wird

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = nicht speichern: Der Speicher dieser Website ist voll ({ $used } mb verbraucht, { $ours } kb davon unsere). Kopieren Sie ein Speichern funktioniert immer noch

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = nicht laden: { $message }

# save row age
slots-since-min = vor { $m } min

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
         [one] vor einem Tag
        *[other] vor { $d } Tagen
    }

# save row item
slots-row-crew = { $n } Besatzungsmitglieder

# saves button label on both fronts
held-slotsbtn-label = speichert · { $n } von { $total }

# achievements page, nothing earned
held-record-none = du hast noch nichts getan.

# cloud section under recovery code
cloud-writedown = schreiben Sie dies auf: Es bringt Ihre Höfe zurück auf ein neues Gerät

# cloud section reply, 503
cloud-why-resting = die Wolke ruht; versuchen Sie es später noch einmal

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = zu viele Versuche von heute hier; versuchen Sie es morgen

# cloud section button, first press
cloud-btn-newcode-armed = andere Geräte abzeichnen?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = { $since } gerettet

# settings dark switch
set-dark-on = dunkel: auf

# settings motion switch
set-motion-less = bewegung: weniger

# settings note where fullscreen unavailable
set-fullscreen-note = für den gesamten Bildschirm, fügen Sie diese Seite zum Startbildschirm

# controls page action column
ctl-rightleft-do = arbeiter abholen

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = ein Felsen. ein Loch. ein paar Leute zwischen ihnen.

# landing page main button
title-play = spielen

# story line, first step
obj-rock = graben Sie den Felsbrocken, um Ihre Frau zu retten!

# story line, wooden roof barrier
obj-props = vielleicht stopft der Bau eines Holzdaches den nächsten Felsbrocken?

# story line, arch barrier
obj-arch = lassen Sie uns versuchen, einen Bogen aus dem abgebauten Erz und Stein zu bauen. Sicherlich ist das robust genug.

# story line, wizards' barrier
obj-dome = aus den Optionen, lassen Sie uns sehen, ob die Assistenten helfen können.

# story line, deep half
obj-portal = ein Portal zum Abgrund zaubern, was ist da unten?

# story line, final step
obj-free = befreien Sie Ihren Mann aus dem Bauch der Schlange

# objective card cancel while building
obj-barrier-cancel = abbrechen ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = halten Sie <span data-l10n-name="key"></span>, um zu überspringen

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = LÖSCHEN SIE ES

# the house's board and the crew window, with no crew yet
crew-empty = hier lebt noch niemand

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }h { $m }m

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }st

# achievement name
ach-gotout-name = du hast deine Schweife gerettet

# toast and achievements card name
ach-firstgrain-name = makin' Geld

# achievement name
ach-firsthire-name = sie haben zusätzliche Pylonen gebaut

# achievement name
ach-firsthat-name = du bist ein Zauberer-Quadrat

# achievement name
ach-firstbrew-name = hallo, Trankverkäufer

# achievement name
ach-dizzy-name = geschütteltes Baby-Syndrom

# achievement name
ach-muckrain-name = es regnet nie, aber es gießt

# achievement name
ach-tablebeaten-name = wir sind so zurück

# achievement name
ach-tableruin-name = zeit, einen Kredit zu bekommen

# achievement name
ach-bird-name = geh von meinem Land

# achievement note
ach-catchall-note = wirf eine volle Hand Staub auf seine größte, und fängt jedes Korn

# achievement name
ach-rifttorn-name = der Riss gerissen, die Lagerung wird gelöst

# achievement note
ach-rifttorn-note = füllen Sie die Grube, die einen interdimensionalen Riss verursacht

# achievement note
ach-drowned-note = ein ganzer Ozean der interdimensionalen Speicherung.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = klare { $n } Felsbrockel, das sind viele Steine

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } Quadrate

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = digger

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = tiefbauer

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit after its number: swings a second
unit-hits-s = treffer/s

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower = { $more ->
         [yes] { $left ->
             [one] kaufen Sie { $left } mehr Züchter zum Freischalten
            *[other] kaufen Sie { $left } weitere Züchter, um freizuschalten
        }
        *[no] { $left ->
             [one] kaufen Sie { $left } Züchter, um freizuschalten
            *[other] { $left } Züchter kaufen, um sie freizuschalten
        }
    }

# the bench: your carry ladder
row-carry = tragebetrag

# the bench: holding a handful throws it by itself
row-autotoss = halten, um zu werfen

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = brauen Sie temporäre Boosts für Ihre Mitarbeiter

# the bench: what the casino is for, under its name
row-unlockcasino-note = ein Tisch, der einen Einsatz nimmt und doppelt oder nichts zahlt

# the bench: what the closet is for, under its name
row-unlockouthouse-note = du hast genug Kacke gesehen, lass es sauber machen

# the bench: what the air filter is for, under its name
row-unlockfilter-note = verkauft die Ballons, die den Dunst zurück vom Himmel ziehen, und liest den Himmel

# the tower: the last barrier's line
row-dome-note = alles vom Boden ist gescheitert. Was übrig bleibt, ist nicht vom Boden

# the bench: the net's line
row-net-note = das hat nicht funktioniert, versuchen Sie, den Stein mit einem Netz zu fangen?

# what the breaker hat does
kit-breaker-does = das Doppelte des Bisses

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, bei { $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = der Ram schlägt { $n }x härter

# the strip at a card's foot: buy another copy behind the one being built
card-another = + ein anderer

# a finished ladder, where its price would go
card-done = getan

# the tower: an enchantment's name
spell-gmo = genetisch veränderte Pflanzen

# the tower: the enchantment's line
spell-thrift-note = jedes Haus von nun an ist 75% günstiger

# the tower: the enchantment's line
spell-drive-note = jede Maschine im Hof läuft 50% schneller

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = jeder Bolzen klopft { $next } Zellen vom Stern statt von { $now }

# the tower: a wizard's line
row-wizard-note = fliegt nach oben und schraubt den Stern für Funken auseinander und beschwört einen neuen, wenn der Himmel leer ist

# the janitor's closet: the roomba's line
row-roomba-note = fährt zum Chaos auf dem offenen Hof und bringt es nach Hause; ein Hausmeister kümmert sich um sie, und sie rauchen

# the air filter: the recycler's line
row-recycler-note = was die Ballons fangen, kommt als Kieselsteine statt Dreck herunter

# a brew's name: the speed one, priced in crops
tonic-stew = herzhafter Eintopf

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } s

# the apothecary's keep-brewing setting: on
row-potkeep-on = charge nach Charge

# the bench: the forklift's line
row-driver-note = ein Gabelstapler, der sich selbst fährt: Er zieht mit niemand an Bord in die Grube und raucht

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = ich brauche einen Steinbruch

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party = { $nth ->
         [0] die { $who }
         [1] die zweite { $who }
         [2] die dritte { $who }
         [3] die vierte { $who }
        *[other] die undefinierte { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot = { $nth ->
         [0] eine Station
         [1] eine zweite Station
         [2] eine dritte Station
         [3] eine vierte Station
        *[other] eine undefinierte Station
    }

# the apothecary's board with nothing on it
station-apothecary-empty = der Topf steht kalt

# the janitor's closet's board with nothing on it
station-outhouse-empty = die Besen sind alle an ihren Haken

# the crusher's pile-full mark, on a hover
station-crusher-full = der Boden ist voll von Waagen

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = in deiner Hand

# a body's card, doing: what its step is (idle)
crew-now-idle = nicht viel

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = Minding { $name }

# a body's card, age: under a minute
crew-card-new = heute neu

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } in { $over }

# the books: the sky full in, while the filter is winning
books-due-never = nicht zu diesem Preis

# the books: a line
books-tally-under = sqwife unter dem Felsen für

# the books: a line
books-tally-saved = sqwife gespeichert in

# the hover over the counter above the pit
hover-counter = kieselsteine in der Grube: Was kostet alles

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } fertig

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = wer am nächsten ist

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Gib deiner Party { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = { $lo }-{ $hi } mehr Schaden nehmen

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Werde eine { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = zurücksetzen – erstattet alles zurück

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Kampfkünstler

# a fighter's tile: dazed, its hover
serp-dazed = Benommen: Abgeworfen, Sterne sehen

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Wähle deinen Kämpfer
