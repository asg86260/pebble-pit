### Pebble Pit, in Russian (ru): every word a player reads, translated from
### locales/en.ftl. The English comment over each message says where it shows.
###
### Drafted by Claude (Opus 5.5) on 2026-10-13 to locales/STYLE.md; not yet
### reviewed by a native speaker. Messages whose English is still an owner's
### placeholder are left out, so the English shows.
###
### Informal address (ты); the player is never given a gender (present
### tense, passive or impersonal forms). Where a name sits where Russian
### would need a case the name cannot take, the line is turned with a colon.

## Sheets

# rescue sheet heading, end of first half
saved-word = Это конец?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = твоя жена спасена за <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Долго и счастливо

# demo end sheet heading
demoend-word = на этом демо всё!

# demo end sheet line
demoend-why = твою жену пока не спасти.

# demo end store link (if STORE_URL)
demoend-store = добавь в желаемое!

# demo end dismiss button
demoend-keep = играть дальше

# free-build teaser end sheet heading
teaseend-word = продолжение в полной игре!

# teaser end store link (if STORE_URL)
teaseend-store = полная игра

# teaser end dismiss button
teaseend-keep = играть дальше

# second-half end sheet heading
freed-word = ну вот теперь всё

# second-half end sheet line
freed-why = твой муж вызволен из брюха змея.

# second-half end sheet line
freed-end = вот и конец, можешь и дальше бить змея и фермерствовать наверху!

# second-half end sheet line
freed-thanks = спасибо!

# second-half end dismiss button
freed-keep = играть дальше

# crash sheet heading
crashed-word = стоп

# crash sheet button
crashed-copysave = копия сохранения

# pause sheet heading
held-word = пауза

# pause sheet button
held-resume = дальше

# pause sheet button (relabelled from JS)
held-slotsbtn = сохранения

# saves page heading
held-slots-word = сохранения

# saves page button
held-savecopy = скопировать

# saves page button
held-loadsave = загрузить

# saves page paste box confirm
held-loadit = загрузить

# saves page paste box cancel
held-nevermind = неважно

# saves page back button
held-slotsback = назад

# pause sheet button (relabelled from JS)
held-recordbtn = достижения

# achievements page heading
held-record-word = достижения

# achievements page back
held-recordback = назад

# pause sheet button (also src/indexpage.js:24)
held-indexbtn = справочник

# index page heading
held-index-word = справочник

# index page back
held-indexback = назад

# pause sheet button to landing page
held-titlebtn = в главное меню

# pause sheet button, desktop build only
held-quit = выйти из игры

# pause sheet footer hint
held-keys = esc пауза · ← → осмотреться · держи пробел, чтобы пропустить сцену

# window close button label
modal-close =
    .aria-label = закрыть

# pause sheet reply, desktop export ok
said-saved = сохранено

# pause sheet reply, desktop export failed
said-notsaved = не сохранено

# pause sheet reply, store fallback
said-fellback = последнее сохранение не загрузилось; это предыдущее

# pause sheet reply, unreadable save
said-broken = последнее сохранение не читается. «скопировать» отдаст его тебе

# pause sheet reply, yard open elsewhere
said-yielded = этот двор открыт в другой вкладке; сохраняется там

# pause sheet reply, storage blocked
said-unsaved-blocked = не сохраняется: браузер не пускает эту страницу в хранилище. копирование сохранения работает

# sheet reply after loading a save
said-loaded = загружено

# sheet reply, pasted text invalid
said-notasave = это не сохранение

# crash sheet line when error has no message
crashed-why-fallback = что-то сломалось

# save row age
slots-since-now = только что

# save row age
slots-since-min = { $m } мин назад

# save row age
slots-since-h = { $h } ч назад

# save row item
slots-row-rock = валун { $n }

# save row item
slots-row-crew = { $n } чел.

# save row item for open slot in play
slots-row-playing = в игре

# save row, no yard
slots-row-empty = пусто

# save row, broken blob
slots-row-unreadable = не читается

# saves button label on both fronts
held-slotsbtn-label = сохранения · { $n } из { $total }

# empty save row after first press
slots-arm = начать новый двор?

# sheet reply after opening empty slot
slots-said-new = новый двор

# sheet reply after opening a slot
slots-said-loaded = загружено

# save row delete cross label
slots-del-aria = удалить

# achievements button label with count
held-recordbtn-label = достижения · { $count } из { $total }

# achievements page, nothing earned
held-record-none = пока ничего не сделано.

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
        [one] { $d } день назад
        [few] { $d } дня назад
        [many] { $d } дней назад
       *[other] { $d } дня назад
    }

# saves row delete confirm
slots-confirm-yes = удалить

# saves row delete cancel
slots-confirm-no = назад

# sheet reply, copy with no save
said-copyout-none = пока ничего не сохранено

# sheet reply when clipboard unavailable
said-copyout-window = лежит в window.__save

# saves page cloud section heading
cloud-head = облако

# cloud section button
cloud-btn-linkcode = ввести код связи

# cloud section button
cloud-btn-recovery = код восстановления

# cloud section button
cloud-btn-stop = выключить облако

# cloud section reply after stop
cloud-said-off = облако на этом устройстве выключено

# cloud section button
cloud-btn-enable = включить облако

# cloud section reply on failure (also cloud.js:768)
cloud-why-noanswer = облако не ответило

# cloud section, copy recovery code
cloud-btn-copy = копировать

# cloud section under recovery code
cloud-writedown = запиши: с ним твои дворы вернутся на новом устройстве

# cloud section, another device ahead
cloud-btn-take = взять тот

# cloud section, another device ahead
cloud-btn-keep = оставить этот

# cloud section reply (also :316)
cloud-said-kept = оставлено

# cloud section above pairing code
cloud-pair-enter = на другом устройстве введи

# cloud section, hide pairing code
cloud-btn-done = готово

# cloud section button
cloud-btn-link = связать устройство

# cloud section toggle
cloud-btn-hidecode = скрыть код восстановления

# cloud section toggle
cloud-btn-showcode = показать код восстановления

# cloud section button
cloud-btn-newcode = новый код восстановления

# cloud section button, first press
cloud-btn-newcode-armed = выйти на других устройствах?

# link code box placeholder
cloud-box-linkph = ···-···

# recovery code box placeholder
cloud-box-recph = ····-····-····

# link code box label
cloud-box-aria-link = код связи

# recovery code box label
cloud-box-aria-rec = код восстановления

# cloud section reply, bad code
cloud-wrong = код не подошёл

# cloud section reply after linking
cloud-said-linked = связано

# cloud code entry confirm
cloud-btn-dolink = связать

# cloud code entry cancel
cloud-btn-nevermind = неважно

# cloud code entry prompt
cloud-typing-link = код с другого устройства

# cloud code entry prompt
cloud-typing-rec = твой код восстановления

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = слишком много попыток отсюда за сегодня; попробуй завтра

# cloud section reply, 503
cloud-why-resting = облако отдыхает; попробуй позже

# cloud section reply, 403
cloud-why-forbidden = облако не знает эту страницу

# the cloud's line in the landing page's foot bar: $state is one of the cloud-state lines below
# (with no state, it stands before the choose-a-yard button)
cloud-line = облако · { $state }

# cloud state: not turned on (in cloud-line, and alone in the saves page section)
cloud-state-off = выкл

# cloud state
cloud-state-out = без входа

# cloud state
cloud-state-refused = сохранение отклонено

# cloud state
cloud-state-offline = не сохранено: нет сети

# cloud state
cloud-state-behind = на другом устройстве новее

# cloud state
cloud-state-newer = обнови игру, чтобы взять новое сохранение

# cloud state
cloud-state-big = слишком велико для облака

# cloud state
cloud-state-full = облако заполнено

# cloud state
cloud-state-paused = пауза

# cloud state
cloud-state-conflict = выбери двор

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = сохранено { $since }

# cloud state: on, nothing pushed yet
cloud-state-on = вкл

# link a device: the pairing code's countdown; $time is m:ss
cloud-pair-left = осталось { $time }

# choose a yard: this device's copy of slot $n; $here is the yard as a saves row says it
cloud-clash-here = это устройство · { $n } · { $here }

# choose a yard: the cloud's copy of slot $n; $cloud is the yard as a saves row says it
cloud-clash-cloud = облако · { $n } · { $cloud }

# a cloud button's answer: too many tries; $m is minutes to wait
cloud-why-wait = слишком много попыток; попробуй через { $m } мин

# window title opened off the books
modal-books = гроссбух

# window title, crew list
modal-crew = кто здесь живёт

## Settings

# pause sheet button
held-settingsbtn = настройки

