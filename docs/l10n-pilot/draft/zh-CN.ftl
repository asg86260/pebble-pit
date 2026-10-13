### Pebble Pit pilot, version A: drafted by Claude (Opus 5.5) after locales/STYLE.md, zh-CN.
### A draft for a native reviewer, not a finished translation.


# rescue sheet heading, end of first half
saved-word = 结束了？

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = 你用 <span data-l10n-name="time"></span> 救出了你的方妻！

# rescue sheet dismiss button
saved-keepplaying = 从此幸福快乐

# demo end sheet line
demoend-why = 现在还救不了你的方妻。

# second-half end sheet line
freed-why = 你把方夫从巨蛇肚子里救了出来。

# second-half end sheet line
freed-end = 结束了，想继续屠蛇、在地面种田也随你！

# saves page paste box cancel
held-nevermind = 算了

# pause sheet footer hint
held-keys = esc 暂停 · ← → 环顾 · 按住空格跳过过场

# window close button label
modal-close =
    .aria-label = 关闭

# pause sheet reply, store fallback
said-fellback = 最新存档读不出来；这是上一个

# pause sheet reply, yard open elsewhere
said-yielded = 这个场地在另一个标签页里开着；由那边存档

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = 没在存档：本站存储已满（已用 { $used } mb，其中 { $ours } kb 是我们的）。复制存档仍可用

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = 无法读取：{ $message }

# save row age
slots-since-min = { $m } 分钟前

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d } 天前

# save row item
slots-row-crew = { $n } 名工人

# saves button label on both fronts
held-slotsbtn-label = 存档 · { $n }/{ $total }

# achievements page, nothing earned
held-record-none = 你还什么都没做。

# cloud section under recovery code
cloud-writedown = 记下来：换了设备也能用它找回你的场地

# cloud section reply, 503
cloud-why-resting = 云端在休息；稍后再试

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = 今天从这里尝试太多次了；明天再试

# cloud section button, first press
cloud-btn-newcode-armed = 登出其他设备？

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = 已保存 { $since }

# settings dark switch
set-dark-on = 深色：开

# settings motion switch
set-motion-less = 动效：少

# settings note where fullscreen unavailable
set-fullscreen-note = 想要全屏，把此页添加到主屏幕

# controls page action column
ctl-rightleft-do = 拎起工人

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = 一块石头。一个坑。中间几个人。

# landing page main button
title-play = 开始

# story line, first step
obj-rock = 凿开巨石，救出你的方妻！

# story line, wooden roof barrier
obj-props = 也许盖个木顶就能挡住下一块巨石？

# story line, arch barrier
obj-arch = 用挖来的矿石和石头砌个拱吧。这总够结实了。

# story line, wizards' barrier
obj-dome = 没辙了，看看巫师能不能帮忙。

# story line, deep half
obj-portal = 召唤一道通往深渊的传送门，下面有什么？

# story line, final step
obj-free = 把方夫从巨蛇肚子里救出来

# objective card cancel while building
obj-barrier-cancel = 取消 ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = 按住 <span data-l10n-name="key"></span> 跳过

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = 放手

# the house's board and the crew window, with no crew yet
crew-empty = 这里还没人住

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }时{ $m }分

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = 第{ $n }

# achievement name
ach-gotout-name = 你救出了方妻

# toast and achievements card name
ach-firstgrain-name = 搞钱

# achievement name
ach-firsthire-name = 你建造了额外的水晶塔

# achievement name
ach-firsthat-name = 你是个巫师，小方

# achievement name
ach-firstbrew-name = 你好，卖药的

# achievement name
ach-dizzy-name = 婴儿摇晃综合征

# achievement name
ach-muckrain-name = 屋漏偏逢连夜雨

# achievement name
ach-tablebeaten-name = 我们又行了

# achievement name
ach-tableruin-name = 该去借贷了

# achievement name
ach-bird-name = 滚出我的地盘

# achievement note
ach-catchall-note = 扔出一大把最满的尘土，接住每一粒

# achievement name
ach-rifttorn-name = 裂隙撕开，存储问题解决

# achievement note
ach-rifttorn-note = 填满坑，撕开一道跨维度裂隙

