### Pebble Pit, in Japanese (ja): every message in locales/en.ftl, same ids, same order.
### Drafted by Claude (Opus 5.5) on 2026-10-13 to locales/STYLE.md; not yet reviewed by a native speaker.
### The comment over each message is the English file's, saying where it shows.
### Messages still [owner's words: ...] in English are left out, so the English shows.

## Sheets

# rescue sheet heading, end of first half
saved-word = 終わった？

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = <span data-l10n-name="time"></span>で妻を救い出した！

# rescue sheet dismiss button
saved-keepplaying = めでたしめでたし

# demo end sheet heading
demoend-word = 体験版はここまで！

# demo end sheet line
demoend-why = 妻はまだ救えない。

# demo end store link (if STORE_URL)
demoend-store = ウィッシュリストへ！

# demo end dismiss button
demoend-keep = 続ける

# free-build teaser end sheet heading
teaseend-word = 続きは製品版で！

# teaser end store link (if STORE_URL)
teaseend-store = 製品版を手に入れる

# teaser end dismiss button
teaseend-keep = 続ける

# second-half end sheet heading
freed-word = よし、今度こそ終わり

# second-half end sheet line
freed-why = 大蛇の腹から夫を救い出した。

# second-half end sheet line
freed-end = これで終わり。大蛇狩りも地上の畑仕事も、好きなだけ続けていい！

# second-half end sheet line
freed-thanks = ありがとう！

# second-half end dismiss button
freed-keep = 続ける

# crash sheet heading
crashed-word = 止まった

# crash sheet button
crashed-copysave = セーブをコピー

# pause sheet heading
held-word = 一時停止

# pause sheet button
held-resume = 再開

# pause sheet button (relabelled from JS)
held-slotsbtn = セーブ

# saves page heading
held-slots-word = セーブ

# saves page button
held-savecopy = セーブをコピー

# saves page button
held-loadsave = セーブをロード

# saves page paste box confirm
held-loadit = ロード

# saves page paste box cancel
held-nevermind = やめとく

# saves page back button
held-slotsback = 戻る

# pause sheet button (relabelled from JS)
held-recordbtn = 実績

# achievements page heading
held-record-word = 実績

# achievements page back
held-recordback = 戻る

# pause sheet button (also src/indexpage.js:24)
held-indexbtn = 図鑑

# index page heading
held-index-word = 図鑑

# index page back
held-indexback = 戻る

# pause sheet button to landing page
held-titlebtn = タイトルへ

# pause sheet button, desktop build only
held-quit = デスクトップに戻る

# pause sheet footer hint
held-keys = esc 一時停止 · ← → 見回す · スペース長押しでシーンをスキップ

# window close button label
modal-close =
    .aria-label = 閉じる

# pause sheet reply, desktop export ok
said-saved = 保存

# pause sheet reply, desktop export failed
said-notsaved = 保存失敗

# pause sheet reply, store fallback
said-fellback = 最新のセーブが読めなかった。これはその一つ前

# pause sheet reply, unreadable save
said-broken = 最新のセーブが読めない。「セーブをコピー」で取り出せる

# pause sheet reply, yard open elsewhere
said-yielded = この作業場は別のタブで開いている。セーブはそっちで

# pause sheet reply, storage blocked
said-unsaved-blocked = セーブしていない：ブラウザがこのページの保存を止めている。セーブのコピーはまだ使える

# sheet reply after loading a save
said-loaded = ロードした

# sheet reply, pasted text invalid
said-notasave = それはセーブじゃない

# crash sheet line when error has no message
crashed-why-fallback = 何かがエラーを出した

# save row age
slots-since-now = たった今

# save row age
slots-since-min = { $m }分前

# save row age
slots-since-h = { $h }時間前

# save row item
slots-row-rock = 岩 { $n }

# save row item
slots-row-crew = 作業員 { $n }人

# save row item for open slot in play
slots-row-playing = プレイ中

# save row, no yard
slots-row-empty = 空き

# save row, broken blob
slots-row-unreadable = 読めない

# saves button label on both fronts
held-slotsbtn-label = セーブ · { $n }/{ $total }

# empty save row after first press
slots-arm = 新しい作業場を始める？

# sheet reply after opening empty slot
slots-said-new = 新しい作業場

# sheet reply after opening a slot
slots-said-loaded = ロードした

# save row delete cross label
slots-del-aria = 削除

# achievements button label with count
held-recordbtn-label = 実績 · { $count }/{ $total }

# achievements page, nothing earned
held-record-none = まだ何もしていない。

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d }日前

# saves row delete confirm
slots-confirm-yes = 削除

# saves row delete cancel
slots-confirm-no = 戻る

# sheet reply, copy with no save
said-copyout-none = まだセーブがない

# sheet reply when clipboard unavailable
said-copyout-window = window.__save に入れた

# saves page cloud section heading
cloud-head = クラウドセーブ

# cloud section button
cloud-btn-linkcode = リンクコードを入力

# cloud section button
cloud-btn-recovery = 復旧コードを使う

# cloud section button
cloud-btn-stop = クラウドセーブをやめる

# cloud section reply after stop
cloud-said-off = この端末ではクラウドはオフ

# cloud section button
cloud-btn-enable = クラウド同期をオンにする

# cloud section reply on failure (also cloud.js:768)
cloud-why-noanswer = クラウドから返事がない

# cloud section, copy recovery code
cloud-btn-copy = コピー

# cloud section under recovery code
cloud-writedown = 書き留めておくこと：新しい端末で作業場を取り戻せる

# cloud section, another device ahead
cloud-btn-take = そっちにする

# cloud section, another device ahead
cloud-btn-keep = こっちを残す

# cloud section reply (also :316)
cloud-said-kept = 残した

# cloud section above pairing code
cloud-pair-enter = もう一方の端末で入力：

# cloud section, hide pairing code
cloud-btn-done = 完了

# cloud section button
cloud-btn-link = 端末をリンク

# cloud section toggle
cloud-btn-hidecode = 復旧コードを隠す

# cloud section toggle
cloud-btn-showcode = 復旧コードを表示

# cloud section button
cloud-btn-newcode = 新しい復旧コード

# cloud section button, first press
cloud-btn-newcode-armed = 他の端末をサインアウトする？

# link code box placeholder
cloud-box-linkph = ···-···

# recovery code box placeholder
cloud-box-recph = ····-····-····

# link code box label
cloud-box-aria-link = リンクコード

# recovery code box label
cloud-box-aria-rec = 復旧コード

# cloud section reply, bad code
cloud-wrong = そのコードは通らなかった

# cloud section reply after linking
cloud-said-linked = リンクした

# cloud code entry confirm
cloud-btn-dolink = リンク

# cloud code entry cancel
cloud-btn-nevermind = やめとく

# cloud code entry prompt
cloud-typing-link = もう一方の端末のコード

# cloud code entry prompt
cloud-typing-rec = 自分の復旧コード

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = 今日はここからの試行が多すぎる。また明日

# cloud section reply, 503
cloud-why-resting = クラウドは休憩中。あとでもう一度

# cloud section reply, 403
cloud-why-forbidden = クラウドはこのページを知らない

# the cloud's line in the landing page's foot bar: $state is one of the cloud-state lines below
# (with no state, it stands before the choose-a-yard button)
cloud-line = クラウド · { $state }

# cloud state: not turned on (in cloud-line, and alone in the saves page section)
cloud-state-off = オフ

# cloud state
cloud-state-out = サインアウト中

# cloud state
cloud-state-refused = セーブが拒否された

# cloud state
cloud-state-offline = 未保存：オフライン

# cloud state
cloud-state-behind = 別の端末のほうが新しい

# cloud state
cloud-state-newer = 更新すると新しいセーブを取れる

# cloud state
cloud-state-big = クラウドには大きすぎる

# cloud state
cloud-state-full = クラウドがいっぱい

# cloud state
cloud-state-paused = 停止中

# cloud state
cloud-state-conflict = 作業場を選ぶ

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = 保存済み { $since }

# cloud state: on, nothing pushed yet
cloud-state-on = オン

# link a device: the pairing code's countdown; $time is m:ss
cloud-pair-left = 残り { $time }

# choose a yard: this device's copy of slot $n; $here is the yard as a saves row says it
cloud-clash-here = この端末 · { $n } · { $here }

# choose a yard: the cloud's copy of slot $n; $cloud is the yard as a saves row says it
cloud-clash-cloud = クラウド · { $n } · { $cloud }