# settings page heading
held-settings-word = настройки

# settings note where fullscreen unavailable
set-fullscreen-note = для полного экрана добавь эту страницу на главный экран

# settings volume slider label
set-volume =
    .aria-label = громкость

# settings button to controls page
set-controlsbtn = управление

# controls page heading
set-controls-word = управление

# controls page back
set-controlsback = назад

# settings page back
set-settingsback = назад

# settings motion switch
set-motion-less = движение: меньше

# settings motion switch
set-motion-full = движение: всё

# settings touch switch (play only)
set-touch-on = сенсор: вкл

# settings touch switch (play only)
set-touch-off = сенсор: выкл

# settings dark switch
set-dark-on = тёмная: вкл

# settings dark switch
set-dark-off = тёмная: выкл

# settings sound switch
set-sound-off = звук: выкл

# settings sound switch
set-sound-on = звук: вкл

# pause sheet line: a save from a newer build; $build is the build's name
said-newer = это сохранение из более новой сборки ({ $build })

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = не сохраняется: хранилище сайта заполнено ({ $used } мб занято, из них { $ours } кб наши). копирование сохранения работает

# pause sheet line: storage refused a save; $name is the browser's error name
said-unsaved-refused = не сохраняется: хранилище отказало ({ $name }). копирование сохранения работает

# pause sheet line: storage refused a save, with no error to name
said-unsaved-refused-why = не сохраняется: хранилище отказало. копирование сохранения работает

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = не загрузилось: { $message }

# controls page input column
ctl-leftclick-in = левый клик

# controls page action column
ctl-leftclick-do = действие

# controls page input column
ctl-rightclick-in = правый клик

# controls page action column
ctl-rightclick-do = фокус на работниках

# controls page input column
ctl-rightleft-in = правый + левый клик

# controls page action column
ctl-rightleft-do = поднять работников

# controls page input column
ctl-middle-in = средний клик

# controls page action column
ctl-middle-do = двигать камеру

# controls page input column
ctl-wheel-in = колесо мыши

# controls page action column
ctl-wheel-do = двигать камеру

# controls page input column
ctl-arrows-in = ← → / a d

# controls page action column
ctl-arrows-do = двигать камеру

# controls page input column
ctl-digits-in = 1 – 9

# controls page action column
ctl-digits-do = перейти к месту

# settings fullscreen row
set-fullscreen-on = полный экран: вкл

# settings fullscreen row
set-fullscreen-off = полный экран: выкл

# a sheet line: the save is on the clipboard; $n is its size in kilobytes
said-copyout-copied = скопировано { $n } кб

## Title page

# browser tab title, landing
title-doctitle = Pebble Pit

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = валун. яма. несколько человек между ними.

# landing page main button
title-play = играть

# landing page button (relabelled saves · n of 3)
title-slotsbtn = сохранения

# landing page button (relabelled, src/record.js:33)
title-recordbtn = достижения

# landing page button
title-settingsbtn = настройки

# landing page, desktop build only
title-quit = выйти из игры

# landing saves page heading
title-slots-word = сохранения

# landing saves page button
title-savecopy = скопировать

# landing saves page button
title-loadsave = загрузить

# landing paste confirm
title-loadit = загрузить

# landing paste cancel
title-nevermind = неважно

# landing saves page back
title-slotsback = назад

# landing achievements page heading
title-record-word = достижения

# landing achievements page back
title-recordback = назад

# landing settings page heading
title-settings-word = настройки

# landing settings to controls
title-controlsbtn = управление

# landing settings back
title-settingsback = назад

# landing controls page heading
title-controls-word = управление

# landing controls back
title-controlsback = назад

# landing cloud conflict page heading
title-conflict-word = выбери двор

# landing cloud conflict back
title-conflictback = назад

# landing foot link
title-link-itch = itch

# landing foot link
title-link-github = github

# under play, empty open slot
title-playlabel-new = новый двор

# landing achievements page, nothing earned
title-record-none = пока ничего

# title foot bar conflict link
cloud-foot-choose = выбери двор

# landing reply, bad paste
title-said-notasave = это не сохранение

# landing reply after load
title-said-loaded = загружено

# landing reply after deleting open slot
title-said-erased = стёрто

## Objectives

# label before story line
obj-next = дальше

# story line, first step
obj-rock = долби валун, чтобы спасти жену!

# intro quest item
obj-rock-q-chip = долби валун

# intro quest item
obj-rock-q-pickup = подбери камушек

# intro quest item
obj-rock-q-toss = брось камушек в яму

# story line after first fall
obj-falling = долби валун ещё раз!

# story line, wooden roof barrier
obj-props = может, деревянная крыша остановит следующий валун?

# story line, net barrier
obj-net = не вышло, попробуй поймать валун и затормозить его

# story line, arch barrier
obj-arch = давай сложим арку из добытой руды и камня. уж она-то выдержит.

# story line, wizards' barrier
obj-dome = идей больше нет, может, волшебники помогут.

# story line before rescue
obj-rescue = спаси жену

# story line, second half
obj-drown = затопи яму

# story line after snatch
obj-tower = построй башню волшебников

# story line after snatch
obj-talk = поговори с волшебниками о том, что сейчас было

# story line, deep half
obj-portal = открой портал в бездну, что там внизу?

# story line, final step
obj-free = вызволи мужа из брюха змея

# objective card cancel while building
obj-barrier-cancel = отмена ×{ $n }

## Other

# browser tab title, game page
play-doctitle = Pebble Pit

# skip hint during cutscene, desktop (skiphint.js:27)
other-skip-desk = держи пробел — пропуск

# top-edge mess tag
other-messtag-muck = грязь

# top-edge mess tag
other-messtag-poop = какашки

# floating button over bench site
other-raise = построй верстак

# phone pause button label
other-pause =
    .aria-label = пауза

title-recordbtn-label = достижения · { $count } из { $total }

# corner fullscreen button tooltip
other-fullscreen-title-on = выйти из полного экрана

# corner fullscreen button tooltip
other-fullscreen-title-off = полный экран

# crew-fade corner button label
other-corner-show = показать бригаду

# crew-fade corner button label
other-corner-fade = приглушить бригаду

# crew-fade corner button label
other-corner-hide = скрыть бригаду

# way corner button tip
other-corner-up = наверх, во двор

# way corner button tip
other-corner-down = вниз, в пучину

# queue card line hover
other-queue-site-yard = двор

# queue card line hover
other-queue-site-sphere = сфера

# queue card, nobody working
other-queue-queued = в очереди

# board footer toggle
other-hidedone-show = показать готовое

# board footer toggle
other-hidedone-hide = скрыть готовое

# the queue card: the first in line to be built after the one going up
queue-place-next = следующий

# the house's board and the crew window, with no crew yet
crew-empty = здесь пока никто не живёт

# a station's name: its board's title, the pointer's label, the queue card
station-bench = верстак

# skip hint during cutscene, phone
other-skip-touch = держи — пропуск

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = держи <span data-l10n-name="key"></span> — пропуск

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee, idle (drawn in the sign's own pixel capitals)
casino-sign = CASINO

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

## Notices

# toast-shaped card, another device ahead
note-cloud-name = на другом устройстве новее

# toast-shaped card, another device ahead
note-cloud-note = ответ в сохранениях

## Numbers

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } ч { $m } мин

# how long a yard has been played, under an hour
played-m = { $m } мин

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }-й

## Achievements

# toast and achievements card name
ach-firstgrain-name = делаем деньги

# toast and achievements card note
ach-firstgrain-note = брось камушек в яму

# achievement name
ach-firstrock-name = копай дальше

# achievement note
ach-firstrock-note = разбей первый валун

# achievement name
ach-gotout-name = жена спасена

# achievement note
ach-gotout-note = валунов больше нет, получилось.

# achievement name
ach-firsthire-name = дополнительные пилоны построены

# achievement note
ach-firsthire-note = построй ещё один дом

# achievement name
ach-firstshard-name = первая руда

# achievement note
ach-firstshard-note = подними руду из карьера

# achievement name
ach-firstspore-name = земледелие

# achievement note
ach-firstspore-note = вырасти первый урожай

# achievement name
ach-firstspark-name = магия в воздухе

# achievement note
ach-firstspark-note = добудь первую искру

# achievement name
ach-holefull-name = яма полна

# achievement note
ach-holefull-note = заполни яму до краёв

# achievement name
ach-rifttorn-name = разлом открыт, вопрос хранения решён

# achievement note
ach-rifttorn-note = заполни яму, чтобы открылся межпространственный разлом

# achievement name
ach-drowned-name = разлом стал больше

