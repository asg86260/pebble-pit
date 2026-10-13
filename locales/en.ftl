### Pebble Pit, in English: every word a player reads, and the source every
### other language is translated from (DESIGN.md, "Localization").
###
### A message is `id = words`. The line over it says where it shows. A
### `{ $name }` is a number or a name the game puts in; it is never translated,
### but it may move. `{ $n -> [one] ... *[other] ... }` picks a form by the
### number, by the language's own plural rules. `{"{"}` is a literal brace and
### `{" "}` a space Fluent would otherwise trim. A `<br>` is a line break, and
### `<span data-l10n-name="...">` stands for a thing the page fills in.
###
### The words are the owner's: change none of them here without asking.

## Sheets

# rescue sheet heading, end of first half
saved-word = It's Over?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = you saved your sqwife in <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Happily Ever After

# demo end sheet heading
demoend-word = thats it for the demo!

# demo end sheet line
demoend-why = cant save your sqwife just yet.

# demo end store link (if STORE_URL)
demoend-store = wishlist today!

# demo end dismiss button
demoend-keep = keep playing

# free-build teaser end sheet heading
teaseend-word = to be continued in the full game!

# teaser end store link (if STORE_URL)
teaseend-store = get the full game

# teaser end dismiss button
teaseend-keep = keep playing

# second-half end sheet heading
freed-word = ok now its over

# second-half end sheet line
freed-why = you saved your sqhusband from the serpent's belly.

# second-half end sheet line
freed-end = that's the end, feel free to keep slaying the serpent and farming on the surface!

# second-half end sheet line
freed-thanks = thank you!

# second-half end dismiss button
freed-keep = keep playing

# crash sheet heading
crashed-word = stopped

# crash sheet button
crashed-copysave = copy save

# pause sheet heading
held-word = paused

# pause sheet button
held-resume = resume

# pause sheet button (relabelled from JS)
held-slotsbtn = saves

# saves page heading
held-slots-word = saves

# saves page button
held-savecopy = copy a save

# saves page button
held-loadsave = load a save

# saves page paste box confirm
held-loadit = load it

# saves page paste box cancel
held-nevermind = never mind

# saves page back button
held-slotsback = back

# pause sheet button (relabelled from JS)
held-recordbtn = achievements

# achievements page heading
held-record-word = achievements

# achievements page back
held-recordback = back

# pause sheet button (also src/indexpage.js:24)
held-indexbtn = index

# index page heading
held-index-word = index

# index page back
held-indexback = back

# pause sheet button to landing page
held-titlebtn = return to title

# pause sheet button, desktop build only
held-quit = exit to desktop

# pause sheet footer hint
held-keys = esc holds · ← → look about · hold space to skip a scene

# window close button label
modal-close =
    .aria-label = close

# pause sheet reply, desktop export ok
said-saved = saved

# pause sheet reply, desktop export failed
said-notsaved = not saved

# pause sheet reply, store fallback
said-fellback = the last save would not load; this is the one before it

# pause sheet reply, unreadable save
said-broken = your last save could not be read. copy a save hands it over

# pause sheet reply, yard open elsewhere
said-yielded = this yard is open in another tab; that one is being saved

# pause sheet reply, storage blocked
said-unsaved-blocked = not saving: your browser blocks storage inside this page. copy a save still works

# sheet reply after loading a save
said-loaded = loaded

# sheet reply, pasted text invalid
said-notasave = that is not a save

# crash sheet line when error has no message
crashed-why-fallback = something threw

# save row age
slots-since-now = just now

# save row age
slots-since-min = { $m } min ago

# save row age
slots-since-h = { $h } h ago

# save row item
slots-row-rock = rock { $n }

# save row item
slots-row-crew = { $n } crew

# save row item for open slot in play
slots-row-playing = playing

# save row, no yard
slots-row-empty = empty

# save row, broken blob
slots-row-unreadable = unreadable

# saves button label on both fronts
held-slotsbtn-label = saves · { $n } of { $total }

# empty save row after first press
slots-arm = start a new yard?

# sheet reply after opening empty slot
slots-said-new = a new yard

