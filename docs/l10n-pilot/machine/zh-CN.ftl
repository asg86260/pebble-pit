### Pebble Pit pilot, version B: machine translation, zh-CN.
### Engine: Firefox Translations (Bergamot) via @browsermt/bergamot-translator 0.4.9 (wasm), model en-zh 2.2 from Mozilla's Remote Settings registry.
### Unedited except: the first letter takes the English case; title-gamename is not sent (the game's name).

# rescue sheet heading, end of first half
saved-word = 结束了吗?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = 你在<span data-l10n-name="time"></span>年救了你的妻子!

# rescue sheet dismiss button
saved-keepplaying = 从此以后过得幸福

# demo end sheet line
demoend-why = 救不了你的女生。

# second-half end sheet line
freed-why = 你把你的丈夫从蛇的肚子里救了出来。

# second-half end sheet line
freed-end = 终将结束,可以继续在水面上杀死蛇和农耕!

# saves page paste box cancel
held-nevermind = 没关系

# pause sheet footer hint
held-keys = esc hand · → 看起来 · 保持空间跳过一个场景

# window close button label
modal-close =
    .aria-label = 关闭

# pause sheet reply, store fallback
said-fellback = 最后一个节省不会加载;这是它之前的那个

# pause sheet reply, yard open elsewhere
said-yielded = 这个院子在另一个标签页上打开;那一个正在被保存

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = 不保存:本网站的存储空间已经满满(使用{ $used } mb,其中 { $ours } kb 为我们)。复制保存仍然有效

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = 无法加载:{ $message }

# save row age
slots-since-min = { $m }分钟前

# saves row: how long ago it was saved, in whole days
slots-since-days = 两天前

# save row item
slots-row-crew = { $n }名船员

# saves button label on both fronts
held-slotsbtn-label = 保存 · { $total } 个中的 { $n }

# achievements page, nothing earned
held-record-none = 你还没做什么。

# cloud section under recovery code
cloud-writedown = 写下这一点:它让你的院子重新回到一个新设备上

# cloud section reply, 503
cloud-why-resting = 云层正在休息;稍后再试

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = 今天从这里尝试太多;明天试试

# cloud section button, first press
cloud-btn-newcode-armed = 签出其他设备?

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = 得救了{ $since }

# settings dark switch
set-dark-on = 黑暗:在

# settings motion switch
set-motion-less = 动议:减少

# settings note where fullscreen unavailable
set-fullscreen-note = 整块屏幕,请将此页面添加到主屏幕

# controls page action column
ctl-rightleft-do = 接工

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = 一块石头,一个洞。他们中间有几个人。

# landing page main button
title-play = 玩

# story line, first step
obj-rock = 挖块头来救你的妻子!

# story line, wooden roof barrier
obj-props = 也许建造一个木制屋顶会阻止下一块巨石?

# story line, arch barrier
obj-arch = 让我们尝试用矿石和石头建造一座拱门。这确实足够坚固。

# story line, wizards' barrier
obj-dome = 选项之外,让我们看看巫师能否提供帮助。

# story line, deep half
obj-portal = 想象一个通往深渊的门,下面有什么?

# story line, final step
obj-free = 把你的女主人从蛇的肚子里解放出来

# objective card cancel while building
obj-barrier-cancel = 取消 ×{ $n }

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = 保持<span data-l10n-name="key"></span>个跳过

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } × { $n }

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = 放下它

# the house's board and the crew window, with no crew yet
crew-empty = 还没有人住在这里

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }小时{ $m }分钟

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = 第一

# achievement name
ach-gotout-name = 你救了你的妻子

# toast and achievements card name
ach-firstgrain-name = 钱

# achievement name
ach-firsthire-name = 你建造了额外的塔架

# achievement name
ach-firsthat-name = 你是个巫师

# achievement name
ach-firstbrew-name = 你好,药水销售商

# achievement name
ach-dizzy-name = 摇晃婴儿综合征

# achievement name
ach-muckrain-name = 从不下雨,但会倾盆而来

# achievement name
ach-tablebeaten-name = 我们回来了

# achievement name
ach-tableruin-name = 是时候申请贷款了

# achievement name
ach-bird-name = 离开我的土地

# achievement note
ach-catchall-note = 向它最大的一团尘土投出一击,并捕捉每一粒

# achievement name
ach-rifttorn-name = 裂痕撕裂,储存得到解决

# achievement note
ach-rifttorn-note = 填满坑,引发一个跨维度的裂痕