# achievement note
ach-drowned-note = целый океан межпространственного хранилища.

# achievement name
ach-star-name = призови звезду

# achievement note
ach-star-note = вызови звезду с башни

# achievement name
ach-firsthat-name = ты волшебник, квадратик

# achievement note
ach-firsthat-note = доделай шляпу волшебника в башне

# achievement name
ach-firstbrew-name = здравствуй, продавец зелий

# achievement note
ach-firstbrew-note = свари партию в аптеке

# achievement name
ach-firsttrade-name = первая шляпа

# achievement note
ach-firsttrade-note = купи станции её первую шляпу

# achievement name
ach-alltrades-name = просвещение масс

# achievement note
ach-alltrades-note = снабди каждую станцию её шляпой

# achievement name
ach-allbuilt-name = стройка завершена

# achievement note
ach-allbuilt-note = построено всё

# achievement name
ach-rift1e6-name = 1 млн через разлом

# achievement note
ach-rift1e6-note = отправь через разлом 1 млн камушков

# achievement name
ach-brew100-name = 100 партий

# achievement note
ach-brew100-note = свари 100 партий

# achievement name
ach-lived1h-name = час без смены

# achievement note
ach-lived1h-note = продержи одного работника в штате целый час

# achievement name
ach-nobodyhired-name = никого в штате

# achievement note
ach-nobodyhired-note = разбей целый валун, когда в штате никого нет

# achievement name
ach-ownhand-name = только своей рукой

# achievement note
ach-ownhand-note = разбей валун так, чтобы его не тронул ни один работник

# achievement name
ach-nevertouched-name = и пальцем не тронуть

# achievement note
ach-nevertouched-note = разбей валун, ни разу по нему не ударив

# achievement name
ach-underminute-name = валун меньше чем за минуту

# achievement note
ach-underminute-note = разбей валун меньше чем за минуту

# achievement name
ach-everyjob-name = все места заняты

# achievement note
ach-everyjob-note = поставь хотя бы одного человека на каждую работу сразу

# achievement name
ach-tablebeaten-name = мы вернулись

# achievement note
ach-tablebeaten-note = выйди в плюс на 50 тыс. с одной горсти в казино

# achievement name
ach-tableruin-name = пора брать кредит

# achievement note
ach-tableruin-note = уйди в минус на 50 тыс. с одной горсти в казино

# achievement name
ach-bird-name = вон с моей земли

# achievement note
ach-bird-note = спугни птицу

# achievement name
ach-wholelot-name = ни одна из вас

# achievement note
ach-wholelot-note = спугни всех птиц на одном участке

# achievement name
ach-catchall-name = жонглёр

# achievement note
ach-catchall-note = брось полную горсть пыли, самую большую, и поймай каждую крупинку

# achievement name
ach-lifted-name = иди сюда

# achievement note
ach-lifted-note = подними работника

# achievement name
ach-shookload-name = выворачивай карманы

# achievement note
ach-shookload-note = вытряси из работника весь груз

# achievement name
ach-hatoff-name = шляпы долой

# achievement note
ach-hatoff-note = стряхни шляпу с работника

# achievement name
ach-dizzy-name = синдром встряхнутого ребёнка

# achievement note
ach-dizzy-note = закружи работника тряской

# achievement name
ach-muckrain-name = пришла беда — отворяй ворота

# achievement note
ach-muckrain-note = выстой грязевой дождь

# achievement name: rocks cleared; $n is the count as written (10, 25, 50, 100)
ach-rocks-name =
    { $n ->
        [one] { $n } валун
        [few] { $n } валуна
        [many] { $n } валунов
       *[other] { $n } валуна
    }

# achievement note: rocks cleared; $n is the count
ach-rocks-note =
    { $n ->
        [one] разбей { $n } валун
        [few] разбей { $n } валуна
        [many] разбей { $n } валунов
       *[other] разбей { $n } валуна
    }

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last =
    { $n ->
        [one] разбей { $n } валун, это много камней
        [few] разбей { $n } валуна, это много камней
        [many] разбей { $n } валунов, это много камней
       *[other] разбей { $n } валуна, это много камней
    }

# achievement name: pebbles banked; $n is the count, short (10k, 1m)
ach-pebbles-name = { $n } камушков

# achievement note: pebbles banked; $n is the count, short
ach-pebbles-note = накопи в яме { $n } камушков

# achievement name: crew hired; $n is the count
ach-crew-name =
    { $n ->
        [one] { $n } квадрат
        [few] { $n } квадрата
        [many] { $n } квадратов
       *[other] { $n } квадрата
    }

# achievement note: crew hired; $n is the count
ach-crew-note =
    { $n ->
        [one] найми бригаду из { $n } человека
        [few] найми бригаду из { $n } человек
        [many] найми бригаду из { $n } человек
       *[other] найми бригаду из { $n } человека
    }

# achievement name: the first ore ladder rung
ach-ore0-name = 1 тыс. руды из выработки

# achievement name: the second ore ladder rung
ach-ore1-name = 10 тыс. руды

# achievement note: ore dug; $n is the count, short (1k, 10k)
ach-ore-note = добудь в карьере { $n } руды

## Index

# index entry name
idx-dust-name = камушки

# index entry text
idx-dust-text = отколоты от валуна.

# index entry name
idx-shard-name = руда

# index entry text
idx-shard-text = добыта в карьере.

# index entry name
idx-spore-name = урожай

# index entry text
idx-spore-text = выращен на ферме.

# index entry name
idx-spark-name = искры

# index entry text
idx-spark-text = волшебники выбивают их из звезды молниями.

# index entry name
idx-scale-name = чешуя

# index entry text
idx-scale-text = выдавлена из того, что роняет змей.

# index entry name
idx-crit-name = криты

# index entry text
idx-crit-text = есть шанс нанести больше урона.

# index entry name
idx-rock-name = валун

# index entry text
idx-rock-text = придавил твою жену; из него добывают ценные камушки.

# index entry name
idx-pit-name = яма

# index entry text
idx-pit-text = кидай сюда камушки и всё прочее на хранение.

# index entry name
idx-rift-name = разлом

# index entry text
idx-rift-text = огромная концентрация камушков порвала реальность?

# index entry name
idx-abyss-name = бездна

# index entry text
idx-abyss-text = разлом проглотил слишком много камушков, не устоял и поглотил всю яму.

# index entry name
idx-muck-name = грязь

# index entry text
idx-muck-text = загрязнение портит природу, а дождь оставляет кучи жижи.

# index entry name
idx-poop-name = какашки

# index entry text
idx-poop-text = фу.

# index entry name
idx-bird-name = птицы

# index entry text
idx-bird-text = обычные птицы.

# index entry name
idx-house-name = дом

# index entry text
idx-house-text = здесь живут работники.

# index entry name
idx-pollution-name = загрязнение

# index entry text
idx-pollution-text = цена промышленности. добыча, фермерство, карьер, волшебство — всё это загрязняет воздух.

# index entry name
idx-star-name = звезда

# index entry text
idx-star-text = настоящая звезда, созданная магией волшебников; её разбивают на искры.

# index entry name
idx-balloon-name = шар

# index entry text
idx-balloon-text = с воздушным фильтром, который чистит облака от загрязнения.

# index entry name
idx-recycler-name = переработчик

# index entry text
idx-recycler-text = сгущает загрязнение воздуха в годные камушки.

# index entry name
idx-bench-name = верстак

# index entry text
idx-bench-text = по сути сельмаг. улучшения носильщиков, ручные улучшения, новые постройки.

# index entry name
idx-shack-name = хижина

# index entry text
idx-shack-text = лавка улучшений для шахтёров.

# index entry name
idx-stats-name = гроссбух

# index entry text
idx-stats-text = всякая статистика твоей игры: доход, время в игре.

# index entry name
idx-farm-name = ферма

# index entry text
idx-farm-text = грядки, на которых растёт урожай.

# index entry name
idx-quarry-name = карьер

# index entry text
idx-quarry-text = копай вглубь ради руды.

# index entry name
idx-apothecary-name = аптека

# index entry text
idx-apothecary-text = здесь варят отвары.

# index entry name
idx-tower-name = башня

# index entry text
idx-tower-text = дом волшебников.

# index entry name
idx-casino-name = казино

# index entry text
idx-casino-text = казино на доске с гвоздиками.

# index entry name
idx-outhouse-name = каморка уборщика

# index entry text
idx-outhouse-text = дом уборщиков.

# index entry name
idx-filter-name = воздушный фильтр

# index entry text
idx-filter-text = вытягивает загрязнение из неба.

# index entry name
idx-ram-name = таран

# index entry text
idx-ram-text = быстро крошит валуны.