# sheet reply after opening a slot
slots-said-loaded = loaded

# save row delete cross label
slots-del-aria = delete

# achievements button label with count
held-recordbtn-label = achievements · { $count } of { $total }

# achievements page, nothing earned
held-record-none = you haven't done anything yet.

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
        [one] a day ago
       *[other] { $d } days ago
    }

# saves row delete confirm
slots-confirm-yes = delete

# saves row delete cancel
slots-confirm-no = back

# sheet reply, copy with no save
said-copyout-none = nothing saved yet

# sheet reply when clipboard unavailable
said-copyout-window = in window.__save

# index entry back button on phone
held-index-entryback = back

# saves page cloud section heading
cloud-head = cloud saves

# cloud section button
cloud-btn-linkcode = enter a link code

# cloud section button
cloud-btn-recovery = use a recovery code

# cloud section button
cloud-btn-stop = stop cloud saves

# cloud section reply after stop
cloud-said-off = the cloud is off on this device

# cloud section button
cloud-btn-enable = enable cloud syncing

# cloud section reply on failure (also cloud.js:768)
cloud-why-noanswer = the cloud did not answer

# cloud section, copy recovery code
cloud-btn-copy = copy

# cloud section under recovery code
cloud-writedown = write this down: it brings your yards back on a new device

# cloud section, another device ahead
cloud-btn-take = take it

# cloud section, another device ahead
cloud-btn-keep = keep this one

# cloud section reply (also :316)
cloud-said-kept = kept

# cloud section above pairing code
cloud-pair-enter = on the other device, enter

# cloud section, hide pairing code
cloud-btn-done = done

# cloud section button
cloud-btn-link = link a device

# cloud section toggle
cloud-btn-hidecode = hide recovery code

# cloud section toggle
cloud-btn-showcode = show recovery code

# cloud section button
cloud-btn-newcode = new recovery code

# cloud section button, first press
cloud-btn-newcode-armed = sign out other devices?

# link code box placeholder
cloud-box-linkph = ···-···

# recovery code box placeholder
cloud-box-recph = ····-····-····

# link code box label
cloud-box-aria-link = link code

# recovery code box label
cloud-box-aria-rec = recovery code

# cloud section reply, bad code
cloud-wrong = that code didn't work

# cloud section reply after linking
cloud-said-linked = linked

# cloud code entry confirm
cloud-btn-dolink = link

# cloud code entry cancel
cloud-btn-nevermind = never mind

# cloud code entry prompt
cloud-typing-link = the code on the other device

# cloud code entry prompt
cloud-typing-rec = your recovery code

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = too many tries from here today; try tomorrow

# cloud section reply, 503
cloud-why-resting = the cloud is resting; try again later

# cloud section reply, 403
cloud-why-forbidden = the cloud does not know this page

# the cloud's line in the landing page's foot bar: $state is one of the cloud-state lines below
# (with no state, it stands before the choose-a-yard button)
cloud-line = cloud · { $state }

# cloud state: not turned on (in cloud-line, and alone in the saves page section)
cloud-state-off = off

# cloud state
cloud-state-out = signed out

# cloud state
cloud-state-refused = a save was refused

# cloud state
cloud-state-offline = not saved: offline

# cloud state
cloud-state-behind = newer on another device

# cloud state
cloud-state-newer = update to take the newer save

# cloud state
cloud-state-big = too big for the cloud

# cloud state
cloud-state-full = the cloud is full

# cloud state
cloud-state-paused = paused

# cloud state
cloud-state-conflict = choose a yard

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = saved { $since }

# cloud state: on, nothing pushed yet
cloud-state-on = on

# link a device: the pairing code's countdown; $time is m:ss
cloud-pair-left = { $time } left

# choose a yard: this device's copy of slot $n; $here is the yard as a saves row says it
cloud-clash-here = this device · { $n } · { $here }

# choose a yard: the cloud's copy of slot $n; $cloud is the yard as a saves row says it
cloud-clash-cloud = cloud · { $n } · { $cloud }

# a cloud button's answer: too many tries; $m is minutes to wait
cloud-why-wait = too many tries; try again in { $m } min

# window title opened off the books
modal-books = the books

