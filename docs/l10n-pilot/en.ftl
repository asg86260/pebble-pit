### The pilot sample, in English: cut from locales/en.ftl, in sample.txt order.

# rescue sheet heading, end of first half
saved-word = It's Over?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = you saved your sqwife in <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Happily Ever After

# demo end sheet line
demoend-why = cant save your sqwife just yet.

# second-half end sheet line
freed-why = you saved your sqhusband from the serpent's belly.

# second-half end sheet line
freed-end = that's the end, feel free to keep slaying the serpent and farming on the surface!

# saves page paste box cancel
held-nevermind = never mind

# pause sheet footer hint
held-keys = esc holds · ← → look about · hold space to skip a scene

# window close button label
modal-close =
    .aria-label = close

# pause sheet reply, store fallback
said-fellback = the last save would not load; this is the one before it

# pause sheet reply, yard open elsewhere
said-yielded = this yard is open in another tab; that one is being saved

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = not saving: this site's storage is full ({ $used } mb used, { $ours } kb of it ours). copy a save still works

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = could not load: { $message }

# save row age
slots-since-min = { $m } min ago

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
        [one] a day ago
       *[other] { $d } days ago
    }

# save row item
slots-row-crew = { $n } crew

# saves button label on both fronts
held-slotsbtn-label = saves · { $n } of { $total }

# achievements page, nothing earned
held-record-none = you haven't done anything yet.

# cloud section under recovery code
cloud-writedown = write this down: it brings your yards back on a new device

# cloud section reply, 503
cloud-why-resting = the cloud is resting; try again later

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = too many tries from here today; try tomorrow

# cloud section button, first press
cloud-btn-newcode-armed = sign out other devices?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = saved { $since }

# settings dark switch
set-dark-on = dark: on

# settings motion switch
set-motion-less = motion: less

# settings note where fullscreen unavailable
set-fullscreen-note = for the whole screen, add this page to the home screen

# controls page action column
ctl-rightleft-do = pick up workers

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = a rock. a hole. a few people between them.

# landing page main button
title-play = play

# story line, first step
obj-rock = dig the boulder to save your sqwife!

# story line, wooden roof barrier
obj-props = maybe building a wooden roof will stop the next boulder?

# story line, arch barrier
obj-arch = lets try building an arch from the mined ore and stone. surely that's sturdy enough.

# story line, wizards' barrier
obj-dome = out of options, lets see if the wizards can help.

# story line, deep half
obj-portal = conjure a portal to the abyss, what's down there?

# story line, final step
obj-free = free your sqhusband from the serpent's belly

# objective card cancel while building
obj-barrier-cancel = cancel ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = hold <span data-l10n-name="key"></span> to skip

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

# the house's board and the crew window, with no crew yet
crew-empty = nobody lives here yet

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }h { $m }m

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }{ $n ->
        [one] st
        [two] nd
        [few] rd
       *[other] th
    }

# achievement name
ach-gotout-name = you saved your sqwife

# toast and achievements card name
ach-firstgrain-name = makin' money

# achievement name
ach-firsthire-name = you've constructed additional pylons

# achievement name
ach-firsthat-name = you're a wizard squarey

# achievement name
ach-firstbrew-name = hello, potion seller

# achievement name
ach-dizzy-name = shaken baby syndrome

# achievement name
ach-muckrain-name = it never rains but it pours

# achievement name
ach-tablebeaten-name = we're so back

# achievement name
ach-tableruin-name = time to get a loan

# achievement name
ach-bird-name = get off my land

# achievement note
ach-catchall-note = throw a full hand of dust, at its biggest, and catch every grain

# achievement name
ach-rifttorn-name = the rift torn, storage is solved

# achievement note
ach-rifttorn-note = fill the pit causing an inter-dimensional rift

# achievement note
ach-drowned-note = a whole ocean of inter-dimensional storage.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = clear { $n } boulders, that's a lot of rocks

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } squares

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = diggers

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = deep builders

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit after its number: swings a second
unit-hits-s = hits/s

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower = { $more ->
        [yes] buy { $left } more { $left ->
            [one] grower
           *[other] growers
        } to unlock
       *[no] buy { $left } { $left ->
            [one] grower
           *[other] growers
        } to unlock
    }

# the bench: your carry ladder
row-carry = carry amount

# the bench: holding a handful throws it by itself
row-autotoss = hold to toss

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = brew temporary boosts for your sqworkers

# the bench: what the casino is for, under its name
row-unlockcasino-note = a table that takes a stake and pays double or nothing

# the bench: what the closet is for, under its name
row-unlockouthouse-note = you've seen enough poop, lets clean it up

# the bench: what the air filter is for, under its name
row-unlockfilter-note = sells the balloons that pull the haze back out of the sky, and reads the sky

# the tower: the last barrier's line
row-dome-note = everything of the ground has failed. what is left is not of the ground

# the bench: the net's line
row-net-note = that didn't work, try catching the rock with a net?

# what the breaker hat does
kit-breaker-does = twice the bite

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, at { $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = the ram strikes { $n }x harder

# the strip at a card's foot: buy another copy behind the one being built
card-another = + another

# a finished ladder, where its price would go
card-done = done

# the tower: an enchantment's name
spell-gmo = genetically modify crops

# the tower: the enchantment's line
spell-thrift-note = every house from now on is 75% cheaper

# the tower: the enchantment's line
spell-drive-note = every machine in the yard runs 50% faster

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = each bolt knocks { $next } cells off the star instead of { $now }

# the tower: a wizard's line
row-wizard-note = flies up and bolts the star apart for sparks, and summons a new one when the sky is empty

# the janitor's closet: the roomba's line
row-roomba-note = drives to the mess on the open yard and brings it home; one janitor minds them, and they smoke

# the air filter: the recycler's line
row-recycler-note = what the balloons catch comes down as pebbles instead of muck

# a brew's name: the speed one, priced in crops
tonic-stew = hearty stew

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } s

# the apothecary's keep-brewing setting: on
row-potkeep-on = batch after batch

# the bench: the forklift's line
row-driver-note = a forklift that drives itself: it hauls to the pit with nobody aboard, and smokes

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = needs a quarry

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party = { $nth ->
        [0] the { $who }
        [1] the second { $who }
        [2] the third { $who }
        [3] the fourth { $who }
       *[other] the undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot = { $nth ->
        [0] a station
        [1] a second station
        [2] a third station
        [3] a fourth station
       *[other] a undefined station
    }

# the apothecary's board with nothing on it
station-apothecary-empty = the pot stands cold

# the janitor's closet's board with nothing on it
station-outhouse-empty = the brooms are all on their hooks

# the crusher's pile-full mark, on a hover
station-crusher-full = the floor is full of scales

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = in your hand

# a body's card, doing: what its step is (idle)
crew-now-idle = nothing much

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = minding { $name }

# a body's card, age: under a minute
crew-card-new = new today

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } in { $over }

# the books: the sky full in, while the filter is winning
books-due-never = not at this rate

# the books: a line
books-tally-under = sqwife under the rock for

# the books: a line
books-tally-saved = sqwife saved in

# the hover over the counter above the pit
hover-counter = pebbles in the pit: what everything costs

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } done

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = whoever is nearest

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Give your party { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = takes { $lo }-{ $hi } more damage

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Become a { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = reset – refunds everything

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Martial Artist

# a fighter's tile: dazed, its hover
serp-dazed = Dazed: thrown off, seeing stars

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Choose your fighter