# a cloud button's answer: too many tries; $m is minutes to wait
cloud-why-wait = 試行が多すぎる。{ $m }分後にもう一度

# window title opened off the books
modal-books = 帳簿

# window title, crew list
modal-crew = ここに住む人たち

## Settings

# pause sheet button
held-settingsbtn = 設定

# settings page heading
held-settings-word = 設定

# settings note where fullscreen unavailable
set-fullscreen-note = 全画面にするには、このページをホーム画面に追加

# settings volume slider label
set-volume =
    .aria-label = 音量

# settings tab strip: the touch switch and the controls table
set-tab-controls = 操作

# controls page back
set-controlsback = 戻る

# settings page back
set-settingsback = 戻る

# settings motion switch
set-motion-less = 動き：少なめ

# settings motion switch
set-motion-full = 動き：フル

# settings touch switch (play only)
set-touch-on = タッチ：オン

# settings touch switch (play only)
set-touch-off = タッチ：オフ

# settings dark switch
set-dark-on = ダーク：オン

# settings dark switch
set-dark-off = ダーク：オフ

# settings sound switch
set-sound-off = 音：オフ

# settings sound switch
set-sound-on = 音：オン

# pause sheet line: a save from a newer build; $build is the build's name
said-newer = このセーブは新しいビルドのもの（{ $build }）

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = セーブしていない：このサイトの保存領域がいっぱい（{ $used } mb 使用中、うち { $ours } kb がこちら）。セーブのコピーはまだ使える

# pause sheet line: storage refused a save; $name is the browser's error name
said-unsaved-refused = セーブしていない：保存領域がセーブを拒んだ（{ $name }）。セーブのコピーはまだ使える

# pause sheet line: storage refused a save, with no error to name
said-unsaved-refused-why = セーブしていない：保存領域がセーブを拒んだ。セーブのコピーはまだ使える

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = 読み込めない：{ $message }

# controls page input column
ctl-leftclick-in = 左クリック

# controls page action column
ctl-leftclick-do = さわる

# controls page input column
ctl-rightclick-in = 右クリック

# controls page action column
ctl-rightclick-do = 作業員にフォーカス

# controls page input column
ctl-rightleft-in = 右クリック＋左クリック

# controls page action column
ctl-rightleft-do = 作業員を持ち上げる

# controls page input column
ctl-middle-in = 中クリック

# controls page action column
ctl-middle-do = カメラ移動

# controls page input column
ctl-wheel-in = ホイール

# controls page action column
ctl-wheel-do = カメラ移動

# controls page input column
ctl-arrows-in = ← → / a d

# controls page action column
ctl-arrows-do = カメラ移動

# controls page input column
ctl-digits-in = 1 – 9

# controls page action column
ctl-digits-do = 場所へジャンプ

# settings fullscreen row
set-fullscreen-on = 全画面：オン

# settings fullscreen row
set-fullscreen-off = 全画面：オフ

# a sheet line: the save is on the clipboard; $n is its size in kilobytes
said-copyout-copied = { $n }kb コピーした

## Title page

# browser tab title, landing
title-doctitle = Pebble Pit

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = 岩ひとつ。穴ひとつ。そのあいだに、数人。

# landing page main button
title-play = プレイ

# landing page button (relabelled saves · n of 3)
title-slotsbtn = セーブ

# landing page button (relabelled, src/record.js:33)
title-recordbtn = 実績

# landing page button
title-settingsbtn = 設定

# landing page, desktop build only
title-quit = デスクトップに戻る

# landing saves page heading
title-slots-word = セーブ

# landing saves page button
title-savecopy = セーブをコピー

# landing saves page button
title-loadsave = セーブをロード

# landing paste confirm
title-loadit = ロード

# landing paste cancel
title-nevermind = やめとく

# landing saves page back
title-slotsback = 戻る

# landing achievements page heading
title-record-word = 実績

# landing achievements page back
title-recordback = 戻る

# landing settings page heading
title-settings-word = 設定

# landing settings back
title-settingsback = 戻る

# landing controls back
title-controlsback = 戻る

# landing cloud conflict page heading
title-conflict-word = 作業場を選ぶ

# landing cloud conflict back
title-conflictback = 戻る

# landing foot link
title-link-itch = itch

# landing foot link
title-link-github = github

# under play, empty open slot
title-playlabel-new = 新しい作業場

# landing achievements page, nothing earned
title-record-none = まだなにも

# title foot bar conflict link
cloud-foot-choose = 作業場を選ぶ

# landing reply, bad paste
title-said-notasave = それはセーブじゃない

# landing reply after load
title-said-loaded = ロードした

# landing reply after deleting open slot
title-said-erased = 消した

## Objectives

# label before story line
obj-next = 次

# story line, first step
obj-rock = 岩を掘って妻を救え！

# intro quest item
obj-rock-q-chip = 岩を掘る

# intro quest item
obj-rock-q-pickup = 小石をつかむ

# intro quest item
obj-rock-q-toss = 小石を穴に投げ込む

# story line after first fall
obj-falling = もう一度岩を掘ってみよう！

# story line, wooden roof barrier
obj-props = 木の屋根を建てれば、次の岩は止まるかも？

# story line, net barrier
obj-net = だめか。岩を受け止めて、勢いを殺してみよう

# story line, arch barrier
obj-arch = 掘った鉱石と石でアーチを組もう。さすがにこれなら持つはず。

# story line, wizards' barrier
obj-dome = 打つ手なし。魔法使いに頼ってみよう。

# story line before rescue
obj-rescue = 妻を救え

# story line, second half
obj-drown = 穴を水に沈めろ

# story line after snatch
obj-tower = 魔法使いの塔を建てろ

# story line after snatch
obj-talk = 今起きたことを魔法使いと話そう

# story line, deep half
obj-portal = 奈落へのポータルを呼び出せ。下には何がある？

# story line, final step
obj-free = 大蛇の腹から夫を救い出せ

# objective card cancel while building
obj-barrier-cancel = 中止 ×{ $n }

## Other

# browser tab title, game page
play-doctitle = Pebble Pit

# skip hint during cutscene, desktop (skiphint.js:27)
other-skip-desk = スペース長押しでスキップ

# top-edge mess tag
other-messtag-muck = 泥

# top-edge mess tag
other-messtag-poop = うんち

# floating button over bench site
other-raise = 作業台を建てる

# phone pause button label
other-pause =
    .aria-label = 一時停止

title-recordbtn-label = 実績 · { $count }/{ $total }

# corner fullscreen button tooltip
other-fullscreen-title-on = 全画面を終了

# corner fullscreen button tooltip
other-fullscreen-title-off = 全画面

# crew-fade corner button label
other-corner-show = 作業員を表示

# crew-fade corner button label
other-corner-fade = 作業員を薄く

# crew-fade corner button label
other-corner-hide = 作業員を隠す

# way corner button tip
other-corner-up = 作業場へ上がる

# way corner button tip
other-corner-down = 深みへ下りる

# queue card line hover
other-queue-site-yard = 作業場

# queue card line hover
other-queue-site-sphere = 球体

# queue card, nobody working
other-queue-queued = 順番待ち

# board footer toggle
other-hidedone-show = 完了分を表示

# board footer toggle
other-hidedone-hide = 完了分を隠す

# the queue card: the first in line to be built after the one going up
queue-place-next = 次

# the house's board and the crew window, with no crew yet
crew-empty = まだ誰も住んでいない

# a station's name: its board's title, the pointer's label, the queue card
station-bench = 作業台

# skip hint during cutscene, phone
other-skip-touch = 長押しでスキップ

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = <span data-l10n-name="key"></span>長押しでスキップ

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee, idle (drawn in the sign's own pixel capitals)
casino-sign = CASINO

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

## Notices

# toast-shaped card, another device ahead
note-cloud-name = 別の端末のほうが新しい

# toast-shaped card, another device ahead
note-cloud-note = 答えはセーブ画面に

## Numbers

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }時間{ $m }分

# how long a yard has been played, under an hour
played-m = { $m }分

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }番目

## Achievements

# toast and achievements card name
ach-firstgrain-name = 金もうけ

# toast and achievements card note
ach-firstgrain-note = 小石を一つ穴に投げ込む

# achievement name
ach-firstrock-name = 掘り続けるしかない

# achievement note
ach-firstrock-note = 最初の岩を片付ける

# achievement name
ach-gotout-name = 妻を救い出した

# achievement note
ach-gotout-note = もう岩はない。やり遂げた。

# achievement name
ach-firsthire-name = パイロンを追加建設した