# index entry name
idx-jaw-name = бур

# index entry text
idx-jaw-text = буровая машина для быстрой выемки.

# index entry name
idx-tiller-name = культиватор

# index entry text
idx-tiller-text = тракторы быстро расправляются с урожаем.

# index entry name
idx-belt-name = конвейер

# index entry text
idx-belt-text = сам сбрасывает камушки в яму.

# index entry name
idx-sphere-name = сфера

# index entry text
idx-sphere-text = сфера дайсона, чтобы собирать энергию звезды.

# index entry name
idx-roomba-name = роботы-пылесосы

# index entry text
idx-roomba-text = автоматические пылесосы убирают беспорядок.

# index entry name
idx-driver-name = погрузчик

# index entry text
idx-driver-text = автоматический погрузчик, который очень быстро возит ресурсы.

# index entry name
idx-props-name = деревянный заслон

# index entry text
idx-props-text = отчаянная попытка удержать валун.

# index entry name
idx-net-name = сеть

# index entry text
idx-net-text = сплети сеть из урожая, чтобы ловить и тормозить валун.

# index entry name
idx-arch-name = арка

# index entry text
idx-arch-text = крепкая арка из камня и металла — попытка удержать валун.

# index entry name
idx-dome-name = барьер

# index entry text
idx-dome-text = энергетический барьер, вызванный волшебниками.

# index entry name
idx-deep-name = бездна

# index entry text
idx-deep-text = не совсем космос, не совсем океан, что-то посередине.

# index entry name
idx-portal-name = портал

# index entry text
idx-portal-text = единственный путь в бездну и обратно.

# index entry name
idx-crusher-name = дробилка

# index entry text
idx-crusher-text = здесь хранится чешуя пучины.

# index entry name
idx-pods-name = капсулы

# index entry text
idx-pods-text = капсулы для работников бездны.

# index entry text
idx-haul-text = носят камушки в яму.

# index entry name
idx-rockcrew-name = камнебои

# index entry text
idx-rockcrew-text = бьют по валуну.

# index entry name
idx-quarrycrew-name = шахтёры

# index entry text
idx-quarrycrew-text = добывают руду в карьере.

# index entry name
idx-farmcrew-name = фермеры

# index entry text
idx-farmcrew-text = растят урожай.

# index entry name
idx-purify-name = очистители воздуха

# index entry text
idx-purify-text = водят шары-очистители по небу и чистят его.

# index entry name
idx-stir-name = аптекари

# index entry text
idx-stir-text = отвечает за одну партию отваров.

# index entry text
idx-janitor-text = убирают какашки и грязь.

# index entry text
idx-wizard-text = учёные маги, умеющие откалывать куски от звезды.

# index entry text
idx-build-text = возводят здания и машины.

# index entry name
idx-breaker-name = крушитель

# index entry text
idx-breaker-text = бьёт по валуну куда сильнее.

# index entry name
idx-carter-name = возчик

# index entry text
idx-carter-text = носильщик тянет тележку и возит вдвое больше.

# index entry name
idx-blaster-name = подрывник

# index entry text
idx-blaster-text = с маленькой взрывчаткой, чтобы как следует выбивать руду.

# index entry name
idx-grower-name = садовод

# index entry text
idx-grower-text = ухаживает за урожаем вдвое больше.

# index entry name
idx-brews-name = отвары

# index entry text
idx-brews-text = особые отвары из аптеки.

# index entry text
idx-party-text = храбрый отряд искателей приключений, готовых рискнуть жизнью, чтобы победить змея.

# index entry name
idx-sqwife-name = жена

# index entry text
idx-sqwife-text = жила себе спокойно, пока не случилось то самое (и не раз): теперь она под валунами, что без конца падают с неба. жесть.

# index entry name
idx-notices-name = достижения

# index entry text
idx-notices-text = вехи двора.

# index entry name
idx-serpent-name = змей

# index entry text
idx-serpent-text = какая-то странная змееподобная тварь, что живёт в бездне.

## Jobs

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = камнебои

# a job, as the boards, the crew and the index say it (the save's key is haulers)
job-haulers = носильщики

# a job, as the boards, the crew and the index say it (the save's key is quarriers)
job-quarriers = шахтёры

# a job, as the boards, the crew and the index say it (the save's key is farmhands)
job-farmhands = фермеры

# a job, as the boards, the crew and the index say it (the save's key is scholars)
job-scholars = учёные

# a job, as the boards, the crew and the index say it (the save's key is purifiers)
job-purifiers = очистители воздуха

# a job, as the boards, the crew and the index say it (the save's key is stirrers)
job-stirrers = аптекари

# a job, as the boards, the crew and the index say it (the save's key is janitors)
job-janitors = уборщики

# a job, as the boards, the crew and the index say it (the save's key is wizards)
job-wizards = волшебники

# a job, as the boards, the crew and the index say it (the save's key is builders)
job-builders = строители

# a job, as the boards, the crew and the index say it (the save's key is fighters)
job-fighters = бойцы

# a job, as the boards, the crew and the index say it (the save's key is gatherers)
job-gatherers = сборщики

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = глубинные строители

## Boards

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/с

# a row's unit: so many a minute; $icon is the coin's mark (html)
unit-per-min = { $icon }/мин

# a row's unit: so many a dig; $icon is the coin's mark (html)
unit-per-dig = { $icon }/раскоп

# a row's unit: so many a harvest; $icon is the coin's mark (html)
unit-per-harvest = { $icon }/сбор

# a row's unit after its number: swings a second
unit-hits-s = удар/с

# a row's unit after its number: swings a second, from one
unit-hit-s = удар/с

# a row's unit after its number: throws a second
unit-throws-s = бросок/с

# a row's unit after its number: a wizard's bolts a minute
unit-bolts-min = молний/мин

# a row's unit after its number: star cells a bolt knocks off
unit-cells-bolt = клеток/молнию

# a row's unit after its number: haze a balloon takes in a second
unit-motes-s = частиц/с

# a row's unit after its number: farm plots
unit-plots = гряд.

# a row's unit after its number: the quarry's shovels
unit-shovels = лоп.

# a row's unit after its number: the apothecary's pots
unit-pots = котл.

# a row's unit after its number: doses a batch
unit-doses = доз.

# a unit after a number: seconds
unit-s = с

# a deep row's unit after its number: damage
unit-dmg = урон

# a deep row's unit after its number: damage a second
unit-dmg-s = урон/с

# a brew's unit after its percentage: how much faster
unit-faster = быстрее

# a brew's unit after its percentage: how much stronger
unit-stronger = сильнее

# a brew's unit after its number: crit chance
unit-crit = крит

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower =
    { $more ->
        [yes]
            { $left ->
                [one] купи ещё { $left } садовода, чтобы открыть
                [few] купи ещё { $left } садовода, чтобы открыть
                [many] купи ещё { $left } садоводов, чтобы открыть
               *[other] купи ещё { $left } садовода, чтобы открыть
            }
       *[no]
            { $left ->
                [one] купи { $left } садовода, чтобы открыть
                [few] купи { $left } садовода, чтобы открыть
                [many] купи { $left } садоводов, чтобы открыть
               *[other] купи { $left } садовода, чтобы открыть
            }
    }

# a machine's row until its station's set of blaster hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-blaster =
    { $more ->
        [yes]
            { $left ->
                [one] купи ещё { $left } подрывника, чтобы открыть
                [few] купи ещё { $left } подрывника, чтобы открыть
                [many] купи ещё { $left } подрывников, чтобы открыть
               *[other] купи ещё { $left } подрывника, чтобы открыть
            }
       *[no]
            { $left ->
                [one] купи { $left } подрывника, чтобы открыть
                [few] купи { $left } подрывника, чтобы открыть
                [many] купи { $left } подрывников, чтобы открыть
               *[other] купи { $left } подрывника, чтобы открыть
            }
    }

# a price in time, a minute or more: $n minutes
price-min = { $n } мин

# a row's verb, before its gain: how much a hand holds
does-hold = в руке

# the bench: your carry ladder
row-carry = сколько несёшь

# a row's verb, before its gain: swings
does-hit = удар

# the bench: your swing pace ladder
row-speed = автоудар

# a row's verb, before its gain: throws
does-throw = бросок

# the bench: how often a held hand lets go
row-toss = темп броска

# a row's verb, before its gain: how far a throw carries
does-reach = дальность

# the bench: how far a handful carries
row-reach = дальность броска

# a row's verb, before its gain: what a swing takes
does-per-swing = за удар

# the bench: what a swing of yours takes
row-pick = урон кирки