# window title, crew list
modal-crew = who lives here

## Settings

# pause sheet button
held-settingsbtn = settings

# settings page heading
held-settings-word = settings

# settings note where fullscreen unavailable
set-fullscreen-note = for the whole screen, add this page to the home screen

# settings volume slider label
set-volume =
    .aria-label = volume

# settings button to controls page
set-controlsbtn = controls

# controls page heading
set-controls-word = controls

# controls page back
set-controlsback = back

# settings page back
set-settingsback = back

# settings motion switch
set-motion-less = motion: less

# settings motion switch
set-motion-full = motion: full

# settings touch switch (play only)
set-touch-on = touch: on

# settings touch switch (play only)
set-touch-off = touch: off

# settings dark switch
set-dark-on = dark: on

# settings dark switch
set-dark-off = dark: off

# settings sound switch
set-sound-off = sound: off

# settings sound switch
set-sound-on = sound: on

# pause sheet line: a save from a newer build; $build is the build's name
said-newer = this save is from a newer build ({ $build })

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = not saving: this site's storage is full ({ $used } mb used, { $ours } kb of it ours). copy a save still works

# pause sheet line: storage refused a save; $name is the browser's error name
said-unsaved-refused = not saving: storage refused the save ({ $name }). copy a save still works

# pause sheet line: storage refused a save, with no error to name
said-unsaved-refused-why = not saving: storage refused the save. copy a save still works

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = could not load: { $message }

# controls page input column
ctl-leftclick-in = left click

# controls page action column
ctl-leftclick-do = interact

# controls page input column
ctl-rightclick-in = right click

# controls page action column
ctl-rightclick-do = focus workers

# controls page input column
ctl-rightleft-in = right click + left click

# controls page action column
ctl-rightleft-do = pick up workers

# controls page input column
ctl-middle-in = middle click

# controls page action column
ctl-middle-do = move camera

# controls page input column
ctl-wheel-in = scroll wheel

# controls page action column
ctl-wheel-do = move camera

# controls page input column
ctl-arrows-in = ← → / a d

# controls page action column
ctl-arrows-do = move camera

# controls page input column
ctl-digits-in = 1 – 9

# controls page action column
ctl-digits-do = jump to a place