# achievement note
ach-firsthire-note = 家をもう一軒建てる

# achievement name
ach-firstshard-name = 最初の鉱石

# achievement note
ach-firstshard-note = 採石場から鉱石を運び出す

# achievement name
ach-firstspore-name = 栽培

# achievement note
ach-firstspore-note = 最初の作物を育てる

# achievement name
ach-firstspark-name = 魔法の気配

# achievement note
ach-firstspark-note = 最初の火花を手に入れる

# achievement name
ach-holefull-name = 穴がいっぱい

# achievement note
ach-holefull-note = 穴を縁まで満たす

# achievement name
ach-rifttorn-name = 裂け目が開いた、収納問題は解決

# achievement note
ach-rifttorn-note = 穴を満たして、次元の裂け目を開く

# achievement name
ach-drowned-name = 裂け目が広がった

# achievement note
ach-drowned-note = 次元をまたぐ収納の、まるごと一つの海。

# achievement name
ach-star-name = 星を呼び出す

# achievement note
ach-star-note = 塔から星を呼び下ろす

# achievement name
ach-firsthat-name = しかく、君は魔法使いだ

# achievement note
ach-firsthat-note = 塔で魔法使いの帽子を一つ仕上げる

# achievement name
ach-firstbrew-name = やあ、薬売り

# achievement note
ach-firstbrew-note = 薬屋で一鍋醸す

# achievement name
ach-firsttrade-name = 最初の帽子

# achievement note
ach-firsttrade-note = ステーションに最初の帽子を買う

# achievement name
ach-alltrades-name = 大衆の教育

# achievement note
ach-alltrades-note = すべてのステーションに帽子をそろえる

# achievement name
ach-allbuilt-name = 建設完了

# achievement note
ach-allbuilt-note = 全部建てた

# achievement name
ach-rift1e6-name = 裂け目に100万

# achievement note
ach-rift1e6-note = 小石を100万個、裂け目に送る

# achievement name
ach-brew100-name = 100鍋

# achievement note
ach-brew100-note = 100鍋醸す

# achievement name
ach-lived1h-name = 一つの時計で一時間

# achievement note
ach-lived1h-note = 一人を一時間、雇い続ける

# achievement name
ach-nobodyhired-name = 誰も雇わず

# achievement note
ach-nobodyhired-note = 誰も雇わずに岩を一つ片付ける

# achievement name
ach-ownhand-name = 自分の手だけで

# achievement note
ach-ownhand-note = 作業員が一度も触れずに岩を片付ける

# achievement name
ach-nevertouched-name = 一度も触れず

# achievement note
ach-nevertouched-note = 自分では一度も叩かずに岩を片付ける

# achievement name
ach-underminute-name = 一分で岩ひとつ

# achievement note
ach-underminute-note = 一分以内に岩を片付ける

# achievement name
ach-everyjob-name = 全職そろい踏み

# achievement note
ach-everyjob-note = すべての仕事に同時に一人以上つける

# achievement name
ach-tablebeaten-name = 完全復活

# achievement note
ach-tablebeaten-note = カジノの一勝負で5万勝つ

# achievement name
ach-tableruin-name = 借金の時間だ

# achievement note
ach-tableruin-note = カジノの一勝負で5万負ける

# achievement name
ach-bird-name = うちの土地から出ていけ

# achievement note
ach-bird-note = 鳥を驚かせる

# achievement name
ach-wholelot-name = 一羽残らず

# achievement note
ach-wholelot-note = 一区画の鳥を全部驚かせる

# achievement name
ach-catchall-name = ジャグラー

# achievement note
ach-catchall-note = 最大の一握りの土ぼこりを投げて、一粒残らず受け止める

# achievement name
ach-lifted-name = こっちに来い

# achievement note
ach-lifted-note = 作業員を持ち上げる

# achievement name
ach-shookload-name = ポケットを裏返せ

# achievement note
ach-shookload-note = 作業員を振って荷物を全部落とす

# achievement name
ach-hatoff-name = 脱帽

# achievement note
ach-hatoff-note = 作業員を振って帽子を落とす

# achievement name
ach-dizzy-name = 揺さぶられっ子症候群

# achievement note
ach-dizzy-note = 作業員を振って目を回させる

# achievement name
ach-muckrain-name = 泣きっ面に蜂

# achievement note
ach-muckrain-note = 泥の雨をやり過ごす

# achievement name: rocks cleared; $n is the count as written (10, 25, 50, 100)
ach-rocks-name = 岩{ $n }個

# achievement note: rocks cleared; $n is the count
ach-rocks-note = 岩を{ $n }個片付ける

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = 岩を{ $n }個片付ける。岩だらけだ

# achievement name: pebbles banked; $n is the count, short (10k, 1m)
ach-pebbles-name = 小石 { $n }

# achievement note: pebbles banked; $n is the count, short
ach-pebbles-note = 小石を{ $n }ためる

# achievement name: crew hired; $n is the count
ach-crew-name = 四角 { $n }人

# achievement note: crew hired; $n is the count
ach-crew-note = 作業員を{ $n }人雇う

# achievement name: the first ore ladder rung
ach-ore0-name = 切り出した鉱石1000

# achievement name: the second ore ladder rung
ach-ore1-name = 鉱石1万

# achievement note: ore dug; $n is the count, short (1k, 10k)
ach-ore-note = 採石場から鉱石を{ $n }掘り出す

## Index

# index entry name
idx-dust-name = 小石

# index entry text
idx-dust-text = 岩から掘り出したもの。

# index entry name
idx-shard-name = 鉱石

# index entry text
idx-shard-text = 採石場から掘り出したもの。

# index entry name
idx-spore-name = 作物

# index entry text
idx-spore-text = 畑で育つ。

# index entry name
idx-spark-name = 火花

# index entry text
idx-spark-text = 魔法使いが星から稲妻で打ち出したもの。

# index entry name
idx-scale-name = 鱗

# index entry text
idx-scale-text = 大蛇が落とすものを砕いて取り出す。

# index entry name
idx-crit-name = 会心

# index entry text
idx-crit-text = ときどき、より大きなダメージを与える。

# index entry name
idx-rock-name = 岩

# index entry text
idx-rock-text = 妻を押しつぶした。貴重な小石が掘れる。

# index entry name
idx-pit-name = 穴

# index entry text
idx-pit-text = 小石でも何でも、ここに放り込んでしまっておく。

# index entry name
idx-rift-name = 裂け目

# index entry text
idx-rift-text = 小石が集まりすぎて、現実に裂け目ができた？

# index entry name
idx-abyss-name = 奈落

# index entry text
idx-abyss-text = 裂け目が小石を飲み込みすぎて安定を失い、穴をまるごと飲み込んだ。

# index entry name
idx-muck-name = 泥

# index entry text
idx-muck-text = 汚染が生態系を蝕み、雨がべとべとの山を残していく。

# index entry name
idx-poop-name = うんち

# index entry text
idx-poop-text = うえっ。

# index entry name
idx-bird-name = 鳥

# index entry text
idx-bird-text = ふつうの鳥。

# index entry name
idx-house-name = 家

# index entry text
idx-house-text = 作業員が住むところ。

# index entry name
idx-pollution-name = 汚染

# index entry text
idx-pollution-text = 産業の代償。採掘、農業、採石、魔法、どれも汚染を生んで空気を汚す。

# index entry name
idx-star-name = 星

# index entry text
idx-star-text = 魔法使いの魔法で生まれた本物の星。撃ち砕いて火花を取る。

# index entry name
idx-balloon-name = 気球

# index entry text
idx-balloon-text = 雲から汚染を取り除くエアフィルターを積んでいる。

# index entry name
idx-recycler-name = リサイクラー

# index entry text
idx-recycler-text = 大気汚染を固めて、使える小石にする。

# index entry name
idx-bench-name = 作業台

# index entry text
idx-bench-text = 要するに何でも屋。運搬の強化、手作業の強化、新しい建物。

# index entry name
idx-shack-name = 小屋

# index entry text
idx-shack-text = 採掘の強化を買う店。

# index entry name
idx-stats-name = 帳簿

# index entry text
idx-stats-text = ゲームのいろいろな記録。収入、プレイ時間。

# index entry name
idx-farm-name = 畑

# index entry text
idx-farm-text = 作物が育つ区画。

# index entry name
idx-quarry-name = 採石場

# index entry text
idx-quarry-text = 深く掘って鉱石を探す。

# index entry name
idx-apothecary-name = 薬屋

# index entry text
idx-apothecary-text = 薬が作られるところ。

