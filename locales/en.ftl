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

# rescue sheet line, naming your sqouse by the name the player gave, else by their role; the span is the time it took, filled in by the game
saved-why-who = you saved { $named ->
        [yes] { $name }
       *[no] your { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    } in <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Happily Ever After

# demo end sheet heading
demoend-word = thats it for the demo!

# demo end sheet line
demoend-why = cant save your sqwife just yet.

# demo end sheet line, naming your sqouse by name, else by role
demoend-why-who = cant save { $named ->
        [yes] { $name }
       *[no] your { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    } just yet.

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

# second-half end sheet line, naming you (the one the serpent swallowed) by name, else by role
freed-why-who = you saved { $named ->
        [yes] { $name }
       *[no] your { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    } from the serpent's belly.

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

# crash sheet button under copy save, opening the feedback form in place
crashed-fbbtn = send report

# crash sheet line over the feedback form's box, asking for the save with the report
crashed-fb-ask = your save helps find what broke

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

# pause sheet button to the feedback page, under settings
held-fbbtn = feedback

# settings page heading
held-settings-word = settings

# settings note where fullscreen unavailable
set-fullscreen-note = for the whole screen, add this page to the home screen

# settings volume slider label
set-volume =
    .aria-label = volume

# the feedback page's back, and the picker's
set-controlsback = back

# settings tab strip, on the held sheet and the landing page: motion, dark and fullscreen
set-tab-graphics = graphics

# settings tab strip: sound and volume
set-tab-audio = audio

# settings tab strip: the touch switch and the controls table
set-tab-controls = controls

# settings tab strip: the language list
set-tab-language = language

# feedback page heading
set-fb-word = comments · concerns · bugs

# feedback form: the box's hint while it is empty
fb-box =
    .placeholder = tell us your feedback

# feedback form: the tick that sends the save along
fb-tick = send my save

# feedback form's send button
fb-send = send

# feedback form's send button while the report is on its way
fb-sending = sending

# feedback form, once the report is taken
fb-sent = sent, thanks

# feedback form, once the report is taken but its save was not, the worker's store being full
fb-sent-nosave = sent, but the save could not be kept

# feedback form, under the sent line: where a reply would be found; $target is the store, steam or itch
fb-sent-where = { $target ->
    [steam] to talk, use the store page's discussions
   *[other] to talk, use the itch page's comments
}

# feedback form, when a send did not go: the words and the tick are kept and nothing is sent later
fb-failed = did not send. your words are kept, try again

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

# settings dark switch: the first dark page, light gray on charcoal
set-dark-dim = dark: dim

# settings dark switch
set-dark-off = dark: off

# settings readable-text switch: the page's words in a plainer face, a size up
set-readable-on = readable text: on

# settings readable-text switch
set-readable-off = readable text: off

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

# controls page, with a pad: the d-pad
ctl-pad-hop = move between places

# controls page, with a pad: B
ctl-pad-back = back

# controls page, with a pad: X
ctl-pad-handback = hand back a queued copy

# controls page, with a pad: LB / RB
ctl-pad-turn = next or last board

# controls page, with a pad: RT held
ctl-pad-hand = hold for the hand: sweep and throw

# controls page, with a pad: View
ctl-pad-corner = the corner cards

# controls page, with a pad: Menu
ctl-pad-hold = hold the yard

# controls page, with a pad: R3
ctl-pad-look = camera back to the focus

# controls page, with a pad: L3
ctl-pad-way = through the portal

# controls page group heading: clicking things in the yard
ctl-group-interact = interact

# controls page group heading: the workers
ctl-group-crew = crew

# controls page group heading: the view
ctl-group-camera = camera

# controls page group heading: the boards
ctl-group-boards = boards

# controls page group heading: going from place to place
ctl-group-travel = travel

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

# landing settings back
title-settingsback = back

# landing feedback page back
title-controlsback = back

# landing settings button to the feedback page, at the foot beside back
title-fbbtn = feedback

# landing feedback page heading
title-fb-word = comments · concerns · bugs

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

# story line, first step, naming your sqouse by name, else by role
obj-rock-who = dig the boulder to save { $named ->
        [yes] { $name }
       *[no] your { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    }!

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

# story line: the rescue, naming your sqouse by name, else by role
obj-rescue-who = save { $named ->
        [yes] { $name }
       *[no] your { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    }

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

# story line, final step, naming you (the one in the belly) by name, else by role
obj-free-who = free { $named ->
        [yes] { $name }
       *[no] your { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    } from the serpent's belly

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
# the save mark in the corner, a disk shown as a save lands
savemark-saved = saved

# the save mark struck through while another tab has the save: what a press does
savemark-take = press to save this tab instead

other-corner-show = show workers

# crew-fade corner button label
other-corner-fade = fade workers

# crew-fade corner button label
other-corner-hide = hide workers

# way corner button tip
other-corner-up = up to the yard

# way corner button tip
other-corner-down = down to the deep

# way corner button tip, in heaven
other-corner-down-yard = down to the yard

# way corner button tip, in the yard once heaven is open
other-corner-up-after = up to the afterlife

# way corner button tip, in the deep once hell is open
other-corner-down-hell = down to hell

# way corner button tip, in hell
other-corner-up-deep = up to the deep

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

# the casino's marquee, idle (drawn in the sign's own pixel capitals)
casino-sign = CASINO

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

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
ach-gotout-name = complete act 1

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

# achievement name: a serpent level reached; $n is the level
ach-serpent-name = serpent level { $n }

# achievement note: a serpent level reached
ach-serpent-note = reach serpent level { $n }

# achievement name: every deep station standing
ach-allstations-name = full party

# achievement note: every deep station standing
ach-allstations-note = stand a station on every slot in the deep

## Index

# index entry name
idx-dust-name = pebbles

# index entry text
idx-dust-text = mined off of the boulder.

# index entry name
idx-shard-name = ore

# index entry text
idx-shard-text = mined out of the quarry.

# index entry name
idx-spore-name = crops

# index entry text
idx-spore-text = grown on the farm.

# index entry name
idx-spark-name = sparks

# index entry text
idx-spark-text = bolted off the star by the wizards.

# index entry name
idx-scale-name = scales

# index entry text
idx-scale-text = crushed out of what the serpent drops.

# index entry name
idx-crit-name = crits

# index entry text
idx-crit-text = has a chance to do more damage.

# index entry name
idx-rock-name = the boulder

# index entry text
idx-rock-text = squished your sqwife, mined for valuable pebbles.

# index entry text, naming your sqouse by name, else by role
idx-rock-text-who = squished { $named ->
        [yes] { $name }
       *[no] your { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    }, mined for valuable pebbles.

# index entry name
idx-pit-name = the pit

# index entry text
idx-pit-text = toss your pebbles, and whatever else into here for storage.

# index entry name
idx-rift-name = the rift

# index entry text
idx-rift-text = massive pebble concentration caused a rift in reality?

# index entry name
idx-abyss-name = the abyss

# index entry text
idx-abyss-text = the rift consumed too many pebbles to remain stable, engulfing the entire pit.

# index entry name
idx-muck-name = muck

# index entry text
idx-muck-text = pollution corrupts the ecosystem and rain leaves behind piles of gunk.

# index entry name
idx-poop-name = poop

# index entry text
idx-poop-text = ew.

# index entry name
idx-bird-name = birds

# index entry text
idx-bird-text = regular birds.

# index entry name
idx-house-name = the house

# index entry text
idx-house-text = where the workers live.

# index entry name
idx-pollution-name = pollution

# index entry text
idx-pollution-text = the cost of industry. mining, farming, quarrying, wizarding, all creates pollution that will dirty up the air.







# index entry name
idx-star-name = the star

# index entry text
idx-star-text = a real star generated by wizards magic, blasted for sparks.

# index entry name
idx-balloon-name = balloon

# index entry text
idx-balloon-text = equipped with an air filter that cleans pollution from the clouds.

# index entry name
idx-recycler-name = the recycler

# index entry text
idx-recycler-text = concentrates air pollution into usable pebbles.

# index entry name
idx-bench-name = the bench

# index entry text
idx-bench-text = basically the general store. hauler upgrades, manual upgrades, new buildings.

# index entry name
idx-shack-name = the shack

# index entry text
idx-shack-text = shop for buying miner upgrades.

# index entry name
idx-stats-name = the books

# index entry text
idx-stats-text = holds various stats for your game, income, time played.

# index entry name
idx-farm-name = the farm

# index entry text
idx-farm-text = plots that grow crops.

# index entry name
idx-quarry-name = the quarry

# index entry text
idx-quarry-text = dig deep for ores.

# index entry name
idx-apothecary-name = the apothecary

# index entry text
idx-apothecary-text = where the brews are made.

# index entry name
idx-tower-name = the tower

# index entry text
idx-tower-text = home of the wizards.

# index entry name
idx-casino-name = the casino

# index entry text
idx-casino-text = peg board based casino.

# index entry name
idx-outhouse-name = the janitor's closet

# index entry text
idx-outhouse-text = home of the janitors.

# index entry name
idx-filter-name = the air filter

# index entry text
idx-filter-text = draws the pollution out of the sky.

# index entry name
idx-ram-name = the ram

# index entry text
idx-ram-text = quickly chunk through boulders.

# index entry name
idx-jaw-name = the drill

# index entry text
idx-jaw-text = machine drill for quick excavation.

# index entry name
idx-tiller-name = the tiller

# index entry text
idx-tiller-text = tractors make quick work of the crops.

# index entry name
idx-belt-name = the belt

# index entry text
idx-belt-text = automatically dump pebbles into the pit.

# index entry name
idx-sphere-name = the sphere

# index entry text
idx-sphere-text = a dyson sphere to harvest the stars power.

# index entry name
idx-roomba-name = robot vacuums

# index entry text
idx-roomba-text = automated vacuums to clean up messes.

# index entry name
idx-driver-name = forklift

# index entry text
idx-driver-text = automated forklift to carry loads of resources very quickly.

# index entry name
idx-props-name = wooden barrier

# index entry text
idx-props-text = the desperate attempt at holding off the boulder.

# index entry name
idx-net-name = the net

# index entry text
idx-net-text = weave crops into a net to catch and slow the boulder.

# index entry name
idx-arch-name = the arch

# index entry text
idx-arch-text = a sturdy stone and metal arch to try to hold off the boulder.

# index entry name
idx-dome-name = the barrier

# index entry text
idx-dome-text = an energy barrier conjured by the wizards.

# index entry name
idx-deep-name = the abyss

# index entry text
idx-deep-text = not quite space, not quite ocean, something in between.

# index entry name
idx-portal-name = the portal

# index entry text
idx-portal-text = only way in and out of the abyss.

# index entry name
idx-crusher-name = the crusher

# index entry text
idx-crusher-text = where the deep's scales are kept.

# index entry name
idx-pods-name = the pods

# index entry text
idx-pods-text = pods for abyssal workers.

# index entry text
idx-haul-text = carry pebbles into the pit.

# index entry name
idx-rockcrew-name = diggers

# index entry text
idx-rockcrew-text = swing at the boulder.

# index entry name
idx-quarrycrew-name = miners

# index entry text
idx-quarrycrew-text = dig ore in the quarry.

# index entry name
idx-farmcrew-name = farmers

# index entry text
idx-farmcrew-text = farms the crops.

# index entry name
idx-purify-name = air purifiers

# index entry text
idx-purify-text = flies the air purifier balloons around to clean up the sky.

# index entry name
idx-stir-name = apothecary

# index entry text
idx-stir-text = in charge of one batch of brews.

# index entry text
idx-janitor-text = clean up the poop and the muck.

# index entry text
idx-wizard-text = learned magic users that have the ability to chunk of pieces of a star.

# index entry text
idx-build-text = put up buildings and machines.

# index entry name
idx-breaker-name = breaker

# index entry text
idx-breaker-text = much more impactful while digging the boulder.

# index entry name
idx-carter-name = carter

# index entry text
idx-carter-text = haulers can pull a cart around to double their capacity.

# index entry name
idx-blaster-name = blaster

# index entry text
idx-blaster-text = equipped with small explosives to really excavate ore.

# index entry name
idx-grower-name = grower

# index entry text
idx-grower-text = able to tend to crops twice as much.

# index entry name
idx-brews-name = brews

# index entry text
idx-brews-text = special brews from the apothecary.

# index entry text
idx-party-text = brave party of adventurers willing to risk their life to defeat the serpent.

# index entry name
idx-sqwife-name = sqwife

# index entry name for your sqouse: the name the player gave, else the role word
idx-sqwife-name-who = { $named ->
        [yes] { $name }
       *[no] { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    }

# index entry text
idx-sqwife-text = living her life, until the incident(s), stuck under infinitely falling boulders from the sky. crazy.

# index entry text for your sqouse, the pronoun by their role
idx-sqwife-text-who = living { $so ->
        [wife] her
        [husband] his
       *[ouse] their
    } life, until the incident(s), stuck under infinitely falling boulders from the sky. crazy.



# index entry name
idx-notices-name = achievements

# index entry text
idx-notices-text = the yard's milestones.







# index entry name
idx-serpent-name = the serpent

# index entry text
idx-serpent-text = some weird abyssal snake like creature that inhabits the abyss.







## Jobs

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = diggers

# a job, as the boards, the crew and the index say it (the save's key is haulers)
job-haulers = haulers

# a job, as the boards, the crew and the index say it (the save's key is quarriers)
job-quarriers = miners

# a job, as the boards, the crew and the index say it (the save's key is farmhands)
job-farmhands = farmers

# a job, as the boards, the crew and the index say it (the save's key is scholars)
job-scholars = scholars

# a job, as the boards, the crew and the index say it (the save's key is purifiers)
job-purifiers = air purifiers

# a job, as the boards, the crew and the index say it (the save's key is stirrers)
job-stirrers = apothecary

# a job, as the boards, the crew and the index say it (the save's key is janitors)
job-janitors = janitors

# a job, as the boards, the crew and the index say it (the save's key is wizards)
job-wizards = wizards

# a job, as the boards, the crew and the index say it (the save's key is builders)
job-builders = builders

# a job, as the boards, the crew and the index say it (the save's key is fighters)
job-fighters = fighters

# a job, as the boards, the crew and the index say it (the save's key is gatherers)
job-gatherers = gatherers

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = deep builders

## Boards

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit: so many a minute; $icon is the coin's mark (html)
unit-per-min = { $icon }/min

# a row's unit: so many a dig; $icon is the coin's mark (html)
unit-per-dig = { $icon }/dig

# a row's unit: so many a harvest; $icon is the coin's mark (html)
unit-per-harvest = { $icon }/harvest

# a row's unit after its number: swings a second
unit-hits-s = hits/s

# a row's unit after its number: swings a second, from one
unit-hit-s = hit/s

# a row's unit after its number: throws a second
unit-throws-s = throws/s

# a row's unit after its number: a wizard's bolts a minute
unit-bolts-min = bolts/min

# a row's unit after its number: star cells a bolt knocks off
unit-cells-bolt = cells/bolt

# a row's unit after its number: haze a balloon takes in a second
unit-motes-s = motes/s

# a row's unit after its number: farm plots
unit-plots = plots

# a row's unit after its number: the quarry's shovels
unit-shovels = shovels

# a row's unit after its number: the apothecary's pots
unit-pots = pots

# a row's unit after its number: doses a batch
unit-doses = doses

# a unit after a number: seconds
unit-s = s

# a deep row's unit after its number: damage
unit-dmg = dmg

# a deep row's unit after its number: damage a second
unit-dmg-s = dmg/s

# a brew's unit after its percentage: how much faster
unit-faster = faster

# a brew's unit after its percentage: how much stronger
unit-stronger = stronger

# a brew's unit after its number: crit chance
unit-crit = crit

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

# a machine's row until its station's set of blaster hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-blaster = { $more ->
        [yes] buy { $left } more { $left ->
            [one] blaster
           *[other] blasters
        } to unlock
       *[no] buy { $left } { $left ->
            [one] blaster
           *[other] blasters
        } to unlock
    }

# a price in time, a minute or more: $n minutes
price-min = { $n } min

# a row's verb, before its gain: how much a hand holds
does-hold = hold

# the bench: your carry ladder
row-carry = carry amount

# a row's verb, before its gain: swings
does-hit = hit

# the bench: your swing pace ladder
row-speed = auto swing

# the bench: the build-speed ladder
row-buildspeed = build speed

# a row's verb, before its gain: how fast a builder works
does-build = pace

# a row's verb, before its gain: throws
does-throw = throw

# the bench: how often a held hand lets go
row-toss = throw pace

# a row's verb, before its gain: how far a throw carries
does-reach = reach

# the bench: how far a handful carries
row-reach = throw reach

# a row's verb, before its gain: what a swing takes
does-per-swing = per swing

# the bench: what a swing of yours takes
row-pick = pick damage

# the bench: holding a handful throws it by itself
row-autotoss = hold to toss

# the bench: holding the pointer on the boulder swings by itself
row-auto = hold to mine

# a row's verb, before its gain: how much a body carries
does-carry = carry

# the bench: the haulers' load ladder
row-haulcarry = hauler carry

# a row's verb, before its gain: walking pace
does-walk = walk

# the bench: the haulers' pace ladder
row-haulpace = hauler speed

# a row's verb, before its gain: crits
does-crit = crit

# the bench: the chance a hit is a crit
row-critchance = crit chance

# the bench: how much more a crit takes
row-critmult = crit damage

# the shack: the diggers' swing pace ladder
row-rockhandspeed = swing speed

# the shack: what a digger's swing takes
row-rockhandpick = digger pick damage

# the bench: the row that puts up the apothecary
row-unlockapothecary = build the apothecary

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = brew temporary boosts for your sqworkers

# the bench: what the apothecary row gives, where a gain would go
row-unlockapothecary-blurb = brews crew tonics

# the bench: the row that puts up the casino
row-unlockcasino = build the casino

# the bench: what the casino is for, under its name
row-unlockcasino-note = a table that takes a stake and pays double or nothing

# the bench: what the casino row gives, where a gain would go
row-unlockcasino-blurb = double or nothing

# the bench: the row that puts up the farm
row-unlockfarm = build the farm

# the bench: what the farm is for, under its name
row-unlockfarm-note = grow some crops

# the bench: what the farm row gives, where a gain would go
row-unlockfarm-blurb = grow crops

# the bench: the row that puts up the air filter
row-unlockfilter = build the air filter

# the bench: what the air filter is for, under its name
row-unlockfilter-note = sells the balloons that pull the haze back out of the sky, and reads the sky

# the bench: what the air filter row gives, where a gain would go
row-unlockfilter-blurb = clears the sky

# the bench: the row that puts up the janitor's closet
row-unlockouthouse = build the janitor's closet

# the bench: what the closet is for, under its name
row-unlockouthouse-note = you've seen enough poop, lets clean it up

# the bench: what the closet row gives, where a gain would go
row-unlockouthouse-blurb = poop, cleaned up

# the bench: the row that puts up the quarry
row-unlockquarry = build the quarry

# the bench: what the quarry is for, under its name
row-unlockquarry-note = start digging for ore

# the bench: what the quarry row gives, where a gain would go
row-unlockquarry-blurb = dig for ore

# the bench: the row that puts up the shack
row-unlockshack = build the shack

# the bench: what the shack is for, under its name
row-unlockshack-note = Digging upgrades

# the bench: what the shack row gives, where a gain would go
row-unlockshack-blurb = gear for the rock

# the bench: the row that puts up the tower
row-unlocktower = discover the tower

# the bench: what the tower is for, under its name
row-unlocktower-note = summon some wizards

# the bench: the first barrier against the boulder
row-props = wooden barrier

# the bench: the wooden barrier's line
row-props-note = quickly try to build a barrier to save your sqwife

# the bench: the wooden barrier's line, naming your sqouse by name, else by role
row-props-note-who = quickly try to build a barrier to save { $named ->
        [yes] { $name }
       *[no] your { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    }

# the bench: the second barrier
row-net = the net

# the bench: the net's line
row-net-note = that didn't work, try catching the rock with a net?

# the bench: the third barrier
row-arch = cut the arch

# the bench: the arch's line
row-arch-note = still not sturdy enough. lets build a stone arch.

# the tower: the last barrier, the wizards'
row-dome = maybe the wizards would know?

# the tower: the last barrier's line
row-dome-note = everything of the ground has failed. what is left is not of the ground

# a hat's name: the diggers' (its row, the index, the crew)
kit-breaker = breaker

# what the breaker hat does
kit-breaker-does = twice the bite

# where the breaker hat is worn
kit-breaker-place = the rock

# a hat's name: the haulers' cart
kit-carter = carter

# what the cart does
kit-carter-does = twice the load

# where the cart is used
kit-carter-place = the pit

# a hat's name: the miners'
kit-blaster = blaster

# what the blaster hat does
kit-blaster-does = twice the trips

# where the blaster hat is worn
kit-blaster-place = the quarry

# a hat's name: the farmers'
kit-grower = grower

# what the grower hat does
kit-grower-does = twice the tending

# where the grower hat is worn
kit-grower-place = the farm

# the bench: a forklift that drives itself
row-driver = forklift

# the bench: the forklift's line
row-driver-note = a forklift that drives itself: it hauls to the pit with nobody aboard, and smokes

# the bench: the forklifts' load ladder
row-liftload = forklift load

# a row's verb, before its gain: driving pace
does-drive = drive

# the bench: the forklifts' pace ladder
row-liftpace = forklift speed

# a heading on the bench's board: your own ladders
sect-you = you

# a heading on the bench's board: the crit ladders
sect-luck = lucky swings

# a heading on the bench's board: the haulers' gear
sect-haulers = the haulers

# a heading on the bench's board: the rows that put up a new place
sect-build = build

# the bench: a section heading over the rows that speed up building
sect-building = building

# the house's board: buy another house to hire somebody
row-house = another house

# the ribbon on every goal card: the barrier the story is on
goal-title = saving your sqwife

# the ribbon on every goal card: the barrier the story is on, naming your sqouse by name, else by role
goal-title-who = saving { $named ->
        [yes] { $name }
       *[no] your { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    }

# a card greyed out: its next rung costs crops, and there is no farm yet
needs-spore = needs crops

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = needs a quarry

# a card greyed out: its next rung costs a spark, and none has been earned
needs-spark = needs a spark

# a card greyed out: its next rung costs a scale, and the deep is not open
needs-scale = needs a scale

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, at { $place }

# the shack: the ram's tuning ladder
row-tuneram = ram strike

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = the ram strikes { $n }x harder

# a heading on any board over the rows no section names
sect-and = and

# a card the yard is at: somebody is building it (the strip's word with nothing to hand back; the gain line's word)
card-building = building

# the strip at a card's foot: buy another copy behind the one being built
card-another = + another

# a card in line: nobody is at it yet
card-queued = queued

# a finished ladder, where its price would go
card-done = done

# the tower: an enchantment's name
spell-drive = speed the machines

# the tower: the enchantment's line
spell-drive-note = every machine in the yard runs 50% faster

# the tower: an enchantment's name
spell-luck = enrich the quarry

# the tower: the enchantment's line
spell-luck-note = every dig in the quarry brings up 25% more ore

# the tower: an enchantment's name
spell-gmo = genetically modify crops

# the tower: the enchantment's line
spell-gmo-note = every crop is 25% bigger

# the tower: an enchantment's name
spell-thrift = cheapen the houses

# the tower: the enchantment's line
spell-thrift-note = every house from now on is 75% cheaper

# the tower: an enchantment's name
spell-sweep = quicken the janitors

# the tower: the enchantment's line
spell-sweep-note = janitors shovel and walk twice as fast

# the tower: how often a wizard throws
row-wizspeed = quicker casting

# the tower: how often a wizard throws, its line; $pct is the rise a rung
row-wizspeed-note = every wizard throws a bolt at the star { $pct }% more often

# a row's verb, before its gain: a wizard's casting
does-cast = cast

# the tower: how much of the star a bolt takes
row-wizpower = heavier bolts

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = each bolt knocks { $next } cells off the star instead of { $now }

# the tower: a wizard's hat
row-wizard = summon a wizard

# the tower: a wizard's line
row-wizard-note = flies up and bolts the star apart for sparks, and summons a new one when the sky is empty

# the tower: the sphere's line
row-sphere-note = capture the power of a star

# the tower: the sphere's tuning ladder
row-tunesphere = sphere yield

# the tower: the sphere's tuning ladder, its line; $n is how many times the light
row-tunesphere-note = the sphere catches { $n }x the light

# the tower: the barrier the wizards pour
row-dome-tower = conjure the barrier

# the tower: the barrier's line
row-dome-tower-note = nothing can get past this thing.

# the tower: the way down to the deep
row-portal = conjure the portal

# the tower: the portal's line
row-portal-note = a way down into the abyss, held open.

# a heading on the tower's board: the spells
sect-enchantments = enchantments

# a heading on the tower's board: the portal
sect-abyss = the abyss

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign (50%)
spell-drive-blurb = +{ $pct } speed

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-luck-blurb = +{ $pct } ore

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-gmo-blurb = +{ $pct } spores

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-thrift-blurb = { $pct } cheaper

# the tower: what the enchantment gives, where a gain would go; $x is how many times
spell-sweep-blurb = { $x }x faster

# the farm: what a harvest is worth, a ladder
row-crop = crop yield

# a row's verb, before its gain: tending plots
does-tend = tend

# the farm: how often a plot is tended, a ladder
row-tend = farming speed

# the farm: break another plot
row-farmplot = another plot

# the farm: the tiller's tuning ladder
row-tunetiller = tiller pace

# the farm: the tiller's tuning ladder, its line; $n is how many times faster
row-tunetiller-note = the tiller works { $n }x faster

# a heading on the farm's board: what a plot pays
sect-crop = the crop

# the quarry: what a dig turns up, a ladder
row-seam = ore yield

# a row's verb, before its gain: digging
does-dig = dig

# the quarry: how often a dig happens, a ladder
row-quarrypace = mining speed

# the quarry: another miner's shovel at the face
row-quarrybench = another shovel

# the quarry: the drill's tuning ladder
row-tunejaw = drill bite

# the quarry: the drill's tuning ladder, its line; $n is how many times harder
row-tunejaw-note = the drill bites { $n }x harder

# a heading on the quarry's board: what the hole pays
sect-ore = the ore

# a heading on the farm's board over who works the plots, with their headcount (the job's save key, as it has always read)
sect-farmhands = farmhands

# a heading on the quarry's board over who works the cut, with their headcount (the job's save key, as it has always read)
sect-quarriers = quarriers

# a row's verb, before its gain: a balloon's flight
does-fly = fly

# the air filter: how fast the balloons go from cloud to cloud
row-balloonspeed = balloon speed

# a row's verb, before its gain: what a balloon takes in
does-filter = filter

# the air filter: how much haze a balloon draws
row-power = balloon power

# the air filter: another balloon
row-balloon = the balloon

# the air filter: the balloon's line
row-balloon-note = rides the clouds and lets what it catches fall under itself

# the air filter: the recycler
row-recycler = the recycler

# the air filter: the recycler's line
row-recycler-note = what the balloons catch comes down as pebbles instead of muck

# a heading on the air filter's board
sect-equipment = equipment

# the janitor's closet: the second cap on the stand
row-loopost = another cap

# the janitor's closet: another roomba
row-roomba = a roomba

# the janitor's closet: the roomba's line
row-roomba-note = drives to the mess on the open yard and brings it home; one janitor minds them, and they smoke

# the janitor's closet: the roombas' tuning ladder
row-tuneroomba = roomba suction

# the janitor's closet: the roombas' tuning ladder, its line; $n is how many times faster
row-tuneroomba-note = the roombas take in { $n }x faster

# a brew's name: the speed one, priced in crops
tonic-stew = hearty stew

# a brew's name: the strength one, priced in ore
tonic-strong = strong brew

# a brew's name: the crit one, priced in sparks
tonic-brace = bracing tonic

# the apothecary: keep the fires going, or let them die once a batch is dealt (a setting)
row-potkeep = keep brewing

# the apothecary's keep-brewing setting: on
row-potkeep-on = batch after batch

# the apothecary's keep-brewing setting: off
row-potkeep-off = just this one

# the apothecary: room for one more pot and its stirrer
row-anotherpot = another pot

# a row's verb, before its gain: how long a dose lasts
does-lasts = lasts

# the apothecary: how long a dose lasts, a ladder
row-bufflength = brew concentration

# the apothecary: doses a batch, a ladder
row-brewdoses = batch size

# a heading on the apothecary's board over the pots, with the stirrers' headcount
sect-pot = the pot

# a heading on the apothecary's board
sect-brewing = brewing

# a heading on the apothecary's board: one ladder a brew
sect-potency = potency

# a brew's potency row's verb, before its gain
does-faster = faster

# a brew's potency row's verb, before its gain
does-stronger = stronger

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } s

# what the crit brew does: $v points of crit chance for $secs seconds
tonic-gain-crit = +{ $v } crit, { $secs } s

# the shack's heading over the diggers' gear, with their headcount
sect-diggers = diggers

## Machines

# a machine's name: the quarry's (the save's key is jaw)
machine-jaw = the drill

# a machine's name: the boulder's
machine-ram = the ram

# a machine's name: the farm's
machine-tiller = the tiller

# a machine's name: carries pebbles from the boulder to the hole
machine-belt = the belt

# a machine's name: the shell round the star
machine-sphere = the sphere

# a machine's name: the janitor's closet's
machine-roomba = the roombas

## Stations

# a deep station's board with nothing on it yet
station-party-empty = nothing to learn yet

# a station's name: its board's title, the pointer's label, the queue card
station-casino = the casino

# a station's name
station-filter = the air filter

# the air filter's board with nothing on it
station-filter-empty = nothing to fit

# a station's name
station-quarry = the quarry

# the quarry's board with nothing on it
station-quarry-empty = the quarry is as deep as it goes

# a station's name
station-farm = the farm

# the farm's board with nothing on it
station-farm-empty = the ground is all broken

# a station's name
station-apothecary = the apothecary

# the apothecary's board with nothing on it
station-apothecary-empty = the pot stands cold

# a station's name
station-tower = the tower

# the tower's board with nothing on it
station-tower-empty = nothing stirs in here yet

# a station's name
station-shack = the shack

# the shack's board with nothing on it
station-shack-empty = the tools are all on the rock

# the bench's board with nothing on it
station-bench-empty = nothing to sell

# a station's name
station-outhouse = the janitor's closet

# the janitor's closet's board with nothing on it
station-outhouse-empty = the brooms are all on their hooks

# a station's name
station-house = the house

# a station's name: the noticeboard over the pit
station-stats = the books

# the books with nothing on them
station-stats-empty = nothing has come in yet

# a station's name: the deep's purse
station-crusher = the crusher

# the crusher's pile-full mark, on a hover
station-crusher-full = the floor is full of scales

# a station's name: the deep's houses
station-pods = the pods

# the pods' board with nothing on it
station-pods-empty = nothing to build

# the lab's board title, still in the page's markup (the lab itself is gone)
station-lab = the lab

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (An eighth like-named station reads "undefined": what the code said before the words moved here, kept by the owner; the deep has seven.)
station-party = { $nth ->
        [0] the { $who }
        [1] the second { $who }
        [2] the third { $who }
        [3] the fourth { $who }
        [4] the fifth { $who }
        [5] the sixth { $who }
        [6] the seventh { $who }
       *[other] the undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (an eighth reads "undefined", as the code said)
station-party-lot = { $nth ->
        [0] a station
        [1] a second station
        [2] a third station
        [3] a fourth station
        [4] a fifth station
        [5] a sixth station
        [6] a seventh station
       *[other] a undefined station
    }

## Crew

# the crew window: where a body is, standing at its station (rockhands)
crew-at-rockhands = on the rock

# the crew window: where a body is, standing at its station (haulers)
crew-at-haulers = at the pit

# the crew window: where a body is, standing at its station (quarriers)
crew-at-quarriers = in the quarry

# the crew window: where a body is, standing at its station (farmhands)
crew-at-farmhands = at the farm plots

# the crew window: where a body is, standing at its station (purifiers)
crew-at-purifiers = at the air filter

# the crew window: where a body is, standing at its station (janitors)
crew-at-janitors = clearing up

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = in your hand

# the crew window and a body's card: where a body is (falling)
crew-where-falling = in mid-air

# the crew window and a body's card: where a body is (home)
crew-where-home = at home

# the crew window and a body's card: where a body is (basket)
crew-where-basket = up in a balloon

# the crew window and a body's card: where a body is (yard)
crew-where-yard = in the yard

# the crew window and a body's card: where a body is (resting)
crew-where-resting = on a break

# the crew window and a body's card: where a body is (walking)
crew-where-walking = on the way

# the crew window and a body's card: where a body is (deep)
crew-where-deep = in the deep

# a body's card, doing: at its job with no step to name (rockhands)
crew-does-rockhands = digging the rock

# a body's card, doing: at its job with no step to name (quarriers)
crew-does-quarriers = mining the quarry

# a body's card, doing: at its job with no step to name (farmhands)
crew-does-farmhands = farming

# a body's card, doing: at its job with no step to name (scholars)
crew-does-scholars = researching

# a body's card, doing: at its job with no step to name (purifiers)
crew-does-purifiers = clearing the air

# a body's card, doing: at its job with no step to name (janitors)
crew-does-janitors = shoveling

# a body's card, doing: at its job with no step to name (haulers)
crew-does-haulers = transporting

# a body's card, doing: what its step is (seek)
crew-now-seek = looking for pebbles

# a body's card, doing: what its step is (dump)
crew-now-dump = tipping a load

# a body's card, doing: what its step is (muck)
crew-now-muck = shoveling up mess

# a body's card, doing: what its step is (cut)
crew-now-cut = digging in the quarry

# a body's card, doing: what its step is (up)
crew-now-up = climbing out

# a body's card, doing: what its step is (down)
crew-now-down = climbing down

# a body's card, doing: what its step is (tend)
crew-now-tend = tending a plot

# a body's card, doing: what its step is (home)
crew-now-home = heading home

# a body's card, doing: what its step is (idle)
crew-now-idle = nothing much

# a body's card, doing: what its step is (in)
crew-now-in = inside

# a body's card, doing: what its step is (aloft)
crew-now-aloft = up in the balloon

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = minding { $name }

# a body's card, doing: what its step is (to)
crew-now-to = walking there

# a body's card, doing: what its step is (kit)
crew-now-kit = fitting kit at the bench

# a body's card, doing: what its step is (build)
crew-now-build = building

# a body's card, doing: what its step is (working)
crew-now-working = working

# a body with no name, on its card and in the crew window
crew-somebody = somebody

# a body's card: the label before how long it has been here (a column of ten in monospace)
crew-card-age = age

# a body's card, age: under a minute
crew-card-new = new today

# a body's card, age: $mins minutes
crew-card-mins = { $mins } min

# a body's card: the label before what it is doing (a column of ten in monospace)
crew-card-doing = doing

# a heading in the crew window over the yard's crew
crew-sect-yard = the yard

# a heading in the crew window over the deep's crew
crew-sect-deep = the deep

# a heading on the house's board, and the window it opens
crew-sect-crew = the crew

## The books

# the books: a coin, before its rate
books-dust = pebbles

# the books: a coin, before its rate
books-shard = ore

# the books: a coin, before its rate
books-spore = crops

# the books: a coin, before its rate
books-spark = sparks

# the books: the window the rates are taken over, in minutes ($n may be ½)
books-over-min = { $n } min

# the books: the row that steps the window the rates are taken over
books-over = averaged over

# the books: the window, in a rate's note (nothing in the last half minute)
books-last-half = the last half minute

# the books: the window, in a rate's note
books-last-one = the last minute

# the books: the window, in a rate's note; $n minutes, more than one
books-last-mins = the last { $n } minutes

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } in { $over }

# the books: a rate's note when nothing came in
books-nothing = nothing

# the books: a line
books-dirt-mach = from the machines

# the books: a line
books-dirt-dust = from the rock

# the books: a line
books-dirt-shard = from the quarry

# the books: a line
books-dirt-spore = from the farm

# the books: the sky full in, while the filter is winning
books-due-never = not at this rate

# the books: a line
books-sky-trend = pollution

# the books: a line
books-sky-up = put up, a minute

# the books: a line
books-sky-down = taken out, a minute

# the books: a line
books-sky-haze = the sky is

# the books: how full the sky is; $pct with its sign
books-sky-full = { $pct } full

# the books: a line
books-sky-due = full in

# the books: a line
books-sky-rains = showers weathered

# the books: a line
books-sky-muck = muck lying about

# the books: a line
books-working = working

# the books: a line
books-idle = idle

# the books: a line
books-best-mined = most off the rock

# the books: a line
books-best-quarried = most ore mined

# the books: a line
books-best-farmed = most crops farmed

# the books: a line
books-best-stored = most into the hole

# the books: a line
books-best-tidied = most muck cleared

# the books: the longest on one clock, an hour or more; $n hours to a tenth
books-hours = { $n } h

# the books: the longest on one clock, under an hour; $n minutes
books-mins = { $n } min

# the books: a line
books-eldest = longest on one clock

# the books: a line
books-tally-rocks = rocks cleared

# the books: a line
books-tally-banked = pebbles banked

# the books: a line
books-tally-ore = ore dug

# the books: a coin earned over the whole game; $coin is books-shard, books-spore or books-spark
books-tally-earned = { $coin } earned

# the books: a line
books-tally-rift = through the rift

# the books: a line
books-tally-brews = batches brewed

# the books: a line
books-tally-hats = hats finished

# the books: a line
books-tally-crew = on the payroll

# the books: a line
books-tally-notes = notices earned

# the books: a line
books-tally-under = sqwife under the rock for

# the books: a line, naming your sqouse by name, else by the role word
books-tally-under-who = { $named ->
        [yes] { $name }
       *[no] { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    } under the rock for

# the books: a line
books-tally-saved = sqwife saved in

# the books: a line, naming your sqouse by name, else by the role word
books-tally-saved-who = { $named ->
        [yes] { $name }
       *[no] { $so ->
            [wife] sqwife
            [husband] sqhusband
           *[ouse] sqouse
        }
    } saved in

# the books: the endless serpent's best level
books-tally-serpent = deepest serpent

# a heading in the books, and on the noticeboard
books-sect-income = income, a second

# a heading in the books
books-sect-sky = the sky

# a heading in the books
books-sect-crew = the crew

# a heading in the books
books-sect-tally = the tally

# the noticeboard: the way into the books (off the board for now)
books-open = open the books

# the noticeboard: how long this yard has been played
books-playtime = playtime

## Hover

# the hover on a deep station whose Recruit still waits on its first choice
hover-choose = choose a fighter

# the hover over a grain of ore
hover-ore = ore

# the hover over a crop, a grain of it or a grown plot
hover-crop = crop

# the hover over a spark
hover-spark = spark

# the hover over a pebble
hover-pebble = pebble

# the hover over the drowned pit
hover-abyss = the abyss

# the hover over the rift
hover-rift = the rift

# the hover over poop on the ground
hover-poop = poop

# the hover over muck on the ground
hover-muck = muck

# the hover over a body, as the job it does (its type, rockhand)
hover-rockhand = rockhand

# the hover over a body, as the job it does (its type, hauler)
hover-hauler = hauler

# the hover over a body, as the job it does (its type, quarrier)
hover-quarrier = quarrier

# the hover over a body, as the job it does (its type, farmhand)
hover-farmhand = farmhand

# the hover over a body, as the job it does (its type, scholar)
hover-scholar = scholar

# the hover over a body, as the job it does (its type, purifier)
hover-purifier = purifier

# the hover over a body, as the job it does (its type, stirrer)
hover-stirrer = stirrer

# the hover over a body, as the job it does (its type, janitor)
hover-janitor = janitor

# the hover over a body, as the job it does (its type, wizard)
hover-wizard = wizard

# the hover over a body, as the job it does (its type, builder)
hover-builder = builder

# the hover over a body, as the job it does (its type, fighter)
hover-fighter = fighter

# the hover over a body, as the job it does (its type, gatherer)
hover-gatherer = gatherer

# the hover over a body, as the job it does (its type, delver)
hover-delver = delver

# the hover over a member of act 3 with no job: the idle at the podium or in the crowd
hover-member = member

# the hover over a counted pile in act 3 (the logs of the saw mill and grove)
hover-pile-logs = log pile

# the hover over a counted pile in act 3 (the timber at the saw mill)
hover-pile-planks = plank pile

# the hover over a counted pile in act 3 (the workshop's signs)
hover-pile-signs = sign pile

# the hover over a log in the hand's reach in act 3, lying on the floor
hover-log = log

# the hover over a plank in the hand's reach in act 3, lying on the floor
hover-plank = plank

# the hover over a sign in the hand's reach in act 3, lying on the floor
hover-sign = sign

# the hover over the portal, from the deep
hover-portal-up = the portal — up to the yard

# the hover over the portal, from the yard
hover-portal-down = the portal — down to the deep

# the hover over the serpent
hover-serpent = the serpent

# the hover over the crew's houses
hover-house = house

# the hover over the boulder
hover-rock = rock

# the hover over a bird
hover-bird = bird

# the hover over a balloon
hover-balloon = balloon

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the air filter's gauge: the sky filling faster than it is cleaned
hover-dial-worse = getting worse

# the air filter's gauge: the sky cleaned faster than it fills
hover-dial-better = getting better

# the air filter's gauge: neither
hover-dial-steady = holding steady

# the hover over the counter above the pit
hover-counter = pebbles in the pit: what everything costs

# the air filter's gauge: the needle in the first band
hover-dial-clean = clean

# the air filter's gauge: the needle in the middle band
hover-dial-dirty = dirty

# the air filter's gauge: the needle in the last band
hover-dial-filthy = filthy

# the hover on a pile-full mark: a station's pile has nowhere left to go
hover-pile-full = pile is full

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } done

# the hover on a done mark whose rows have no names
hover-done-work = work done

# the casino's lever, by name (its hover and the pad's label)
lever-arm = the arm

# a pot's picker: the brew it is set to, when it is set to none
pot-nothing = nothing

# a pot's picker: the heading over who the brew is for
pot-for = for

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = whoever is nearest

## The deep

# a brawler's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-brawler-fork = Throw harder punches, learn combos

# the brawler's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move = Combos

# what the brawler's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move-does = chain punches

# the brawler's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap = Knockout

# what the brawler's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap-does = { $stun }

# a sword's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sword-fork = Master the sword

# the sword's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-move = Whirlwind

# what the sword's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-move-does = heavier cut

# the sword's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap = Weak points

# what the sword's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap-does = { $bleed }

# a monk's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-monk-fork = Focus your chi

# the monk's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-move = Deep breath

# what the monk's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-move-does = faster chi

# the monk's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap = Still water

# what the monk's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap-does = { $stun }

# a martial's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-martial-fork = Strike quicker and finish faster

# the martial's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-move = Flourish

# what the martial's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-move-does = faster finishers

# the martial's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap = Rally

# what the martial's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap-does = party { $haste }

# a ranger's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-ranger-fork = Aim at weak points

# the ranger's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move = Aimed shot

# what the ranger's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move-does = charged arrow

# the ranger's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap = Pinning shot

# what the ranger's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap-does = { $stun }

# a assassin's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-assassin-fork = Strike quick and precise

# the assassin's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move = Execution

# what the assassin's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move-does = punish wounds

# the assassin's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap = Serrated

# what the assassin's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap-does = { $bleed }

# a hexer's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-hexer-fork = Cast hexes that debuff

# the hexer's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move = Wither

# what the hexer's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move-does = serpent takes more damage

# the hexer's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap = Binding

# what the hexer's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap-does = { $held }, { $exposed }

# a sapper's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sapper-fork = Learn explosives

# the sapper's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move = Sticky bombs

# what the sapper's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move-does = stick, then blow

# the sapper's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap = Pair

# what the sapper's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap-does = two bombs, { $stun }

# a mage's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-mage-fork = Channel powerful beams

# the mage's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-move = Widening

# what the mage's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-move-does = wider beam

# the mage's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap = Thermite

# what the mage's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap-does = burns armor

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Give your party { $inspired }

# the bard's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-move = Anthem

# what the bard's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-move-does = double { $inspired }

# the bard's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap = Tempo

# what the bard's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap-does = party { $haste }

# a status, by name (bold in a line, under its icon)
status-stun = Stun

# a status, by name
status-bleed = Bleed

# a status, by name
status-haste = Haste

# a status, by name
status-held = Held

# a status, by name
status-exposed = Exposed

# a status, by name
status-inspired = Inspired

# what Stun does, after its name
status-stun-does = holds still, stops healing

# what Bleed does, after its name
status-bleed-does = damage over time

# what Haste does, after its name; $pct with its sign
status-haste-does = attacks { $pct } faster

# what Held does, after its name
status-held-does = cannot heal

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = takes { $lo }-{ $hi } more damage

# what Inspired does, after its name
status-inspired-does = hits harder

# a status's hover line: $name (status-…) and what it does
status-line = { $name }: { $does }

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# a status's label under its icon when $n of it are on
status-label-n = { $name } x{ $n }

# a base fighter's line: the altar's (the Fighter)
base-altar-does = Throw punches

# a base fighter's line: the well's (the Novice)
base-well-does = Practice martial arts

# a base fighter's line: the armory's (the Scout)
base-armory-does = Shoot arrows

# a base fighter's line: the circle's (the Adept)
base-circle-does = Cast hexes

# a base fighter's line: the spire's (the Apprentice)
base-spire-does = Shoot beams

# the Recruit's line, before its first choice
recruit-does = a light punch

# the Bard's line with nobody else fighting
rail-alone = no one else to sing to

# a class that needs company, before there is any
rail-locked = opens with a second station

# a station's board at the fork: the heading over the two classes
rail-fork-ask = Specialize

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Choose your fighter

# a rung's number in its class's unit; $unit is unit-dmg or unit-dmg-s
rail-worth = { $n } { $unit }

# a rung's number for a class written in percent (the Bard)
rail-worth-pct = +{ $n }%

# a pip's hover line on a station's tree: $name (a fighter, a move) and $what (its number, or a few words)
rail-line = { $name }: { $what }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Become a { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = reset – refunds everything

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-brawler = Brawler

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sword = Swordsman

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-monk = Monk

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Martial Artist

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-ranger = Ranger

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-assassin = Assassin

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-hexer = Hexer

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sapper = Sapper

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-mage = Mage

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-bard = Bard

# a base fighter's name: the altar's, below the fork
base-altar = Fighter

# a base fighter's name: the well's
base-well = Novice

# a base fighter's name: the armory's
base-armory = Scout

# a base fighter's name: the circle's
base-circle = Adept

# a base fighter's name: the spire's
base-spire = Apprentice

# every station's first fighter, before its first choice
class-recruit = Recruit

# the serpent's lash, its tile's hover while it waits
serp-lash-calm = Lash: stuns melee attackers

# the serpent's lash, its tile's hover while it is warned
serp-lash-coming = Lash coming

# the serpent's lash, its tile's hover while it is on
serp-lash-on = Lash: stuns melee attackers

# the serpent's lash, its tile's hover once answered
serp-lash-stopped = Lash: stopped

# the serpent's cloak, warned
serp-sink-coming = Cloak coming

# the serpent's cloak, on
serp-sink-on = Cloak: out of reach

# the serpent's constrict, warned
serp-orb-coming = Constrict coming

# the serpent's constrict, on
serp-orb-on = Constrict

# the serpent's constrict, answered
serp-orb-stopped = Constrict

# a fighter's tile: dazed, its hover
serp-dazed = Dazed: thrown off, seeing stars

# a fighter's tile: constricted, its hover
serp-constricted = Constricted

# the serpent's barrier, its tile's hover
serp-barrier = Barrier: absorbs explosive damage

# the serpent's ward, its tile's hover
serp-ward = Ward: magic damage cut in half

# the serpent's plates, its tile's hover
serp-plates = Plates: phys damage cut in half

# the lash's tile, its label
serp-lash = Lash

# the cloak's tile, its label
serp-sink = Cloak

# the constrict's tile, its label
serp-orb = Constrict

# a fighter's dazed tile, its label
serp-dazed-name = Dazed

# a fighter's constricted tile, its label
serp-constricted-name = Constricted

# the barrier's tile, its label
serp-barrier-name = Barrier

# the ward's tile, its label
serp-ward-name = Ward

# the plates' tile, its label
serp-plates-name = Plates

# the pods: one more of the crew, living down here
row-pod = another pod

# the pods: the pod's line
row-pod-note = a capsule on the deep's far side: one more of the crew, living down here

# a deep station's board: the heading over its one fighter, with the count
rail-fighter = the fighter

# the deep: the build of a new fighter's station (the queue card names it)
row-raise-station = raise a station

# the deep's build button: the first station costs no fang
build-free = free

# the serpent's level after the pips on its bar, from level 2 on; $n is the level.
# drawn as the bare number, in the pixel number font
# (NUM_FONT), which draws only the glyphs it has: words want their letters drawn into the font
serp-level = { $n }

## The picker: who the two of them are and what they wear (wardrobepage.js)

# at a new yard, the heading of the picker's last step, the two of you side by side
ward-title = the two of you

# the picker page's heading and the house board's row that opens it
ward-appearance = appearance

# the picker's tab for choosing your own square
ward-you = you

# the picker's tab for choosing your sqouse's square
ward-sqouse = your sqouse

# a new yard's first step: your name, role and outfit (the owner's words, 2026-10-16)
ward-build-you = build who you are

# a new yard's second step: your square shown back to you (the owner's words, 2026-10-16)
ward-confirm-you = confirm your square

# a new yard's third step: your sqouse's name, role and outfit (the owner's words, 2026-10-16)
ward-build-sqouse = build your sqouse

# a new yard's steps, counted: $n the step, $of how many
ward-step = { $n } / { $of }

# the picker's row label over the name field
ward-name = name

# the picker's row label over the role, stepped between the three words
ward-role = title

# the role, as the picker shows it and as an empty name field's hint
ward-role-word = { $so ->
        [wife] sqwife
        [husband] sqhusband
       *[ouse] sqouse
    }


# the label on the picker's dice: the name's, the role's and the slot's, each a roll of that alone
ward-randomize = randomize

# the picker's button that rolls the whole square: its role and outfit, never its name
ward-randomize-all = randomize all

# the picker's button that takes every slot of the square's outfit back to none (and the pattern to plain); the name and role stay
ward-clear = clear

# the picker's button, at a new yard, that keeps the outfits they start in and goes on
ward-skip = skip

# a new yard's button on to the next step
ward-next = next

# the picker's way off, at a new yard: the outfits as chosen, and on with the game
ward-done = done

# the pad's letter grid under the name: the key that types a space
ward-key-space = space

# the pad's letter grid under the name: the key that takes the last letter back
ward-key-del = del

# the picker's slot buttons round the close-up, and the tab over the grid of the chosen one, a slot each
ward-slot-head = head
ward-slot-face = face
ward-slot-neck = neck
ward-slot-back = back
ward-slot-pattern = pattern
ward-slot-aura = aura

# a slot's button round the picker's close-up, as a screen reader names it: $slot the slot, $item what is worn in it
ward-grid-head = { $slot }: { $item }

# beside the tab over the picker's grid: how many of the slot's items are open to wear
ward-grid-open = { $open } of { $all } open

# a locked item in the picker's grid, in the tooltip on its hover and focus: $item the item, $lock what opens it
ward-locked = { $item }: { $lock }

# an item on the picker, under its tile in the slot's grid; a plain label
ward-none = none
ward-plain = plain
ward-bow = bow
ward-top-hat = top hat
ward-crown = crown
ward-flower = flower
ward-sprout = sprout
ward-ears = ears
ward-antenna = antenna
ward-beanie = beanie
ward-beret = beret
ward-headband = headband
ward-mohawk = mohawk
ward-eyes = eyes
ward-sleepy = sleepy
ward-smile = smile
ward-glasses = glasses
ward-round-glasses = round glasses
ward-shades = shades
ward-monocle = monocle
ward-eyepatch = eyepatch
ward-mustache = mustache
ward-freckles = freckles
ward-blush = blush
ward-scarf = scarf
ward-checked-scarf = checked scarf
ward-striped-scarf = striped scarf
ward-cape = cape
ward-short-cape = short cape
ward-backpack = backpack
ward-balloon = balloon
ward-flag = flag
ward-overalls = overalls
ward-stripes = stripes
ward-tall-stripes = tall stripes
ward-dots = dots
ward-diagonal = diagonal
ward-quarters = quarters
ward-filled = filled
ward-dust-motes = dust motes
ward-pebble-bits = pebble bits
ward-bubbles = bubbles
ward-orbiting-pixel = orbiting pixel
ward-sparkle-glints = sparkle glints
ward-footprints = footprints
ward-rain-cloud = rain cloud
ward-falling-petals = falling petals
ward-scale-swirl = scale swirl
ward-embers = embers
ward-helmet = helmet
ward-lamp = lamp
ward-sun-hat = sun hat
ward-wizard-hat = wizard hat
ward-cap = cap
ward-bird = bird
ward-mortarboard = mortarboard
ward-bowler = bowler
ward-hard-hat = hard hat
ward-diving-bowl = diving bowl
ward-gold-crown = gold crown
ward-surprised = surprised
ward-gold-scarf = gold-checked scarf
ward-moneybag = moneybag
ward-gold-cape = gold-trim cape
ward-flies = flies
ward-stink = stink lines
ward-juggling-balls = juggling balls
ward-potion-fizz = potion fizz
ward-dizzy-stars = dizzy stars
ward-shooting-star = shooting star
ward-flock-overhead = flock overhead
ward-speed-lines = speed lines
ward-gold-halo = gold halo
ward-serpent-comb = serpent comb

# what a locked item waits on, where it is not a notice: a station's first
# hat, or the portal; the first a short line shown on the item's tile, the
# second the fuller one under the grid (the line as the mock had it)
ward-lock-rockhands = first helmet at the rock
ward-lock-rockhands-note = buy the rock its first helmet
ward-lock-quarriers = first lamp at the quarry
ward-lock-quarriers-note = buy the quarry its first lamp
ward-lock-farmhands = first sun hat at the farm
ward-lock-farmhands-note = buy the farm its first sun hat
ward-lock-wizards = first wizard hat at the tower
ward-lock-wizards-note = make the tower its first wizard hat
ward-lock-janitors = the outhouse opens
ward-lock-janitors-note = open the outhouse
ward-lock-portal = the portal opens
ward-lock-portal-note = conjure the portal over the abyss

## The shell

# the desk's window title is title-doctitle, read by the shell (electron/main.cjs)

# the Steam carry-over offer, on the full game's first launch when a demo save is found: the dialog's title
shell-carry-title = a demo save

# the Steam carry-over offer: the question
shell-carry-message = a save from the demo was found. carry it on?

# the Steam carry-over offer: the button that carries the demo save over
shell-carry-yes = carry it on

# the Steam carry-over offer: the button that starts a fresh yard
shell-carry-no = start fresh

# achievement name: the serpent kill, the one in its belly out (neutral: no name, no role)
ach-freed-name = complete act 2

# achievement note: the serpent kill
ach-freed-note = finish act 2

# --- acts 3 and 4: the connective tissue (actbeats.js), placeholders --------
# Every line below is a plain label standing in for the owner's words, behind
# AFTERLIFE_ON / HELL_ON (nothing a released build shows).

# the card over the house after the finale: pressing it begins act 3 (call 7)
act-goon = go on

# act beat line, placeholder: the rock falls on the house
act-house-fall = the house falls

# act beat line, placeholder: the souls arrive on the cloud
act-arrive = the afterlife

# act beat line, placeholder: God at the throne
act-meet-god = God holds out a pick

# act beat line, placeholder: the pair refuse the work
act-refuse = they set the pick down

# act beat line, placeholder: the axe handed over
act-axe = an axe

# act beat line, placeholder: the strike
act-strike = the strike

# act beat line, placeholder: the unmasking
act-unmask = God is Satan

# act beat line, placeholder: Satan's line
act-hell-told = God is caged in hell

# act beat line, placeholder: the cloud stair let down
act-ghost-road = the road down opens

# act beat line, placeholder: the pair back on the yard as ghosts
act-haunt = back on the yard, as ghosts

# act beat line, placeholder: the first descent into hell
act-descend = hell

# act beat line, placeholder: the yard's pick rings off the rubble
act-wall-first = the pick rings off

# act beat line, placeholder: a barrier down
act-wall = barrier { $n } down

# act beat line, placeholder: the cage open
act-unchain = God is free

# act beat line, placeholder: the pair's lives given back
act-alive = their lives back

# act beat line, placeholder: the walk home
act-home-again = home

# act beat line, placeholder: the freed souls gathering at the mansion
act-mansion = the mansion

# the ending's sheet heading, placeholder
mansion-word = the end

# the ending's sheet line, placeholder
mansion-why = a mansion, for the two of you.

# the ending's sheet dismiss button
mansion-keep = keep playing

# objective line, placeholder: begin act 3
obj-act-goon = say go on

# objective line, placeholder: act 3's loop
obj-act-union = take God down

# objective line, placeholder: the road down
obj-act-road = take the road down

# objective line, placeholder: into hell
obj-act-hell = go down to hell

# objective line, placeholder: act 4's loop
obj-act-cage = free God

# objective line, placeholder: the walk home
obj-act-home = go home

## Act 4 (placeholder)

# act 4 (placeholder): hell's boards are working labels for the owner to word; the face card's name, the miners at the seams
row-hellface = miners

# act 4 (placeholder): the face card's verb, before its hits a second
row-hellface-does = swing

# act 4 (placeholder): the furnace card's name, every furnace's pace
row-hellfurnace = furnaces

# act 4 (placeholder): the furnace card's verb, before its share
row-hellfurnace-does = smelt

# act 4 (placeholder): the anvil card's name, the smith's strokes
row-hellanvil = smith

# act 4 (placeholder): the anvil card's verb, before its hits a second
row-hellanvil-does = strike

# act 4 (placeholder): the muster card's name, how many ghosts come down the road
row-hellmuster = muster

# act 4 (placeholder): the muster card's verb, before the count
row-hellmuster-does = ghosts

# act 4 (placeholder): the barrier board's row taking one more miner off the faces onto the wall
row-hellgangup = one more on the wall

# act 4 (placeholder): the barrier board's row sending one of the wall gang back to the faces
row-hellgangdown = one back to the faces

# act 4 (placeholder): the anvil board's row buying a barrel of black water with sparks
row-hellwater = black water

# act 4 (placeholder): a seam face's board, its heading
board-hell-face = the seam

# act 4 (placeholder): a furnace's board, its heading
board-hell-furnace = the furnace

# act 4 (placeholder): the anvil's board, its heading
board-hell-anvil = the anvil

# act 4 (placeholder): the road's foot, the muster's board, its heading
board-hell-muster = the road

# act 4 (placeholder): a barrier's board, its heading
board-hell-wall = the barrier
# act 3 (placeholder)
# Plain working labels for act 3's cards, held behind AFTERLIFE_ON and never
# shipped: every one is the owner's to reword on the wording board.

# act 3's coin (placeholder): rebel, knocked off the pair's speech
after-coin-rebel = rebel

# act 3 card row (placeholder): the pedestal's podium ladder, five podiums, each higher and more rebel a line
after-row-podium = podium

# act 3 card row: the pedestal's recruit, a won soul bought out of God's yard to work for rebel
after-row-recruit = recruit
# its line: the souls won and waiting to be hired, and the workers idle at the podium
after-recruit-ready = { $ready } ready, { $idle } idle
# its line while nobody is won: why it is greyed (not its price), and how souls are won
after-recruit-none = no souls won yet: plant signs

# act 3 card row (placeholder): the axe, bought: a click on a grown tree chops it
after-row-axe = axe

# act 3 card row (placeholder): the grove's plots, a plot cleared a press
after-row-plot = plot

# act 3 card row (placeholder): the grove's faster growth
after-row-grow = faster growth

# act 3 card row (placeholder): the grove's bigger trees, more logs a fall
after-row-tree = bigger trees

# act 3 card row (placeholder): the grove's stump removal: woodcutters dig stumps too
after-row-stumps = stump removal

# act 3 card row (placeholder): the saw mill's second blade, two logs a cut
after-row-blade = second blade

# act 3 card row (placeholder): the workshop's second bench, two signs at once
after-row-bench = second bench

# act 3 card row (placeholder): the workshop's bigger sign, a further reach
after-row-signreach = bigger sign

# act 3 card row (placeholder): one more seat for a job at its station, the job named
after-row-seat = { $job } seat

# act 3 job name (placeholder): a woodcutter, named on its seat row
after-job-woodcutter = woodcutter
    .says = fells the grove's trees and carries their logs to the forestry shack

# act 3 job name (placeholder): a sawyer, named on its seat row
after-job-sawyer = sawyer
    .says = fetches logs from the forestry shack and saws them into timber

# act 3 job name (placeholder): a joiner, named on its seat row
after-job-joiner = joiner
    .says = nails timber into signs and plants them in God's crowd

# act 3 roster hover (placeholder): a job's name and what it does, or why it is standing still
after-roster-tip = { $job }: { $line }

# act 3 roster hover (placeholder): why a station's worker is standing still
after-stall-trees = waiting on a tree to grow

# act 3 roster hover (placeholder): why a station's worker is standing still
after-stall-logs = waiting on logs

# act 3 roster hover (placeholder): why a station's worker is standing still
after-stall-timber = waiting on timber

# act 3 shack row (placeholder): build the saw mill
after-build-mill = saw mill

# act 3 shack row (placeholder): build the workshop
after-build-workshop = workshop

# act 3 shack row's wait (placeholder): the saw mill must stand first
after-wait-mill = needs the saw mill

# act 3 podium row's wait (placeholder): the union's support must reach the rung's mark, a share of the strike's
after-wait-support = needs { $share }% support

# act 3 card heading (placeholder): the seats for the station's jobs
after-sect-seats = seats

# act 3 shack heading (placeholder): the stations to build
after-sect-build = build

# act 3 ruined station's card heading (placeholder): its rebuild
after-sect-rebuild = rebuild

# act 3 station card heading (placeholder)
after-sect-card = upgrades

## Act 3 boards (track C, placeholder)

# act 3 board title (placeholder): the pedestal's board, the speech and the agitators
after-board-pedestal = pedestal

# act 3 board title (placeholder): the construction shack's board, every station to build
after-board-shack = construction shack

# act 3 board title (placeholder): the grove's board, the axe and the trees
after-board-grove = grove

# act 3 board title (placeholder): God's crowd's board, readings only
after-board-crowd = God's crowd

# act 3 crowd board heading (placeholder): how the union stands
after-sect-crowd = the crowd

# act 3 crowd board heading (placeholder): the three gates
after-sect-gates = gates

# act 3 crowd board reading (placeholder): the share of God's yard walked out
after-crowd-share = share won

# act 3 crowd board reading (placeholder): the souls walked out to the camp
after-crowd-members = members

# act 3 crowd board reading (placeholder): the time to the throne's next speech
after-crowd-speech = next speech

# act 3 crowd board reading (placeholder): the first gate
after-crowd-meeting = the meeting

# act 3 crowd board reading (placeholder): the second gate
after-crowd-slowdown = the slowdown

# act 3 crowd board reading (placeholder): the last gate
after-crowd-strike = the strike

# act 3 crowd board value (placeholder): a gate already reached
after-crowd-reached = reached

# act 3 crowd board value (placeholder): how far toward a gate, what there is of what it wants
after-crowd-of = { $have } of { $want }

# act 3 crowd board value (placeholder): a share, in whole percent
after-crowd-pct = { $n }%

# act 3 crowd board value (placeholder): no speech set yet
after-crowd-none = none due

# The button above a station's worker count that opens its upgrades (act 3).
roster-upgrades = upgrades
