### Pebble Pit, auf Deutsch (de).
### Drafted by Claude (Opus 5.5) on 2026-10-13 to locales/STYLE.md; not yet
### reviewed by a native speaker.
###
### Translated from locales/en.ftl, same ids, same order, same groups. The
### English comment over each message says where it shows. Messages whose
### English is still an `[owner's words: ...]` placeholder are left out, so
### the English shows until the owner has written them.

## Sheets

# rescue sheet heading, end of first half
saved-word = Ist es vorbei?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = du hast deine frau in <span data-l10n-name="time"></span> gerettet!

# rescue sheet dismiss button
saved-keepplaying = Glücklich bis ans Ende

# demo end sheet heading
demoend-word = das wars mit der demo!

# demo end sheet line
demoend-why = deine frau kannst du noch nicht retten.

# demo end store link (if STORE_URL)
demoend-store = jetzt auf die wunschliste!

# demo end dismiss button
demoend-keep = weiterspielen

# free-build teaser end sheet heading
teaseend-word = fortsetzung im vollen spiel!

# teaser end store link (if STORE_URL)
teaseend-store = hol dir das volle spiel

# teaser end dismiss button
teaseend-keep = weiterspielen

# second-half end sheet heading
freed-word = ok, jetzt ist es vorbei

# second-half end sheet line
freed-why = du hast deinen mann aus dem bauch der schlange gerettet.

# second-half end sheet line
freed-end = das wars. du kannst gern weiter die schlange erschlagen und oben farmen!

# second-half end sheet line
freed-thanks = danke!

# second-half end dismiss button
freed-keep = weiterspielen

# crash sheet heading
crashed-word = angehalten

# crash sheet button
crashed-copysave = spielstand kopieren

# pause sheet heading
held-word = pause

# pause sheet button
held-resume = weiter

# pause sheet button (relabelled from JS)
held-slotsbtn = spielstände

# saves page heading
held-slots-word = spielstände

# saves page button
held-savecopy = spielstand kopieren

# saves page button
held-loadsave = spielstand laden

# saves page paste box confirm
held-loadit = laden

# saves page paste box cancel
held-nevermind = doch nicht

# saves page back button
held-slotsback = zurück

# pause sheet button (relabelled from JS)
held-recordbtn = erfolge

# achievements page heading
held-record-word = erfolge

# achievements page back
held-recordback = zurück

# pause sheet button (also src/indexpage.js:24)
held-indexbtn = index

# index page heading
held-index-word = index

# index page back
held-indexback = zurück

# pause sheet button to landing page
held-titlebtn = zum titel

# pause sheet button, desktop build only
held-quit = zum desktop

# pause sheet footer hint
held-keys = esc hält an · ← → umsehen · leertaste halten: szene überspringen

# window close button label
modal-close =
    .aria-label = schließen

# pause sheet reply, desktop export ok
said-saved = gespeichert

# pause sheet reply, desktop export failed
said-notsaved = nicht gespeichert

# pause sheet reply, store fallback
said-fellback = der letzte spielstand lud nicht; das hier ist der davor

# pause sheet reply, unreadable save
said-broken = dein letzter spielstand ist nicht lesbar. spielstand kopieren gibt ihn dir trotzdem

# pause sheet reply, yard open elsewhere
said-yielded = dieser hof ist in einem anderen tab offen; gespeichert wird dort

# pause sheet reply, storage blocked
said-unsaved-blocked = speichert nicht: dein browser sperrt den speicher auf dieser seite. spielstand kopieren geht noch

# sheet reply after loading a save
said-loaded = geladen

# sheet reply, pasted text invalid
said-notasave = das ist kein spielstand

# crash sheet line when error has no message
crashed-why-fallback = etwas ging schief

# save row age
slots-since-now = gerade eben

# save row age
slots-since-min = vor { $m } min

# save row age
slots-since-h = vor { $h } h

# save row item
slots-row-rock = fels { $n }

# save row item
slots-row-crew = { $n } leute

# save row item for open slot in play
slots-row-playing = läuft

# save row, no yard
slots-row-empty = leer

# save row, broken blob
slots-row-unreadable = unlesbar

# saves button label on both fronts
held-slotsbtn-label = spielstände · { $n } von { $total }

# empty save row after first press
slots-arm = neuen hof anfangen?

# sheet reply after opening empty slot
slots-said-new = ein neuer hof

# sheet reply after opening a slot
slots-said-loaded = geladen

# save row delete cross label
slots-del-aria = löschen

# achievements button label with count
held-recordbtn-label = erfolge · { $count } von { $total }

# achievements page, nothing earned
held-record-none = du hast noch nichts getan.

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
        [one] vor einem tag
       *[other] vor { $d } tagen
    }

# saves row delete confirm
slots-confirm-yes = löschen

# saves row delete cancel
slots-confirm-no = zurück

# sheet reply, copy with no save
said-copyout-none = noch nichts gespeichert

# sheet reply when clipboard unavailable
said-copyout-window = in window.__save

# index entry back button on phone
held-index-entryback = zurück

# saves page cloud section heading
cloud-head = cloud-spielstände

# cloud section button
cloud-btn-linkcode = verknüpfungscode eingeben

# cloud section button
cloud-btn-recovery = wiederherstellungscode nutzen

# cloud section button
cloud-btn-stop = cloud-speichern beenden

# cloud section reply after stop
cloud-said-off = die cloud ist auf diesem gerät aus

# cloud section button
cloud-btn-enable = cloud-sync einschalten

# cloud section reply on failure (also cloud.js:768)
cloud-why-noanswer = die cloud hat nicht geantwortet

# cloud section, copy recovery code
cloud-btn-copy = kopieren

# cloud section under recovery code
cloud-writedown = schreib das auf: damit holst du deine höfe auf ein neues gerät

# cloud section, another device ahead
cloud-btn-take = übernehmen

# cloud section, another device ahead
cloud-btn-keep = diesen behalten

# cloud section reply (also :316)
cloud-said-kept = behalten

# cloud section above pairing code
cloud-pair-enter = gib auf dem anderen gerät ein

# cloud section, hide pairing code
cloud-btn-done = fertig

# cloud section button
cloud-btn-link = gerät verknüpfen

# cloud section toggle
cloud-btn-hidecode = code verbergen

# cloud section toggle
cloud-btn-showcode = code zeigen

# cloud section button
cloud-btn-newcode = neuer wiederherstellungscode

# cloud section button, first press
cloud-btn-newcode-armed = andere geräte abmelden?

# link code box placeholder
cloud-box-linkph = ···-···

# recovery code box placeholder
cloud-box-recph = ····-····-····

# link code box label
cloud-box-aria-link = verknüpfungscode

# recovery code box label
cloud-box-aria-rec = wiederherstellungscode

# cloud section reply, bad code
cloud-wrong = der code hat nicht geklappt

# cloud section reply after linking
cloud-said-linked = verknüpft

# cloud code entry confirm
cloud-btn-dolink = verknüpfen

# cloud code entry cancel
cloud-btn-nevermind = doch nicht

# cloud code entry prompt
cloud-typing-link = der code auf dem anderen gerät

# cloud code entry prompt
cloud-typing-rec = dein wiederherstellungscode

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = heute zu viele versuche von hier; versuch es morgen

# cloud section reply, 503
cloud-why-resting = die cloud ruht sich aus; versuch es später

# cloud section reply, 403
cloud-why-forbidden = die cloud kennt diese seite nicht

# the cloud's line in the landing page's foot bar: $state is one of the cloud-state lines below
# (with no state, it stands before the choose-a-yard button)
cloud-line = cloud · { $state }

# cloud state: not turned on (in cloud-line, and alone in the saves page section)
cloud-state-off = aus

# cloud state
cloud-state-out = abgemeldet

# cloud state
cloud-state-refused = ein spielstand wurde abgelehnt

# cloud state
cloud-state-offline = nicht gespeichert: offline

# cloud state
cloud-state-behind = neuer auf einem anderen gerät

# cloud state
cloud-state-newer = aktualisieren, um den neueren zu nehmen

# cloud state
cloud-state-big = zu groß für die cloud

# cloud state
cloud-state-full = die cloud ist voll

# cloud state
cloud-state-paused = pausiert

# cloud state
cloud-state-conflict = wähl einen hof

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = gespeichert { $since }

# cloud state: on, nothing pushed yet
cloud-state-on = an

# link a device: the pairing code's countdown; $time is m:ss
cloud-pair-left = noch { $time }

# choose a yard: this device's copy of slot $n; $here is the yard as a saves row says it
cloud-clash-here = dieses gerät · { $n } · { $here }