# index entry name
idx-tower-name = 塔

# index entry text
idx-tower-text = 魔法使いの住まい。

# index entry name
idx-casino-name = カジノ

# index entry text
idx-casino-text = パチンコ風のカジノ。

# index entry name
idx-outhouse-name = 用務員室

# index entry text
idx-outhouse-text = 用務員の住まい。

# index entry name
idx-filter-name = エアフィルター

# index entry text
idx-filter-text = 空から汚染を吸い出す。

# index entry name
idx-ram-name = 破城槌

# index entry text
idx-ram-text = 岩をどんどん削り取る。

# index entry name
idx-jaw-name = ドリル

# index entry text
idx-jaw-text = すばやく掘るための機械ドリル。

# index entry name
idx-tiller-name = 耕運機

# index entry text
idx-tiller-text = トラクターなら作物もあっという間。

# index entry name
idx-belt-name = ベルト

# index entry text
idx-belt-text = 小石を自動で穴に流し込む。

# index entry name
idx-sphere-name = 球体

# index entry text
idx-sphere-text = 星の力を集めるダイソン球。

# index entry name
idx-roomba-name = ロボット掃除機

# index entry text
idx-roomba-text = 散らかりを片付ける自動掃除機。

# index entry name
idx-driver-name = フォークリフト

# index entry text
idx-driver-text = 資源の荷をとても速く運ぶ自動フォークリフト。

# index entry name
idx-props-name = 木の防壁

# index entry text
idx-props-text = 岩を食い止めようとする必死の試み。

# index entry name
idx-net-name = 網

# index entry text
idx-net-text = 作物で網を編み、岩を受け止めて勢いを殺す。

# index entry name
idx-arch-name = アーチ

# index entry text
idx-arch-text = 岩を食い止めるための、石と金属の頑丈なアーチ。

# index entry name
idx-dome-name = 結界

# index entry text
idx-dome-text = 魔法使いが呼び出したエネルギーの結界。

# index entry name
idx-deep-name = 奈落

# index entry text
idx-deep-text = 宇宙でも海でもない、その間の何か。

# index entry name
idx-portal-name = ポータル

# index entry text
idx-portal-text = 奈落を出入りする唯一の道。

# index entry name
idx-crusher-name = 粉砕機

# index entry text
idx-crusher-text = 深みの鱗をしまっておくところ。

# index entry name
idx-pods-name = ポッド

# index entry text
idx-pods-text = 奈落の作業員のためのポッド。

# index entry text
idx-haul-text = 小石を穴まで運ぶ。

# index entry name
idx-rockcrew-name = 石割り

# index entry text
idx-rockcrew-text = 岩を叩く。

# index entry name
idx-quarrycrew-name = 採石工

# index entry text
idx-quarrycrew-text = 採石場で鉱石を掘る。

# index entry name
idx-farmcrew-name = 農民

# index entry text
idx-farmcrew-text = 作物を育てる。

# index entry name
idx-purify-name = 空気清浄係

# index entry text
idx-purify-text = 空気清浄の気球を飛ばして、空をきれいにする。

# index entry name
idx-stir-name = 薬師

# index entry text
idx-stir-text = 薬の一鍋を受け持つ。

# index entry text
idx-janitor-text = うんちと泥を片付ける。

# index entry text
idx-wizard-text = 星のかけらを削り取れる、学のある魔法使い。

# index entry text
idx-build-text = 建物と機械を建てる。

# index entry name
idx-breaker-name = 破砕師

# index entry text
idx-breaker-text = 岩を掘るとき、ずっと強く効く。

# index entry name
idx-carter-name = 荷車師

# index entry text
idx-carter-text = 運び屋が荷車を引いて、運べる量を倍にする。

# index entry name
idx-blaster-name = 発破師

# index entry text
idx-blaster-text = 小さな爆薬を持ち、鉱石をがっつり掘り出す。

# index entry name
idx-grower-name = 栽培師

# index entry text
idx-grower-text = 作物の世話が二倍できる。

# index entry name
idx-brews-name = 薬

# index entry text
idx-brews-text = 薬屋の特製の薬。

# index entry text
idx-party-text = 大蛇を倒すため命をかける、勇敢な冒険者の一行。

# index entry name
idx-sqwife-name = 妻

# index entry text
idx-sqwife-text = ふつうに暮らしていた。あの事件（たち）までは。空から無限に落ちてくる岩の下敷き。やばい。

# index entry name
idx-notices-name = 実績

# index entry text
idx-notices-text = 作業場の節目。

# index entry name
idx-serpent-name = 大蛇

# index entry text
idx-serpent-text = 奈落に棲む、ヘビみたいな変な生き物。

## Jobs

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = 石割り

# a job, as the boards, the crew and the index say it (the save's key is haulers)
job-haulers = 運び屋

# a job, as the boards, the crew and the index say it (the save's key is quarriers)
job-quarriers = 採石工

# a job, as the boards, the crew and the index say it (the save's key is farmhands)
job-farmhands = 農民

# a job, as the boards, the crew and the index say it (the save's key is scholars)
job-scholars = 学者

# a job, as the boards, the crew and the index say it (the save's key is purifiers)
job-purifiers = 空気清浄係

# a job, as the boards, the crew and the index say it (the save's key is stirrers)
job-stirrers = 薬師

# a job, as the boards, the crew and the index say it (the save's key is janitors)
job-janitors = 用務員

# a job, as the boards, the crew and the index say it (the save's key is wizards)
job-wizards = 魔法使い

# a job, as the boards, the crew and the index say it (the save's key is builders)
job-builders = 大工

# a job, as the boards, the crew and the index say it (the save's key is fighters)
job-fighters = 戦士

# a job, as the boards, the crew and the index say it (the save's key is gatherers)
job-gatherers = 採集係

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = 深みの建築家

## Boards

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/秒

# a row's unit: so many a minute; $icon is the coin's mark (html)
unit-per-min = { $icon }/分

# a row's unit: so many a dig; $icon is the coin's mark (html)
unit-per-dig = { $icon }/掘り

# a row's unit: so many a harvest; $icon is the coin's mark (html)
unit-per-harvest = { $icon }/収穫

# a row's unit after its number: swings a second
unit-hits-s = 打/秒

# a row's unit after its number: swings a second, from one
unit-hit-s = 打/秒

# a row's unit after its number: throws a second
unit-throws-s = 投/秒

# a row's unit after its number: a wizard's bolts a minute
unit-bolts-min = 発/分

# a row's unit after its number: star cells a bolt knocks off
unit-cells-bolt = マス/発

# a row's unit after its number: haze a balloon takes in a second
unit-motes-s = 粒/秒

# a row's unit after its number: farm plots
unit-plots = 区画

# a row's unit after its number: the quarry's shovels
unit-shovels = 本

# a row's unit after its number: the apothecary's pots
unit-pots = 鍋

# a row's unit after its number: doses a batch
unit-doses = 回分

# a unit after a number: seconds
unit-s = 秒

# a deep row's unit after its number: damage
unit-dmg = ダメージ

# a deep row's unit after its number: damage a second
unit-dmg-s = ダメージ/秒

# a brew's unit after its percentage: how much faster
unit-faster = 速さ

# a brew's unit after its percentage: how much stronger
unit-stronger = 強さ

# a brew's unit after its number: crit chance
unit-crit = 会心

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower =
    { $more ->
        [yes] あと{ $left }人の栽培師を買うと解放
       *[no] 栽培師を{ $left }人買うと解放
    }

# a machine's row until its station's set of blaster hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-blaster =
    { $more ->
        [yes] あと{ $left }人の発破師を買うと解放
       *[no] 発破師を{ $left }人買うと解放
    }

# a price in time, a minute or more: $n minutes
price-min = { $n }分

# a row's verb, before its gain: how much a hand holds
does-hold = 持つ

# the bench: your carry ladder
row-carry = 運べる量

# a row's verb, before its gain: swings
does-hit = 打つ

# the bench: your swing pace ladder
row-speed = 自動打ち

# a row's verb, before its gain: throws
does-throw = 投げ

# the bench: how often a held hand lets go
row-toss = 投げる速さ

# a row's verb, before its gain: how far a throw carries
does-reach = 飛距離

# the bench: how far a handful carries
row-reach = 投げる距離

# a row's verb, before its gain: what a swing takes
does-per-swing = 一振り

# the bench: what a swing of yours takes
row-pick = つるはしの威力

# the bench: holding a handful throws it by itself
row-autotoss = 長押しで投げる