# achievement note
ach-drowned-note = 整个海洋的跨维度存储。

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = 清澈的{ $n }块巨石,那是一块很大的石头

# achievement name: crew hired; $n is the count
ach-crew-name = { $n }个广场

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = 挖掘者

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = 深度构建

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/s

# a row's unit after its number: swings a second
unit-hits-s = 点击

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower = { $more ->
         [yes] 再购买两个种植户以解锁
        *[no] 购买{ $left }个种植户以解锁
    }

# the bench: your carry ladder
row-carry = 携带量

# the bench: holding a handful throws it by itself
row-autotoss = 坚持要蜦觊

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = 为您的员工提供临时提升

# the bench: what the casino is for, under its name
row-unlockcasino-note = 一张合住且支付双倍或无费用的桌子

# the bench: what the closet is for, under its name
row-unlockouthouse-note = 你已经看够了粪便,让它清理干净

# the bench: what the air filter is for, under its name
row-unlockfilter-note = 出售那些将雾霾从天而降的气球,并读取天空

# the tower: the last barrier's line
row-dome-note = 地面的一切都失败了。剩下的就不是地面

# the bench: the net's line
row-net-note = 没用,试着用网子抓住石头?

# what the breaker hat does
kit-breaker-does = 咬合两度

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }:{ $does },{ $place }

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = 公羊的击球力度要大{ $n }倍

# the strip at a card's foot: buy another copy behind the one being built
card-another = + 另一个

# a finished ladder, where its price would go
card-done = 完成了

# the tower: an enchantment's name
spell-gmo = 转基因作物

# the tower: the enchantment's line
spell-thrift-note = 从现在起,每栋房子都便宜75%

# the tower: the enchantment's line
spell-drive-note = 院子里的每台机器运行速度都快了50%

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = 每颗螺栓将{ $next }个细胞从恒星上敲除,而不是从{ $now }个

# the tower: a wizard's line
row-wizard-note = 飞起来,将星星分开以获取火花,当天空空无一物时,便召唤出一颗新的

# the janitor's closet: the roomba's line
row-roomba-note = 开车去露天院子里的乱七八糟的,然后把它带回家;一位看门人会把他们拉到门外,然后他们抽烟

# the air filter: the recycler's line
row-recycler-note = 气球捕捉到的是鹅卵石而不是泥浆

# a brew's name: the speed one, priced in crops
tonic-stew = 丰盛的炖菜

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit },{ $secs } 秒

# the apothecary's keep-brewing setting: on
row-potkeep-on = 批次后

# the bench: the forklift's line
row-driver-note = 一辆自行驱动的叉车:它载着无人驾驶,并冒烟

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = 需要一个采石场

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (A fifth like-named station reads "undefined": that is what the code said before the words moved here, kept for the owner to word.)
station-party = { $nth ->
         [0] { $who }
         [1] 第二个{ $who }
         [2] 第三三部
         [3] 第四篇{ $who }
        *[other] 未定义的{ $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (a fifth reads "undefined", as the code said)
station-party-lot = { $nth ->
         [0] 一个车站
         [1] 第二个站点
         [2] 第三站
         [3] 第四站
        *[other] 未定义的站点
    }

# the apothecary's board with nothing on it
station-apothecary-empty = 锅里僵住了

# the janitor's closet's board with nothing on it
station-outhouse-empty = 扫帚都挂在了钩子上

# the crusher's pile-full mark, on a hover
station-crusher-full = 地板上满是鳞片

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = 在你手中

# a body's card, doing: what its step is (idle)
crew-now-idle = 没什么

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = 心想 { $name }

# a body's card, age: under a minute
crew-card-new = 今日新

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $over } 投出 { $n } 人

# the books: the sky full in, while the filter is winning
books-due-never = 不以这种速度

# the books: a line
books-tally-under = 石探下

# the books: a line
books-tally-saved = sqwife 保存在

# the hover over the counter above the pit
hover-counter = 坑中的卵石:所有东西都需要花费多少

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone },{ $way }

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } 已完成

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = 最亲近的人

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = 给你的派对{ $inspired }

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = 再造成{ $lo }-{ $hi }次伤害

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }:{ $does }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = 成为{ $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = 重置——退款所有

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = 武术艺术家

# a fighter's tile: dazed, its hover
serp-dazed = 茫然:被甩掉,看到星星

# a Recruit's board: the heading over its first choice
rail-recruit-ask = 选择你的拳手