# choose a yard: the cloud's copy of slot $n; $cloud is the yard as a saves row says it
cloud-clash-cloud = cloud · { $n } · { $cloud }

# a cloud button's answer: too many tries; $m is minutes to wait
cloud-why-wait = zu viele versuche; versuch es in { $m } min wieder

# window title opened off the books
modal-books = die bücher

# window title, crew list
modal-crew = wer hier wohnt

## Settings

# pause sheet button
held-settingsbtn = einstellungen

# settings page heading
held-settings-word = einstellungen

# settings note where fullscreen unavailable
set-fullscreen-note = für den ganzen bildschirm diese seite zum startbildschirm hinzufügen

# settings volume slider label
set-volume =
    .aria-label = lautstärke

# settings button to controls page
set-controlsbtn = steuerung

# controls page heading
set-controls-word = steuerung

# controls page back
set-controlsback = zurück

# settings page back
set-settingsback = zurück

# settings motion switch
set-motion-less = bewegung: weniger

# settings motion switch
set-motion-full = bewegung: voll

# settings touch switch (play only)
set-touch-on = touch: an

# settings touch switch (play only)
set-touch-off = touch: aus

# settings dark switch
set-dark-on = dunkel: an

# settings dark switch
set-dark-off = dunkel: aus

# settings sound switch
set-sound-off = ton: aus

# settings sound switch
set-sound-on = ton: an

# pause sheet line: a save from a newer build; $build is the build's name
said-newer = dieser spielstand ist aus einer neueren version ({ $build })

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = speichert nicht: der speicher dieser seite ist voll ({ $used } mb belegt, { $ours } kb davon unsere). spielstand kopieren geht noch

# pause sheet line: storage refused a save; $name is the browser's error name
said-unsaved-refused = speichert nicht: der speicher hat den spielstand abgelehnt ({ $name }). spielstand kopieren geht noch

# pause sheet line: storage refused a save, with no error to name
said-unsaved-refused-why = speichert nicht: der speicher hat den spielstand abgelehnt. spielstand kopieren geht noch

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = konnte nicht laden: { $message }

# controls page input column
ctl-leftclick-in = linksklick

# controls page action column
ctl-leftclick-do = benutzen

# controls page input column
ctl-rightclick-in = rechtsklick

# controls page action column
ctl-rightclick-do = arbeiter anvisieren

# controls page input column
ctl-rightleft-in = rechtsklick + linksklick

# controls page action column
ctl-rightleft-do = arbeiter hochheben

# controls page input column
ctl-middle-in = mittelklick

# controls page action column
ctl-middle-do = kamera bewegen

# controls page input column
ctl-wheel-in = mausrad

# controls page action column
ctl-wheel-do = kamera bewegen

# controls page input column
ctl-arrows-in = ← → / a d

# controls page action column
ctl-arrows-do = kamera bewegen

# controls page input column
ctl-digits-in = 1 – 9

# controls page action column
ctl-digits-do = zu einem ort springen

# settings fullscreen row
set-fullscreen-on = vollbild: an

# settings fullscreen row
set-fullscreen-off = vollbild: aus

# a sheet line: the save is on the clipboard; $n is its size in kilobytes
said-copyout-copied = { $n } kb kopiert

## Title page

# browser tab title, landing
title-doctitle = Pebble Pit

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = ein fels. ein loch. ein paar leute dazwischen.

# landing page main button
title-play = spielen

# landing page button (relabelled saves · n of 3)
title-slotsbtn = spielstände

# landing page button (relabelled, src/record.js:33)
title-recordbtn = erfolge

# landing page button
title-settingsbtn = einstellungen

# landing page, desktop build only
title-quit = zum desktop

# landing saves page heading
title-slots-word = spielstände

# landing saves page button
title-savecopy = spielstand kopieren

# landing saves page button
title-loadsave = spielstand laden

# landing paste confirm
title-loadit = laden

# landing paste cancel
title-nevermind = doch nicht

# landing saves page back
title-slotsback = zurück

# landing achievements page heading
title-record-word = erfolge

# landing achievements page back
title-recordback = zurück

# landing settings page heading
title-settings-word = einstellungen

# landing settings to controls
title-controlsbtn = steuerung

# landing settings back
title-settingsback = zurück

# landing controls page heading
title-controls-word = steuerung

# landing controls back
title-controlsback = zurück

# landing cloud conflict page heading
title-conflict-word = wähl einen hof

# landing cloud conflict back
title-conflictback = zurück

# landing foot link
title-link-itch = itch

# landing foot link
title-link-github = github

# under play, empty open slot
title-playlabel-new = ein neuer hof

# landing achievements page, nothing earned
title-record-none = noch nichts

# title foot bar conflict link
cloud-foot-choose = wähl einen hof

# landing reply, bad paste
title-said-notasave = das ist kein spielstand

# landing reply after load
title-said-loaded = geladen

# landing reply after deleting open slot
title-said-erased = gelöscht

## Objectives

# label before story line
obj-next = nächstes

# story line, first step
obj-rock = grab den fels ab, um deine frau zu retten!

# intro quest item
obj-rock-q-chip = den fels abbauen

# intro quest item
obj-rock-q-pickup = einen kiesel nehmen

# intro quest item
obj-rock-q-toss = den kiesel in die grube werfen

# story line after first fall
obj-falling = versuch nochmal, den fels abzugraben!

# story line, wooden roof barrier
obj-props = vielleicht hält ein holzdach den nächsten fels auf?

# story line, net barrier
obj-net = nö. versuch, den fels zu fangen und abzubremsen

# story line, arch barrier
obj-arch = versuchen wir einen bogen aus dem erz und stein. der hält bestimmt.

# story line, wizards' barrier
obj-dome = keine ideen mehr, mal sehen, ob die zauberer helfen können.

# story line before rescue
obj-rescue = rette deine frau

# story line, second half
obj-drown = flute die grube

# story line after snatch
obj-tower = bau den turm der zauberer

# story line after snatch
obj-talk = sprich mit den zauberern über das, was gerade passiert ist

# story line, deep half
obj-portal = beschwör ein portal in den abgrund, was ist da unten?

# story line, final step
obj-free = befrei deinen mann aus dem bauch der schlange

# objective card cancel while building
obj-barrier-cancel = abbrechen ×{ $n }

## Other

# browser tab title, game page
play-doctitle = Pebble Pit

# skip hint during cutscene, desktop (skiphint.js:27)
other-skip-desk = leertaste halten: überspringen

# top-edge mess tag
other-messtag-muck = schlamm

# top-edge mess tag
other-messtag-poop = kacke

# floating button over bench site
other-raise = werkbank bauen

# phone pause button label
other-pause =
    .aria-label = pause

title-recordbtn-label = erfolge · { $count } von { $total }

# corner fullscreen button tooltip
other-fullscreen-title-on = vollbild verlassen

# corner fullscreen button tooltip
other-fullscreen-title-off = vollbild

# crew-fade corner button label
other-corner-show = arbeiter zeigen

# crew-fade corner button label
other-corner-fade = arbeiter blasser

# crew-fade corner button label
other-corner-hide = arbeiter verbergen

# way corner button tip
other-corner-up = hoch zum hof

# way corner button tip
other-corner-down = runter in die tiefe

# queue card line hover
other-queue-site-yard = der hof

# queue card line hover
other-queue-site-sphere = die kugel

# queue card, nobody working
other-queue-queued = wartet

# board footer toggle
other-hidedone-show = fertige zeigen

# board footer toggle
other-hidedone-hide = fertige verbergen

# the queue card: the first in line to be built after the one going up
queue-place-next = danach

# the house's board and the crew window, with no crew yet
crew-empty = hier wohnt noch niemand

# a station's name: its board's title, the pointer's label, the queue card
station-bench = die werkbank

# skip hint during cutscene, phone
other-skip-touch = halten zum überspringen

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = <span data-l10n-name="key"></span> halten zum überspringen

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee, idle (drawn in the sign's own pixel capitals)
casino-sign = CASINO

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

## Notices

# toast-shaped card, another device ahead
note-cloud-name = neuer auf einem anderen gerät

# toast-shaped card, another device ahead
note-cloud-note = antwort unter spielstände

## Numbers

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } h { $m } min

# how long a yard has been played, under an hour
played-m = { $m } min

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }.

## Achievements

# toast and achievements card name
ach-firstgrain-name = kohle machen

# toast and achievements card note
ach-firstgrain-note = wirf einen kiesel in die grube

# achievement name
ach-firstrock-name = lieber weitergraben

# achievement note
ach-firstrock-note = räum den ersten fels ab

# achievement name
ach-gotout-name = du hast deine frau gerettet