# the bench: holding the pointer on the boulder swings by itself
row-auto = 長押しで掘る

# a row's verb, before its gain: how much a body carries
does-carry = 運ぶ

# the bench: the haulers' load ladder
row-haulcarry = 運び屋の積載量

# a row's verb, before its gain: walking pace
does-walk = 歩き

# the bench: the haulers' pace ladder
row-haulpace = 運び屋の速さ

# a row's verb, before its gain: crits
does-crit = 会心

# the bench: the chance a hit is a crit
row-critchance = 会心率

# the bench: how much more a crit takes
row-critmult = 会心ダメージ

# the shack: the diggers' swing pace ladder
row-rockhandspeed = 振る速さ

# the shack: what a digger's swing takes
row-rockhandpick = 石割りのつるはし威力

# the bench: the row that puts up the apothecary
row-unlockapothecary = 薬屋を建てる

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = 四角作業員のための一時強化を醸す

# the bench: what the apothecary row gives, where a gain would go
row-unlockapothecary-blurb = 作業員の強壮剤を醸す

# the bench: the row that puts up the casino
row-unlockcasino = カジノを建てる

# the bench: what the casino is for, under its name
row-unlockcasino-note = 賭け金を受けて、倍か無しかで払うテーブル

# the bench: what the casino row gives, where a gain would go
row-unlockcasino-blurb = 倍か無しか

# the bench: the row that puts up the farm
row-unlockfarm = 畑を作る

# the bench: what the farm is for, under its name
row-unlockfarm-note = 作物を育てよう

# the bench: what the farm row gives, where a gain would go
row-unlockfarm-blurb = 作物を育てる

# the bench: the row that puts up the air filter
row-unlockfilter = エアフィルターを建てる

# the bench: what the air filter is for, under its name
row-unlockfilter-note = 空からかすみを吸い戻す気球を売り、空の具合も読む

# the bench: what the air filter row gives, where a gain would go
row-unlockfilter-blurb = 空をきれいに

# the bench: the row that puts up the janitor's closet
row-unlockouthouse = 用務員室を建てる

# the bench: what the closet is for, under its name
row-unlockouthouse-note = うんちはもう見飽きた、片付けよう

# the bench: what the closet row gives, where a gain would go
row-unlockouthouse-blurb = うんち、片付いた

# the bench: the row that puts up the quarry
row-unlockquarry = 採石場を作る

# the bench: what the quarry is for, under its name
row-unlockquarry-note = 鉱石を掘りはじめよう

# the bench: what the quarry row gives, where a gain would go
row-unlockquarry-blurb = 鉱石を掘る

# the bench: the row that puts up the shack
row-unlockshack = 小屋を建てる

# the bench: what the shack is for, under its name
row-unlockshack-note = 採掘の強化

# the bench: what the shack row gives, where a gain would go
row-unlockshack-blurb = 岩のための道具

# the bench: the row that puts up the tower
row-unlocktower = 塔を見つける

# the bench: what the tower is for, under its name
row-unlocktower-note = 魔法使いを呼ぼう

# the bench: the first barrier against the boulder
row-props = 木の防壁

# the bench: the wooden barrier's line
row-props-note = 妻を救うため、急いで防壁を建ててみる

# the bench: the second barrier
row-net = 網

# the bench: the net's line
row-net-note = だめだった。網で岩を受け止めてみる？

# the bench: the third barrier
row-arch = アーチを切り出す

# the bench: the arch's line
row-arch-note = まだ頑丈さが足りない。石のアーチを組もう。

# the tower: the last barrier, the wizards'
row-dome = 魔法使いなら分かるかも？

# the tower: the last barrier's line
row-dome-note = 地のものはすべて敗れた。残るのは地のものではない

# a hat's name: the diggers' (its row, the index, the crew)
kit-breaker = 破砕師

# what the breaker hat does
kit-breaker-does = 噛みつき二倍

# where the breaker hat is worn
kit-breaker-place = 岩

# a hat's name: the haulers' cart
kit-carter = 荷車師

# what the cart does
kit-carter-does = 積荷二倍

# where the cart is used
kit-carter-place = 穴

# a hat's name: the miners'
kit-blaster = 発破師

# what the blaster hat does
kit-blaster-does = 往復二倍

# where the blaster hat is worn
kit-blaster-place = 採石場

# a hat's name: the farmers'
kit-grower = 栽培師

# what the grower hat does
kit-grower-does = 世話二倍

# where the grower hat is worn
kit-grower-place = 畑

# the bench: a forklift that drives itself
row-driver = フォークリフト

# the bench: the forklift's line
row-driver-note = 自分で走るフォークリフト：誰も乗せずに穴まで運び、煙を出す

# the bench: the forklifts' load ladder
row-liftload = リフトの積載量

# a row's verb, before its gain: driving pace
does-drive = 走り

# the bench: the forklifts' pace ladder
row-liftpace = リフトの速さ

# a heading on the bench's board: your own ladders
sect-you = 自分

# a heading on the bench's board: the crit ladders
sect-luck = 幸運の一振り

# a heading on the bench's board: the haulers' gear
sect-haulers = 運び屋

# a heading on the bench's board: the rows that put up a new place
sect-build = 建設

# the house's board: buy another house to hire somebody
row-house = 家をもう一軒

# the ribbon on every goal card: the barrier the story is on
goal-title = 妻を救う

# a card greyed out: its next rung costs crops, and there is no farm yet
needs-spore = 作物が必要

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = 採石場が必要

# a card greyed out: its next rung costs a spark, and none has been earned
needs-spark = 火花が必要

# a card greyed out: its next rung costs a scale, and the deep is not open
needs-scale = 鱗が必要

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }：{ $does }、{ $place }

# the shack: the ram's tuning ladder
row-tuneram = 破城槌の一撃

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = 破城槌の一撃が{ $n }倍に

# a heading on any board over the rows no section names
sect-and = その他

# a card the yard is at: somebody is building it (the strip's word with nothing to hand back; the gain line's word)
card-building = 建設中

# the strip at a card's foot: buy another copy behind the one being built
card-another = ＋もう一つ

# a card in line: nobody is at it yet
card-queued = 順番待ち

# a finished ladder, where its price would go
card-done = 完了

# the tower: an enchantment's name
spell-drive = 機械を速める

# the tower: the enchantment's line
spell-drive-note = 作業場の機械すべてが50%速く動く

# the tower: an enchantment's name
spell-luck = 採石場を豊かに

# the tower: the enchantment's line
spell-luck-note = 採石場で掘るたび、鉱石が25%多く出る

# the tower: an enchantment's name
spell-gmo = 作物の遺伝子組み換え

# the tower: the enchantment's line
spell-gmo-note = 作物がすべて25%大きくなる

# the tower: an enchantment's name
spell-thrift = 家を安く

# the tower: the enchantment's line
spell-thrift-note = 以後、家はすべて75%安くなる

# the tower: an enchantment's name
spell-sweep = 用務員を速く

# the tower: the enchantment's line
spell-sweep-note = 用務員のすくうのも歩くのも二倍速くなる

# the tower: how often a wizard throws
row-wizspeed = 詠唱の高速化

# the tower: how often a wizard throws, its line; $pct is the rise a rung
row-wizspeed-note = 魔法使いが星に稲妻を撃つ回数が{ $pct }%増える

# a row's verb, before its gain: a wizard's casting
does-cast = 詠唱

# the tower: how much of the star a bolt takes
row-wizpower = 重い稲妻

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = 一発の稲妻で星から{ $now }マスではなく{ $next }マス削る

# the tower: a wizard's hat
row-wizard = 魔法使いを呼ぶ

# the tower: a wizard's line
row-wizard-note = 飛び上がって星を稲妻で砕いて火花にし、空が空になれば新しい星を呼ぶ

# the tower: the sphere's line
row-sphere-note = 星の力を捕らえる

# the tower: the sphere's tuning ladder
row-tunesphere = 球体の収量

# the tower: the sphere's tuning ladder, its line; $n is how many times the light
row-tunesphere-note = 球体が{ $n }倍の光を捕らえる

# the tower: the barrier the wizards pour
row-dome-tower = 結界を呼び出す

# the tower: the barrier's line
row-dome-tower-note = これは何も通さない。

# the tower: the way down to the deep
row-portal = ポータルを呼び出す

# the tower: the portal's line
row-portal-note = 奈落へ下りる道。開いたままにしてある。

# a heading on the tower's board: the spells
sect-enchantments = エンチャント