# the bench: holding a handful throws it by itself
row-autotoss = держать, чтобы бросать

# the bench: holding the pointer on the boulder swings by itself
row-auto = держать, чтобы долбить

# a row's verb, before its gain: how much a body carries
does-carry = несёт

# the bench: the haulers' load ladder
row-haulcarry = груз носильщика

# a row's verb, before its gain: walking pace
does-walk = шаг

# the bench: the haulers' pace ladder
row-haulpace = скорость носильщика

# a row's verb, before its gain: crits
does-crit = крит

# the bench: the chance a hit is a crit
row-critchance = шанс крита

# the bench: how much more a crit takes
row-critmult = урон крита

# the shack: the diggers' swing pace ladder
row-rockhandspeed = скорость удара

# the shack: what a digger's swing takes
row-rockhandpick = кирка камнебоя

# the bench: the row that puts up the apothecary
row-unlockapothecary = построй аптеку

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = вари временные усиления для своих квадрарабочих

# the bench: what the apothecary row gives, where a gain would go
row-unlockapothecary-blurb = варит тоники бригаде

# the bench: the row that puts up the casino
row-unlockcasino = построй казино

# the bench: what the casino is for, under its name
row-unlockcasino-note = стол, который принимает ставку и платит вдвое или ничего

# the bench: what the casino row gives, where a gain would go
row-unlockcasino-blurb = вдвое или ничего

# the bench: the row that puts up the farm
row-unlockfarm = построй ферму

# the bench: what the farm is for, under its name
row-unlockfarm-note = вырасти немного урожая

# the bench: what the farm row gives, where a gain would go
row-unlockfarm-blurb = растит урожай

# the bench: the row that puts up the air filter
row-unlockfilter = построй воздушный фильтр

# the bench: what the air filter is for, under its name
row-unlockfilter-note = продаёт шары, которые вытягивают дымку обратно из неба, и показывает, каково небо

# the bench: what the air filter row gives, where a gain would go
row-unlockfilter-blurb = чистит небо

# the bench: the row that puts up the janitor's closet
row-unlockouthouse = построй каморку уборщика

# the bench: what the closet is for, under its name
row-unlockouthouse-note = какашек ты насмотрелся, давай уберём

# the bench: what the closet row gives, where a gain would go
row-unlockouthouse-blurb = какашки убраны

# the bench: the row that puts up the quarry
row-unlockquarry = построй карьер

# the bench: what the quarry is for, under its name
row-unlockquarry-note = начни копать руду

# the bench: what the quarry row gives, where a gain would go
row-unlockquarry-blurb = копает руду

# the bench: the row that puts up the shack
row-unlockshack = построй хижину

# the bench: what the shack is for, under its name
row-unlockshack-note = Улучшения для копки

# the bench: what the shack row gives, where a gain would go
row-unlockshack-blurb = снаряжение для валуна

# the bench: the row that puts up the tower
row-unlocktower = открой башню

# the bench: what the tower is for, under its name
row-unlocktower-note = призови волшебников

# the bench: the first barrier against the boulder
row-props = деревянный заслон

# the bench: the wooden barrier's line
row-props-note = скорее построй заслон, чтобы спасти жену

# the bench: the second barrier
row-net = сеть

# the bench: the net's line
row-net-note = не вышло, может, поймать валун сетью?

# the bench: the third barrier
row-arch = вытеши арку

# the bench: the arch's line
row-arch-note = всё ещё непрочно. давай сложим каменную арку.

# the tower: the last barrier, the wizards'
row-dome = может, волшебники знают?

# the tower: the last barrier's line
row-dome-note = всё, что от земли, не сработало. то, что осталось, не от земли

# a hat's name: the diggers' (its row, the index, the crew)
kit-breaker = крушитель

# what the breaker hat does
kit-breaker-does = вдвое сильнее удар

# where the breaker hat is worn
kit-breaker-place = валун

# a hat's name: the haulers' cart
kit-carter = возчик

# what the cart does
kit-carter-does = вдвое больше груза

# where the cart is used
kit-carter-place = яма

# a hat's name: the miners'
kit-blaster = подрывник

# what the blaster hat does
kit-blaster-does = вдвое больше ходок

# where the blaster hat is worn
kit-blaster-place = карьер

# a hat's name: the farmers'
kit-grower = садовод

# what the grower hat does
kit-grower-does = вдвое больше ухода

# where the grower hat is worn
kit-grower-place = ферма

# the bench: a forklift that drives itself
row-driver = погрузчик

# the bench: the forklift's line
row-driver-note = погрузчик, который ездит сам: возит к яме без водителя и дымит

# the bench: the forklifts' load ladder
row-liftload = груз погрузчика

# a row's verb, before its gain: driving pace
does-drive = ход

# the bench: the forklifts' pace ladder
row-liftpace = скорость погрузчика

# a heading on the bench's board: your own ladders
sect-you = ты

# a heading on the bench's board: the crit ladders
sect-luck = удачные удары

# a heading on the bench's board: the haulers' gear
sect-haulers = носильщики

# a heading on the bench's board: the rows that put up a new place
sect-build = стройка

# the house's board: buy another house to hire somebody
row-house = ещё один дом

# the ribbon on every goal card: the barrier the story is on
goal-title = спасаем жену

# a card greyed out: its next rung costs crops, and there is no farm yet
needs-spore = нужен урожай

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = нужен карьер

# a card greyed out: its next rung costs a spark, and none has been earned
needs-spark = нужна искра

# a card greyed out: its next rung costs a scale, and the deep is not open
needs-scale = нужна чешуя

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does } ({ $place })

# the shack: the ram's tuning ladder
row-tuneram = удар тарана

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note =
    { $n ->
        [one] таран бьёт в { $n } раз сильнее
        [few] таран бьёт в { $n } раза сильнее
        [many] таран бьёт в { $n } раз сильнее
       *[other] таран бьёт в { $n } раза сильнее
    }

# a heading on any board over the rows no section names
sect-and = и ещё

# a card the yard is at: somebody is building it (the strip's word with nothing to hand back; the gain line's word)
card-building = строится

# the strip at a card's foot: buy another copy behind the one being built
card-another = + ещё один

# a card in line: nobody is at it yet
card-queued = в очереди

# a finished ladder, where its price would go
card-done = готово

# the tower: an enchantment's name
spell-drive = ускорить машины

# the tower: the enchantment's line
spell-drive-note = каждая машина во дворе работает на 50% быстрее

# the tower: an enchantment's name
spell-luck = обогатить карьер

# the tower: the enchantment's line
spell-luck-note = каждый раскоп в карьере даёт на 25% больше руды

# the tower: an enchantment's name
spell-gmo = генетически изменить урожай

# the tower: the enchantment's line
spell-gmo-note = каждый урожай на 25% крупнее

# the tower: an enchantment's name
spell-thrift = удешевить дома

# the tower: the enchantment's line
spell-thrift-note = каждый дом отныне на 75% дешевле

# the tower: an enchantment's name
spell-sweep = поторопить уборщиков

# the tower: the enchantment's line
spell-sweep-note = уборщики убирают и ходят вдвое быстрее

# the tower: how often a wizard throws
row-wizspeed = быстрые чары

# the tower: how often a wizard throws, its line; $pct is the rise a rung
row-wizspeed-note = каждый волшебник мечет молнию в звезду на { $pct }% чаще

# a row's verb, before its gain: a wizard's casting
does-cast = чары

# the tower: how much of the star a bolt takes
row-wizpower = тяжёлые молнии

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note =
    { $next ->
        [one] каждая молния откалывает от звезды { $next } клетку вместо { $now }
        [few] каждая молния откалывает от звезды { $next } клетки вместо { $now }
        [many] каждая молния откалывает от звезды { $next } клеток вместо { $now }
       *[other] каждая молния откалывает от звезды { $next } клетки вместо { $now }
    }

# the tower: a wizard's hat
row-wizard = призвать волшебника

# the tower: a wizard's line
row-wizard-note = взлетает, разбивает звезду молниями на искры и вызывает новую, когда небо пустеет

# the tower: the sphere's line
row-sphere-note = поймай силу звезды

# the tower: the sphere's tuning ladder
row-tunesphere = отдача сферы

# the tower: the sphere's tuning ladder, its line; $n is how many times the light
row-tunesphere-note =
    { $n ->
        [one] сфера ловит в { $n } раз больше света
        [few] сфера ловит в { $n } раза больше света
        [many] сфера ловит в { $n } раз больше света
       *[other] сфера ловит в { $n } раза больше света
    }

# the tower: the barrier the wizards pour
row-dome-tower = вызвать барьер

# the tower: the barrier's line
row-dome-tower-note = через эту штуку ничто не пройдёт.

