### Pebble Pit pilot, version A: drafted by Claude (Opus 5.5) after locales/STYLE.md, ja.
### A draft for a native reviewer, not a finished translation.


# rescue sheet heading, end of first half
saved-word = 終わった？

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = <span data-l10n-name="time"></span>で四角妻を救い出した！

# rescue sheet dismiss button
saved-keepplaying = めでたしめでたし

# demo end sheet line
demoend-why = 四角妻はまだ救えない。

# second-half end sheet line
freed-why = 大蛇の腹から四角夫を救い出した。

# second-half end sheet line
freed-end = これで終わり。大蛇狩りも地上の畑仕事も、好きなだけ続けていい！

# saves page paste box cancel
held-nevermind = やめとく

# pause sheet footer hint
held-keys = esc 一時停止 · ← → 見回す · スペース長押しでシーンをスキップ

# window close button label
modal-close =
    .aria-label = 閉じる

# pause sheet reply, store fallback
said-fellback = 最新のセーブが読めなかった。これはその一つ前

# pause sheet reply, yard open elsewhere
said-yielded = この作業場は別のタブで開いている。セーブはそっちで

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = セーブしていない：このサイトの保存領域がいっぱい（{ $used } mb 使用中、うち { $ours } kb がこちら）。セーブのコピーはまだ使える

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = 読み込めない：{ $message }

# save row age
slots-since-min = { $m }分前

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d }日前

# save row item
slots-row-crew = 作業員 { $n }人

# saves button label on both fronts
held-slotsbtn-label = セーブ · { $n }/{ $total }

# achievements page, nothing earned
held-record-none = まだ何もしていない。

# cloud section under recovery code
cloud-writedown = 書き留めておくこと：新しい端末で作業場を取り戻せる

# cloud section reply, 503
cloud-why-resting = クラウドは休憩中。あとでもう一度

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = 今日はここからの試行が多すぎる。また明日

# cloud section button, first press
cloud-btn-newcode-armed = 他の端末をサインアウトする？

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = 保存済み { $since }

# settings dark switch
set-dark-on = ダーク：オン

# settings motion switch
set-motion-less = 動き：少なめ

# settings note where fullscreen unavailable
set-fullscreen-note = 全画面にするには、このページをホーム画面に追加

# controls page action column
ctl-rightleft-do = 作業員を持ち上げる

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = 岩ひとつ。穴ひとつ。そのあいだに、数人。

# landing page main button
title-play = はじめる

# story line, first step
obj-rock = 岩を掘って四角妻を救え！

# story line, wooden roof barrier
obj-props = 木の屋根を建てれば、次の岩は止まるかも？

# story line, arch barrier
obj-arch = 掘った鉱石と石でアーチを組もう。さすがにこれなら持つはず。

# story line, wizards' barrier
obj-dome = 打つ手なし。魔法使いに頼ってみよう。

# story line, deep half
obj-portal = 奈落への門を呼び出せ。下には何がある？

# story line, final step
obj-free = 大蛇の腹から四角夫を救い出せ

# objective card cancel while building
obj-barrier-cancel = 中止 ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = <span data-l10n-name="key"></span>長押しでスキップ

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = はなせ

# the house's board and the crew window, with no crew yet
crew-empty = まだ誰も住んでいない

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }時間{ $m }分

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }番目

# achievement name
ach-gotout-name = 四角妻を救い出した

# toast and achievements card name
ach-firstgrain-name = 金もうけ

# achievement name
ach-firsthire-name = パイロンを追加建設した

# achievement name
ach-firsthat-name = しかく、君は魔法使いだ

# achievement name
ach-firstbrew-name = やあ、薬売り

# achievement name
ach-dizzy-name = 揺さぶられっ子症候群

# achievement name
ach-muckrain-name = 泣きっ面に蜂

# achievement name
ach-tablebeaten-name = 完全復活

# achievement name
ach-tableruin-name = 借金の時間だ

# achievement name
ach-bird-name = うちの土地から出ていけ

# achievement note
ach-catchall-note = 最大の一握りの土ぼこりを投げて、一粒残らず受け止める

# achievement name
ach-rifttorn-name = 裂け目が開いた、収納問題は解決

# achievement note
ach-rifttorn-note = 穴を満たして、次元の裂け目を開く

# achievement note
ach-drowned-note = 次元をまたぐ収納の、まるごと一つの海。

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = 岩を{ $n }個片付ける。岩だらけだ