# a heading on the tower's board: the portal
sect-abyss = 奈落

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign (50%)
spell-drive-blurb = 速度 +{ $pct }

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-luck-blurb = 鉱石 +{ $pct }

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-gmo-blurb = 作物 +{ $pct }

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-thrift-blurb = { $pct } 安く

# the tower: what the enchantment gives, where a gain would go; $x is how many times
spell-sweep-blurb = { $x }倍速

# the farm: what a harvest is worth, a ladder
row-crop = 作物の収量

# a row's verb, before its gain: tending plots
does-tend = 世話

# the farm: how often a plot is tended, a ladder
row-tend = 畑仕事の速さ

# the farm: break another plot
row-farmplot = 区画をもう一つ

# the farm: the tiller's tuning ladder
row-tunetiller = 耕運機の速さ

# the farm: the tiller's tuning ladder, its line; $n is how many times faster
row-tunetiller-note = 耕運機が{ $n }倍速く働く

# a heading on the farm's board: what a plot pays
sect-crop = 作物

# the quarry: what a dig turns up, a ladder
row-seam = 鉱石の収量

# a row's verb, before its gain: digging
does-dig = 掘り

# the quarry: how often a dig happens, a ladder
row-quarrypace = 採掘の速さ

# the quarry: another miner's shovel at the face
row-quarrybench = シャベルをもう一本

# the quarry: the drill's tuning ladder
row-tunejaw = ドリルの威力

# the quarry: the drill's tuning ladder, its line; $n is how many times harder
row-tunejaw-note = ドリルが{ $n }倍強く食い込む

# a heading on the quarry's board: what the hole pays
sect-ore = 鉱石

# a heading on the farm's board over who works the plots, with their headcount (the job's save key, as it has always read)
sect-farmhands = 農民

# a heading on the quarry's board over who works the cut, with their headcount (the job's save key, as it has always read)
sect-quarriers = 採石工

# a row's verb, before its gain: a balloon's flight
does-fly = 飛行

# the air filter: how fast the balloons go from cloud to cloud
row-balloonspeed = 気球の速さ

# a row's verb, before its gain: what a balloon takes in
does-filter = 濾過

# the air filter: how much haze a balloon draws
row-power = 気球の吸引力

# the air filter: another balloon
row-balloon = 気球

# the air filter: the balloon's line
row-balloon-note = 雲に乗って、捕まえたものを真下に落とす

# the air filter: the recycler
row-recycler = リサイクラー

# the air filter: the recycler's line
row-recycler-note = 気球が捕まえたものが、泥ではなく小石になって落ちる

# a heading on the air filter's board
sect-equipment = 装備

# the janitor's closet: the second cap on the stand
row-loopost = 帽子をもう一つ

# the janitor's closet: another roomba
row-roomba = ロボット掃除機

# the janitor's closet: the roomba's line
row-roomba-note = 作業場の散らかりまで走って持ち帰る。用務員が一人見張り、煙を出す

# the janitor's closet: the roombas' tuning ladder
row-tuneroomba = 掃除機の吸引力

# the janitor's closet: the roombas' tuning ladder, its line; $n is how many times faster
row-tuneroomba-note = 掃除機の吸い込みが{ $n }倍速くなる

# a brew's name: the speed one, priced in crops
tonic-stew = 具沢山シチュー

# a brew's name: the strength one, priced in ore
tonic-strong = 濃い薬

# a brew's name: the crit one, priced in sparks
tonic-brace = 気付け薬

# the apothecary: keep the fires going, or let them die once a batch is dealt (a setting)
row-potkeep = 醸し続ける

# the apothecary's keep-brewing setting: on
row-potkeep-on = 次から次へ

# the apothecary's keep-brewing setting: off
row-potkeep-off = これっきり

# the apothecary: room for one more pot and its stirrer
row-anotherpot = 鍋をもう一つ

# a row's verb, before its gain: how long a dose lasts
does-lasts = 持続

# the apothecary: how long a dose lasts, a ladder
row-bufflength = 薬の濃さ

# the apothecary: doses a batch, a ladder
row-brewdoses = 一鍋の量

# a heading on the apothecary's board over the pots, with the stirrers' headcount
sect-pot = 鍋

# a heading on the apothecary's board
sect-brewing = 醸造

# a heading on the apothecary's board: one ladder a brew
sect-potency = 効き目

# a brew's potency row's verb, before its gain
does-faster = 速さ

# a brew's potency row's verb, before its gain
does-stronger = 強さ

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }、{ $secs }秒

# what the crit brew does: $v points of crit chance for $secs seconds
tonic-gain-crit = +{ $v } 会心、{ $secs }秒

# the shack's heading over the diggers' gear, with their headcount
sect-diggers = 石割り

## Machines

# a machine's name: the quarry's (the save's key is jaw)
machine-jaw = ドリル

# a machine's name: the boulder's
machine-ram = 破城槌

# a machine's name: the farm's
machine-tiller = 耕運機

# a machine's name: carries pebbles from the boulder to the hole
machine-belt = ベルト

# a machine's name: the shell round the star
machine-sphere = 球体

# a machine's name: the janitor's closet's
machine-roomba = ロボット掃除機

## Stations

# a deep station's board with nothing on it yet
station-party-empty = まだ学ぶことはない

# a station's name: its board's title, the pointer's label, the queue card
station-casino = カジノ

# a station's name
station-filter = エアフィルター

# the air filter's board with nothing on it
station-filter-empty = 付けるものがない

# a station's name
station-quarry = 採石場

# the quarry's board with nothing on it
station-quarry-empty = 採石場はもうこれ以上深くならない

# a station's name
station-farm = 畑

# the farm's board with nothing on it
station-farm-empty = 土地はすべて耕した

# a station's name
station-apothecary = 薬屋

# the apothecary's board with nothing on it
station-apothecary-empty = 鍋は冷えたまま

# a station's name
station-tower = 塔

# the tower's board with nothing on it
station-tower-empty = ここではまだ何も動かない

# a station's name
station-shack = 小屋

# the shack's board with nothing on it
station-shack-empty = 道具は全部岩のところにある

# the bench's board with nothing on it
station-bench-empty = 売るものがない

# a station's name
station-outhouse = 用務員室

# the janitor's closet's board with nothing on it
station-outhouse-empty = ほうきは全部フックに掛かっている

# a station's name
station-house = 家

# a station's name: the noticeboard over the pit
station-stats = 帳簿

# the books with nothing on them
station-stats-empty = まだ何も入ってこない

# a station's name: the deep's purse
station-crusher = 粉砕機

# the crusher's pile-full mark, on a hover
station-crusher-full = 床が鱗でいっぱい

# a station's name: the deep's houses
station-pods = ポッド

# the pods' board with nothing on it
station-pods-empty = 建てるものがない