# the tower: the way down to the deep
row-portal = вызвать портал

# the tower: the portal's line
row-portal-note = путь вниз, в бездну, и он держится открытым.

# a heading on the tower's board: the spells
sect-enchantments = чары

# a heading on the tower's board: the portal
sect-abyss = бездна

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign (50%)
spell-drive-blurb = +{ $pct } скорости

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-luck-blurb = +{ $pct } руды

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-gmo-blurb = +{ $pct } урожая

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-thrift-blurb = на { $pct } дешевле

# the tower: what the enchantment gives, where a gain would go; $x is how many times
spell-sweep-blurb =
    { $x ->
        [one] в { $x } раз быстрее
        [few] в { $x } раза быстрее
        [many] в { $x } раз быстрее
       *[other] в { $x } раза быстрее
    }

# the farm: what a harvest is worth, a ladder
row-crop = урожайность

# a row's verb, before its gain: tending plots
does-tend = уход

# the farm: how often a plot is tended, a ladder
row-tend = скорость фермы

# the farm: break another plot
row-farmplot = ещё грядка

# the farm: the tiller's tuning ladder
row-tunetiller = темп культиватора

# the farm: the tiller's tuning ladder, its line; $n is how many times faster
row-tunetiller-note =
    { $n ->
        [one] культиватор работает в { $n } раз быстрее
        [few] культиватор работает в { $n } раза быстрее
        [many] культиватор работает в { $n } раз быстрее
       *[other] культиватор работает в { $n } раза быстрее
    }

# a heading on the farm's board: what a plot pays
sect-crop = урожай

# the quarry: what a dig turns up, a ladder
row-seam = выход руды

# a row's verb, before its gain: digging
does-dig = копка

# the quarry: how often a dig happens, a ladder
row-quarrypace = скорость добычи

# the quarry: another miner's shovel at the face
row-quarrybench = ещё лопата

# the quarry: the drill's tuning ladder
row-tunejaw = хватка бура

# the quarry: the drill's tuning ladder, its line; $n is how many times harder
row-tunejaw-note =
    { $n ->
        [one] бур вгрызается в { $n } раз сильнее
        [few] бур вгрызается в { $n } раза сильнее
        [many] бур вгрызается в { $n } раз сильнее
       *[other] бур вгрызается в { $n } раза сильнее
    }

# a heading on the quarry's board: what the hole pays
sect-ore = руда

# a heading on the farm's board over who works the plots, with their headcount (the job's save key, as it has always read)
sect-farmhands = батраки

# a heading on the quarry's board over who works the cut, with their headcount (the job's save key, as it has always read)
sect-quarriers = карьерщики

# a row's verb, before its gain: a balloon's flight
does-fly = полёт

# the air filter: how fast the balloons go from cloud to cloud
row-balloonspeed = скорость шаров

# a row's verb, before its gain: what a balloon takes in
does-filter = фильтр

# the air filter: how much haze a balloon draws
row-power = сила шара

# the air filter: another balloon
row-balloon = шар

# the air filter: the balloon's line
row-balloon-note = плывёт по облакам и роняет пойманное под себя

# the air filter: the recycler
row-recycler = переработчик

# the air filter: the recycler's line
row-recycler-note = то, что ловят шары, падает камушками, а не грязью

# a heading on the air filter's board
sect-equipment = снаряжение

# the janitor's closet: the second cap on the stand
row-loopost = ещё одна кепка

# the janitor's closet: another roomba
row-roomba = робот-пылесос

# the janitor's closet: the roomba's line
row-roomba-note = едет к грязи на открытом дворе и везёт её домой; за ними присматривает один уборщик, и они дымят

# the janitor's closet: the roombas' tuning ladder
row-tuneroomba = тяга пылесосов

# the janitor's closet: the roombas' tuning ladder, its line; $n is how many times faster
row-tuneroomba-note =
    { $n ->
        [one] пылесосы всасывают в { $n } раз быстрее
        [few] пылесосы всасывают в { $n } раза быстрее
        [many] пылесосы всасывают в { $n } раз быстрее
       *[other] пылесосы всасывают в { $n } раза быстрее
    }

# a brew's name: the speed one, priced in crops
tonic-stew = сытная похлёбка

# a brew's name: the strength one, priced in ore
tonic-strong = крепкое варево

# a brew's name: the crit one, priced in sparks
tonic-brace = бодрящий тоник

# the apothecary: keep the fires going, or let them die once a batch is dealt (a setting)
row-potkeep = варить дальше

# the apothecary's keep-brewing setting: on
row-potkeep-on = варка за варкой

# the apothecary's keep-brewing setting: off
row-potkeep-off = только эту

# the apothecary: room for one more pot and its stirrer
row-anotherpot = ещё котёл

# a row's verb, before its gain: how long a dose lasts
does-lasts = длится

# the apothecary: how long a dose lasts, a ladder
row-bufflength = крепость отвара

# the apothecary: doses a batch, a ladder
row-brewdoses = размер партии

# a heading on the apothecary's board over the pots, with the stirrers' headcount
sect-pot = котёл

# a heading on the apothecary's board
sect-brewing = варка

# a heading on the apothecary's board: one ladder a brew
sect-potency = сила

# a brew's potency row's verb, before its gain
does-faster = быстрее

# a brew's potency row's verb, before its gain
does-stronger = сильнее

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } с

# what the crit brew does: $v points of crit chance for $secs seconds
tonic-gain-crit = +{ $v } крит, { $secs } с

# the shack's heading over the diggers' gear, with their headcount
sect-diggers = камнебои

## Machines

# a machine's name: the quarry's (the save's key is jaw)
machine-jaw = бур

# a machine's name: the boulder's
machine-ram = таран

# a machine's name: the farm's
machine-tiller = культиватор

# a machine's name: carries pebbles from the boulder to the hole
machine-belt = конвейер

# a machine's name: the shell round the star
machine-sphere = сфера

# a machine's name: the janitor's closet's
machine-roomba = роботы-пылесосы

## Stations

# a deep station's board with nothing on it yet
station-party-empty = учиться пока нечему

# a station's name: its board's title, the pointer's label, the queue card
station-casino = казино

# a station's name
station-filter = воздушный фильтр

# the air filter's board with nothing on it
station-filter-empty = ставить нечего

# a station's name
station-quarry = карьер

# the quarry's board with nothing on it
station-quarry-empty = карьер выкопан до дна

# a station's name
station-farm = ферма

# the farm's board with nothing on it
station-farm-empty = вся земля вскопана

# a station's name
station-apothecary = аптека

# the apothecary's board with nothing on it
station-apothecary-empty = котёл стоит холодный

# a station's name
station-tower = башня

# the tower's board with nothing on it
station-tower-empty = здесь пока ничто не шевелится

# a station's name
station-shack = хижина

# the shack's board with nothing on it
station-shack-empty = все инструменты на валуне

# the bench's board with nothing on it
station-bench-empty = продавать нечего

# a station's name
station-outhouse = каморка уборщика

# the janitor's closet's board with nothing on it
station-outhouse-empty = мётлы все на своих крючках

# a station's name
station-house = дом

# a station's name: the noticeboard over the pit
station-stats = гроссбух

# the books with nothing on them
station-stats-empty = пока ничего не поступало

# a station's name: the deep's purse
station-crusher = дробилка

# the crusher's pile-full mark, on a hover
station-crusher-full = пол завален чешуёй

# a station's name: the deep's houses
station-pods = капсулы

# the pods' board with nothing on it
station-pods-empty = строить нечего

# the lab's board title, still in the page's markup (the lab itself is gone)
station-lab = лаборатория

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (An eighth like-named station reads "undefined": what the code said before the words moved here, kept by the owner; the deep has seven.)
station-party =
    { $nth ->
        [0] { $who }
        [1] второй { $who }
        [2] третий { $who }
        [3] четвёртый { $who }
        [4] пятый { $who }
        [5] шестой { $who }
        [6] седьмой { $who }
       *[other] undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (an eighth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] станция
        [1] вторая станция
        [2] третья станция
        [3] четвёртая станция
        [4] пятая станция
        [5] шестая станция
        [6] седьмая станция
       *[other] undefined станция
    }

## Crew

# the crew window: where a body is, standing at its station (rockhands)
crew-at-rockhands = на валуне

# the crew window: where a body is, standing at its station (haulers)
crew-at-haulers = у ямы

# the crew window: where a body is, standing at its station (quarriers)
crew-at-quarriers = в карьере

# the crew window: where a body is, standing at its station (farmhands)
crew-at-farmhands = на грядках

