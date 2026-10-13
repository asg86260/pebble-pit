### Pebble Pit pilot, version B: machine translation, ru.
### Engine: Firefox Translations (Bergamot) via @browsermt/bergamot-translator 0.4.9 (wasm), model en-ru 2.0 from Mozilla's Remote Settings registry.
### Unedited except: the first letter takes the English case; title-gamename is not sent (the game's name).

# rescue sheet heading, end of first half
saved-word = Все кончено?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = ты спас свою жену в <span data-l10n-name="time"></span>!

# rescue sheet dismiss button
saved-keepplaying = Счастей Всегда После

# demo end sheet line
demoend-why = не могу спасти свою жену.

# second-half end sheet line
freed-why = ты спас своего мужа от брюха змеи.

# second-half end sheet line
freed-end = это конец, не стесняйтесь продолжать грать змея и сельское хозяйство на поверхности!

# saves page paste box cancel
held-nevermind = неважно,

# pause sheet footer hint
held-keys = esc держит · ← → смотреть о · удерживайте пространство, чтобы пропустить сцену

# window close button label
modal-close =
    .aria-label = закрыть

# pause sheet reply, store fallback
said-fellback = последний сейв не загрузится; это тот, что перед

# pause sheet reply, yard open elsewhere
said-yielded = этот двор открыт на другой вкладке; что один из них сохраняется

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = не экономия: хранилище этого сайта заполнено ({ $used } мб используется, { $ours } кб его нашего). копия сохранения все еще работает

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = не смог загрузить: { $message }

# save row age
slots-since-min = { $m } мин. назад

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d ->
         [one] { $d } день назад
         [few] { $d } дня назад
         [many] { $d } дней назад
        *[other] { $d } дня назад
    }

# save row item
slots-row-crew = { $n } членов экипажа

# saves button label on both fronts
held-slotsbtn-label = сбережение · { $n } из { $total }

# achievements page, nothing earned
held-record-none = ты еще ничего не сделал.

# cloud section under recovery code
cloud-writedown = напишите это: это возвращает ваши ярды на новом устройстве

# cloud section reply, 503
cloud-why-resting = облако отдыхает; попробуйте еще позже

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = слишком много попыток отсюда сегодня; попробуйте завтра

# cloud section button, first press
cloud-btn-newcode-armed = вывесить другие устройства?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = сохранено { $since }

# settings dark switch
set-dark-on = темнота: на

# settings motion switch
set-motion-less = движение: меньше

# settings note where fullscreen unavailable
set-fullscreen-note = для всего экрана, добавьте эту страницу на домашний экран

# controls page action column
ctl-rightleft-do = забрать работников

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = камень. дыра. несколько человек между ними.

# landing page main button
title-play = играть

# story line, first step
obj-rock = вырыть валун, чтобы спасти свою жену!

# story line, wooden roof barrier
obj-props = может быть, строительство деревянной крыши остановит следующий валун?

# story line, arch barrier
obj-arch = давайте попробуем построить арку из добытой руды и камня.

# story line, wizards' barrier
obj-dome = если не вариантов, давайте посмотрим, могут ли волшебники помочь.

# story line, deep half
obj-portal = замыкаете портал в пропасть, что там?

# story line, final step
obj-free = освободит своего мужа от живота змеи

# objective card cancel while building
obj-barrier-cancel = отменить × { $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = взятие <span data-l10n-name="key"></span>, чтобы пропустить

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } × { $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

# the house's board and the crew window, with no crew yet
crew-empty = здесь еще никто не живет

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }h { $m }m

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }-й

# achievement name
ach-gotout-name = вы спасли свою жену

# toast and achievements card name
ach-firstgrain-name = зарабатывать деньги

# achievement name
ach-firsthire-name = вы построили дополнительные пилоны

# achievement name
ach-firsthat-name = ты волшебник квадратный

# achievement name
ach-firstbrew-name = привет, продавец зелий

# achievement name
ach-dizzy-name = встряхнутый детский синдром

# achievement name
ach-muckrain-name = никогда не идет дождь, но он льет

# achievement name
ach-tablebeaten-name = мы так вернулись.

# achievement name
ach-tableruin-name = время для того, чтобы получить кредит

# achievement name
ach-bird-name = сойди с моей земли

# achievement note
ach-catchall-note = бросить полную руку пыли, в самую большую, и поймать каждое зерно

# achievement name
ach-rifttorn-name = разлом разорван, хранение решено

# achievement note
ach-rifttorn-note = заполнить яму, вызывая межпространственный разлом