# achievement note
ach-gotout-note = keine felsen mehr, du hast es geschafft.

# achievement name
ach-firsthire-name = du hast zusätzliche pylonen errichtet

# achievement note
ach-firsthire-note = bau noch ein haus

# achievement name
ach-firstshard-name = das erste erz

# achievement note
ach-firstshard-note = hol erz aus dem steinbruch nach oben

# achievement name
ach-firstspore-name = ackerbau

# achievement note
ach-firstspore-note = bau deine erste ernte an

# achievement name
ach-firstspark-name = magie liegt in der luft

# achievement note
ach-firstspark-note = verdien deinen ersten funken

# achievement name
ach-holefull-name = die grube ist voll

# achievement note
ach-holefull-note = füll die grube bis zum rand

# achievement name
ach-rifttorn-name = der riss ist auf, das lagerproblem gelöst

# achievement note
ach-rifttorn-note = füll die grube, bis ein interdimensionaler riss aufgeht

# achievement name
ach-drowned-name = der riss ist größer geworden

# achievement note
ach-drowned-note = ein ganzer ozean interdimensionaler lagerfläche.

# achievement name
ach-star-name = beschwör einen stern

# achievement note
ach-star-note = ruf vom turm einen stern herab

# achievement name
ach-firsthat-name = du bist ein zauberer, quadri

# achievement note
ach-firsthat-note = mach am turm einen zauberhut fertig

# achievement name
ach-firstbrew-name = hallo, trankverkäufer

# achievement note
ach-firstbrew-note = brau eine charge in der apotheke

# achievement name
ach-firsttrade-name = der erste hut

# achievement note
ach-firsttrade-note = kauf einer station ihren ersten hut

# achievement name
ach-alltrades-name = bildung für die massen

# achievement note
ach-alltrades-note = gib jeder station ihren hut

# achievement name
ach-allbuilt-name = bau abgeschlossen

# achievement note
ach-allbuilt-note = du hast alles gebaut

# achievement name
ach-rift1e6-name = 1m durch den riss

# achievement note
ach-rift1e6-note = schick 1m kiesel durch den riss

# achievement name
ach-brew100-name = 100 chargen

# achievement note
ach-brew100-note = brau 100 chargen

# achievement name
ach-lived1h-name = eine stunde am stück

# achievement note
ach-lived1h-note = behalt einen arbeiter eine stunde lang auf der lohnliste

# achievement name
ach-nobodyhired-name = niemand eingestellt

# achievement note
ach-nobodyhired-note = räum einen ganzen fels ab, ohne dass jemand auf der lohnliste steht

# achievement name
ach-ownhand-name = nur mit eigener hand

# achievement note
ach-ownhand-note = räum einen fels ab, ohne dass ein einziger arbeiter ihn anfasst

# achievement name
ach-nevertouched-name = nie angefasst

# achievement note
ach-nevertouched-note = räum einen fels ab, ohne selbst ein einziges mal draufzuhauen

# achievement name
ach-underminute-name = ein fels in unter einer minute

# achievement note
ach-underminute-note = räum einen fels in unter einer minute ab

# achievement name
ach-everyjob-name = jeder job zugleich besetzt

# achievement note
ach-everyjob-note = setz auf jeden job gleichzeitig mindestens einen arbeiter

# achievement name
ach-tablebeaten-name = wir sind sowas von zurück

# achievement note
ach-tablebeaten-note = geh mit 50k plus aus einer einzigen hand im casino

# achievement name
ach-tableruin-name = zeit für einen kredit

# achievement note
ach-tableruin-note = geh mit 50k minus aus einer einzigen hand im casino

# achievement name
ach-bird-name = weg von meinem land

# achievement note
ach-bird-note = erschreck einen vogel

# achievement name
ach-wholelot-name = keiner von euch

# achievement note
ach-wholelot-note = erschreck jeden vogel eines schwarms

# achievement name
ach-catchall-name = jongleur

# achievement note
ach-catchall-note = wirf eine volle hand staub, so groß sie geht, und fang jedes korn

# achievement name
ach-lifted-name = komm her, du

# achievement note
ach-lifted-note = heb einen arbeiter hoch

# achievement name
ach-shookload-name = taschen leeren

# achievement note
ach-shookload-note = schüttel eine volle ladung aus einem arbeiter

# achievement name
ach-hatoff-name = hut ab

# achievement note
ach-hatoff-note = schüttel einem arbeiter den hut vom kopf

# achievement name
ach-dizzy-name = schütteltrauma

# achievement note
ach-dizzy-note = schüttel einen arbeiter schwindlig

# achievement name
ach-muckrain-name = ein unglück kommt selten allein

# achievement note
ach-muckrain-note = steh einen schlammregen durch

# achievement name: rocks cleared; $n is the count as written (10, 25, 50, 100)
ach-rocks-name = { $n } felsen

# achievement note: rocks cleared; $n is the count
ach-rocks-note = räum { $n } felsen ab

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = räum { $n } felsen ab, das sind ganz schön viele steine

# achievement name: pebbles banked; $n is the count, short (10k, 1m)
ach-pebbles-name = { $n } kiesel

# achievement note: pebbles banked; $n is the count, short
ach-pebbles-note = versenk { $n } kiesel

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } quadrate

# achievement note: crew hired; $n is the count
ach-crew-note = stell { $n } leute ein

# achievement name: the first ore ladder rung
ach-ore0-name = 1k erz aus dem bruch

# achievement name: the second ore ladder rung
ach-ore1-name = 10k erz

# achievement note: ore dug; $n is the count, short (1k, 10k)
ach-ore-note = grab { $n } erz aus dem steinbruch

## Index

# index entry name
idx-dust-name = kiesel

# index entry text
idx-dust-text = vom fels abgebaut.

# index entry name
idx-shard-name = erz

# index entry text
idx-shard-text = aus dem steinbruch geholt.

# index entry name
idx-spore-name = ernte

# index entry text
idx-spore-text = auf der farm angebaut.

# index entry name
idx-spark-name = funken

# index entry text
idx-spark-text = von den zauberern mit blitzen aus dem stern geschlagen.

# index entry name
idx-scale-name = schuppen

# index entry text
idx-scale-text = aus dem zermahlen, was die schlange fallen lässt.

# index entry name
idx-crit-name = krits

# index entry text
idx-crit-text = hat die chance, mehr schaden zu machen.

# index entry name
idx-rock-name = der fels

# index entry text
idx-rock-text = hat deine frau zerquetscht, wird nach wertvollen kieseln abgebaut.

# index entry name
idx-pit-name = die grube

# index entry text
idx-pit-text = wirf deine kiesel und was sonst noch so rumliegt zum lagern hier rein.

# index entry name
idx-rift-name = der riss

# index entry text
idx-rift-text = eine gewaltige kieselkonzentration hat einen riss in die wirklichkeit gerissen?

# index entry name
idx-abyss-name = der abgrund

# index entry text
idx-abyss-text = der riss hat zu viele kiesel geschluckt, um stabil zu bleiben, und die ganze grube verschlungen.

# index entry name
idx-muck-name = schlamm

# index entry text
idx-muck-text = die verschmutzung verdirbt das ökosystem, und der regen hinterlässt haufen von schmodder.

# index entry name
idx-poop-name = kacke

# index entry text
idx-poop-text = igitt.

# index entry name
idx-bird-name = vögel

# index entry text
idx-bird-text = ganz normale vögel.

# index entry name
idx-house-name = das haus

# index entry text
idx-house-text = hier wohnen die arbeiter.

# index entry name
idx-pollution-name = verschmutzung

# index entry text
idx-pollution-text = der preis der industrie. abbauen, anbauen, steinbrechen, zaubern, alles macht dreck, der die luft verschmutzt.

# index entry name
idx-star-name = der stern

# index entry text
idx-star-text = ein echter stern, von zauberern erschaffen und für funken zerblitzt.

# index entry name
idx-balloon-name = ballon

# index entry text
idx-balloon-text = mit einem luftfilter, der die verschmutzung aus den wolken holt.

# index entry name
idx-recycler-name = der recycler

# index entry text
idx-recycler-text = verdichtet luftverschmutzung zu brauchbaren kieseln.

# index entry name
idx-bench-name = die werkbank

# index entry text
idx-bench-text = im grunde der gemischtwarenladen. träger-upgrades, hand-upgrades, neue gebäude.

# index entry name
idx-shack-name = die hütte

# index entry text
idx-shack-text = laden für upgrades der bergleute.

# index entry name
idx-stats-name = die bücher

# index entry text
idx-stats-text = allerlei zahlen zu deinem spiel: einkommen, spielzeit.