# the crew window: where a body is, standing at its station (purifiers)
crew-at-purifiers = у воздушного фильтра

# the crew window: where a body is, standing at its station (janitors)
crew-at-janitors = на уборке

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = у тебя в руке

# the crew window and a body's card: where a body is (falling)
crew-where-falling = в воздухе

# the crew window and a body's card: where a body is (home)
crew-where-home = дома

# the crew window and a body's card: where a body is (basket)
crew-where-basket = в шаре

# the crew window and a body's card: where a body is (yard)
crew-where-yard = во дворе

# the crew window and a body's card: where a body is (resting)
crew-where-resting = на перерыве

# the crew window and a body's card: where a body is (walking)
crew-where-walking = в пути

# the crew window and a body's card: where a body is (deep)
crew-where-deep = в пучине

# a body's card, doing: at its job with no step to name (rockhands)
crew-does-rockhands = долбит валун

# a body's card, doing: at its job with no step to name (quarriers)
crew-does-quarriers = добывает в карьере

# a body's card, doing: at its job with no step to name (farmhands)
crew-does-farmhands = фермерствует

# a body's card, doing: at its job with no step to name (scholars)
crew-does-scholars = исследует

# a body's card, doing: at its job with no step to name (purifiers)
crew-does-purifiers = чистит воздух

# a body's card, doing: at its job with no step to name (janitors)
crew-does-janitors = орудует лопатой

# a body's card, doing: at its job with no step to name (haulers)
crew-does-haulers = перевозит

# a body's card, doing: what its step is (seek)
crew-now-seek = ищет камушки

# a body's card, doing: what its step is (dump)
crew-now-dump = вываливает груз

# a body's card, doing: what its step is (muck)
crew-now-muck = сгребает грязь

# a body's card, doing: what its step is (cut)
crew-now-cut = копает в карьере

# a body's card, doing: what its step is (up)
crew-now-up = вылезает

# a body's card, doing: what its step is (down)
crew-now-down = спускается

# a body's card, doing: what its step is (tend)
crew-now-tend = ухаживает за грядкой

# a body's card, doing: what its step is (home)
crew-now-home = идёт домой

# a body's card, doing: what its step is (idle)
crew-now-idle = ничего особенного

# a body's card, doing: what its step is (in)
crew-now-in = внутри

# a body's card, doing: what its step is (aloft)
crew-now-aloft = наверху, в шаре

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = следит: { $name }

# a body's card, doing: what its step is (to)
crew-now-to = идёт туда

# a body's card, doing: what its step is (kit)
crew-now-kit = берёт снаряжение у верстака

# a body's card, doing: what its step is (build)
crew-now-build = строит

# a body's card, doing: what its step is (working)
crew-now-working = работает

# a body with no name, on its card and in the crew window
crew-somebody = кто-то

# a body's card: the label before how long it has been here (a column of ten in monospace)
crew-card-age = стаж

# a body's card, age: under a minute
crew-card-new = новенький

# a body's card, age: $mins minutes
crew-card-mins = { $mins } мин

# a body's card: the label before what it is doing (a column of ten in monospace)
crew-card-doing = занят

# a heading in the crew window over the yard's crew
crew-sect-yard = двор

# a heading in the crew window over the deep's crew
crew-sect-deep = пучина

# a heading on the house's board, and the window it opens
crew-sect-crew = бригада

## The books

# the books: a coin, before its rate
books-dust = камушки

# the books: a coin, before its rate
books-shard = руда

# the books: a coin, before its rate
books-spore = урожай

# the books: a coin, before its rate
books-spark = искры

# the books: the window the rates are taken over, in minutes ($n may be ½)
books-over-min = { $n } мин

# the books: the row that steps the window the rates are taken over
books-over = среднее за

# the books: the window, in a rate's note (nothing in the last half minute)
books-last-half = последние полминуты

# the books: the window, in a rate's note
books-last-one = последнюю минуту

# the books: the window, in a rate's note; $n minutes, more than one
books-last-mins =
    { $n ->
        [one] последние { $n } минуту
        [few] последние { $n } минуты
        [many] последние { $n } минут
       *[other] последние { $n } минуты
    }

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } за { $over }

# the books: a rate's note when nothing came in
books-nothing = ничего

# the books: a line
books-dirt-mach = от машин

# the books: a line
books-dirt-dust = от валуна

# the books: a line
books-dirt-shard = от карьера

# the books: a line
books-dirt-spore = от фермы

# the books: the sky full in, while the filter is winning
books-due-never = не при таком темпе

# the books: a line
books-sky-trend = загрязнение

# the books: a line
books-sky-up = выброшено в минуту

# the books: a line
books-sky-down = убрано в минуту

# the books: a line
books-sky-haze = небо

# the books: how full the sky is; $pct with its sign
books-sky-full = заполнено на { $pct }

# the books: a line
books-sky-due = заполнится через

# the books: a line
books-sky-rains = пережито ливней

# the books: a line
books-sky-muck = грязи вокруг

# the books: a line
books-working = работают

# the books: a line
books-idle = без дела

# the books: a line
books-best-mined = больше всех с валуна

# the books: a line
books-best-quarried = больше всех руды

# the books: a line
books-best-farmed = больше всех урожая

# the books: a line
books-best-stored = больше всех в яму

# the books: a line
books-best-tidied = больше всех убрано грязи

# the books: the longest on one clock, an hour or more; $n hours to a tenth
books-hours = { $n } ч

# the books: the longest on one clock, under an hour; $n minutes
books-mins = { $n } мин

# the books: a line
books-eldest = дольше всех без смены

# the books: a line
books-tally-rocks = разбито валунов

# the books: a line
books-tally-banked = камушков в яме

# the books: a line
books-tally-ore = добыто руды

# the books: a coin earned over the whole game; $coin is books-shard, books-spore or books-spark
books-tally-earned = { $coin }: заработано

# the books: a line
books-tally-rift = через разлом

# the books: a line
books-tally-brews = сварено партий

# the books: a line
books-tally-hats = доделано шляп

# the books: a line
books-tally-crew = в штате

# the books: a line
books-tally-notes = получено достижений

# the books: a line
books-tally-under = жена под валуном уже

# the books: a line
books-tally-saved = жена спасена за

# a heading in the books, and on the noticeboard
books-sect-income = доход в секунду

# a heading in the books
books-sect-sky = небо

# a heading in the books
books-sect-crew = бригада

# a heading in the books
books-sect-tally = итог

# the noticeboard: the way into the books (off the board for now)
books-open = открыть гроссбух

# the noticeboard: how long this yard has been played
books-playtime = время в игре

## Hover

# the hover on a deep station whose Recruit still waits on its first choice
hover-choose = выбери бойца

# the hover over a grain of ore
hover-ore = руда

# the hover over a crop, a grain of it or a grown plot
hover-crop = урожай

# the hover over a spark
hover-spark = искра

# the hover over a pebble
hover-pebble = камушек

# the hover over the drowned pit
hover-abyss = бездна

# the hover over the rift
hover-rift = разлом

# the hover over poop on the ground
hover-poop = какашки

# the hover over muck on the ground
hover-muck = грязь

# the hover over a body, as the job it does (its type, rockhand)
hover-rockhand = камнебой

# the hover over a body, as the job it does (its type, hauler)
hover-hauler = носильщик

# the hover over a body, as the job it does (its type, quarrier)
hover-quarrier = карьерщик

# the hover over a body, as the job it does (its type, farmhand)
hover-farmhand = батрак

# the hover over a body, as the job it does (its type, scholar)
hover-scholar = учёный

# the hover over a body, as the job it does (its type, purifier)
hover-purifier = очиститель

# the hover over a body, as the job it does (its type, stirrer)
hover-stirrer = аптекарь

# the hover over a body, as the job it does (its type, janitor)
hover-janitor = уборщик

# the hover over a body, as the job it does (its type, wizard)
hover-wizard = волшебник

# the hover over a body, as the job it does (its type, builder)
hover-builder = строитель

# the hover over a body, as the job it does (its type, fighter)
hover-fighter = боец

# the hover over a body, as the job it does (its type, gatherer)
hover-gatherer = сборщик

# the hover over a body, as the job it does (its type, delver)
hover-delver = глубинный строитель

# the hover over the portal, from the deep
hover-portal-up = портал — наверх, во двор

# the hover over the portal, from the yard
hover-portal-down = портал — вниз, в пучину

# the hover over the serpent
hover-serpent = змей

# the hover over the crew's houses
hover-house = дом

# the hover over the boulder
hover-rock = валун

# the hover over a bird
hover-bird = птица