# controls page, with a pad: the d-pad (a placeholder for the owner's words)
ctl-pad-hop = [owner's words: d-pad, move between places]

# controls page, with a pad: B (a placeholder for the owner's words)
ctl-pad-back = [owner's words: B, back]

# controls page, with a pad: Y (a placeholder for the owner's words)
ctl-pad-handback = [owner's words: Y, hand back a queued copy]

# controls page, with a pad: LB / RB (a placeholder for the owner's words)
ctl-pad-turn = [owner's words: LB / RB, the next station's board]

# controls page, with a pad: RT held (a placeholder for the owner's words)
ctl-pad-hand = [owner's words: RT held, the hand: sweep and throw]

# controls page, with a pad: View (a placeholder for the owner's words)
ctl-pad-corner = [owner's words: View, the corner cards]

# controls page, with a pad: Menu (a placeholder for the owner's words)
ctl-pad-hold = [owner's words: Menu, hold the yard]

# controls page, with a pad: R3 (a placeholder for the owner's words)
ctl-pad-look = [owner's words: R3, the camera back to the focus]

# controls page, with a pad: L3 (a placeholder for the owner's words)
ctl-pad-way = [owner's words: L3, through the portal]

# settings fullscreen row
set-fullscreen-on = fullscreen: on

# settings fullscreen row
set-fullscreen-off = fullscreen: off

# a sheet line: the save is on the clipboard; $n is its size in kilobytes
said-copyout-copied = copied { $n }kb

## Title page

# browser tab title, landing
title-doctitle = Pebble Pit

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = a rock. a hole. a few people between them.

# landing page main button
title-play = play

# landing page button (relabelled saves · n of 3)
title-slotsbtn = saves

# landing page button (relabelled, src/record.js:33)
title-recordbtn = achievements

# landing page button
title-settingsbtn = settings

# landing page, desktop build only
title-quit = exit to desktop

# landing saves page heading
title-slots-word = saves

# landing saves page button
title-savecopy = copy a save

# landing saves page button
title-loadsave = load a save

# landing paste confirm
title-loadit = load it

# landing paste cancel
title-nevermind = never mind

# landing saves page back
title-slotsback = back

# landing achievements page heading
title-record-word = achievements

# landing achievements page back
title-recordback = back

# landing settings page heading
title-settings-word = settings

# landing settings to controls
title-controlsbtn = controls

# landing settings back
title-settingsback = back

# landing controls page heading
title-controls-word = controls

# landing controls back
title-controlsback = back

# landing cloud conflict page heading
title-conflict-word = choose a yard

# landing cloud conflict back
title-conflictback = back

# landing foot link
title-link-itch = itch

# landing foot link
title-link-github = github

# under play, empty open slot
title-playlabel-new = a new yard

# landing achievements page, nothing earned
title-record-none = nothing yet

# title foot bar conflict link
cloud-foot-choose = choose a yard

# landing reply, bad paste
title-said-notasave = that is not a save

# landing reply after load
title-said-loaded = loaded

# landing reply after deleting open slot
title-said-erased = erased

## Objectives

# label before story line
obj-next = next

# story line, first step
obj-rock = dig the boulder to save your sqwife!

# intro quest item
obj-rock-q-chip = mine the boulder

# intro quest item
obj-rock-q-pickup = grab a pebble

# intro quest item
obj-rock-q-toss = toss the pebble into the pit

# story line after first fall
obj-falling = try to dig the boulder again!

# story line, wooden roof barrier
obj-props = maybe building a wooden roof will stop the next boulder?

# story line, net barrier
obj-net = nope, try catching the boulder and slowing it down

# story line, arch barrier
obj-arch = lets try building an arch from the mined ore and stone. surely that's sturdy enough.

# story line, wizards' barrier
obj-dome = out of options, lets see if the wizards can help.

# story line before rescue
obj-rescue = save your sqwife

# story line, second half
obj-drown = drown the pit

# story line after snatch
obj-tower = build the wizards' tower

# story line after snatch
obj-talk = talk to the wizards about what just happened

# story line, deep half
obj-portal = conjure a portal to the abyss, what's down there?

# story line, final step
obj-free = free your sqhusband from the serpent's belly

# objective card cancel while building
obj-barrier-cancel = cancel ×{ $n }

## Other

# browser tab title, game page
play-doctitle = Pebble Pit

# skip hint during cutscene, desktop (skiphint.js:27)
other-skip-desk = hold space to skip

# top-edge mess tag
other-messtag-muck = muck

# top-edge mess tag
other-messtag-poop = poop

# floating button over bench site
other-raise = build the bench

# phone pause button label
other-pause =
    .aria-label = pause

title-recordbtn-label = achievements · { $count } of { $total }

# corner fullscreen button tooltip
other-fullscreen-title-on = leave fullscreen

# corner fullscreen button tooltip
other-fullscreen-title-off = fullscreen

# crew-fade corner button label
other-corner-show = show workers

# crew-fade corner button label
other-corner-fade = fade workers

# crew-fade corner button label
other-corner-hide = hide workers

# way corner button tip
other-corner-up = up to the yard

# way corner button tip
other-corner-down = down to the deep

# queue card line hover
other-queue-site-yard = the yard

# queue card line hover
other-queue-site-sphere = the sphere

# queue card, nobody working
other-queue-queued = queued

# board footer toggle
other-hidedone-show = show finished

# board footer toggle
other-hidedone-hide = hide finished

# the queue card: the first in line to be built after the one going up
queue-place-next = next

# the house's board and the crew window, with no crew yet
crew-empty = nobody lives here yet

# a station's name: its board's title, the pointer's label, the queue card
station-bench = the bench

# skip hint during cutscene, phone
other-skip-touch = hold to skip

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = hold <span data-l10n-name="key"></span> to skip

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

## Notices

# toast-shaped card, another device ahead
note-cloud-name = newer on another device

# toast-shaped card, another device ahead
note-cloud-note = saves has the answer

## Numbers

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }h { $m }m

# how long a yard has been played, under an hour
played-m = { $m }m

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }{ $n ->
        [one] st
        [two] nd
        [few] rd
       *[other] th
    }

## Achievements

# toast and achievements card name
ach-firstgrain-name = makin' money

# toast and achievements card note
ach-firstgrain-note = throw a pebble into the pit

# achievement name
ach-firstrock-name = better keep digging

# achievement note
ach-firstrock-note = clear the first rock

# achievement name
ach-gotout-name = you saved your sqwife

# achievement note
ach-gotout-note = no more rocks, you did it.

# achievement name
ach-firsthire-name = you've constructed additional pylons

# achievement note
ach-firsthire-note = build another house

# achievement name
ach-firstshard-name = the first ore

# achievement note
ach-firstshard-note = bring ore up out of the quarry

# achievement name
ach-firstspore-name = cultivation

# achievement note
ach-firstspore-note = grow your first crop

# achievement name
ach-firstspark-name = magic in the air

# achievement note
ach-firstspark-note = earn your first spark

# achievement name
ach-holefull-name = the pit is full

# achievement note
ach-holefull-note = fill the pit to the brim

# achievement name
ach-rifttorn-name = the rift torn, storage is solved

# achievement note
ach-rifttorn-note = fill the pit causing an inter-dimensional rift

# achievement name
ach-drowned-name = the rift has gotten bigger

# achievement note
ach-drowned-note = a whole ocean of inter-dimensional storage.

# achievement name
ach-star-name = conjure a star

# achievement note
ach-star-note = call a star down from the tower

# achievement name
ach-firsthat-name = you're a wizard squarey

# achievement note
ach-firsthat-note = finish a wizard hat at the tower

# achievement name
ach-firstbrew-name = hello, potion seller

# achievement note
ach-firstbrew-note = brew a batch at the apothecary

# achievement name
ach-firsttrade-name = first hat

# achievement note
ach-firsttrade-note = buy a station its first hat

# achievement name
ach-alltrades-name = educating the masses

# achievement note
ach-alltrades-note = stock every station with its hat

# achievement name
ach-allbuilt-name = building complete

# achievement note
ach-allbuilt-note = you built everything

# achievement name
ach-rift1e6-name = 1m through the rift

# achievement note
ach-rift1e6-note = send 1m pebbles through the rift

# achievement name
ach-brew100-name = 100 batches

# achievement note
ach-brew100-note = brew 100 batches

# achievement name
ach-lived1h-name = an hour on one clock

# achievement note
ach-lived1h-note = keep one body on the payroll for an hour

# achievement name
ach-nobodyhired-name = nobody hired

# achievement note
ach-nobodyhired-note = clear a whole boulder with nobody on the payroll

# achievement name
ach-ownhand-name = your own hand alone

# achievement note
ach-ownhand-note = clear a boulder without a single worker touching it

# achievement name
ach-nevertouched-name = never touched it

# achievement note
ach-nevertouched-note = clear a boulder without swinging at it once yourself

# achievement name
ach-underminute-name = a rock off in under a minute

# achievement note
ach-underminute-note = clear a boulder in under a minute

# achievement name
ach-everyjob-name = every job staffed at once

# achievement note
ach-everyjob-note = put at least one body on every job at once

# achievement name
ach-tablebeaten-name = we're so back

# achievement note
ach-tablebeaten-note = come out 50k up on a single hand at the casino

# achievement name
ach-tableruin-name = time to get a loan

# achievement note
ach-tableruin-note = come out 50k down on a single hand at the casino

# achievement name
ach-bird-name = get off my land

# achievement note
ach-bird-note = startle a bird

# achievement name
ach-wholelot-name = not one of you

# achievement note
ach-wholelot-note = startle every bird in one lot

# achievement name
ach-catchall-name = juggler

# achievement note
ach-catchall-note = throw a full hand of dust, at its biggest, and catch every grain

# achievement name
ach-lifted-name = come here you

# achievement note
ach-lifted-note = pick a worker up

# achievement name
ach-shookload-name = turn out your pockets

# achievement note
ach-shookload-note = shake a full load out of a worker

# achievement name
ach-hatoff-name = hats off

# achievement note
ach-hatoff-note = shake the hat off a worker

# achievement name
ach-dizzy-name = shaken baby syndrome

# achievement note
ach-dizzy-note = shake a worker dizzy

# achievement name
ach-muckrain-name = it never rains but it pours

# achievement note
ach-muckrain-note = stand through a muck rain

# achievement name: rocks cleared; $n is the count as written (10, 25, 50, 100)
ach-rocks-name = { $n } rocks

# achievement note: rocks cleared; $n is the count
ach-rocks-note = clear { $n } boulders

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = clear { $n } boulders, that's a lot of rocks

# achievement name: pebbles banked; $n is the count, short (10k, 1m)
ach-pebbles-name = { $n } pebbles

# achievement note: pebbles banked; $n is the count, short
ach-pebbles-note = bank { $n } pebbles

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } squares

# achievement note: crew hired; $n is the count
ach-crew-note = hire a crew of { $n }

# achievement name: the first ore ladder rung
ach-ore0-name = 1k ore out of the cut

# achievement name: the second ore ladder rung
ach-ore1-name = 10k ore

# achievement note: ore dug; $n is the count, short (1k, 10k)
ach-ore-note = dig { $n } ore out of the quarry

# achievement name: a serpent level reached; $n is the level (a placeholder for the owner's words)
ach-serpent-name = [owner's words: name, serpent level { $n }]

# achievement note: a serpent level reached (a placeholder for the owner's words)
ach-serpent-note = [owner's words: note, reach serpent level { $n }]

# achievement name: every deep station standing (a placeholder for the owner's words)
ach-allstations-name = [owner's words: name, every station standing]

# achievement note: every deep station standing (a placeholder for the owner's words)
ach-allstations-note = [owner's words: note, stand a station on every slot in the deep]

## Index

# index entry name
idx-dust-name = pebbles

# index entry text
idx-dust-text = chipped off the boulder by you, the diggers and the ram. toss them into the hole: what is in the hole pays for everything.

# index entry name
idx-shard-name = ore

# index entry text
idx-shard-text = dug out of the quarry by the miners and carried up to the hole. pays for the arch and the later rungs of every ladder.

# index entry name
idx-spore-name = crops

# index entry text
idx-spore-text = grown on the farm and harvested by the farmers. pays for the net, and the apothecary brews with them.

# index entry name
idx-spark-name = sparks

# index entry text
idx-spark-text = shed by the star when the wizards bolt it apart. the machines' coin: every machine, every rung of their ladders, and the rift.

# index entry name
idx-scale-name = scales

# index entry text
idx-scale-text = the deep's coin, crushed out of what the serpent drops.

# index entry name
idx-crit-name = crits

# index entry text
idx-crit-text = now and then a hit lands hard, and a fountain of pebbles comes off instead of a chip. the bench sells the chance and the size.

# index entry name
idx-rock-name = the boulder

# index entry text
idx-rock-text = falls out of the sky, one after another. chip it down for pebbles; each new one drives the last back into the ground.

# index entry name
idx-pit-name = the hole

# index entry text
idx-pit-text = everything you bank lands here, and every bill is paid out of it. it fills up.

# index entry name
idx-rift-name = the rift

# index entry text
idx-rift-text = torn open over the hole once it was full. it swallows what the hole cannot take, and grows as it eats.

# index entry name
idx-abyss-name = the abyss

# index entry text
idx-abyss-text = the hole, drowned. bottomless: whatever goes in, there is always room.

# index entry name
idx-muck-name = muck

# index entry text
idx-muck-text = dirty rain lands as muck. nobody touches it while the storm is still dropping it; after, the crew shovel it up. muck on a station slows the work there.

# index entry name
idx-poop-name = poop

# index entry text
idx-poop-text = everybody has to go sometime. the janitors clean it up.

# index entry name
idx-bird-name = birds

# index entry text
idx-bird-text = they cross the sky now and then. click one and it shakes a few pebbles loose.

# index entry name
idx-house-name = the house

# index entry text
idx-house-text = a room for every body. buy another house to hire somebody; its board is the crew.

# index entry name
idx-pollution-name = pollution

# index entry text
idx-pollution-text = every grain dug kicks a mote into the sky, and the machines put up soot. the fuller the sky, the dirtier the rain. only the air filter takes it down.

# index entry name
idx-cloud-name = clouds

# index entry text
idx-cloud-text = they drift past at the back. when they swell and darken, rain is coming.

# index entry name
idx-rain-name = rain

# index entry text
idx-rain-text = comes when it likes and washes some of the sky down. clean drops just wet the yard; dirty ones land as muck.

# index entry name
idx-lightning-name = lightning

# index entry text
idx-lightning-text = comes with a heavy pour. all show: it touches nothing.

# index entry name
idx-star-name = the star

# index entry text
idx-star-text = a rock in the sky only the wizards can reach. every bit they bolt off sheds sparks; when it is gone they call down the next.

# index entry name
idx-balloon-name = balloon

# index entry text
idx-balloon-text = the air filter's craft: it rides up among the clouds and draws the haze in.

# index entry name
idx-recycler-name = the recycler

# index entry text
idx-recycler-text = hands back some of what the air filter takes out of the sky.

# index entry name
idx-bench-name = the bench

# index entry text
idx-bench-text = your own board: your click, carry and toss, the haulers' gear, crits, the barriers, and the door to every new place.

# index entry name
idx-shack-name = the shack

# index entry text
idx-shack-text = the diggers' hut by the boulder. sells their swing and pick, the breaker hat and the ram.

# index entry name
idx-stats-name = the books

# index entry text
idx-stats-text = the noticeboard: how long you have played and what the yard earns a second.

# index entry name
idx-farm-name = the farm

# index entry text
idx-farm-text = plots that grow crops, worked by farmers. sells plots, tending and yield, the grower hat and the tiller.

# index entry name
idx-quarry-name = the quarry

# index entry text
idx-quarry-text = an open cut; miners work its floor and carry ore up. sells depth, pace and seam, the blaster hat and the drill.

# index entry name
idx-apothecary-name = the apothecary

# index entry text
idx-apothecary-text = a keeper lights the pot and it brews by itself. the brews walk out to the crew.

# index entry name
idx-tower-name = the tower

# index entry text
idx-tower-text = summons wizards, a hat each, who fly up to the star. sells the spells, the sphere and the barrier.

# index entry name
idx-casino-name = the casino

# index entry text
idx-casino-text = no board, just levers. pull the arm and a handful of grains pours down the pegs; the bins they land in pay.

# index entry name
idx-outhouse-name = the janitor's closet

# index entry text
idx-outhouse-text = home of the janitors, who clean up the poop and the muck. sells caps and the roombas.

# index entry name
idx-filter-name = the air filter

# index entry text
idx-filter-text = the only thing that empties the sky. air purifiers work it; its dial reads clean, dirty or filthy.

# index entry name
idx-ram-name = the ram

# index entry text
idx-ram-text = the boulder's machine. bought and tuned with sparks, and it puts up soot.

# index entry name
idx-jaw-name = the drill

# index entry text
idx-jaw-text = the quarry's machine. bought and tuned with sparks, and it puts up soot.

# index entry name
idx-tiller-name = the tiller

# index entry text
idx-tiller-text = the farm's machine. bought and tuned with sparks, and it puts up soot.

# index entry name
idx-belt-name = the belt

# index entry text
idx-belt-text = carries pebbles from the boulder to the hole with nobody minding it. the haulers tip their loads onto it.

# index entry name
idx-sphere-name = the sphere

# index entry text
idx-sphere-text = a shell round the star that catches its light and lets it fall as sparks.

# index entry name
idx-roomba-name = the roombas

# index entry text
idx-roomba-text = little machines that go out from their dock, pick up the mess and bin it.

# index entry name
idx-driver-name = forklift

# index entry text
idx-driver-text = drives itself to the hole with nobody aboard, and smokes.

# index entry name
idx-props-name = wooden barrier

# index entry text
idx-props-text = the first try at holding off the next boulder. it does not hold.

# index entry name
idx-net-name = the net

# index entry text
idx-net-text = rope that catches the boulder and lets it down slowly. it does not hold either.

# index entry name
idx-arch-name = the arch

# index entry text
idx-arch-text = stone that catches one, and then the crack runs.

# index entry name
idx-dome-name = the barrier

# index entry text
idx-dome-text = poured by the wizards, not carried. this one holds.

# index entry name
idx-deep-name = the deep

# index entry text
idx-deep-text = the water under the drowned hole, where the serpent lives.

# index entry name
idx-portal-name = the portal

# index entry text
idx-portal-text = conjured by the wizards over the abyss: the way down to the deep.

# index entry name
idx-crusher-name = the crusher

# index entry text
idx-crusher-text = where the deep's scales are crushed and kept.

# index entry name
idx-pods-name = the pods

# index entry text
idx-pods-text = the deep's houses: a room for a body down there.

# index entry text
idx-haul-text = carry pebbles from the ground to the hole. anybody without a job hauls, and they shovel muck too.

# index entry name
idx-rockcrew-name = diggers

# index entry text
idx-rockcrew-text = swing at the boulder from its row. the shack sells their swing and pick.

# index entry name
idx-quarrycrew-name = miners

# index entry text
idx-quarrycrew-text = work the quarry's floor and bring ore up.

# index entry name
idx-farmcrew-name = farmers

# index entry text
idx-farmcrew-text = tend the plots and harvest the crops.

# index entry name
idx-purify-name = air purifiers

# index entry text
idx-purify-text = work the air filter. only the ones inside it count.

# index entry name
idx-stir-name = apothecary

# index entry text
idx-stir-text = the keeper who lights the pot.

# index entry text
idx-janitor-text = go after the poop first, then the muck.

# index entry text
idx-wizard-text = fly up and bolt the star apart for sparks, and call down a new one. they pour the barrier too.

# index entry text
idx-build-text = spare hands lent to put up a building or a machine.

# index entry name
idx-breaker-name = breaker

# index entry text
idx-breaker-text = the diggers' hat: twice the bite.

# index entry name
idx-carter-name = carter

# index entry text
idx-carter-text = the haulers' cart: twice the load.

# index entry name
idx-blaster-name = blaster

# index entry text
idx-blaster-text = the miners' hat: twice the trips.

# index entry name
idx-grower-name = grower

# index entry text
idx-grower-text = the farmers' hat: twice the tending.

# index entry name
idx-brews-name = brews

# index entry text
idx-brews-text = one for each coin. hearty stew speeds a body up, strong brew makes it stronger, bracing tonic makes it crit.

# index entry text
idx-party-text = crew gone down to the deep to fight the serpent, a fighter to a station.

# index entry name
idx-sqwife-name = sqwife

# index entry text
idx-sqwife-text = buried by the first boulder. every one you clear, somebody runs to dig; every new one drives them back in.

# index entry name
idx-objective-name = objective

# index entry text
idx-objective-text = the line at the top: the story's next step.

# index entry name
idx-notices-name = achievements

# index entry text
idx-notices-text = the yard's milestones. this sheet keeps the ones you have earned.

# index entry name
idx-rescue-name = you saved your sqwife

# index entry text
idx-rescue-text = the barrier held, and the sqwife came out.

# index entry name
idx-cutscene-name = scenes

# index entry text
idx-cutscene-text = now and then a scene takes the camera. hold space to skip one.

# index entry name
idx-sqhusband-name = sqhusband

# index entry text
idx-sqhusband-text = snatched by the serpent after the rescue. free him from its belly.

# index entry name
idx-serpent-name = the serpent

# index entry text
idx-serpent-text = lives in the deep, and swallowed the sqhusband.

# index: a group heading in the list, and under an entry's name
idx-grp-materials = materials

# index: a group heading in the list, and under an entry's name
idx-grp-yard = the yard

# index: a group heading in the list, and under an entry's name
idx-grp-sky = the sky

# index: a group heading in the list, and under an entry's name
idx-grp-places = places

# index: a group heading in the list, and under an entry's name
idx-grp-crew = crew

# index: a group heading in the list, and under an entry's name
idx-grp-story = the story