# the lab's board title, still in the page's markup (the lab itself is gone)
station-lab = 研究所

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (An eighth like-named station reads "undefined": what the code said before the words moved here, kept by the owner; the deep has seven.)
station-party =
    { $nth ->
        [0] { $who }
        [1] 二人目の{ $who }
        [2] 三人目の{ $who }
        [3] 四人目の{ $who }
        [4] 五人目の{ $who }
        [5] 六人目の{ $who }
        [6] 七人目の{ $who }
       *[other] undefined人目の{ $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (an eighth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] ステーション
        [1] 二つ目のステーション
        [2] 三つ目のステーション
        [3] 四つ目のステーション
        [4] 五つ目のステーション
        [5] 六つ目のステーション
        [6] 七つ目のステーション
       *[other] undefined個目のステーション
    }

## Crew

# the crew window: where a body is, standing at its station (rockhands)
crew-at-rockhands = 岩の上

# the crew window: where a body is, standing at its station (haulers)
crew-at-haulers = 穴のそば

# the crew window: where a body is, standing at its station (quarriers)
crew-at-quarriers = 採石場の中

# the crew window: where a body is, standing at its station (farmhands)
crew-at-farmhands = 畑

# the crew window: where a body is, standing at its station (purifiers)
crew-at-purifiers = エアフィルター

# the crew window: where a body is, standing at its station (janitors)
crew-at-janitors = 片付け中

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = 手の中

# the crew window and a body's card: where a body is (falling)
crew-where-falling = 空中

# the crew window and a body's card: where a body is (home)
crew-where-home = 家

# the crew window and a body's card: where a body is (basket)
crew-where-basket = 気球の上

# the crew window and a body's card: where a body is (yard)
crew-where-yard = 作業場

# the crew window and a body's card: where a body is (resting)
crew-where-resting = 休憩中

# the crew window and a body's card: where a body is (walking)
crew-where-walking = 移動中

# the crew window and a body's card: where a body is (deep)
crew-where-deep = 深み

# a body's card, doing: at its job with no step to name (rockhands)
crew-does-rockhands = 岩を掘っている

# a body's card, doing: at its job with no step to name (quarriers)
crew-does-quarriers = 採石場で採掘中

# a body's card, doing: at its job with no step to name (farmhands)
crew-does-farmhands = 畑仕事中

# a body's card, doing: at its job with no step to name (scholars)
crew-does-scholars = 研究中

# a body's card, doing: at its job with no step to name (purifiers)
crew-does-purifiers = 空気を掃除中

# a body's card, doing: at its job with no step to name (janitors)
crew-does-janitors = すくっている

# a body's card, doing: at its job with no step to name (haulers)
crew-does-haulers = 運搬中

# a body's card, doing: what its step is (seek)
crew-now-seek = 小石を探している

# a body's card, doing: what its step is (dump)
crew-now-dump = 荷を下ろしている

# a body's card, doing: what its step is (muck)
crew-now-muck = 汚れをすくっている

# a body's card, doing: what its step is (cut)
crew-now-cut = 採石場で掘っている

# a body's card, doing: what its step is (up)
crew-now-up = 這い上がっている

# a body's card, doing: what its step is (down)
crew-now-down = 下りている

# a body's card, doing: what its step is (tend)
crew-now-tend = 区画の世話中

# a body's card, doing: what its step is (home)
crew-now-home = 帰宅中

# a body's card, doing: what its step is (idle)
crew-now-idle = 特になにも

# a body's card, doing: what its step is (in)
crew-now-in = 中にいる

# a body's card, doing: what its step is (aloft)
crew-now-aloft = 気球に乗っている

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = { $name }の番

# a body's card, doing: what its step is (to)
crew-now-to = 向かっている

# a body's card, doing: what its step is (kit)
crew-now-kit = 作業台で装備中

# a body's card, doing: what its step is (build)
crew-now-build = 建設中

# a body's card, doing: what its step is (working)
crew-now-working = 作業中

# a body with no name, on its card and in the crew window
crew-somebody = 誰か

# a body's card: the label before how long it has been here (a column of ten in monospace)
crew-card-age = 在籍

# a body's card, age: under a minute
crew-card-new = 今日来た

# a body's card, age: $mins minutes
crew-card-mins = { $mins }分

# a body's card: the label before what it is doing (a column of ten in monospace)
crew-card-doing = 作業

# a heading in the crew window over the yard's crew
crew-sect-yard = 作業場

# a heading in the crew window over the deep's crew
crew-sect-deep = 深み

# a heading on the house's board, and the window it opens
crew-sect-crew = 作業員

## The books

# the books: a coin, before its rate
books-dust = 小石

# the books: a coin, before its rate
books-shard = 鉱石

# the books: a coin, before its rate
books-spore = 作物

# the books: a coin, before its rate
books-spark = 火花

# the books: the window the rates are taken over, in minutes ($n may be ½)
books-over-min = { $n }分

# the books: the row that steps the window the rates are taken over
books-over = 平均の期間

# the books: the window, in a rate's note (nothing in the last half minute)
books-last-half = 直近30秒

# the books: the window, in a rate's note
books-last-one = 直近1分

# the books: the window, in a rate's note; $n minutes, more than one
books-last-mins = 直近{ $n }分

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $over }で{ $n }

# the books: a rate's note when nothing came in
books-nothing = なし

# the books: a line
books-dirt-mach = 機械から

# the books: a line
books-dirt-dust = 岩から

# the books: a line
books-dirt-shard = 採石場から

# the books: a line
books-dirt-spore = 畑から

# the books: the sky full in, while the filter is winning
books-due-never = この調子では来ない

# the books: a line
books-sky-trend = 汚染

# the books: a line
books-sky-up = 排出（毎分）

# the books: a line
books-sky-down = 除去（毎分）

# the books: a line
books-sky-haze = 空は

# the books: how full the sky is; $pct with its sign
books-sky-full = { $pct }まで

# the books: a line
books-sky-due = 満杯まで

# the books: a line
books-sky-rains = しのいだ雨

# the books: a line
books-sky-muck = 散らばった泥

# the books: a line
books-working = 作業中

# the books: a line
books-idle = 手すき

# the books: a line
books-best-mined = 岩から最多

# the books: a line
books-best-quarried = 鉱石を最多採掘

# the books: a line
books-best-farmed = 作物を最多収穫

# the books: a line
books-best-stored = 穴へ最多

# the books: a line
books-best-tidied = 泥を最多片付け

# the books: the longest on one clock, an hour or more; $n hours to a tenth
books-hours = { $n }時間

# the books: the longest on one clock, under an hour; $n minutes
books-mins = { $n }分

# the books: a line
books-eldest = 一つの時計で最長

# the books: a line
books-tally-rocks = 片付けた岩

# the books: a line
books-tally-banked = ためた小石

# the books: a line
books-tally-ore = 掘った鉱石

# the books: a coin earned over the whole game; $coin is books-shard, books-spore or books-spark
books-tally-earned = 稼いだ{ $coin }

# the books: a line
books-tally-rift = 裂け目を通った

# the books: a line
books-tally-brews = 醸した鍋

# the books: a line
books-tally-hats = 仕上げた帽子

# the books: a line
books-tally-crew = 雇用中

# the books: a line
books-tally-notes = 獲得した実績

# the books: a line
books-tally-under = 妻が岩の下にいた時間

# the books: a line
books-tally-saved = 妻救出まで

# a heading in the books, and on the noticeboard
books-sect-income = 収入（毎秒）

# a heading in the books
books-sect-sky = 空

# a heading in the books
books-sect-crew = 作業員

# a heading in the books
books-sect-tally = 集計

# the noticeboard: the way into the books (off the board for now)
books-open = 帳簿を開く

# the noticeboard: how long this yard has been played
books-playtime = プレイ時間

## Hover

# the hover on a deep station whose Recruit still waits on its first choice
hover-choose = 戦士を選ぶ

# the hover over a grain of ore
hover-ore = 鉱石

# the hover over a crop, a grain of it or a grown plot
hover-crop = 作物

# the hover over a spark
hover-spark = 火花

# the hover over a pebble
hover-pebble = 小石

# the hover over the drowned pit
hover-abyss = 奈落

# the hover over the rift
hover-rift = 裂け目

# the hover over poop on the ground
hover-poop = うんち

# the hover over muck on the ground
hover-muck = 泥

# the hover over a body, as the job it does (its type, rockhand)
hover-rockhand = 石割り

# the hover over a body, as the job it does (its type, hauler)
hover-hauler = 運び屋

# the hover over a body, as the job it does (its type, quarrier)
hover-quarrier = 採石工

# the hover over a body, as the job it does (its type, farmhand)
hover-farmhand = 農民

# the hover over a body, as the job it does (its type, scholar)
hover-scholar = 学者

# the hover over a body, as the job it does (its type, purifier)
hover-purifier = 空気清浄係

# the hover over a body, as the job it does (its type, stirrer)
hover-stirrer = 薬師

# the hover over a body, as the job it does (its type, janitor)
hover-janitor = 用務員

# the hover over a body, as the job it does (its type, wizard)
hover-wizard = 魔法使い

# the hover over a body, as the job it does (its type, builder)
hover-builder = 大工

# the hover over a body, as the job it does (its type, fighter)
hover-fighter = 戦士

# the hover over a body, as the job it does (its type, gatherer)
hover-gatherer = 採集係

# the hover over a body, as the job it does (its type, delver)
hover-delver = 深みの建築家

# the hover over the portal, from the deep
hover-portal-up = ポータル — 作業場へ

# the hover over the portal, from the yard
hover-portal-down = ポータル — 深みへ

# the hover over the serpent
hover-serpent = 大蛇

# the hover over the crew's houses
hover-house = 家

# the hover over the boulder
hover-rock = 岩

# the hover over a bird
hover-bird = 鳥

# the hover over a balloon
hover-balloon = 気球

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }、{ $way }

# the air filter's gauge: the sky filling faster than it is cleaned
hover-dial-worse = 悪化中

# the air filter's gauge: the sky cleaned faster than it fills
hover-dial-better = 改善中

# the air filter's gauge: neither
hover-dial-steady = 横ばい

# the hover over the counter above the pit
hover-counter = 穴の小石：すべての支払いはこれで

# the air filter's gauge: the needle in the first band
hover-dial-clean = きれい