# index entry name
idx-farm-name = die farm

# index entry text
idx-farm-text = beete, auf denen ernte wächst.

# index entry name
idx-quarry-name = der steinbruch

# index entry text
idx-quarry-text = grab tief nach erz.

# index entry name
idx-apothecary-name = die apotheke

# index entry text
idx-apothecary-text = hier wird gebraut.

# index entry name
idx-tower-name = der turm

# index entry text
idx-tower-text = das zuhause der zauberer.

# index entry name
idx-casino-name = das casino

# index entry text
idx-casino-text = ein casino mit nagelbrett.

# index entry name
idx-outhouse-name = die besenkammer

# index entry text
idx-outhouse-text = das zuhause der hausmeister.

# index entry name
idx-filter-name = der luftfilter

# index entry text
idx-filter-text = zieht die verschmutzung aus dem himmel.

# index entry name
idx-ram-name = der rammbock

# index entry text
idx-ram-text = hackt sich schnell durch felsen.

# index entry name
idx-jaw-name = der bohrer

# index entry text
idx-jaw-text = ein maschinenbohrer für schnellen aushub.

# index entry name
idx-tiller-name = die fräse

# index entry text
idx-tiller-text = traktoren machen mit der ernte kurzen prozess.

# index entry name
idx-belt-name = das förderband

# index entry text
idx-belt-text = kippt kiesel ganz von selbst in die grube.

# index entry name
idx-sphere-name = die kugel

# index entry text
idx-sphere-text = eine dysonsphäre, die die kraft des sterns erntet.

# index entry name
idx-roomba-name = saugroboter

# index entry text
idx-roomba-text = automatische sauger, die den dreck wegmachen.

# index entry name
idx-driver-name = gabelstapler

# index entry text
idx-driver-text = ein automatischer gabelstapler, der ladungen sehr schnell herumfährt.

# index entry name
idx-props-name = holzsperre

# index entry text
idx-props-text = der verzweifelte versuch, den fels aufzuhalten.

# index entry name
idx-net-name = das netz

# index entry text
idx-net-text = flicht ernte zu einem netz, das den fels fängt und bremst.

# index entry name
idx-arch-name = der bogen

# index entry text
idx-arch-text = ein stabiler bogen aus stein und metall, der den fels aufhalten soll.

# index entry name
idx-dome-name = die barriere

# index entry text
idx-dome-text = eine energiebarriere, von den zauberern beschworen.

# index entry name
idx-deep-name = der abgrund

# index entry text
idx-deep-text = nicht ganz weltall, nicht ganz ozean, irgendwas dazwischen.

# index entry name
idx-portal-name = das portal

# index entry text
idx-portal-text = der einzige weg in den abgrund und wieder hinaus.

# index entry name
idx-crusher-name = der brecher

# index entry text
idx-crusher-text = hier liegen die schuppen der tiefe.

# index entry name
idx-pods-name = die kapseln

# index entry text
idx-pods-text = kapseln für die arbeiter im abgrund.

# index entry text
idx-haul-text = tragen kiesel in die grube.

# index entry name
idx-rockcrew-name = steinklopfer

# index entry text
idx-rockcrew-text = hauen auf den fels ein.

# index entry name
idx-quarrycrew-name = bergleute

# index entry text
idx-quarrycrew-text = graben erz im steinbruch.

# index entry name
idx-farmcrew-name = bauern

# index entry text
idx-farmcrew-text = bestellen die ernte.

# index entry name
idx-purify-name = luftreiniger

# index entry text
idx-purify-text = fliegen die luftreinigerballons herum, um den himmel sauber zu machen.

# index entry name
idx-stir-name = apotheker

# index entry text
idx-stir-text = kümmert sich um eine charge tränke.

# index entry text
idx-janitor-text = machen kacke und schlamm weg.

# index entry text
idx-wizard-text = gelehrte magier, die stücke von einem stern abschlagen können.

# index entry text
idx-build-text = stellen gebäude und maschinen auf.

# index entry name
idx-breaker-name = spalter

# index entry text
idx-breaker-text = hat beim abbauen am fels viel mehr wucht.

# index entry name
idx-carter-name = kärrner

# index entry text
idx-carter-text = träger können einen karren ziehen und so doppelt so viel tragen.

# index entry name
idx-blaster-name = sprengmeister

# index entry text
idx-blaster-text = mit kleinen sprengladungen, um richtig erz rauszuholen.

# index entry name
idx-grower-name = gärtner

# index entry text
idx-grower-text = kann sich doppelt so viel um die ernte kümmern.

# index entry name
idx-brews-name = tränke

# index entry text
idx-brews-text = besondere tränke aus der apotheke.

# index entry text
idx-party-text = eine tapfere heldengruppe, die ihr leben riskiert, um die schlange zu besiegen.

# index entry name
idx-sqwife-name = deine frau

# index entry text
idx-sqwife-text = lebte ihr leben, bis zum vorfall (oder den vorfällen), eingeklemmt unter felsen, die endlos vom himmel fallen. verrückt.

# index entry name
idx-notices-name = erfolge

# index entry text
idx-notices-text = die meilensteine des hofs.

# index entry name
idx-serpent-name = die schlange

# index entry text
idx-serpent-text = irgendein seltsames schlangenartiges wesen, das im abgrund haust.

## Jobs

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = steinklopfer

# a job, as the boards, the crew and the index say it (the save's key is haulers)
job-haulers = träger

# a job, as the boards, the crew and the index say it (the save's key is quarriers)
job-quarriers = bergleute

# a job, as the boards, the crew and the index say it (the save's key is farmhands)
job-farmhands = bauern

# a job, as the boards, the crew and the index say it (the save's key is scholars)
job-scholars = gelehrte

# a job, as the boards, the crew and the index say it (the save's key is purifiers)
job-purifiers = luftreiniger

# a job, as the boards, the crew and the index say it (the save's key is stirrers)
job-stirrers = apotheker

# a job, as the boards, the crew and the index say it (the save's key is janitors)
job-janitors = hausmeister

# a job, as the boards, the crew and the index say it (the save's key is wizards)
job-wizards = zauberer

# a job, as the boards, the crew and the index say it (the save's key is builders)
job-builders = bauleute

# a job, as the boards, the crew and the index say it (the save's key is fighters)
job-fighters = kämpfer

# a job, as the boards, the crew and the index say it (the save's key is gatherers)
job-gatherers = sammler

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = tiefenbauer

## Boards

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit: so many a minute; $icon is the coin's mark (html)
unit-per-min = { $icon }/min

# a row's unit: so many a dig; $icon is the coin's mark (html)
unit-per-dig = { $icon }/grabung

# a row's unit: so many a harvest; $icon is the coin's mark (html)
unit-per-harvest = { $icon }/ernte

# a row's unit after its number: swings a second
unit-hits-s = schläge/s

# a row's unit after its number: swings a second, from one
unit-hit-s = schlag/s

# a row's unit after its number: throws a second
unit-throws-s = würfe/s

# a row's unit after its number: a wizard's bolts a minute
unit-bolts-min = blitze/min

# a row's unit after its number: star cells a bolt knocks off
unit-cells-bolt = zellen/blitz

# a row's unit after its number: haze a balloon takes in a second
unit-motes-s = partikel/s

# a row's unit after its number: farm plots
unit-plots = beete

# a row's unit after its number: the quarry's shovels
unit-shovels = schaufeln

# a row's unit after its number: the apothecary's pots
unit-pots = töpfe

# a row's unit after its number: doses a batch
unit-doses = portionen

# a unit after a number: seconds
unit-s = s

# a deep row's unit after its number: damage
unit-dmg = schaden

# a deep row's unit after its number: damage a second
unit-dmg-s = schaden/s

# a brew's unit after its percentage: how much faster
unit-faster = schneller

# a brew's unit after its percentage: how much stronger
unit-stronger = stärker

# a brew's unit after its number: crit chance
unit-crit = krit

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower = { $more ->
        [yes] kauf noch { $left } gärtner zum freischalten
       *[no] kauf { $left } gärtner zum freischalten
    }

# a machine's row until its station's set of blaster hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-blaster = { $more ->
        [yes] kauf noch { $left } sprengmeister zum freischalten
       *[no] kauf { $left } sprengmeister zum freischalten
    }

# a price in time, a minute or more: $n minutes
price-min = { $n } min

# a row's verb, before its gain: how much a hand holds
does-hold = halten

# the bench: your carry ladder
row-carry = traglast

# a row's verb, before its gain: swings
does-hit = schlagen

# the bench: your swing pace ladder
row-speed = auto-schlag

