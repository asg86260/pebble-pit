### Pebble Pit pilot, version A: drafted by Claude (Opus 5.5) after locales/STYLE.md, ru.
### A draft for a native reviewer, not a finished translation.


# rescue sheet heading, end of first half
saved-word = Это конец?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = твоя квадражена спасена за <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Долго и счастливо

# demo end sheet line
demoend-why = квадражену пока не спасти.

# second-half end sheet line
freed-why = твой квадрамуж вызволен из брюха змея.

# second-half end sheet line
freed-end = вот и конец, можешь и дальше бить змея и фермерствовать наверху!

# saves page paste box cancel
held-nevermind = неважно

# pause sheet footer hint
held-keys = esc пауза · ← → осмотреться · держи пробел, чтобы пропустить сцену

# window close button label
modal-close =
    .aria-label = закрыть

# pause sheet reply, store fallback
said-fellback = последнее сохранение не загрузилось; это предыдущее

# pause sheet reply, yard open elsewhere
said-yielded = этот двор открыт в другой вкладке; сохраняется там

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = не сохраняется: хранилище сайта заполнено ({ $used } мб занято, из них { $ours } кб наши). копирование сохранения работает

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = не загрузилось: { $message }

# save row age
slots-since-min = { $m } мин назад

# saves row: how long ago it was saved, in whole days
slots-since-days =
    { $d ->
        [one] { $d } день назад
        [few] { $d } дня назад
        [many] { $d } дней назад
       *[other] { $d } дня назад
    }

# save row item
slots-row-crew = { $n } чел.

# saves button label on both fronts
held-slotsbtn-label = сохранения · { $n } из { $total }

# achievements page, nothing earned
held-record-none = пока ничего не сделано.

# cloud section under recovery code
cloud-writedown = запиши: с ним твои дворы вернутся на новом устройстве

# cloud section reply, 503
cloud-why-resting = облако отдыхает; попробуй позже

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = слишком много попыток отсюда за сегодня; попробуй завтра

# cloud section button, first press
cloud-btn-newcode-armed = выйти на других устройствах?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = сохранено { $since }

# settings dark switch
set-dark-on = тёмная: вкл

# settings motion switch
set-motion-less = движение: меньше

# settings note where fullscreen unavailable
set-fullscreen-note = для полного экрана добавь эту страницу на главный экран

# controls page action column
ctl-rightleft-do = поднять работников

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = валун. яма. несколько человек между ними.

# landing page main button
title-play = играть

# story line, first step
obj-rock = долби валун, чтобы спасти квадражену!

# story line, wooden roof barrier
obj-props = может, деревянная крыша остановит следующий валун?

# story line, arch barrier
obj-arch = давай сложим арку из руды и камня. уж она-то выдержит.

# story line, wizards' barrier
obj-dome = идей больше нет, может, волшебники помогут.

# story line, deep half
obj-portal = открой портал в бездну, что там внизу?

# story line, final step
obj-free = вызволи квадрамужа из брюха змея

# objective card cancel while building
obj-barrier-cancel = отмена ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = держи <span data-l10n-name="key"></span>, чтобы пропустить

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = БРОСАЙ

# the house's board and the crew window, with no crew yet
crew-empty = здесь пока никто не живёт

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h } ч { $m } мин

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }-й

# achievement name
ach-gotout-name = квадражена спасена

# toast and achievements card name
ach-firstgrain-name = делаем деньги

# achievement name
ach-firsthire-name = дополнительные пилоны построены

# achievement name
ach-firsthat-name = ты волшебник, квадратик

# achievement name
ach-firstbrew-name = здравствуй, продавец зелий

# achievement name
ach-dizzy-name = синдром встряхнутого ребёнка

# achievement name
ach-muckrain-name = пришла беда — отворяй ворота

# achievement name
ach-tablebeaten-name = мы вернулись

# achievement name
ach-tableruin-name = пора брать кредит

# achievement name
ach-bird-name = вон с моей земли

# achievement note
ach-catchall-note = брось полную горсть пыли, самую большую, и поймай каждую крупинку

# achievement name
ach-rifttorn-name = разлом открыт, вопрос хранения решён

