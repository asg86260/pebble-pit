### Pebble Pit pilot, version A: drafted by Claude (Opus 5.5) after locales/STYLE.md, de.
### A draft for a native reviewer, not a finished translation.


# rescue sheet heading, end of first half
saved-word = Ist es vorbei?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = du hast deine quadratfrau in <span data-l10n-name="time"></span> gerettet!

# rescue sheet dismiss button
saved-keepplaying = Glücklich bis ans Ende

# demo end sheet line
demoend-why = deine quadratfrau kannst du noch nicht retten.

# second-half end sheet line
freed-why = du hast deinen quadratmann aus dem bauch der schlange gerettet.

# second-half end sheet line
freed-end = das wars. du kannst gern weiter die schlange erschlagen und oben farmen!

# saves page paste box cancel
held-nevermind = doch nicht

# pause sheet footer hint
held-keys = esc hält an · ← → umsehen · leertaste halten, um eine szene zu überspringen

# window close button label
modal-close =
    .aria-label = schließen

# pause sheet reply, store fallback
said-fellback = der letzte spielstand lud nicht; das hier ist der davor

# pause sheet reply, yard open elsewhere
said-yielded = dieser hof ist in einem anderen tab offen; gespeichert wird dort

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = speichert nicht: der speicher dieser seite ist voll ({ $used } mb belegt, { $ours } kb davon unsere). spielstand kopieren geht noch

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = konnte nicht laden: { $message }

# save row age
slots-since-min = vor { $m } min

# saves row: how long ago it was saved, in whole days
slots-since-days =
    { $d ->
        [one] vor einem tag
       *[other] vor { $d } tagen
    }

# save row item
slots-row-crew = { $n } leute

# saves button label on both fronts
held-slotsbtn-label = spielstände · { $n } von { $total }

# achievements page, nothing earned
held-record-none = du hast noch nichts getan.

# cloud section under recovery code
cloud-writedown = schreib das auf: damit holst du deine höfe auf ein neues gerät

# cloud section reply, 503
cloud-why-resting = die cloud ruht sich aus; versuch es später

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = heute zu viele versuche von hier; versuch es morgen

# cloud section button, first press
cloud-btn-newcode-armed = andere geräte abmelden?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = gespeichert { $since }

# settings dark switch
set-dark-on = dunkel: an

# settings motion switch
set-motion-less = bewegung: weniger

# settings note where fullscreen unavailable
set-fullscreen-note = für den ganzen bildschirm diese seite zum startbildschirm hinzufügen

# controls page action column
ctl-rightleft-do = arbeiter hochheben

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = ein fels. ein loch. ein paar leute dazwischen.

# landing page main button
title-play = spielen

# story line, first step
obj-rock = grab den fels ab, um deine quadratfrau zu retten!

# story line, wooden roof barrier
obj-props = vielleicht hält ein holzdach den nächsten fels auf?

# story line, arch barrier
obj-arch = versuchen wir einen bogen aus dem erz und stein. der hält bestimmt.

# story line, wizards' barrier
obj-dome = keine ideen mehr, mal sehen, ob die zauberer helfen können.

# story line, deep half
obj-portal = beschwör ein portal in den abgrund, was ist da unten?

# story line, final step
obj-free = befrei deinen quadratmann aus dem bauch der schlange

# objective card cancel while building
obj-barrier-cancel = abbrechen ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = <span data-l10n-name="key"></span> halten zum überspringen

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = LOSLASSEN

# the house's board and the crew window, with no crew yet
crew-empty = hier wohnt noch niemand

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } h { $m } min

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }.

# achievement name
ach-gotout-name = du hast deine quadratfrau gerettet

# toast and achievements card name
ach-firstgrain-name = kohle machen

# achievement name
ach-firsthire-name = du hast weitere pylonen errichtet

# achievement name
ach-firsthat-name = du bist ein zauberer, quadri

# achievement name
ach-firstbrew-name = hallo, trankverkäufer

# achievement name
ach-dizzy-name = schütteltrauma

# achievement name
ach-muckrain-name = ein unglück kommt selten allein

# achievement name
ach-tablebeaten-name = wir sind sowas von zurück

# achievement name
ach-tableruin-name = zeit für einen kredit

# achievement name
ach-bird-name = weg von meinem land

# achievement note
ach-catchall-note = wirf eine volle hand staub, so groß sie geht, und fang jedes korn

# achievement name
ach-rifttorn-name = der riss ist auf, das lagerproblem gelöst