# achievement note
ach-drowned-note = целый океан межпространственных хранилищ.

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = очистить { $n } валунов, это много камней

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } квадратных

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = диггеры

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = глубокие строители

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/с

# a row's unit after its number: swings a second
unit-hits-s = хитов/с

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower = { $more ->
         [yes] { $left ->
             [one] купить еще { $left } производителя, чтобы разблокировать
             [few] купить еще { $left } производителя, чтобы разблокировать
             [many] купить еще { $left } производителей, чтобы разблокировать
            *[other] купить еще { $left } производителей, чтобы разблокировать
        }
        *[no] { $left ->
             [one] купить { $left } производителя, чтобы разблокировать
             [few] купить { $left } производителя, чтобы разблокировать
             [many] купить { $left } производителей, чтобы разблокировать
            *[other] купить { $left } производителей, чтобы разблокировать
        }
    }

# the bench: your carry ladder
row-carry = перенести сумму

# the bench: holding a handful throws it by itself
row-autotoss = удержать, чтобы подкинуть

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = заварите временные повышения для ваших работников

# the bench: what the casino is for, under its name
row-unlockcasino-note = стол, который берет ставку и платит дважды или ничего

# the bench: what the closet is for, under its name
row-unlockouthouse-note = вы видели достаточно какашек, давайте очистить его

# the bench: what the air filter is for, under its name
row-unlockfilter-note = продает воздушные шары, которые вытаскивают дымку обратно с неба, и читает небо

# the tower: the last barrier's line
row-dome-note = все земли потерпело неудачу. то, что осталось, не от земли

# the bench: the net's line
row-net-note = это не сработало, попробуйте поймать камень сеткой?

# what the breaker hat does
kit-breaker-does = в два раза больше укусов

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, в { $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = барабан ударяет { $n }x сильнее

# the strip at a card's foot: buy another copy behind the one being built
card-another = + еще один

# a finished ladder, where its price would go
card-done = сделано

# the tower: an enchantment's name
spell-gmo = генетически модифицированные культуры

# the tower: the enchantment's line
spell-thrift-note = каждый дом отныне на 75% дешевле

# the tower: the enchantment's line
spell-drive-note = каждая машина во дворе работает на 50% быстрее

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = каждый болт сбивает { $next } клеток со звезды вместо { $now }

# the tower: a wizard's line
row-wizard-note = летит вверх и болтает звезду на части для искр, и вызывает новую, когда небо пусто

# the janitor's closet: the roomba's line
row-roomba-note = едет в беспорядок на открытом дворе и приносит его домой; один уборщик помнит их, и они курят

# the air filter: the recycler's line
row-recycler-note = что ловят воздушные шары, спускается как галька вместо грязи

# a brew's name: the speed one, priced in crops
tonic-stew = сырое рагу

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs } s

# the apothecary's keep-brewing setting: on
row-potkeep-on = партия после пакета

# the bench: the forklift's line
row-driver-note = вилочный погрузчик, который едет сам: он вывозит в яму без кого-то на борту, и курит

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = нуждается в карьере

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party = { $nth ->
         [0] в { $who }
         [1] второй { $who }
         [2] третьи { $who }
         [3] Четвертый { $who }
        *[other] Неопределенный { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot = { $nth ->
         [0] станция
         [1] вторая станция
         [2] третья станция
         [3] четвертая станция
        *[other] неопределённая станция
    }

# the apothecary's board with nothing on it
station-apothecary-empty = горшок стоит холодно

# the janitor's closet's board with nothing on it
station-outhouse-empty = метлы все на крючках

# the crusher's pile-full mark, on a hover
station-crusher-full = пол полон чешуи

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = в твоей руке

# a body's card, doing: what its step is (idle)
crew-now-idle = ничего много

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = Умение { $name }

# a body's card, age: under a minute
crew-card-new = новый сегодня

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $n } в { $over }

# the books: the sky full in, while the filter is winning
books-due-never = не в таком темп

# the books: a line
books-tally-under = свиная под скалой для

# the books: a line
books-tally-saved = свягода, сохраненная в

# the hover over the counter above the pit
hover-counter = галька в яме: сколько стоит все

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } сделано

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = кто из ближайших

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = Дайте свою партию { $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = принимает { $lo }-{ $hi } больше урона

# a status's hover line when $n of it are on
status-line-n = { $name } х{ $n }: { $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = Стать { $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = сброс – возвращает все

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = Боевидный художник

# a fighter's tile: dazed, its hover
serp-dazed = Ошеломлен: сброшенный, видя звезды

# a Recruit's board: the heading over its first choice
rail-recruit-ask = Выберите своего бойца