# the air filter's gauge: the needle in the middle band
hover-dial-dirty = 汚い

# the air filter's gauge: the needle in the last band
hover-dial-filthy = 真っ黒

# the hover on a pile-full mark: a station's pile has nowhere left to go
hover-pile-full = 山がいっぱい

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } 完了

# the hover on a done mark whose rows have no names
hover-done-work = 作業完了

# the casino's lever, by name (its hover and the pad's label)
lever-arm = レバー

# a pot's picker: the brew it is set to, when it is set to none
pot-nothing = なし

# a pot's picker: the heading over who the brew is for
pot-for = 対象

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = いちばん近い人に

## The deep

# a brawler's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-brawler-fork = 拳を重くし、コンボを覚える

# the brawler's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move = コンボ

# what the brawler's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move-does = 連続パンチ

# the brawler's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap = ノックアウト

# what the brawler's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap-does = { $stun }

# a sword's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sword-fork = 剣を極める

# the sword's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-move = 旋風斬り

# what the sword's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-move-does = 重い斬撃

# the sword's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap = 弱点

# what the sword's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap-does = { $bleed }

# a monk's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-monk-fork = 気を練る

# the monk's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-move = 深呼吸

# what the monk's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-move-does = 気が速くたまる

# the monk's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap = 明鏡止水

# what the monk's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap-does = { $stun }

# a martial's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-martial-fork = 素早く打ち、素早く決める

# the martial's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-move = 演武

# what the martial's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-move-does = とどめが速くなる

# the martial's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap = 号令

# what the martial's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap-does = 仲間に{ $haste }

# a ranger's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-ranger-fork = 弱点を狙う

# the ranger's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move = 狙い撃ち

# what the ranger's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move-does = 溜めた矢

# the ranger's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap = 縫い止め

# what the ranger's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap-does = { $stun }

# a assassin's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-assassin-fork = 素早く、正確に刺す

# the assassin's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move = 処刑

# what the assassin's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move-does = 傷を突く

# the assassin's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap = ギザ刃

# what the assassin's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap-does = { $bleed }

# a hexer's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-hexer-fork = 弱体の呪いをかける

# the hexer's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move = 衰弱

# what the hexer's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move-does = 大蛇の被ダメージ増

# the hexer's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap = 束縛

# what the hexer's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap-does = { $held }、{ $exposed }

# a sapper's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sapper-fork = 爆薬を覚える

# the sapper's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move = 粘着爆弾

# what the sapper's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move-does = くっつけて、爆破

# the sapper's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap = 二連

# what the sapper's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap-does = 爆弾二つ、{ $stun }

# a mage's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-mage-fork = 強力な光線を放つ

# the mage's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-move = 拡散

# what the mage's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-move-does = 太い光線

# the mage's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap = テルミット

# what the mage's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap-does = 装甲を焼く

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = 仲間に{ $inspired }を与える

# the bard's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-move = 賛歌

# what the bard's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-move-does = { $inspired }二倍

# the bard's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap = テンポ

# what the bard's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap-does = 仲間に{ $haste }

# a status, by name (bold in a line, under its icon)
status-stun = スタン

# a status, by name
status-bleed = 出血

# a status, by name
status-haste = 加速

# a status, by name
status-held = 拘束

# a status, by name
status-exposed = 無防備

# a status, by name
status-inspired = 鼓舞

# what Stun does, after its name
status-stun-does = 動けず、回復も止まる

# what Bleed does, after its name
status-bleed-does = 継続ダメージ

# what Haste does, after its name; $pct with its sign
status-haste-does = 攻撃が{ $pct }速くなる

# what Held does, after its name
status-held-does = 回復できない

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = 受けるダメージ{ $lo }～{ $hi }増

# what Inspired does, after its name
status-inspired-does = 攻撃が重くなる

# a status's hover line: $name (status-…) and what it does
status-line = { $name }：{ $does }

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }：{ $does }

# a status's label under its icon when $n of it are on
status-label-n = { $name } x{ $n }

# a base fighter's line: the altar's (the Fighter)
base-altar-does = パンチを打つ

# a base fighter's line: the well's (the Novice)
base-well-does = 武術を修行する

# a base fighter's line: the armory's (the Scout)
base-armory-does = 矢を射る

# a base fighter's line: the circle's (the Adept)
base-circle-does = 呪いをかける

# a base fighter's line: the spire's (the Apprentice)
base-spire-does = 光線を撃つ

# the Recruit's line, before its first choice
recruit-does = 軽いパンチ

# the Bard's line with nobody else fighting
rail-alone = 歌を聞かせる相手がいない

# a class that needs company, before there is any
rail-locked = 二つ目のステーションで解放

# a station's board at the fork: the heading over the two classes
rail-fork-ask = 専門を選べ

# a Recruit's board: the heading over its first choice
rail-recruit-ask = 戦士を選べ

# a rung's number in its class's unit; $unit is unit-dmg or unit-dmg-s
rail-worth = { $n } { $unit }

# a rung's number for a class written in percent (the Bard)
rail-worth-pct = +{ $n }%

# a pip's hover line on a station's tree: $name (a fighter, a move) and $what (its number, or a few words)
rail-line = { $name }：{ $what }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = { $name }になる

# a station's board: stand the Recruit again, every rung handed back
rail-reset = リセット – 全額返却

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-brawler = 喧嘩屋

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sword = 剣士

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-monk = モンク

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = 武闘家

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-ranger = レンジャー

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-assassin = アサシン

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-hexer = 呪術師

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sapper = 工兵

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-mage = 魔導士

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-bard = 吟遊詩人

# a base fighter's name: the altar's, below the fork
base-altar = 格闘家

# a base fighter's name: the well's
base-well = 修行者

# a base fighter's name: the armory's
base-armory = 斥候

# a base fighter's name: the circle's
base-circle = 術士

# a base fighter's name: the spire's
base-spire = 見習い

# every station's first fighter, before its first choice
class-recruit = 新兵

# the serpent's lash, its tile's hover while it waits
serp-lash-calm = 鞭打ち：近接の攻撃者をスタン

# the serpent's lash, its tile's hover while it is warned
serp-lash-coming = 鞭打ちが来る

# the serpent's lash, its tile's hover while it is on
serp-lash-on = 鞭打ち：近接の攻撃者をスタン

# the serpent's lash, its tile's hover once answered
serp-lash-stopped = 鞭打ち：阻止

# the serpent's cloak, warned
serp-sink-coming = 隠れ身が来る

# the serpent's cloak, on
serp-sink-on = 隠れ身：手が届かない

# the serpent's constrict, warned
serp-orb-coming = 締めつけが来る

# the serpent's constrict, on
serp-orb-on = 締めつけ

# the serpent's constrict, answered
serp-orb-stopped = 締めつけ

# a fighter's tile: dazed, its hover
serp-dazed = めまい：振り落とされ、目に星が飛ぶ

# a fighter's tile: constricted, its hover
serp-constricted = 締めつけ中

# the serpent's barrier, its tile's hover
serp-barrier = 障壁：爆発ダメージを吸収

# the serpent's ward, its tile's hover
serp-ward = 守護：魔法ダメージ半減

# the serpent's plates, its tile's hover
serp-plates = 鱗甲：物理ダメージ半減

# the lash's tile, its label
serp-lash = 鞭打ち

# the cloak's tile, its label
serp-sink = 隠れ身

# the constrict's tile, its label
serp-orb = 締めつけ

# a fighter's dazed tile, its label
serp-dazed-name = めまい

# a fighter's constricted tile, its label
serp-constricted-name = 締めつけ中

# the barrier's tile, its label
serp-barrier-name = 障壁

# the ward's tile, its label
serp-ward-name = 守護

# the plates' tile, its label
serp-plates-name = 鱗甲

# the pods: one more of the crew, living down here
row-pod = ポッドをもう一つ

# the pods: the pod's line
row-pod-note = 深みの奥のカプセル：作業員がもう一人、ここで暮らす

# a deep station's board: the heading over its one fighter, with the count
rail-fighter = 戦士

# the deep: the build of a new fighter's station (the queue card names it)
row-raise-station = ステーションを建てる

# the deep's build button: the first station costs no fang
build-free = 無料

# the serpent's level after the pips on its bar, from level 2 on; $n is the level.
# [owner's words: a level label, e.g. "Lv 7"] -- until then the bare number. Drawn in the pixel number font
# (NUM_FONT), which draws only the glyphs it has: words want their letters drawn into the font
serp-level = { $n }