# achievement note
ach-rifttorn-note = füll die grube, bis ein interdimensionaler riss aufgeht

# achievement note
ach-drowned-note = ein ganzer ozean interdimensionaler lagerfläche.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = räum { $n } felsen ab, das sind ganz schön viele steine

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } quadrate

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = steinklopfer

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = tiefenbauer

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit after its number: swings a second
unit-hits-s = schläge/s

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower =
    { $more ->
        [yes] kauf noch { $left } weitere gärtner zum freischalten
       *[no] kauf { $left } gärtner zum freischalten
    }

# the bench: your carry ladder
row-carry = traglast

# the bench: holding a handful throws it by itself
row-autotoss = halten zum werfen

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = brau kurze stärkungen für deine quadratarbeiter

# the bench: what the casino is for, under its name
row-unlockcasino-note = ein tisch, der einen einsatz nimmt und doppelt oder nichts zahlt

# the bench: what the closet is for, under its name
row-unlockouthouse-note = du hast genug kacke gesehen, räumen wir sie weg

# the bench: what the air filter is for, under its name
row-unlockfilter-note = verkauft die ballons, die den dunst wieder aus dem himmel ziehen, und liest den himmel ab

# the tower: the last barrier's line
row-dome-note = alles vom boden hat versagt. was bleibt, ist nicht vom boden

# the bench: the net's line
row-net-note = das ging nicht, vielleicht den fels mit einem netz fangen?

# what the breaker hat does
kit-breaker-does = doppelter biss

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does } ({ $place })

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = der rammbock schlägt { $n }x härter

# the strip at a card's foot: buy another copy behind the one being built
card-another = + noch einer

# a finished ladder, where its price would go
card-done = fertig

# the tower: an enchantment's name
spell-gmo = ernte genmanipulieren

# the tower: the enchantment's line
spell-thrift-note = jedes haus ab jetzt 75 % billiger

# the tower: the enchantment's line
spell-drive-note = jede maschine im hof läuft 50 % schneller

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = jeder blitz schlägt { $next } zellen vom stern statt { $now }

# the tower: a wizard's line
row-wizard-note = fliegt hoch, zerblitzt den stern zu funken und ruft einen neuen, wenn der himmel leer ist

# the janitor's closet: the roomba's line
row-roomba-note = fährt zum dreck auf dem offenen hof und bringt ihn heim; ein hausmeister passt auf sie auf, und sie qualmen

# the air filter: the recycler's line
row-recycler-note = was die ballons fangen, fällt als kiesel statt als schlamm herunter

# a brew's name: the speed one, priced in crops
tonic-stew = deftiger eintopf

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v } % { $unit }, { $secs } s

# the apothecary's keep-brewing setting: on
row-potkeep-on = charge um charge

# the bench: the forklift's line
row-driver-note = ein gabelstapler, der selbst fährt: er bringt alles zur grube, ohne fahrer, und qualmt

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = steinbruch nötig

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party =
    { $nth ->
        [0] der { $who }
        [1] der zweite { $who }
        [2] der dritte { $who }
        [3] der vierte { $who }
       *[other] der undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] eine station
        [1] eine zweite station
        [2] eine dritte station
        [3] eine vierte station
       *[other] eine undefined station
    }

# the apothecary's board with nothing on it
station-apothecary-empty = der topf steht kalt

# the janitor's closet's board with nothing on it
station-outhouse-empty = die besen hängen alle an ihren haken

# the crusher's pile-full mark, on a hover
station-crusher-full = der boden ist voller schuppen

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = in deiner hand

# a body's card, doing: what its step is (idle)
crew-now-idle = nicht viel

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = hütet { $name }

# a body's card, age: under a minute
crew-card-new = heute neu

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } in { $over }

# the books: the sky full in, while the filter is winning
books-due-never = nicht bei diesem tempo

# the books: a line
books-tally-under = quadratfrau unterm fels seit

# the books: a line
books-tally-saved = quadratfrau gerettet in

# the hover over the counter above the pit
hover-counter = kiesel in der grube: damit zahlst du alles

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } fertig

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = wer am nächsten ist

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Gib deiner Gruppe { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = nimmt { $lo }-{ $hi } mehr schaden

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Werde { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = zurücksetzen – erstattet alles

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Kampfkünstler

# a fighter's tile: dazed, its hover
serp-dazed = Benommen: aus dem Tritt, sieht Sterne

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Wähle deinen Kämpfer