# a row's verb, before its gain: throws
does-throw = werfen

# the bench: how often a held hand lets go
row-toss = wurftempo

# a row's verb, before its gain: how far a throw carries
does-reach = weite

# the bench: how far a handful carries
row-reach = wurfweite

# a row's verb, before its gain: what a swing takes
does-per-swing = pro schlag

# the bench: what a swing of yours takes
row-pick = hackenschaden

# the bench: holding a handful throws it by itself
row-autotoss = halten zum werfen

# the bench: holding the pointer on the boulder swings by itself
row-auto = halten zum abbauen

# a row's verb, before its gain: how much a body carries
does-carry = tragen

# the bench: the haulers' load ladder
row-haulcarry = trägerlast

# a row's verb, before its gain: walking pace
does-walk = laufen

# the bench: the haulers' pace ladder
row-haulpace = trägertempo

# a row's verb, before its gain: crits
does-crit = krit

# the bench: the chance a hit is a crit
row-critchance = krit-chance

# the bench: how much more a crit takes
row-critmult = krit-schaden

# the shack: the diggers' swing pace ladder
row-rockhandspeed = schlagtempo

# the shack: what a digger's swing takes
row-rockhandpick = hackenschaden der klopfer

# the bench: the row that puts up the apothecary
row-unlockapothecary = apotheke bauen

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = brau kurze stärkungen für deine quadratarbeiter

# the bench: what the apothecary row gives, where a gain would go
row-unlockapothecary-blurb = braut tränke

# the bench: the row that puts up the casino
row-unlockcasino = casino bauen

# the bench: what the casino is for, under its name
row-unlockcasino-note = ein tisch, der einen einsatz nimmt und doppelt oder nichts zahlt

# the bench: what the casino row gives, where a gain would go
row-unlockcasino-blurb = doppelt oder nix

# the bench: the row that puts up the farm
row-unlockfarm = farm bauen

# the bench: what the farm is for, under its name
row-unlockfarm-note = bau ein bisschen ernte an

# the bench: what the farm row gives, where a gain would go
row-unlockfarm-blurb = ernte anbauen

# the bench: the row that puts up the air filter
row-unlockfilter = luftfilter bauen

# the bench: what the air filter is for, under its name
row-unlockfilter-note = verkauft die ballons, die den dunst wieder aus dem himmel ziehen, und liest den himmel ab

# the bench: what the air filter row gives, where a gain would go
row-unlockfilter-blurb = klärt den himmel

# the bench: the row that puts up the janitor's closet
row-unlockouthouse = besenkammer bauen

# the bench: what the closet is for, under its name
row-unlockouthouse-note = du hast genug kacke gesehen, räumen wir sie weg

# the bench: what the closet row gives, where a gain would go
row-unlockouthouse-blurb = kacke weg

# the bench: the row that puts up the quarry
row-unlockquarry = steinbruch bauen

# the bench: what the quarry is for, under its name
row-unlockquarry-note = fang an, nach erz zu graben

# the bench: what the quarry row gives, where a gain would go
row-unlockquarry-blurb = nach erz graben

# the bench: the row that puts up the shack
row-unlockshack = hütte bauen

# the bench: what the shack is for, under its name
row-unlockshack-note = Upgrades fürs Graben

# the bench: what the shack row gives, where a gain would go
row-unlockshack-blurb = fels-ausrüstung

# the bench: the row that puts up the tower
row-unlocktower = den turm entdecken

# the bench: what the tower is for, under its name
row-unlocktower-note = beschwör ein paar zauberer

# the bench: the first barrier against the boulder
row-props = holzsperre

# the bench: the wooden barrier's line
row-props-note = bau schnell eine sperre, um deine frau zu retten

# the bench: the second barrier
row-net = das netz

# the bench: the net's line
row-net-note = das ging nicht, vielleicht den fels mit einem netz fangen?

# the bench: the third barrier
row-arch = den bogen hauen

# the bench: the arch's line
row-arch-note = immer noch nicht stabil genug. bauen wir einen steinbogen.

# the tower: the last barrier, the wizards'
row-dome = vielleicht wissen die zauberer was?

# the tower: the last barrier's line
row-dome-note = alles vom boden hat versagt. was bleibt, ist nicht vom boden

# a hat's name: the diggers' (its row, the index, the crew)
kit-breaker = spalter

# what the breaker hat does
kit-breaker-does = doppelter biss

# where the breaker hat is worn
kit-breaker-place = der fels

# a hat's name: the haulers' cart
kit-carter = kärrner

# what the cart does
kit-carter-does = doppelte last

# where the cart is used
kit-carter-place = die grube

# a hat's name: the miners'
kit-blaster = sprengmeister

# what the blaster hat does
kit-blaster-does = doppelt so viele gänge

# where the blaster hat is worn
kit-blaster-place = der steinbruch

# a hat's name: the farmers'
kit-grower = gärtner

# what the grower hat does
kit-grower-does = doppelte pflege

# where the grower hat is worn
kit-grower-place = die farm

# the bench: a forklift that drives itself
row-driver = gabelstapler

# the bench: the forklift's line
row-driver-note = ein gabelstapler, der selbst fährt: er bringt alles zur grube, ohne fahrer, und qualmt

# the bench: the forklifts' load ladder
row-liftload = staplerlast

# a row's verb, before its gain: driving pace
does-drive = fahren

# the bench: the forklifts' pace ladder
row-liftpace = staplertempo

# a heading on the bench's board: your own ladders
sect-you = du

# a heading on the bench's board: the crit ladders
sect-luck = glückstreffer

# a heading on the bench's board: the haulers' gear
sect-haulers = die träger

# a heading on the bench's board: the rows that put up a new place
sect-build = bauen

# the house's board: buy another house to hire somebody
row-house = noch ein haus

# the ribbon on every goal card: the barrier the story is on
goal-title = deine frau retten

# a card greyed out: its next rung costs crops, and there is no farm yet
needs-spore = ernte nötig

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = steinbruch nötig

# a card greyed out: its next rung costs a spark, and none has been earned
needs-spark = funke nötig

# a card greyed out: its next rung costs a scale, and the deep is not open
needs-scale = schuppe nötig

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
# (de: "at $place" would need a case the nominative place name cannot give, so the place stands in brackets)
kit-note = { $name }: { $does } ({ $place })

# the shack: the ram's tuning ladder
row-tuneram = rammstoß

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = der rammbock schlägt { $n }x härter

# a heading on any board over the rows no section names
sect-and = und

# a card the yard is at: somebody is building it (the strip's word with nothing to hand back; the gain line's word)
card-building = im bau

# the strip at a card's foot: buy another copy behind the one being built
card-another = + noch einer

# a card in line: nobody is at it yet
card-queued = wartet

# a finished ladder, where its price would go
card-done = fertig

# the tower: an enchantment's name
spell-drive = maschinen beschleunigen

# the tower: the enchantment's line
spell-drive-note = jede maschine im hof läuft 50 % schneller

# the tower: an enchantment's name
spell-luck = steinbruch anreichern

# the tower: the enchantment's line
spell-luck-note = jede grabung im steinbruch bringt 25 % mehr erz

# the tower: an enchantment's name
spell-gmo = ernte genmanipulieren

# the tower: the enchantment's line
spell-gmo-note = jede ernte ist 25 % größer

# the tower: an enchantment's name
spell-thrift = häuser verbilligen

# the tower: the enchantment's line
spell-thrift-note = jedes haus ab jetzt 75 % billiger

# the tower: an enchantment's name
spell-sweep = hausmeister antreiben

# the tower: the enchantment's line
spell-sweep-note = hausmeister schaufeln und laufen doppelt so schnell

# the tower: how often a wizard throws
row-wizspeed = schneller zaubern

# the tower: how often a wizard throws, its line; $pct is the rise a rung
row-wizspeed-note = jeder zauberer schleudert { $pct } % öfter einen blitz auf den stern

# a row's verb, before its gain: a wizard's casting
does-cast = zaubern

# the tower: how much of the star a bolt takes
row-wizpower = stärkere blitze

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = jeder blitz schlägt { $next } zellen vom stern statt { $now }

# the tower: a wizard's hat
row-wizard = zauberer beschwören

# the tower: a wizard's line
row-wizard-note = fliegt hoch, zerblitzt den stern zu funken und ruft einen neuen, wenn der himmel leer ist

# the tower: the sphere's line
row-sphere-note = fang die kraft eines sterns ein

# the tower: the sphere's tuning ladder
row-tunesphere = kugelertrag

# the tower: the sphere's tuning ladder, its line; $n is how many times the light
row-tunesphere-note = die kugel fängt { $n }x so viel licht