# the hover over a balloon
hover-balloon = шар

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the air filter's gauge: the sky filling faster than it is cleaned
hover-dial-worse = становится хуже

# the air filter's gauge: the sky cleaned faster than it fills
hover-dial-better = становится лучше

# the air filter's gauge: neither
hover-dial-steady = держится ровно

# the hover over the counter above the pit
hover-counter = камушки в яме: ими платят за всё

# the air filter's gauge: the needle in the first band
hover-dial-clean = чисто

# the air filter's gauge: the needle in the middle band
hover-dial-dirty = грязно

# the air filter's gauge: the needle in the last band
hover-dial-filthy = грязища

# the hover on a pile-full mark: a station's pile has nowhere left to go
hover-pile-full = куча полна

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names }: готово

# the hover on a done mark whose rows have no names
hover-done-work = работа сделана

# the casino's lever, by name (its hover and the pad's label)
lever-arm = рычаг

# a pot's picker: the brew it is set to, when it is set to none
pot-nothing = ничего

# a pot's picker: the heading over who the brew is for
pot-for = кому

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = кто ближе

## The deep

# a brawler's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-brawler-fork = Бей сильнее, учи комбо

# the brawler's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move = Комбо

# what the brawler's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move-does = серии ударов

# the brawler's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap = Нокаут

# what the brawler's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap-does = { $stun }

# a sword's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sword-fork = Освой меч

# the sword's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-move = Вихрь

# what the sword's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-move-does = удар тяжелее

# the sword's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap = Слабые места

# what the sword's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap-does = { $bleed }

# a monk's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-monk-fork = Сосредоточь ци

# the monk's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-move = Глубокий вдох

# what the monk's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-move-does = ци быстрее

# the monk's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap = Тихая вода

# what the monk's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap-does = { $stun }

# a martial's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-martial-fork = Бей быстрее, добивай скорее

# the martial's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-move = Росчерк

# what the martial's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-move-does = добивания быстрее

# the martial's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap = Сплочение

# what the martial's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap-does = отряду { $haste }

# a ranger's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-ranger-fork = Целься в слабые места

# the ranger's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move = Прицельный выстрел

# what the ranger's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move-does = заряженная стрела

# the ranger's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap = Пригвождающий выстрел

# what the ranger's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap-does = { $stun }

# a assassin's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-assassin-fork = Бей быстро и точно

# the assassin's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move = Казнь

# what the assassin's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move-does = карает за раны

# the assassin's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap = Зазубрины

# what the assassin's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap-does = { $bleed }

# a hexer's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-hexer-fork = Насылай ослабляющие проклятия

# the hexer's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move = Иссушение

# what the hexer's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move-does = змей получает больше урона

# the hexer's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap = Путы

# what the hexer's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap-does = { $held }, { $exposed }

# a sapper's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sapper-fork = Изучи взрывчатку

# the sapper's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move = Липкие бомбы

# what the sapper's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move-does = прилипает, потом взрывается

# the sapper's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap = Пара

# what the sapper's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap-does = две бомбы, { $stun }

# a mage's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-mage-fork = Направляй мощные лучи

# the mage's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-move = Расширение

# what the mage's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-move-does = луч шире

# the mage's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap = Термит

# what the mage's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap-does = прожигает броню

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Дай отряду { $inspired }

# the bard's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-move = Гимн

# what the bard's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-move-does = двойное { $inspired }

# the bard's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap = Темп

# what the bard's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap-does = отряду { $haste }

# a status, by name (bold in a line, under its icon)
status-stun = Оглушение

# a status, by name
status-bleed = Кровотечение

# a status, by name
status-haste = Ускорение

# a status, by name
status-held = Скованность

# a status, by name
status-exposed = Уязвимость

# a status, by name
status-inspired = Воодушевление

# what Stun does, after its name
status-stun-does = замирает, не лечится

# what Bleed does, after its name
status-bleed-does = урон со временем

# what Haste does, after its name; $pct with its sign
status-haste-does = атакует на { $pct } быстрее

# what Held does, after its name
status-held-does = не может лечиться

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = получает на { $lo }-{ $hi } больше урона

# what Inspired does, after its name
status-inspired-does = бьёт сильнее

# a status's hover line: $name (status-…) and what it does
status-line = { $name }: { $does }

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# a status's label under its icon when $n of it are on
status-label-n = { $name } x{ $n }

# a base fighter's line: the altar's (the Fighter)
base-altar-does = Бьёт кулаками

# a base fighter's line: the well's (the Novice)
base-well-does = Занимается боевыми искусствами

# a base fighter's line: the armory's (the Scout)
base-armory-does = Стреляет из лука

# a base fighter's line: the circle's (the Adept)
base-circle-does = Насылает проклятия

# a base fighter's line: the spire's (the Apprentice)
base-spire-does = Стреляет лучами

# the Recruit's line, before its first choice
recruit-does = лёгкий удар

# the Bard's line with nobody else fighting
rail-alone = петь больше некому

# a class that needs company, before there is any
rail-locked = откроется со второй станцией

# a station's board at the fork: the heading over the two classes
rail-fork-ask = Специализация

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Выбери бойца

# a rung's number in its class's unit; $unit is unit-dmg or unit-dmg-s
rail-worth = { $n } { $unit }

# a rung's number for a class written in percent (the Bard)
rail-worth-pct = +{ $n }%

# a pip's hover line on a station's tree: $name (a fighter, a move) and $what (its number, or a few words)
rail-line = { $name }: { $what }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Стать: { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = сброс – всё возвращается

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-brawler = Драчун

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sword = Мечник

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-monk = Монах

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Мастер боевых искусств

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-ranger = Следопыт

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-assassin = Убийца

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-hexer = Колдун

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sapper = Сапёр

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-mage = Маг

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-bard = Бард

# a base fighter's name: the altar's, below the fork
base-altar = Боец

# a base fighter's name: the well's
base-well = Новичок

# a base fighter's name: the armory's
base-armory = Разведчик

# a base fighter's name: the circle's
base-circle = Адепт

# a base fighter's name: the spire's
base-spire = Ученик

# every station's first fighter, before its first choice
class-recruit = Новобранец

# the serpent's lash, its tile's hover while it waits
serp-lash-calm = Хлёст: оглушает бойцов ближнего боя

# the serpent's lash, its tile's hover while it is warned
serp-lash-coming = Хлёст на подходе

# the serpent's lash, its tile's hover while it is on
serp-lash-on = Хлёст: оглушает бойцов ближнего боя

# the serpent's lash, its tile's hover once answered
serp-lash-stopped = Хлёст: остановлен

# the serpent's cloak, warned
serp-sink-coming = Покров на подходе

# the serpent's cloak, on
serp-sink-on = Покров: вне досягаемости

# the serpent's constrict, warned
serp-orb-coming = Удушение на подходе

# the serpent's constrict, on
serp-orb-on = Удушение

# the serpent's constrict, answered
serp-orb-stopped = Удушение

# a fighter's tile: dazed, its hover
serp-dazed = Ошеломлён: сбит с толку, искры из глаз

# a fighter's tile: constricted, its hover
serp-constricted = Сдавлен

# the serpent's barrier, its tile's hover
serp-barrier = Барьер: поглощает урон от взрывов

# the serpent's ward, its tile's hover
serp-ward = Оберег: магический урон вдвое меньше

# the serpent's plates, its tile's hover
serp-plates = Пластины: физический урон вдвое меньше

# the lash's tile, its label
serp-lash = Хлёст

# the cloak's tile, its label
serp-sink = Покров

# the constrict's tile, its label
serp-orb = Удушение

# a fighter's dazed tile, its label
serp-dazed-name = Ошеломлён

# a fighter's constricted tile, its label
serp-constricted-name = Сдавлен

# the barrier's tile, its label
serp-barrier-name = Барьер

# the ward's tile, its label
serp-ward-name = Оберег

# the plates' tile, its label
serp-plates-name = Пластины

# the pods: one more of the crew, living down here
row-pod = ещё капсула

# the pods: the pod's line
row-pod-note = капсула на дальнем краю пучины: ещё один из бригады будет жить здесь, внизу

# a deep station's board: the heading over its one fighter, with the count
rail-fighter = боец

# the deep: the build of a new fighter's station (the queue card names it)
row-raise-station = поставить станцию

# the deep's build button: the first station costs no fang
build-free = даром

# the serpent's level after the pips on its bar, from level 2 on; $n is the level.
# [owner's words: a level label, e.g. "Lv 7"] -- until then the bare number. Drawn in the pixel number font
# (NUM_FONT), which draws only the glyphs it has: words want their letters drawn into the font
serp-level = { $n }