# achievement name: crew hired; $n is the count
ach-crew-name = 四角 { $n }人

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = 石割り

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = 深みの建築家

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/秒

# a row's unit after its number: swings a second
unit-hits-s = 打/秒

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower =
    { $more ->
        [yes] あと{ $left }人の栽培師を買うと解放
       *[no] 栽培師を{ $left }人買うと解放
    }

# the bench: your carry ladder
row-carry = 運べる量

# the bench: holding a handful throws it by itself
row-autotoss = 長押しで投げる

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = 四角作業員のための一時強化を醸す

# the bench: what the casino is for, under its name
row-unlockcasino-note = 賭け金を受けて、倍か無しかで払うテーブル

# the bench: what the closet is for, under its name
row-unlockouthouse-note = うんちはもう見飽きた、片付けよう

# the bench: what the air filter is for, under its name
row-unlockfilter-note = 空からかすみを吸い戻す気球を売り、空の具合も読む

# the tower: the last barrier's line
row-dome-note = 地のものはすべて敗れた。残るのは地のものではない

# the bench: the net's line
row-net-note = だめだった。網で岩を受け止めてみる？

# what the breaker hat does
kit-breaker-does = 噛みつき二倍

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }：{ $does }、{ $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = 破城槌の一撃が{ $n }倍に

# the strip at a card's foot: buy another copy behind the one being built
card-another = ＋もう一つ

# a finished ladder, where its price would go
card-done = 完了

# the tower: an enchantment's name
spell-gmo = 作物の遺伝子組み換え

# the tower: the enchantment's line
spell-thrift-note = 以後、家はすべて75%安くなる

# the tower: the enchantment's line
spell-drive-note = 作業場の機械すべてが50%速く動く

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = 一発の稲妻で星から{ $now }マスではなく{ $next }マス削る

# the tower: a wizard's line
row-wizard-note = 飛び上がって星を稲妻で砕いて火花にし、空が空になれば新しい星を呼ぶ

# the janitor's closet: the roomba's line
row-roomba-note = 作業場の散らかりまで走って持ち帰る。掃除係が一人見張り、煙を出す

# the air filter: the recycler's line
row-recycler-note = 気球が捕まえたものが、泥ではなく小石になって落ちる

# a brew's name: the speed one, priced in crops
tonic-stew = 具だくさんシチュー

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }、{ $secs }秒

# the apothecary's keep-brewing setting: on
row-potkeep-on = 次から次へ

# the bench: the forklift's line
row-driver-note = 自分で走るフォークリフト：誰も乗せずに穴まで運び、煙を出す

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = 採石場が必要

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party =
    { $nth ->
        [0] { $who }
        [1] 二人目の{ $who }
        [2] 三人目の{ $who }
        [3] 四人目の{ $who }
       *[other] undefined人目の{ $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] ステーション
        [1] 二つ目のステーション
        [2] 三つ目のステーション
        [3] 四つ目のステーション
       *[other] undefined個目のステーション
    }

# the apothecary's board with nothing on it
station-apothecary-empty = 鍋は冷えたまま

# the janitor's closet's board with nothing on it
station-outhouse-empty = ほうきは全部フックに掛かっている

# the crusher's pile-full mark, on a hover
station-crusher-full = 床が鱗でいっぱい

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = 手の中

# a body's card, doing: what its step is (idle)
crew-now-idle = 特になにも

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = { $name }の番

# a body's card, age: under a minute
crew-card-new = 今日来た

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $over }で{ $n }

# the books: the sky full in, while the filter is winning
books-due-never = この調子では来ない

# the books: a line
books-tally-under = 四角妻が岩の下にいた時間

# the books: a line
books-tally-saved = 四角妻救出まで

# the hover over the counter above the pit
hover-counter = 穴の小石：すべての支払いはこれで

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }、{ $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } 完了

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = いちばん近い人に

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = 仲間に{ $inspired }を与える

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = 受けるダメージ{ $lo }～{ $hi }増

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }：{ $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = { $name }になる

# a station's board: stand the Recruit again, every rung handed back
rail-reset = リセット – 全額返却

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = 武闘家

# a fighter's tile: dazed, its hover
serp-dazed = めまい：振り落とされ、目に星が飛ぶ

# a Recruit's board: the heading over its first choice
rail-recruit-ask = 戦士を選べ