# the tower: the barrier the wizards pour
row-dome-tower = die barriere beschwören

# the tower: the barrier's line
row-dome-tower-note = an diesem ding kommt nichts vorbei.

# the tower: the way down to the deep
row-portal = das portal beschwören

# the tower: the portal's line
row-portal-note = ein weg hinab in den abgrund, offen gehalten.

# a heading on the tower's board: the spells
sect-enchantments = verzauberungen

# a heading on the tower's board: the portal
sect-abyss = der abgrund

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign (50%)
spell-drive-blurb = +{ $pct } tempo

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-luck-blurb = +{ $pct } erz

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-gmo-blurb = +{ $pct } ernte

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-thrift-blurb = { $pct } billiger

# the tower: what the enchantment gives, where a gain would go; $x is how many times
spell-sweep-blurb = { $x }x schneller

# the farm: what a harvest is worth, a ladder
row-crop = ernteertrag

# a row's verb, before its gain: tending plots
does-tend = pflegen

# the farm: how often a plot is tended, a ladder
row-tend = farmtempo

# the farm: break another plot
row-farmplot = noch ein beet

# the farm: the tiller's tuning ladder
row-tunetiller = fräsentempo

# the farm: the tiller's tuning ladder, its line; $n is how many times faster
row-tunetiller-note = die fräse arbeitet { $n }x schneller

# a heading on the farm's board: what a plot pays
sect-crop = die ernte

# the quarry: what a dig turns up, a ladder
row-seam = erzertrag

# a row's verb, before its gain: digging
does-dig = graben

# the quarry: how often a dig happens, a ladder
row-quarrypace = abbautempo

# the quarry: another miner's shovel at the face
row-quarrybench = noch eine schaufel

# the quarry: the drill's tuning ladder
row-tunejaw = bohrerbiss

# the quarry: the drill's tuning ladder, its line; $n is how many times harder
row-tunejaw-note = der bohrer beißt { $n }x härter

# a heading on the quarry's board: what the hole pays
sect-ore = das erz

# a heading on the farm's board over who works the plots, with their headcount (the job's save key, as it has always read)
sect-farmhands = feldarbeiter

# a heading on the quarry's board over who works the cut, with their headcount (the job's save key, as it has always read)
sect-quarriers = steinbrecher

# a row's verb, before its gain: a balloon's flight
does-fly = fliegen

# the air filter: how fast the balloons go from cloud to cloud
row-balloonspeed = ballontempo

# a row's verb, before its gain: what a balloon takes in
does-filter = filtern

# the air filter: how much haze a balloon draws
row-power = ballonkraft

# the air filter: another balloon
row-balloon = der ballon

# the air filter: the balloon's line
row-balloon-note = reitet auf den wolken und lässt unter sich fallen, was er fängt

# the air filter: the recycler
row-recycler = der recycler

# the air filter: the recycler's line
row-recycler-note = was die ballons fangen, fällt als kiesel statt als schlamm herunter

# a heading on the air filter's board
sect-equipment = ausrüstung

# the janitor's closet: the second cap on the stand
row-loopost = noch eine mütze

# the janitor's closet: another roomba
row-roomba = ein saugroboter

# the janitor's closet: the roomba's line
row-roomba-note = fährt zum dreck auf dem offenen hof und bringt ihn heim; ein hausmeister passt auf sie auf, und sie qualmen

# the janitor's closet: the roombas' tuning ladder
row-tuneroomba = saugkraft

# the janitor's closet: the roombas' tuning ladder, its line; $n is how many times faster
row-tuneroomba-note = die saugroboter saugen { $n }x schneller

# a brew's name: the speed one, priced in crops
tonic-stew = deftiger eintopf

# a brew's name: the strength one, priced in ore
tonic-strong = starkes gebräu

# a brew's name: the crit one, priced in sparks
tonic-brace = belebendes tonikum

# the apothecary: keep the fires going, or let them die once a batch is dealt (a setting)
row-potkeep = weiterbrauen

# the apothecary's keep-brewing setting: on
row-potkeep-on = charge um charge

# the apothecary's keep-brewing setting: off
row-potkeep-off = nur diese eine

# the apothecary: room for one more pot and its stirrer
row-anotherpot = noch ein topf

# a row's verb, before its gain: how long a dose lasts
does-lasts = hält

# the apothecary: how long a dose lasts, a ladder
row-bufflength = trankstärke

# the apothecary: doses a batch, a ladder
row-brewdoses = chargengröße

# a heading on the apothecary's board over the pots, with the stirrers' headcount
sect-pot = der topf

# a heading on the apothecary's board
sect-brewing = brauen

# a heading on the apothecary's board: one ladder a brew
sect-potency = wirkung

# a brew's potency row's verb, before its gain
does-faster = schneller

# a brew's potency row's verb, before its gain
does-stronger = stärker

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v } % { $unit }, { $secs } s

# what the crit brew does: $v points of crit chance for $secs seconds
tonic-gain-crit = +{ $v } krit, { $secs } s

# the shack's heading over the diggers' gear, with their headcount
sect-diggers = steinklopfer

## Machines

# a machine's name: the quarry's (the save's key is jaw)
machine-jaw = der bohrer

# a machine's name: the boulder's
machine-ram = der rammbock

# a machine's name: the farm's
machine-tiller = die fräse

# a machine's name: carries pebbles from the boulder to the hole
machine-belt = das förderband

# a machine's name: the shell round the star
machine-sphere = die kugel

# a machine's name: the janitor's closet's
machine-roomba = die saugroboter

## Stations

# a deep station's board with nothing on it yet
station-party-empty = noch nichts zu lernen

# a station's name: its board's title, the pointer's label, the queue card
station-casino = das casino

# a station's name
station-filter = der luftfilter

# the air filter's board with nothing on it
station-filter-empty = nichts zum einbauen

# a station's name
station-quarry = der steinbruch

# the quarry's board with nothing on it
station-quarry-empty = der steinbruch ist so tief, wie es geht

# a station's name
station-farm = die farm

# the farm's board with nothing on it
station-farm-empty = der boden ist ganz umgegraben

# a station's name
station-apothecary = die apotheke

# the apothecary's board with nothing on it
station-apothecary-empty = der topf steht kalt

# a station's name
station-tower = der turm

# the tower's board with nothing on it
station-tower-empty = hier regt sich noch nichts

# a station's name
station-shack = die hütte

# the shack's board with nothing on it
station-shack-empty = das werkzeug ist alles am fels

# the bench's board with nothing on it
station-bench-empty = nichts zu verkaufen

# a station's name
station-outhouse = die besenkammer

# the janitor's closet's board with nothing on it
station-outhouse-empty = die besen hängen alle an ihren haken

# a station's name
station-house = das haus

# a station's name: the noticeboard over the pit
station-stats = die bücher

# the books with nothing on them
station-stats-empty = noch ist nichts reingekommen

# a station's name: the deep's purse
station-crusher = der brecher

# the crusher's pile-full mark, on a hover
station-crusher-full = der boden ist voller schuppen

# a station's name: the deep's houses
station-pods = die kapseln

# the pods' board with nothing on it
station-pods-empty = nichts zu bauen