# achievement note
ach-drowned-note = 一整片跨维度存储的海洋。

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = 清掉 { $n } 块巨石，石头可真多

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } 个方块

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = 凿石工

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = 深处建造工

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/秒

# a row's unit after its number: swings a second
unit-hits-s = 击/秒

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower =
    { $more ->
        [yes] 再买 { $left } 个园丁以解锁
       *[no] 买 { $left } 个园丁以解锁
    }

# the bench: your carry ladder
row-carry = 携带量

# the bench: holding a handful throws it by itself
row-autotoss = 按住自动扔

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = 给你的方工们熬临时增益

# the bench: what the casino is for, under its name
row-unlockcasino-note = 一张收赌注、赔双倍或输光的桌子

# the bench: what the closet is for, under its name
row-unlockouthouse-note = 便便看够了吧，清一清

# the bench: what the air filter is for, under its name
row-unlockfilter-note = 出售把雾霾从天上吸回来的气球，还能看天色

# the tower: the last barrier's line
row-dome-note = 地上的一切都失败了。剩下的不属于地上

# the bench: the net's line
row-net-note = 没用，试试用网接住巨石？

# what the breaker hat does
kit-breaker-does = 两倍啃劲

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }：{ $does }，{ $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = 撞锤的力道变为 { $n } 倍

# the strip at a card's foot: buy another copy behind the one being built
card-another = + 再来一个

# a finished ladder, where its price would go
card-done = 完成

# the tower: an enchantment's name
spell-gmo = 转基因作物

# the tower: the enchantment's line
spell-thrift-note = 此后每栋房子便宜 75%

# the tower: the enchantment's line
spell-drive-note = 场地里每台机器快 50%

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = 每道闪电从星星上打下 { $next } 格，而不是 { $now } 格

# the tower: a wizard's line
row-wizard-note = 飞上天用闪电把星星打成火花，天空空了就召来新的一颗

# the janitor's closet: the roomba's line
row-roomba-note = 开到场地上的脏乱处把它运回家；一个清洁工看着它们，它们会冒烟

# the air filter: the recycler's line
row-recycler-note = 气球接住的东西落下来变成石子，而不是污泥

# a brew's name: the speed one, priced in crops
tonic-stew = 浓汤

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }，{ $secs } 秒

# the apothecary's keep-brewing setting: on
row-potkeep-on = 一锅接一锅

# the bench: the forklift's line
row-driver-note = 自己开的叉车：没人驾驶也能运到坑边，还冒烟

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = 需要采石场

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party =
    { $nth ->
        [0] { $who }
        [1] 第二个{ $who }
        [2] 第三个{ $who }
        [3] 第四个{ $who }
       *[other] 第undefined个{ $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] 一座站点
        [1] 第二座站点
        [2] 第三座站点
        [3] 第四座站点
       *[other] 第undefined座站点
    }

# the apothecary's board with nothing on it
station-apothecary-empty = 锅是冷的

# the janitor's closet's board with nothing on it
station-outhouse-empty = 扫帚都挂在钩子上

# the crusher's pile-full mark, on a hover
station-crusher-full = 地上堆满了鳞片

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = 在你手里

# a body's card, doing: what its step is (idle)
crew-now-idle = 没干啥

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = 看管{ $name }

# a body's card, age: under a minute
crew-card-new = 今天新来

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $over }收入 { $n }

# the books: the sky full in, while the filter is winning
books-due-never = 照这速度不会

# the books: a line
books-tally-under = 方妻埋在石下已有

# the books: a line
books-tally-saved = 救出方妻用时

# the hover over the counter above the pit
hover-counter = 坑里的石子：一切都用它付

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }，{ $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } 完成

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = 谁离得近给谁

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = 让你的队伍获得{ $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = 多受 { $lo }-{ $hi } 伤害

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }：{ $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = 成为{ $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = 重置 – 全额退还

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = 武术家

# a fighter's tile: dazed, its hover
serp-dazed = 眩晕：被甩开，眼冒金星

# a Recruit's board: the heading over its first choice
rail-recruit-ask = 选择你的战士