# achievement note
ach-rifttorn-note = заполни яму, чтобы открылся межпространственный разлом

# achievement note
ach-drowned-note = целый океан межпространственного хранилища.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = разбей { $n } валунов, это много камней

# achievement name: crew hired; $n is the count
ach-crew-name =
    { $n ->
        [one] { $n } квадрат
        [few] { $n } квадрата
        [many] { $n } квадратов
       *[other] { $n } квадрата
    }

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = камнебои

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = глубинные строители

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/с

# a row's unit after its number: swings a second
unit-hits-s = удар/с

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

# the bench: your carry ladder
row-carry = сколько несёшь

# the bench: holding a handful throws it by itself
row-autotoss = держать, чтобы бросать

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = вари временные усиления для своих квадрарабочих

# the bench: what the casino is for, under its name
row-unlockcasino-note = стол, который принимает ставку и платит вдвое или ничего

# the bench: what the closet is for, under its name
row-unlockouthouse-note = какашек ты насмотрелся, давай уберём

# the bench: what the air filter is for, under its name
row-unlockfilter-note = продаёт шары, которые вытягивают дымку обратно из неба, и показывает, каково небо

# the tower: the last barrier's line
row-dome-note = всё, что от земли, не сработало. то, что осталось, не от земли

# the bench: the net's line
row-net-note = не вышло, может, поймать валун сетью?

# what the breaker hat does
kit-breaker-does = вдвое сильнее удар

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, { $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = таран бьёт в { $n } раз сильнее

# the strip at a card's foot: buy another copy behind the one being built
card-another = + ещё один

# a finished ladder, where its price would go
card-done = готово

# the tower: an enchantment's name
spell-gmo = генетически изменить урожай

# the tower: the enchantment's line
spell-thrift-note = каждый дом отныне на 75% дешевле

# the tower: the enchantment's line
spell-drive-note = каждая машина во дворе работает на 50% быстрее

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = каждая молния откалывает от звезды { $next } клеток вместо { $now }

# the tower: a wizard's line
row-wizard-note = взлетает, разбивает звезду молниями на искры и вызывает новую, когда небо пустеет

# the janitor's closet: the roomba's line
row-roomba-note = едет к грязи на открытом дворе и везёт её домой; за ними присматривает один уборщик, и они дымят

# the air filter: the recycler's line
row-recycler-note = то, что ловят шары, падает камушками, а не грязью

# a brew's name: the speed one, priced in crops
tonic-stew = сытная похлёбка

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } с

# the apothecary's keep-brewing setting: on
row-potkeep-on = варка за варкой

# the bench: the forklift's line
row-driver-note = погрузчик, который ездит сам: возит к яме без водителя и дымит

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = нужен карьер

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party =
    { $nth ->
        [0] { $who }
        [1] второй { $who }
        [2] третий { $who }
        [3] четвёртый { $who }
       *[other] undefined { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] станция
        [1] вторая станция
        [2] третья станция
        [3] четвёртая станция
       *[other] undefined станция
    }

# the apothecary's board with nothing on it
station-apothecary-empty = котёл стоит холодный

# the janitor's closet's board with nothing on it
station-outhouse-empty = мётлы все на своих крючках

# the crusher's pile-full mark, on a hover
station-crusher-full = пол завален чешуёй

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = у тебя в руке

# a body's card, doing: what its step is (idle)
crew-now-idle = ничего особенного

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = следит: { $name }

# a body's card, age: under a minute
crew-card-new = новенький

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } за { $over }

# the books: the sky full in, while the filter is winning
books-due-never = не при таком темпе

# the books: a line
books-tally-under = квадражена под валуном уже

# the books: a line
books-tally-saved = квадражена спасена за

# the hover over the counter above the pit
hover-counter = камушки в яме: ими платят за всё

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names }: готово

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = кто ближе

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Дай отряду { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = получает на { $lo }-{ $hi } больше урона

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Стать: { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = сброс – всё возвращается

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Мастер боевых искусств

# a fighter's tile: dazed, its hover
serp-dazed = Оглушён: сбит с толку, искры из глаз

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Выбери бойца