# the lab's board title, still in the page's markup (the lab itself is gone)
station-lab = das labor

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party = { $nth ->
        [0] der { $who }
        [1] der zweite { $who }
        [2] der dritte { $who }
        [3] der vierte { $who }
       *[other] der undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot = { $nth ->
        [0] eine station
        [1] eine zweite station
        [2] eine dritte station
        [3] eine vierte station
       *[other] eine undefined station
    }

## Crew

# the crew window: where a body is, standing at its station (rockhands)
crew-at-rockhands = am fels

# the crew window: where a body is, standing at its station (haulers)
crew-at-haulers = an der grube

# the crew window: where a body is, standing at its station (quarriers)
crew-at-quarriers = im steinbruch

# the crew window: where a body is, standing at its station (farmhands)
crew-at-farmhands = an den beeten

# the crew window: where a body is, standing at its station (purifiers)
crew-at-purifiers = am luftfilter

# the crew window: where a body is, standing at its station (janitors)
crew-at-janitors = räumt auf

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = in deiner hand

# the crew window and a body's card: where a body is (falling)
crew-where-falling = in der luft

# the crew window and a body's card: where a body is (home)
crew-where-home = zu hause

# the crew window and a body's card: where a body is (basket)
crew-where-basket = oben im ballon

# the crew window and a body's card: where a body is (yard)
crew-where-yard = auf dem hof

# the crew window and a body's card: where a body is (resting)
crew-where-resting = in der pause

# the crew window and a body's card: where a body is (walking)
crew-where-walking = unterwegs

# the crew window and a body's card: where a body is (deep)
crew-where-deep = in der tiefe

# a body's card, doing: at its job with no step to name (rockhands)
crew-does-rockhands = haut auf den fels

# a body's card, doing: at its job with no step to name (quarriers)
crew-does-quarriers = baut erz ab

# a body's card, doing: at its job with no step to name (farmhands)
crew-does-farmhands = farmt

# a body's card, doing: at its job with no step to name (scholars)
crew-does-scholars = forscht

# a body's card, doing: at its job with no step to name (purifiers)
crew-does-purifiers = reinigt die luft

# a body's card, doing: at its job with no step to name (janitors)
crew-does-janitors = schaufelt

# a body's card, doing: at its job with no step to name (haulers)
crew-does-haulers = transportiert

# a body's card, doing: what its step is (seek)
crew-now-seek = sucht kiesel

# a body's card, doing: what its step is (dump)
crew-now-dump = kippt eine ladung

# a body's card, doing: what its step is (muck)
crew-now-muck = schaufelt dreck weg

# a body's card, doing: what its step is (cut)
crew-now-cut = gräbt im steinbruch

# a body's card, doing: what its step is (up)
crew-now-up = klettert raus

# a body's card, doing: what its step is (down)
crew-now-down = klettert runter

# a body's card, doing: what its step is (tend)
crew-now-tend = pflegt ein beet

# a body's card, doing: what its step is (home)
crew-now-home = geht heim

# a body's card, doing: what its step is (idle)
crew-now-idle = nicht viel

# a body's card, doing: what its step is (in)
crew-now-in = drinnen

# a body's card, doing: what its step is (aloft)
crew-now-aloft = oben im ballon

# a body's card, doing: minding a machine; $name is the machine's (the belt)
# (de: "minds $name" would need the accusative, which the machine's name in its basic form cannot give)
crew-minding = aufsicht: { $name }

# a body's card, doing: what its step is (to)
crew-now-to = geht hin

# a body's card, doing: what its step is (kit)
crew-now-kit = holt ausrüstung an der werkbank

# a body's card, doing: what its step is (build)
crew-now-build = baut

# a body's card, doing: what its step is (working)
crew-now-working = arbeitet

# a body with no name, on its card and in the crew window
crew-somebody = jemand

# a body's card: the label before how long it has been here (a column of ten in monospace)
crew-card-age = alter

# a body's card, age: under a minute
crew-card-new = heute neu

# a body's card, age: $mins minutes
crew-card-mins = { $mins } min

# a body's card: the label before what it is doing (a column of ten in monospace)
crew-card-doing = tätigkeit

# a heading in the crew window over the yard's crew
crew-sect-yard = der hof

# a heading in the crew window over the deep's crew
crew-sect-deep = die tiefe

# a heading on the house's board, and the window it opens
crew-sect-crew = die leute

## The books

# the books: a coin, before its rate
books-dust = kiesel

# the books: a coin, before its rate
books-shard = erz

# the books: a coin, before its rate
books-spore = ernte

# the books: a coin, before its rate
books-spark = funken

# the books: the window the rates are taken over, in minutes ($n may be ½)
books-over-min = { $n } min

# the books: the row that steps the window the rates are taken over
books-over = gemittelt über

# the books: the window, in a rate's note (nothing in the last half minute)
# (de: written in the dative, since it only ever stands after "in" in books-got)
books-last-half = der letzten halben minute

# the books: the window, in a rate's note
books-last-one = der letzten minute

# the books: the window, in a rate's note; $n minutes, more than one
books-last-mins = den letzten { $n } minuten

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } in { $over }

# the books: a rate's note when nothing came in
books-nothing = nichts

# the books: a line
books-dirt-mach = von den maschinen

# the books: a line
books-dirt-dust = vom fels

# the books: a line
books-dirt-shard = aus dem steinbruch

# the books: a line
books-dirt-spore = von der farm

# the books: the sky full in, while the filter is winning
books-due-never = nicht bei diesem tempo

# the books: a line
books-sky-trend = verschmutzung

# the books: a line
books-sky-up = ausgestoßen, pro minute

# the books: a line
books-sky-down = rausgeholt, pro minute

# the books: a line
books-sky-haze = der himmel ist

# the books: how full the sky is; $pct with its sign
books-sky-full = { $pct } voll

# the books: a line
books-sky-due = voll in

# the books: a line
books-sky-rains = überstandene schauer

# the books: a line
books-sky-muck = herumliegender schlamm

# the books: a line
books-working = arbeiten

# the books: a line
books-idle = untätig

# the books: a line
books-best-mined = am meisten vom fels

# the books: a line
books-best-quarried = am meisten erz

# the books: a line
books-best-farmed = am meisten ernte

# the books: a line
books-best-stored = am meisten in die grube

# the books: a line
books-best-tidied = am meisten schlamm geräumt

# the books: the longest on one clock, an hour or more; $n hours to a tenth
books-hours = { $n } h

# the books: the longest on one clock, under an hour; $n minutes
books-mins = { $n } min

# the books: a line
books-eldest = am längsten am stück

# the books: a line
books-tally-rocks = felsen abgeräumt

# the books: a line
books-tally-banked = kiesel versenkt

# the books: a line
books-tally-ore = erz gegraben

# the books: a coin earned over the whole game; $coin is books-shard, books-spore or books-spark
books-tally-earned = { $coin } verdient

# the books: a line
books-tally-rift = durch den riss

# the books: a line
books-tally-brews = chargen gebraut

# the books: a line
books-tally-hats = hüte fertig

# the books: a line
books-tally-crew = auf der lohnliste

# the books: a line
books-tally-notes = erfolge erhalten

# the books: a line
books-tally-under = frau unterm fels seit

# the books: a line
books-tally-saved = frau gerettet in

# a heading in the books, and on the noticeboard
books-sect-income = einkommen pro sekunde

# a heading in the books
books-sect-sky = der himmel

# a heading in the books
books-sect-crew = die leute

# a heading in the books
books-sect-tally = die bilanz

# the noticeboard: the way into the books (off the board for now)
books-open = die bücher öffnen

# the noticeboard: how long this yard has been played
books-playtime = spielzeit

## Hover

# the hover on a deep station whose Recruit still waits on its first choice
hover-choose = wähl einen kämpfer

# the hover over a grain of ore
hover-ore = erz

# the hover over a crop, a grain of it or a grown plot
hover-crop = ernte

# the hover over a spark
hover-spark = funke

# the hover over a pebble
hover-pebble = kiesel

# the hover over the drowned pit
hover-abyss = der abgrund

# the hover over the rift
hover-rift = der riss

# the hover over poop on the ground
hover-poop = kacke

# the hover over muck on the ground
hover-muck = schlamm

# the hover over a body, as the job it does (its type, rockhand)
hover-rockhand = steinklopfer

# the hover over a body, as the job it does (its type, hauler)
hover-hauler = träger

# the hover over a body, as the job it does (its type, quarrier)
hover-quarrier = bergmann

# the hover over a body, as the job it does (its type, farmhand)
hover-farmhand = bauer

# the hover over a body, as the job it does (its type, scholar)
hover-scholar = gelehrter

# the hover over a body, as the job it does (its type, purifier)
hover-purifier = luftreiniger

# the hover over a body, as the job it does (its type, stirrer)
hover-stirrer = apotheker

# the hover over a body, as the job it does (its type, janitor)
hover-janitor = hausmeister

# the hover over a body, as the job it does (its type, wizard)
hover-wizard = zauberer

# the hover over a body, as the job it does (its type, builder)
hover-builder = bauarbeiter

# the hover over a body, as the job it does (its type, fighter)
hover-fighter = kämpfer

# the hover over a body, as the job it does (its type, gatherer)
hover-gatherer = sammler

# the hover over a body, as the job it does (its type, delver)
hover-delver = tiefenbauer

# the hover over the portal, from the deep
hover-portal-up = das portal — hoch zum hof

# the hover over the portal, from the yard
hover-portal-down = das portal — runter in die tiefe

# the hover over the serpent
hover-serpent = die schlange

# the hover over the crew's houses
hover-house = haus

# the hover over the boulder
hover-rock = fels

# the hover over a bird
hover-bird = vogel

# the hover over a balloon
hover-balloon = ballon

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the air filter's gauge: the sky filling faster than it is cleaned
hover-dial-worse = wird schlimmer

# the air filter's gauge: the sky cleaned faster than it fills
hover-dial-better = wird besser

# the air filter's gauge: neither
hover-dial-steady = hält sich

# the hover over the counter above the pit
hover-counter = kiesel in der grube: damit zahlst du alles

# the air filter's gauge: the needle in the first band
hover-dial-clean = sauber

# the air filter's gauge: the needle in the middle band
hover-dial-dirty = dreckig

# the air filter's gauge: the needle in the last band
hover-dial-filthy = verdreckt

# the hover on a pile-full mark: a station's pile has nowhere left to go
hover-pile-full = haufen ist voll

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } fertig

# the hover on a done mark whose rows have no names
hover-done-work = arbeit erledigt

# the casino's lever, by name (its hover and the pad's label)
lever-arm = der hebel

# a pot's picker: the brew it is set to, when it is set to none
pot-nothing = nichts

# a pot's picker: the heading over who the brew is for
pot-for = für

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = wer am nächsten ist

## The deep

# a brawler's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-brawler-fork = Schlag härter zu, lerne Combos

# the brawler's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move = Combos

# what the brawler's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move-does = schläge verketten

# the brawler's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap = K.o.

# what the brawler's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap-does = { $stun }

# a sword's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sword-fork = Meistere das Schwert

# the sword's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-move = Wirbelwind

# what the sword's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-move-does = schwererer hieb

# the sword's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap = Schwachstellen

# what the sword's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap-does = { $bleed }

# a monk's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-monk-fork = Bündle dein Chi

# the monk's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-move = Tiefer Atem

# what the monk's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-move-does = schnelleres chi

# the monk's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap = Stilles Wasser

# what the monk's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap-does = { $stun }

# a martial's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-martial-fork = Schlag schneller zu und mach schneller Schluss

# the martial's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-move = Finesse

# what the martial's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-move-does = schnellere finisher

# the martial's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap = Sammelruf

# what the martial's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap-does = { $haste } für alle

# a ranger's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-ranger-fork = Ziel auf Schwachstellen

# the ranger's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move = Gezielter Schuss

# what the ranger's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move-does = aufgeladener pfeil

# the ranger's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap = Nagelschuss

# what the ranger's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap-does = { $stun }

# a assassin's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-assassin-fork = Schlag schnell und präzise zu

# the assassin's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move = Hinrichtung

# what the assassin's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move-does = wunden bestrafen

# the assassin's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap = Gezackt

# what the assassin's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap-does = { $bleed }

# a hexer's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-hexer-fork = Wirke schwächende Flüche

# the hexer's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move = Verdorren

# what the hexer's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move-does = schlange nimmt mehr schaden

# the hexer's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap = Bindung

# what the hexer's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap-does = { $held }, { $exposed }

# a sapper's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sapper-fork = Lerne Sprengstoffe

# the sapper's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move = Haftbomben

# what the sapper's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move-does = kleben, dann knallen

# the sapper's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap = Paar

# what the sapper's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap-does = zwei bomben, { $stun }

# a mage's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-mage-fork = Kanalisiere mächtige Strahlen

# the mage's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-move = Weitung

# what the mage's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-move-does = breiterer strahl

# the mage's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap = Thermit

# what the mage's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap-does = brennt rüstung weg

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Mach deine Gruppe { $inspired }

# the bard's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-move = Hymne

# what the bard's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-move-does = doppelt { $inspired }

# the bard's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap = Tempo

# what the bard's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap-does = { $haste } für alle

# a status, by name (bold in a line, under its icon)
status-stun = Betäubt

# a status, by name
status-bleed = Blutung

# a status, by name
status-haste = Eile

# a status, by name
status-held = Gebunden

# a status, by name
status-exposed = Entblößt

# a status, by name
status-inspired = Inspiriert

# what Stun does, after its name
status-stun-does = hält still, heilt nicht mehr

# what Bleed does, after its name
status-bleed-does = schaden über zeit

# what Haste does, after its name; $pct with its sign
status-haste-does = greift { $pct } schneller an

# what Held does, after its name
status-held-does = kann nicht heilen

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = nimmt { $lo }-{ $hi } mehr schaden

# what Inspired does, after its name
status-inspired-does = schlägt härter zu

# a status's hover line: $name (status-…) and what it does
status-line = { $name }: { $does }

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# a status's label under its icon when $n of it are on
status-label-n = { $name } x{ $n }

# a base fighter's line: the altar's (the Fighter)
base-altar-does = Teile Schläge aus

# a base fighter's line: the well's (the Novice)
base-well-does = Übe Kampfkunst

# a base fighter's line: the armory's (the Scout)
base-armory-does = Schieß Pfeile

# a base fighter's line: the circle's (the Adept)
base-circle-does = Wirke Flüche

# a base fighter's line: the spire's (the Apprentice)
base-spire-does = Schieß Strahlen

# the Recruit's line, before its first choice
recruit-does = ein leichter schlag

# the Bard's line with nobody else fighting
rail-alone = niemand da, dem man vorsingen kann

# a class that needs company, before there is any
rail-locked = öffnet mit einer zweiten station

# a station's board at the fork: the heading over the two classes
rail-fork-ask = Spezialisiere dich

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Wähle deinen Kämpfer

# a rung's number in its class's unit; $unit is unit-dmg or unit-dmg-s
rail-worth = { $n } { $unit }

# a rung's number for a class written in percent (the Bard)
rail-worth-pct = +{ $n } %

# a pip's hover line on a station's tree: $name (a fighter, a move) and $what (its number, or a few words)
rail-line = { $name }: { $what }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Werde { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = zurücksetzen – erstattet alles

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-brawler = Schläger

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sword = Schwertkämpfer

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-monk = Mönch

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Kampfkünstler

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-ranger = Waldläufer

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-assassin = Assassine

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-hexer = Hexer

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sapper = Pionier

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-mage = Magier

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-bard = Barde

# a base fighter's name: the altar's, below the fork
base-altar = Kämpfer

# a base fighter's name: the well's
base-well = Novize

# a base fighter's name: the armory's
base-armory = Späher

# a base fighter's name: the circle's
base-circle = Adept

# a base fighter's name: the spire's
base-spire = Lehrling

# every station's first fighter, before its first choice
class-recruit = Rekrut

# the serpent's lash, its tile's hover while it waits
serp-lash-calm = Peitsche: betäubt Nahkämpfer

# the serpent's lash, its tile's hover while it is warned
serp-lash-coming = Peitsche naht

# the serpent's lash, its tile's hover while it is on
serp-lash-on = Peitsche: betäubt Nahkämpfer

# the serpent's lash, its tile's hover once answered
serp-lash-stopped = Peitsche: gestoppt

# the serpent's cloak, warned
serp-sink-coming = Tarnung naht

# the serpent's cloak, on
serp-sink-on = Tarnung: außer Reichweite

# the serpent's constrict, warned
serp-orb-coming = Würgegriff naht

# the serpent's constrict, on
serp-orb-on = Würgegriff

# the serpent's constrict, answered
serp-orb-stopped = Würgegriff

# a fighter's tile: dazed, its hover
serp-dazed = Benommen: aus dem Tritt, sieht Sterne

# a fighter's tile: constricted, its hover
serp-constricted = Umschlungen

# the serpent's barrier, its tile's hover
serp-barrier = Barriere: schluckt Explosionsschaden

# the serpent's ward, its tile's hover
serp-ward = Bann: Magieschaden halbiert

# the serpent's plates, its tile's hover
serp-plates = Panzer: phys. Schaden halbiert

# the lash's tile, its label
serp-lash = Peitsche

# the cloak's tile, its label
serp-sink = Tarnung

# the constrict's tile, its label
serp-orb = Würgegriff

# a fighter's dazed tile, its label
serp-dazed-name = Benommen

# a fighter's constricted tile, its label
serp-constricted-name = Umschlungen

# the barrier's tile, its label
serp-barrier-name = Barriere

# the ward's tile, its label
serp-ward-name = Bann

# the plates' tile, its label
serp-plates-name = Panzer

# the pods: one more of the crew, living down here
row-pod = noch eine kapsel

# the pods: the pod's line
row-pod-note = eine kapsel am anderen ende der tiefe: noch jemand von den leuten, der hier unten wohnt

# a deep station's board: the heading over its one fighter, with the count
rail-fighter = der kämpfer

# the deep: the build of a new fighter's station (the queue card names it)
row-raise-station = station errichten

# the deep's build button: the first station costs no fang
build-free = gratis

# the serpent's level after the pips on its bar, from level 2 on; $n is the level.
# [owner's words: a level label, e.g. "Lv 7"] -- until then the bare number. Drawn in the pixel number font
# (NUM_FONT), which draws only the glyphs it has: words want their letters drawn into the font
serp-level = { $n }
