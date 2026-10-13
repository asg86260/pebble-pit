### Pebble Pit, in Simplified Chinese (zh-CN): every word a player reads,
### translated from locales/en.ftl. The English comment over each message
### says where it shows.
###
### Drafted by Claude (Opus 5.5) on 2026-10-13 to locales/STYLE.md; not yet
### reviewed by a native speaker. Messages whose English is still an owner's
### placeholder are left out, so the English shows.
###
### Plain, colloquial register, never 您. A number is always its variable,
### never a written word.

## Sheets

# rescue sheet heading, end of first half
saved-word = 结束了？

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = 你用 <span data-l10n-name="time"></span> 救出了你的妻子！

# rescue sheet dismiss button
saved-keepplaying = 从此幸福快乐

# demo end sheet heading
demoend-word = 试玩版就到这里！

# demo end sheet line
demoend-why = 现在还救不了你的妻子。

# demo end store link (if STORE_URL)
demoend-store = 快加入愿望单！

# demo end dismiss button
demoend-keep = 继续玩

# free-build teaser end sheet heading
teaseend-word = 未完待续，请看完整版！

# teaser end store link (if STORE_URL)
teaseend-store = 获取完整版

# teaser end dismiss button
teaseend-keep = 继续玩

# second-half end sheet heading
freed-word = 好，这回真结束了

# second-half end sheet line
freed-why = 你把丈夫从巨蛇肚子里救了出来。

# second-half end sheet line
freed-end = 结束了，想继续屠蛇、在地面种田也随你！

# second-half end sheet line
freed-thanks = 谢谢！

# second-half end dismiss button
freed-keep = 继续玩

# crash sheet heading
crashed-word = 停了

# crash sheet button
crashed-copysave = 复制存档

# pause sheet heading
held-word = 暂停

# pause sheet button
held-resume = 继续

# pause sheet button (relabelled from JS)
held-slotsbtn = 存档

# saves page heading
held-slots-word = 存档

# saves page button
held-savecopy = 复制存档

# saves page button
held-loadsave = 读取存档

# saves page paste box confirm
held-loadit = 读取

# saves page paste box cancel
held-nevermind = 算了

# saves page back button
held-slotsback = 返回

# pause sheet button (relabelled from JS)
held-recordbtn = 成就

# achievements page heading
held-record-word = 成就

# achievements page back
held-recordback = 返回

# pause sheet button (also src/indexpage.js:24)
held-indexbtn = 图鉴

# index page heading
held-index-word = 图鉴

# index page back
held-indexback = 返回

# pause sheet button to landing page
held-titlebtn = 回到标题

# pause sheet button, desktop build only
held-quit = 退出到桌面

# pause sheet footer hint
held-keys = esc 暂停 · ← → 环顾 · 按住空格跳过过场

# window close button label
modal-close =
    .aria-label = 关闭

# pause sheet reply, desktop export ok
said-saved = 已保存

# pause sheet reply, desktop export failed
said-notsaved = 没保存

# pause sheet reply, store fallback
said-fellback = 最新存档读不出来；这是上一个

# pause sheet reply, unreadable save
said-broken = 最新存档读不出来。点“复制存档”可以把它拿走

# pause sheet reply, yard open elsewhere
said-yielded = 这个场地在另一个标签页里开着；由那边存档

# pause sheet reply, storage blocked
said-unsaved-blocked = 没在存档：浏览器不让这个页面存储。复制存档仍可用

# sheet reply after loading a save
said-loaded = 已读取

# sheet reply, pasted text invalid
said-notasave = 这不是存档

# crash sheet line when error has no message
crashed-why-fallback = 出了点错

# save row age
slots-since-now = 刚刚

# save row age
slots-since-min = { $m } 分钟前

# save row age
slots-since-h = { $h } 小时前

# save row item
slots-row-rock = 巨石 { $n }

# save row item
slots-row-crew = { $n } 名工人

# save row item for open slot in play
slots-row-playing = 正在玩

# save row, no yard
slots-row-empty = 空

# save row, broken blob
slots-row-unreadable = 读不出

# saves button label on both fronts
held-slotsbtn-label = 存档 · { $n }/{ $total }

# empty save row after first press
slots-arm = 开一个新场地？

# sheet reply after opening empty slot
slots-said-new = 新场地

# sheet reply after opening a slot
slots-said-loaded = 已读取

# save row delete cross label
slots-del-aria = 删除

# achievements button label with count
held-recordbtn-label = 成就 · { $count }/{ $total }

# achievements page, nothing earned
held-record-none = 你还什么都没做。

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d } 天前

# saves row delete confirm
slots-confirm-yes = 删除

# saves row delete cancel
slots-confirm-no = 返回

# sheet reply, copy with no save
said-copyout-none = 还没有存档

# sheet reply when clipboard unavailable
said-copyout-window = 在 window.__save 里

# index entry back button on phone
held-index-entryback = 返回

# saves page cloud section heading
cloud-head = 云存档

# cloud section button
cloud-btn-linkcode = 输入关联码

# cloud section button
cloud-btn-recovery = 使用恢复码

# cloud section button
cloud-btn-stop = 停用云存档

# cloud section reply after stop
cloud-said-off = 这台设备的云存档已关

# cloud section button
cloud-btn-enable = 开启云同步

# cloud section reply on failure (also cloud.js:768)
cloud-why-noanswer = 云端没回应

# cloud section, copy recovery code
cloud-btn-copy = 复制

# cloud section under recovery code
cloud-writedown = 记下来：换了设备也能用它找回你的场地

# cloud section, another device ahead
cloud-btn-take = 用那个

# cloud section, another device ahead
cloud-btn-keep = 留这个

# cloud section reply (also :316)
cloud-said-kept = 已保留

# cloud section above pairing code
cloud-pair-enter = 在另一台设备上输入

# cloud section, hide pairing code
cloud-btn-done = 好了

# cloud section button
cloud-btn-link = 关联设备

# cloud section toggle
cloud-btn-hidecode = 隐藏恢复码

# cloud section toggle
cloud-btn-showcode = 显示恢复码

# cloud section button
cloud-btn-newcode = 新的恢复码

# cloud section button, first press
cloud-btn-newcode-armed = 登出其他设备？

# link code box placeholder
cloud-box-linkph = ···-···

# recovery code box placeholder
cloud-box-recph = ····-····-····

# link code box label
cloud-box-aria-link = 关联码

# recovery code box label
cloud-box-aria-rec = 恢复码

# cloud section reply, bad code
cloud-wrong = 这个码不对

# cloud section reply after linking
cloud-said-linked = 已关联

# cloud code entry confirm
cloud-btn-dolink = 关联

# cloud code entry cancel
cloud-btn-nevermind = 算了

# cloud code entry prompt
cloud-typing-link = 另一台设备上的码

# cloud code entry prompt
cloud-typing-rec = 你的恢复码

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = 今天从这里尝试太多次了；明天再试

# cloud section reply, 503
cloud-why-resting = 云端在休息；稍后再试

# cloud section reply, 403
cloud-why-forbidden = 云端不认识这个页面

# the cloud's line in the landing page's foot bar: $state is one of the cloud-state lines below
# (with no state, it stands before the choose-a-yard button)
cloud-line = 云 · { $state }

# cloud state: not turned on (in cloud-line, and alone in the saves page section)
cloud-state-off = 关

# cloud state
cloud-state-out = 已登出

# cloud state
cloud-state-refused = 有个存档被拒了

# cloud state
cloud-state-offline = 没保存：离线

# cloud state
cloud-state-behind = 别的设备上有新的

# cloud state
cloud-state-newer = 更新游戏才能拿到新存档

# cloud state
cloud-state-big = 太大，云端放不下

# cloud state
cloud-state-full = 云端满了

# cloud state
cloud-state-paused = 已暂停

# cloud state
cloud-state-conflict = 选一个场地

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = { $since }已保存

# cloud state: on, nothing pushed yet
cloud-state-on = 开

# link a device: the pairing code's countdown; $time is m:ss
cloud-pair-left = 还剩 { $time }

# choose a yard: this device's copy of slot $n; $here is the yard as a saves row says it
cloud-clash-here = 本设备 · { $n } · { $here }

# choose a yard: the cloud's copy of slot $n; $cloud is the yard as a saves row says it
cloud-clash-cloud = 云端 · { $n } · { $cloud }

# a cloud button's answer: too many tries; $m is minutes to wait
cloud-why-wait = 尝试太多次；{ $m } 分钟后再试

# window title opened off the books
modal-books = 账本

# window title, crew list
modal-crew = 谁住在这儿

## Settings

# pause sheet button
held-settingsbtn = 设置

# settings page heading
held-settings-word = 设置

# settings note where fullscreen unavailable
set-fullscreen-note = 想要全屏，把此页添加到主屏幕

# settings volume slider label
set-volume =
    .aria-label = 音量

# settings button to controls page
set-controlsbtn = 操作

# controls page heading
set-controls-word = 操作

# controls page back
set-controlsback = 返回

# settings page back
set-settingsback = 返回

# settings motion switch
set-motion-less = 动效：少

# settings motion switch
set-motion-full = 动效：全

# settings touch switch (play only)
set-touch-on = 触屏：开

# settings touch switch (play only)
set-touch-off = 触屏：关

# settings dark switch
set-dark-on = 深色：开

# settings dark switch
set-dark-off = 深色：关

# settings sound switch
set-sound-off = 声音：关

# settings sound switch
set-sound-on = 声音：开

# pause sheet line: a save from a newer build; $build is the build's name
said-newer = 这个存档来自更新的版本（{ $build }）

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = 没在存档：本站存储已满（已用 { $used } mb，其中 { $ours } kb 是我们的）。复制存档仍可用

# pause sheet line: storage refused a save; $name is the browser's error name
said-unsaved-refused = 没在存档：存储拒绝了存档（{ $name }）。复制存档仍可用

# pause sheet line: storage refused a save, with no error to name
said-unsaved-refused-why = 没在存档：存储拒绝了存档。复制存档仍可用

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = 无法读取：{ $message }

# controls page input column
ctl-leftclick-in = 左键

# controls page action column
ctl-leftclick-do = 互动

# controls page input column
ctl-rightclick-in = 右键

# controls page action column
ctl-rightclick-do = 聚焦工人

# controls page input column
ctl-rightleft-in = 右键 + 左键

# controls page action column
ctl-rightleft-do = 拎起工人

# controls page input column
ctl-middle-in = 中键

# controls page action column
ctl-middle-do = 移动镜头

# controls page input column
ctl-wheel-in = 滚轮

# controls page action column
ctl-wheel-do = 移动镜头

# controls page input column
ctl-arrows-in = ← → / a d

# controls page action column
ctl-arrows-do = 移动镜头

# controls page input column
ctl-digits-in = 1 – 9

# controls page action column
ctl-digits-do = 跳到某处

# settings fullscreen row
set-fullscreen-on = 全屏：开

# settings fullscreen row
set-fullscreen-off = 全屏：关

# a sheet line: the save is on the clipboard; $n is its size in kilobytes
said-copyout-copied = 已复制 { $n }kb

## Title page

# browser tab title, landing
title-doctitle = Pebble Pit

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = 一块石头。一个坑。中间几个人。

# landing page main button
title-play = 开始

# landing page button (relabelled saves · n of 3)
title-slotsbtn = 存档

# landing page button (relabelled, src/record.js:33)
title-recordbtn = 成就

# landing page button
title-settingsbtn = 设置

# landing page, desktop build only
title-quit = 退出到桌面

# landing saves page heading
title-slots-word = 存档

# landing saves page button
title-savecopy = 复制存档

# landing saves page button
title-loadsave = 读取存档

# landing paste confirm
title-loadit = 读取

# landing paste cancel
title-nevermind = 算了

# landing saves page back
title-slotsback = 返回

# landing achievements page heading
title-record-word = 成就

# landing achievements page back
title-recordback = 返回

# landing settings page heading
title-settings-word = 设置

# landing settings to controls
title-controlsbtn = 操作

# landing settings back
title-settingsback = 返回

# landing controls page heading
title-controls-word = 操作

# landing controls back
title-controlsback = 返回

# landing cloud conflict page heading
title-conflict-word = 选一个场地

# landing cloud conflict back
title-conflictback = 返回

# landing foot link
title-link-itch = itch

# landing foot link
title-link-github = github

# under play, empty open slot
title-playlabel-new = 新场地

# landing achievements page, nothing earned
title-record-none = 还没有

# title foot bar conflict link
cloud-foot-choose = 选一个场地

# landing reply, bad paste
title-said-notasave = 这不是存档

# landing reply after load
title-said-loaded = 已读取

# landing reply after deleting open slot
title-said-erased = 已抹掉

## Objectives

# label before story line
obj-next = 下一步

# story line, first step
obj-rock = 凿开巨石，救出你的妻子！

# intro quest item
obj-rock-q-chip = 凿巨石

# intro quest item
obj-rock-q-pickup = 捡一颗石子

# intro quest item
obj-rock-q-toss = 把石子扔进坑里

# story line after first fall
obj-falling = 再凿一次巨石试试！

# story line, wooden roof barrier
obj-props = 也许盖个木顶就能挡住下一块巨石？

# story line, net barrier
obj-net = 不行，试试接住巨石，让它慢下来

# story line, arch barrier
obj-arch = 用挖来的矿石和石头砌个拱吧。这总够结实了。

# story line, wizards' barrier
obj-dome = 没辙了，看看巫师能不能帮忙。

# story line before rescue
obj-rescue = 救出你的妻子

# story line, second half
obj-drown = 淹没这个坑

# story line after snatch
obj-tower = 建造巫师塔

# story line after snatch
obj-talk = 跟巫师们聊聊刚才发生了什么

# story line, deep half
obj-portal = 召唤一道通往深渊的传送门，下面有什么？

# story line, final step
obj-free = 把丈夫从巨蛇肚子里救出来

# objective card cancel while building
obj-barrier-cancel = 取消 ×{ $n }

## Other

# browser tab title, game page
play-doctitle = Pebble Pit

# skip hint during cutscene, desktop (skiphint.js:27)
other-skip-desk = 按住空格跳过

# top-edge mess tag
other-messtag-muck = 污泥

# top-edge mess tag
other-messtag-poop = 便便

# floating button over bench site
other-raise = 造工作台

# phone pause button label
other-pause =
    .aria-label = 暂停

title-recordbtn-label = 成就 · { $count }/{ $total }

# corner fullscreen button tooltip
other-fullscreen-title-on = 退出全屏

# corner fullscreen button tooltip
other-fullscreen-title-off = 全屏

# crew-fade corner button label
other-corner-show = 显示工人

# crew-fade corner button label
other-corner-fade = 淡化工人

# crew-fade corner button label
other-corner-hide = 隐藏工人

# way corner button tip
other-corner-up = 上到场地

# way corner button tip
other-corner-down = 下到深处

# queue card line hover
other-queue-site-yard = 场地

# queue card line hover
other-queue-site-sphere = 球体

# queue card, nobody working
other-queue-queued = 排队中

# board footer toggle
other-hidedone-show = 显示已完成

# board footer toggle
other-hidedone-hide = 隐藏已完成

# the queue card: the first in line to be built after the one going up
queue-place-next = 下一个

# the house's board and the crew window, with no crew yet
crew-empty = 这里还没人住

# a station's name: its board's title, the pointer's label, the queue card
station-bench = 工作台

# skip hint during cutscene, phone
other-skip-touch = 按住跳过

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = 按住 <span data-l10n-name="key"></span> 跳过

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee, idle (drawn in the sign's own pixel capitals)
casino-sign = CASINO

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

## Notices

# toast-shaped card, another device ahead
note-cloud-name = 别的设备上有新的

# toast-shaped card, another device ahead
note-cloud-note = 去存档里看

## Numbers

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }小时{ $m }分

# how long a yard has been played, under an hour
played-m = { $m }分钟

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = 第{ $n }

## Achievements

# toast and achievements card name
ach-firstgrain-name = 搞钱

# toast and achievements card note
ach-firstgrain-note = 把一颗石子扔进坑里

# achievement name
ach-firstrock-name = 接着挖吧

# achievement note
ach-firstrock-note = 清掉第一块石头

# achievement name
ach-gotout-name = 你救出了妻子

# achievement note
ach-gotout-note = 再也没有石头了，你做到了。

# achievement name
ach-firsthire-name = 你建造了额外的水晶塔

# achievement note
ach-firsthire-note = 再盖一栋房子

# achievement name
ach-firstshard-name = 第一块矿石

# achievement note
ach-firstshard-note = 把矿石从采石场运上来

# achievement name
ach-firstspore-name = 耕种

# achievement note
ach-firstspore-note = 种出第一份作物

# achievement name
ach-firstspark-name = 空气中的魔法

# achievement note
ach-firstspark-note = 赚到第一颗火花

# achievement name
ach-holefull-name = 坑满了

# achievement note
ach-holefull-note = 把坑填到满

# achievement name
ach-rifttorn-name = 裂隙撕开，存储问题解决

# achievement note
ach-rifttorn-note = 填满坑，撕开一道跨维度裂隙

# achievement name
ach-drowned-name = 裂隙变大了

# achievement note
ach-drowned-note = 一整片跨维度存储的海洋。

# achievement name
ach-star-name = 召唤一颗星星

# achievement note
ach-star-note = 从塔上召下一颗星星

# achievement name
ach-firsthat-name = 你是个巫师，小方

# achievement note
ach-firsthat-note = 在塔里做完一顶巫师帽

# achievement name
ach-firstbrew-name = 你好，卖药的

# achievement note
ach-firstbrew-note = 在药铺熬一锅

# achievement name
ach-firsttrade-name = 第一顶帽子

# achievement note
ach-firsttrade-note = 给一个站点买第一顶帽子

# achievement name
ach-alltrades-name = 教化大众

# achievement note
ach-alltrades-note = 给每个站点配齐帽子

# achievement name
ach-allbuilt-name = 建造完毕

# achievement note
ach-allbuilt-note = 你什么都建好了

# achievement name
ach-rift1e6-name = 100万穿过裂隙

# achievement note
ach-rift1e6-note = 把100万颗石子送过裂隙

# achievement name
ach-brew100-name = 100 锅

# achievement note
ach-brew100-note = 熬 100 锅

# achievement name
ach-lived1h-name = 一个钟头没换人

# achievement note
ach-lived1h-note = 让一个工人在册干满一小时

# achievement name
ach-nobodyhired-name = 一个没雇

# achievement note
ach-nobodyhired-note = 一个工人都不雇，清掉一整块巨石

# achievement name
ach-ownhand-name = 全凭一双手

# achievement note
ach-ownhand-note = 不让任何工人碰，清掉一块巨石

# achievement name
ach-nevertouched-name = 碰都没碰

# achievement note
ach-nevertouched-note = 自己一下都不凿，清掉一块巨石

# achievement name
ach-underminute-name = 一分钟内搞定一块石头

# achievement note
ach-underminute-note = 一分钟内清掉一块巨石

# achievement name
ach-everyjob-name = 每个岗位都有人

# achievement note
ach-everyjob-note = 同时让每个岗位至少有一个人

# achievement name
ach-tablebeaten-name = 我们又行了

# achievement note
ach-tablebeaten-note = 在赌场一把赢 5万

# achievement name
ach-tableruin-name = 该去借贷了

# achievement note
ach-tableruin-note = 在赌场一把输 5万

# achievement name
ach-bird-name = 滚出我的地盘

# achievement note
ach-bird-note = 吓跑一只鸟

# achievement name
ach-wholelot-name = 一个都别想留

# achievement note
ach-wholelot-note = 把一块地上的鸟全吓跑

# achievement name
ach-catchall-name = 杂耍艺人

# achievement note
ach-catchall-note = 扔出一大把最满的尘土，接住每一粒

# achievement name
ach-lifted-name = 过来吧你

# achievement note
ach-lifted-note = 拎起一个工人

# achievement name
ach-shookload-name = 把口袋翻出来

# achievement note
ach-shookload-note = 从工人身上抖出满满一担

# achievement name
ach-hatoff-name = 脱帽致敬

# achievement note
ach-hatoff-note = 把工人的帽子抖掉

# achievement name
ach-dizzy-name = 婴儿摇晃综合征

# achievement note
ach-dizzy-note = 把工人晃晕

# achievement name
ach-muckrain-name = 屋漏偏逢连夜雨

# achievement note
ach-muckrain-note = 熬过一场污泥雨

# achievement name: rocks cleared; $n is the count as written (10, 25, 50, 100)
ach-rocks-name = { $n } 块石头

# achievement note: rocks cleared; $n is the count
ach-rocks-note = 清掉 { $n } 块巨石

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = 清掉 { $n } 块巨石，石头可真多

# achievement name: pebbles banked; $n is the count, short (10k, 1m)
ach-pebbles-name = { $n } 颗石子

# achievement note: pebbles banked; $n is the count, short
ach-pebbles-note = 往坑里存 { $n } 颗石子

# achievement name: crew hired; $n is the count
ach-crew-name = { $n } 个方块

# achievement note: crew hired; $n is the count
ach-crew-note = 雇一支 { $n } 人的队伍

# achievement name: the first ore ladder rung
ach-ore0-name = 1千矿石出坑

# achievement name: the second ore ladder rung
ach-ore1-name = 1万矿石

# achievement note: ore dug; $n is the count, short (1k, 10k)
ach-ore-note = 从采石场挖出 { $n } 矿石

## Index

# index entry name
idx-dust-name = 石子

# index entry text
idx-dust-text = 从巨石上凿下来的。

# index entry name
idx-shard-name = 矿石

# index entry text
idx-shard-text = 从采石场挖出来的。

# index entry name
idx-spore-name = 作物

# index entry text
idx-spore-text = 农场里种出来的。

# index entry name
idx-spark-name = 火花

# index entry text
idx-spark-text = 巫师用闪电从星星上劈下来的。

# index entry name
idx-scale-name = 鳞片

# index entry text
idx-scale-text = 从巨蛇掉下的东西里碾出来的。

# index entry name
idx-crit-name = 暴击

# index entry text
idx-crit-text = 有几率造成更多伤害。

# index entry name
idx-rock-name = 巨石

# index entry text
idx-rock-text = 压扁了你的妻子，能凿出值钱的石子。

# index entry name
idx-pit-name = 坑

# index entry text
idx-pit-text = 把石子和别的什么都扔进来存着。

# index entry name
idx-rift-name = 裂隙

# index entry text
idx-rift-text = 石子太密集，把现实撕开了？

# index entry name
idx-abyss-name = 深渊

# index entry text
idx-abyss-text = 裂隙吞了太多石子，撑不住了，把整个坑都吞了进去。

# index entry name
idx-muck-name = 污泥

# index entry text
idx-muck-text = 污染破坏生态，下雨留下一堆堆脏东西。

# index entry name
idx-poop-name = 便便

# index entry text
idx-poop-text = 咦。

# index entry name
idx-bird-name = 鸟

# index entry text
idx-bird-text = 普通的鸟。

# index entry name
idx-house-name = 房子

# index entry text
idx-house-text = 工人住的地方。

# index entry name
idx-pollution-name = 污染

# index entry text
idx-pollution-text = 工业的代价。凿石、种地、采石、施法，全都产生污染，把空气弄脏。

# index entry name
idx-star-name = 星星

# index entry text
idx-star-text = 巫师用魔法造出的真星星，劈开它得火花。

# index entry name
idx-balloon-name = 气球

# index entry text
idx-balloon-text = 装着空气过滤器，把云里的污染清掉。

# index entry name
idx-recycler-name = 回收器

# index entry text
idx-recycler-text = 把空气污染浓缩成能用的石子。

# index entry name
idx-bench-name = 工作台

# index entry text
idx-bench-text = 基本就是个小卖部。搬运升级、手动升级、新建筑。

# index entry name
idx-shack-name = 小屋

# index entry text
idx-shack-text = 买矿工升级的店。

# index entry name
idx-stats-name = 账本

# index entry text
idx-stats-text = 记着你这局的各种数据：收入、游戏时间。

# index entry name
idx-farm-name = 农场

# index entry text
idx-farm-text = 种作物的田。

# index entry name
idx-quarry-name = 采石场

# index entry text
idx-quarry-text = 往深处挖矿。

# index entry name
idx-apothecary-name = 药铺

# index entry text
idx-apothecary-text = 熬药的地方。

# index entry name
idx-tower-name = 巫师塔

# index entry text
idx-tower-text = 巫师的家。

# index entry name
idx-casino-name = 赌场

# index entry text
idx-casino-text = 钉板赌场。

# index entry name
idx-outhouse-name = 清洁间

# index entry text
idx-outhouse-text = 清洁工的家。

# index entry name
idx-filter-name = 空气过滤器

# index entry text
idx-filter-text = 把污染从天上抽走。

# index entry name
idx-ram-name = 撞锤

# index entry text
idx-ram-text = 飞快地凿穿巨石。

# index entry name
idx-jaw-name = 钻机

# index entry text
idx-jaw-text = 快速挖掘用的机器钻。

# index entry name
idx-tiller-name = 耕作机

# index entry text
idx-tiller-text = 拖拉机三两下就把作物收拾好。

# index entry name
idx-belt-name = 传送带

# index entry text
idx-belt-text = 自动把石子倒进坑里。

# index entry name
idx-sphere-name = 球体

# index entry text
idx-sphere-text = 戴森球，收集星星的能量。

# index entry name
idx-roomba-name = 扫地机器人

# index entry text
idx-roomba-text = 自动清理脏乱的吸尘器。

# index entry name
idx-driver-name = 叉车

# index entry text
idx-driver-text = 自动叉车，飞快地运送大批资源。

# index entry name
idx-props-name = 木头屏障

# index entry text
idx-props-text = 想挡住巨石的拼命一试。

# index entry name
idx-net-name = 网

# index entry text
idx-net-text = 用作物编张网，接住巨石，让它慢下来。

# index entry name
idx-arch-name = 拱

# index entry text
idx-arch-text = 结实的石头金属拱，试着挡住巨石。

# index entry name
idx-dome-name = 屏障

# index entry text
idx-dome-text = 巫师召唤的能量屏障。

# index entry name
idx-deep-name = 深渊

# index entry text
idx-deep-text = 不全是太空，也不全是海洋，介于两者之间。

# index entry name
idx-portal-name = 传送门

# index entry text
idx-portal-text = 进出深渊的唯一通道。

# index entry name
idx-crusher-name = 碾碎机

# index entry text
idx-crusher-text = 存放深处鳞片的地方。

# index entry name
idx-pods-name = 舱

# index entry text
idx-pods-text = 给深渊工人住的舱。

# index entry text
idx-haul-text = 把石子运进坑里。

# index entry name
idx-rockcrew-name = 凿石工

# index entry text
idx-rockcrew-text = 凿巨石。

# index entry name
idx-quarrycrew-name = 矿工

# index entry text
idx-quarrycrew-text = 在采石场挖矿。

# index entry name
idx-farmcrew-name = 农夫

# index entry text
idx-farmcrew-text = 种作物。

# index entry name
idx-purify-name = 空气净化工

# index entry text
idx-purify-text = 开着净化气球满天转，清理天空。

# index entry name
idx-stir-name = 药剂师

# index entry text
idx-stir-text = 负责一锅药。

# index entry text
idx-janitor-text = 清理便便和污泥。

# index entry text
idx-wizard-text = 有学问的魔法使用者，能从星星上劈下碎块。

# index entry text
idx-build-text = 盖房子，造机器。

# index entry name
idx-breaker-name = 破石手

# index entry text
idx-breaker-text = 凿巨石时力道大得多。

# index entry name
idx-carter-name = 车夫

# index entry text
idx-carter-text = 搬运工可以拉辆车，运量翻倍。

# index entry name
idx-blaster-name = 爆破手

# index entry text
idx-blaster-text = 带着小炸药，好好地把矿石炸出来。

# index entry name
idx-grower-name = 园丁

# index entry text
idx-grower-text = 照料作物的效率翻倍。

# index entry name
idx-brews-name = 药剂

# index entry text
idx-brews-text = 药铺特制的药剂。

# index entry text
idx-party-text = 一支勇敢的冒险队，愿意拼上性命打败巨蛇。

# index entry name
idx-sqwife-name = 妻子

# index entry text
idx-sqwife-text = 本来好好过日子，直到出了那件（些）事，被困在天上没完没了掉下来的巨石底下。离谱。

# index entry name
idx-notices-name = 成就

# index entry text
idx-notices-text = 场地的里程碑。

# index entry name
idx-serpent-name = 巨蛇

# index entry text
idx-serpent-text = 栖息在深渊里的某种怪异的蛇状生物。

## Jobs

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = 凿石工

# a job, as the boards, the crew and the index say it (the save's key is haulers)
job-haulers = 搬运工

# a job, as the boards, the crew and the index say it (the save's key is quarriers)
job-quarriers = 矿工

# a job, as the boards, the crew and the index say it (the save's key is farmhands)
job-farmhands = 农夫

# a job, as the boards, the crew and the index say it (the save's key is scholars)
job-scholars = 学者

# a job, as the boards, the crew and the index say it (the save's key is purifiers)
job-purifiers = 空气净化工

# a job, as the boards, the crew and the index say it (the save's key is stirrers)
job-stirrers = 药剂师

# a job, as the boards, the crew and the index say it (the save's key is janitors)
job-janitors = 清洁工

# a job, as the boards, the crew and the index say it (the save's key is wizards)
job-wizards = 巫师

# a job, as the boards, the crew and the index say it (the save's key is builders)
job-builders = 建筑工

# a job, as the boards, the crew and the index say it (the save's key is fighters)
job-fighters = 战士

# a job, as the boards, the crew and the index say it (the save's key is gatherers)
job-gatherers = 采集工

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = 深处建造工

## Boards

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/秒

# a row's unit: so many a minute; $icon is the coin's mark (html)
unit-per-min = { $icon }/分钟

# a row's unit: so many a dig; $icon is the coin's mark (html)
unit-per-dig = { $icon }/次挖掘

# a row's unit: so many a harvest; $icon is the coin's mark (html)
unit-per-harvest = { $icon }/次收成

# a row's unit after its number: swings a second
unit-hits-s = 击/秒

# a row's unit after its number: swings a second, from one
unit-hit-s = 击/秒

# a row's unit after its number: throws a second
unit-throws-s = 投/秒

# a row's unit after its number: a wizard's bolts a minute
unit-bolts-min = 道闪电/分钟

# a row's unit after its number: star cells a bolt knocks off
unit-cells-bolt = 格/道闪电

# a row's unit after its number: haze a balloon takes in a second
unit-motes-s = 粒/秒

# a row's unit after its number: farm plots
unit-plots = 块田

# a row's unit after its number: the quarry's shovels
unit-shovels = 把铲子

# a row's unit after its number: the apothecary's pots
unit-pots = 口锅

# a row's unit after its number: doses a batch
unit-doses = 剂

# a unit after a number: seconds
unit-s = 秒

# a deep row's unit after its number: damage
unit-dmg = 伤害

# a deep row's unit after its number: damage a second
unit-dmg-s = 伤害/秒

# a brew's unit after its percentage: how much faster
unit-faster = 更快

# a brew's unit after its percentage: how much stronger
unit-stronger = 更强

# a brew's unit after its number: crit chance
unit-crit = 暴击

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower =
    { $more ->
        [yes] 再买 { $left } 个园丁以解锁
       *[no] 买 { $left } 个园丁以解锁
    }

# a machine's row until its station's set of blaster hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-blaster =
    { $more ->
        [yes] 再买 { $left } 个爆破手以解锁
       *[no] 买 { $left } 个爆破手以解锁
    }

# a price in time, a minute or more: $n minutes
price-min = { $n } 分钟

# a row's verb, before its gain: how much a hand holds
does-hold = 握

# the bench: your carry ladder
row-carry = 携带量

# a row's verb, before its gain: swings
does-hit = 击

# the bench: your swing pace ladder
row-speed = 自动挥击

# a row's verb, before its gain: throws
does-throw = 投

# the bench: how often a held hand lets go
row-toss = 投掷节奏

# a row's verb, before its gain: how far a throw carries
does-reach = 距离

# the bench: how far a handful carries
row-reach = 投掷距离

# a row's verb, before its gain: what a swing takes
does-per-swing = 每击

# the bench: what a swing of yours takes
row-pick = 镐伤害

# the bench: holding a handful throws it by itself
row-autotoss = 按住自动扔

# the bench: holding the pointer on the boulder swings by itself
row-auto = 按住自动凿

# a row's verb, before its gain: how much a body carries
does-carry = 运量

# the bench: the haulers' load ladder
row-haulcarry = 搬运工运量

# a row's verb, before its gain: walking pace
does-walk = 步速

# the bench: the haulers' pace ladder
row-haulpace = 搬运工速度

# a row's verb, before its gain: crits
does-crit = 暴击

# the bench: the chance a hit is a crit
row-critchance = 暴击率

# the bench: how much more a crit takes
row-critmult = 暴击伤害

# the shack: the diggers' swing pace ladder
row-rockhandspeed = 挥击速度

# the shack: what a digger's swing takes
row-rockhandpick = 凿石工镐伤害

# the bench: the row that puts up the apothecary
row-unlockapothecary = 建造药铺

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = 给你的方工们熬临时增益

# the bench: what the apothecary row gives, where a gain would go
row-unlockapothecary-blurb = 熬工人补药

# the bench: the row that puts up the casino
row-unlockcasino = 建造赌场

# the bench: what the casino is for, under its name
row-unlockcasino-note = 一张收赌注、赔双倍或输光的桌子

# the bench: what the casino row gives, where a gain would go
row-unlockcasino-blurb = 翻倍或输光

# the bench: the row that puts up the farm
row-unlockfarm = 建造农场

# the bench: what the farm is for, under its name
row-unlockfarm-note = 种点作物

# the bench: what the farm row gives, where a gain would go
row-unlockfarm-blurb = 种作物

# the bench: the row that puts up the air filter
row-unlockfilter = 建造空气过滤器

# the bench: what the air filter is for, under its name
row-unlockfilter-note = 出售把雾霾从天上吸回来的气球，还能看天色

# the bench: what the air filter row gives, where a gain would go
row-unlockfilter-blurb = 清理天空

# the bench: the row that puts up the janitor's closet
row-unlockouthouse = 建造清洁间

# the bench: what the closet is for, under its name
row-unlockouthouse-note = 便便看够了吧，清一清

# the bench: what the closet row gives, where a gain would go
row-unlockouthouse-blurb = 便便清干净

# the bench: the row that puts up the quarry
row-unlockquarry = 建造采石场

# the bench: what the quarry is for, under its name
row-unlockquarry-note = 开始挖矿

# the bench: what the quarry row gives, where a gain would go
row-unlockquarry-blurb = 挖矿

# the bench: the row that puts up the shack
row-unlockshack = 建造小屋

# the bench: what the shack is for, under its name
row-unlockshack-note = 挖掘升级

# the bench: what the shack row gives, where a gain would go
row-unlockshack-blurb = 凿石装备

# the bench: the row that puts up the tower
row-unlocktower = 发现巫师塔

# the bench: what the tower is for, under its name
row-unlocktower-note = 召唤几个巫师

# the bench: the first barrier against the boulder
row-props = 木头屏障

# the bench: the wooden barrier's line
row-props-note = 赶紧搭个屏障，救你的妻子

# the bench: the second barrier
row-net = 网

# the bench: the net's line
row-net-note = 没用，试试用网接住巨石？

# the bench: the third barrier
row-arch = 凿出石拱

# the bench: the arch's line
row-arch-note = 还不够结实。砌个石拱吧。

# the tower: the last barrier, the wizards'
row-dome = 也许巫师知道？

# the tower: the last barrier's line
row-dome-note = 地上的一切都失败了。剩下的不属于地上

# a hat's name: the diggers' (its row, the index, the crew)
kit-breaker = 破石手

# what the breaker hat does
kit-breaker-does = 两倍啃劲

# where the breaker hat is worn
kit-breaker-place = 巨石

# a hat's name: the haulers' cart
kit-carter = 车夫

# what the cart does
kit-carter-does = 运量翻倍

# where the cart is used
kit-carter-place = 坑

# a hat's name: the miners'
kit-blaster = 爆破手

# what the blaster hat does
kit-blaster-does = 趟数翻倍

# where the blaster hat is worn
kit-blaster-place = 采石场

# a hat's name: the farmers'
kit-grower = 园丁

# what the grower hat does
kit-grower-does = 照料翻倍

# where the grower hat is worn
kit-grower-place = 农场

# the bench: a forklift that drives itself
row-driver = 叉车

# the bench: the forklift's line
row-driver-note = 自己开的叉车：没人驾驶也能运到坑边，还冒烟

# the bench: the forklifts' load ladder
row-liftload = 叉车载量

# a row's verb, before its gain: driving pace
does-drive = 车速

# the bench: the forklifts' pace ladder
row-liftpace = 叉车速度

# a heading on the bench's board: your own ladders
sect-you = 你

# a heading on the bench's board: the crit ladders
sect-luck = 幸运一击

# a heading on the bench's board: the haulers' gear
sect-haulers = 搬运工

# a heading on the bench's board: the rows that put up a new place
sect-build = 建造

# the house's board: buy another house to hire somebody
row-house = 再盖一栋房子

# the ribbon on every goal card: the barrier the story is on
goal-title = 拯救你的妻子

# a card greyed out: its next rung costs crops, and there is no farm yet
needs-spore = 需要作物

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = 需要采石场

# a card greyed out: its next rung costs a spark, and none has been earned
needs-spark = 需要火花

# a card greyed out: its next rung costs a scale, and the deep is not open
needs-scale = 需要鳞片

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }：{ $does }，在{ $place }

# the shack: the ram's tuning ladder
row-tuneram = 撞锤冲击

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = 撞锤的力道变为 { $n } 倍

# a heading on any board over the rows no section names
sect-and = 其他

# a card the yard is at: somebody is building it (the strip's word with nothing to hand back; the gain line's word)
card-building = 建造中

# the strip at a card's foot: buy another copy behind the one being built
card-another = + 再来一个

# a card in line: nobody is at it yet
card-queued = 排队中

# a finished ladder, where its price would go
card-done = 完成

# the tower: an enchantment's name
spell-drive = 加速机器

# the tower: the enchantment's line
spell-drive-note = 场地里每台机器快 50%

# the tower: an enchantment's name
spell-luck = 让采石场变富

# the tower: the enchantment's line
spell-luck-note = 采石场每次挖掘多出 25% 矿石

# the tower: an enchantment's name
spell-gmo = 转基因作物

# the tower: the enchantment's line
spell-gmo-note = 每份作物大 25%

# the tower: an enchantment's name
spell-thrift = 房子降价

# the tower: the enchantment's line
spell-thrift-note = 此后每栋房子便宜 75%

# the tower: an enchantment's name
spell-sweep = 加快清洁工

# the tower: the enchantment's line
spell-sweep-note = 清洁工铲和走都快一倍

# the tower: how often a wizard throws
row-wizspeed = 施法更快

# the tower: how often a wizard throws, its line; $pct is the rise a rung
row-wizspeed-note = 每个巫师朝星星放闪电的频率提高 { $pct }%

# a row's verb, before its gain: a wizard's casting
does-cast = 施法

# the tower: how much of the star a bolt takes
row-wizpower = 更重的闪电

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = 每道闪电从星星上打下 { $next } 格，而不是 { $now } 格

# the tower: a wizard's hat
row-wizard = 召唤巫师

# the tower: a wizard's line
row-wizard-note = 飞上天用闪电把星星打成火花，天空空了就召来新的一颗

# the tower: the sphere's line
row-sphere-note = 捕获一颗星星的能量

# the tower: the sphere's tuning ladder
row-tunesphere = 球体产量

# the tower: the sphere's tuning ladder, its line; $n is how many times the light
row-tunesphere-note = 球体捕获的光变为 { $n } 倍

# the tower: the barrier the wizards pour
row-dome-tower = 召唤屏障

# the tower: the barrier's line
row-dome-tower-note = 什么都过不了这玩意儿。

# the tower: the way down to the deep
row-portal = 召唤传送门

# the tower: the portal's line
row-portal-note = 一条通往深渊的路，一直开着。

# a heading on the tower's board: the spells
sect-enchantments = 附魔

# a heading on the tower's board: the portal
sect-abyss = 深渊

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign (50%)
spell-drive-blurb = +{ $pct } 速度

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-luck-blurb = +{ $pct } 矿石

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-gmo-blurb = +{ $pct } 作物

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-thrift-blurb = 便宜 { $pct }

# the tower: what the enchantment gives, where a gain would go; $x is how many times
spell-sweep-blurb = { $x } 倍速

# the farm: what a harvest is worth, a ladder
row-crop = 作物产量

# a row's verb, before its gain: tending plots
does-tend = 照料

# the farm: how often a plot is tended, a ladder
row-tend = 耕作速度

# the farm: break another plot
row-farmplot = 再开一块田

# the farm: the tiller's tuning ladder
row-tunetiller = 耕作机节奏

# the farm: the tiller's tuning ladder, its line; $n is how many times faster
row-tunetiller-note = 耕作机速度变为 { $n } 倍

# a heading on the farm's board: what a plot pays
sect-crop = 作物

# the quarry: what a dig turns up, a ladder
row-seam = 矿石产量

# a row's verb, before its gain: digging
does-dig = 挖掘

# the quarry: how often a dig happens, a ladder
row-quarrypace = 采矿速度

# the quarry: another miner's shovel at the face
row-quarrybench = 再加一把铲子

# the quarry: the drill's tuning ladder
row-tunejaw = 钻机咬劲

# the quarry: the drill's tuning ladder, its line; $n is how many times harder
row-tunejaw-note = 钻机的咬劲变为 { $n } 倍

# a heading on the quarry's board: what the hole pays
sect-ore = 矿石

# a heading on the farm's board over who works the plots, with their headcount (the job's save key, as it has always read)
sect-farmhands = 农工

# a heading on the quarry's board over who works the cut, with their headcount (the job's save key, as it has always read)
sect-quarriers = 采石工

# a row's verb, before its gain: a balloon's flight
does-fly = 飞行

# the air filter: how fast the balloons go from cloud to cloud
row-balloonspeed = 气球速度

# a row's verb, before its gain: what a balloon takes in
does-filter = 过滤

# the air filter: how much haze a balloon draws
row-power = 气球功率

# the air filter: another balloon
row-balloon = 气球

# the air filter: the balloon's line
row-balloon-note = 乘着云飘，接住的东西从它下面落下

# the air filter: the recycler
row-recycler = 回收器

# the air filter: the recycler's line
row-recycler-note = 气球接住的东西落下来变成石子，而不是污泥

# a heading on the air filter's board
sect-equipment = 装备

# the janitor's closet: the second cap on the stand
row-loopost = 再挂一顶帽子

# the janitor's closet: another roomba
row-roomba = 扫地机器人

# the janitor's closet: the roomba's line
row-roomba-note = 开到场地上的脏乱处把它运回家；一个清洁工看着它们，它们会冒烟

# the janitor's closet: the roombas' tuning ladder
row-tuneroomba = 扫地机器人吸力

# the janitor's closet: the roombas' tuning ladder, its line; $n is how many times faster
row-tuneroomba-note = 扫地机器人的吸入速度变为 { $n } 倍

# a brew's name: the speed one, priced in crops
tonic-stew = 浓汤

# a brew's name: the strength one, priced in ore
tonic-strong = 烈药

# a brew's name: the crit one, priced in sparks
tonic-brace = 提神补药

# the apothecary: keep the fires going, or let them die once a batch is dealt (a setting)
row-potkeep = 一直熬

# the apothecary's keep-brewing setting: on
row-potkeep-on = 一锅接一锅

# the apothecary's keep-brewing setting: off
row-potkeep-off = 就这一锅

# the apothecary: room for one more pot and its stirrer
row-anotherpot = 再来一口锅

# a row's verb, before its gain: how long a dose lasts
does-lasts = 持续

# the apothecary: how long a dose lasts, a ladder
row-bufflength = 药剂浓度

# the apothecary: doses a batch, a ladder
row-brewdoses = 每锅剂量

# a heading on the apothecary's board over the pots, with the stirrers' headcount
sect-pot = 锅

# a heading on the apothecary's board
sect-brewing = 熬药

# a heading on the apothecary's board: one ladder a brew
sect-potency = 药效

# a brew's potency row's verb, before its gain
does-faster = 更快

# a brew's potency row's verb, before its gain
does-stronger = 更强

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }，{ $secs } 秒

# what the crit brew does: $v points of crit chance for $secs seconds
tonic-gain-crit = +{ $v } 暴击，{ $secs } 秒

# the shack's heading over the diggers' gear, with their headcount
sect-diggers = 凿石工

## Machines

# a machine's name: the quarry's (the save's key is jaw)
machine-jaw = 钻机

# a machine's name: the boulder's
machine-ram = 撞锤

# a machine's name: the farm's
machine-tiller = 耕作机

# a machine's name: carries pebbles from the boulder to the hole
machine-belt = 传送带

# a machine's name: the shell round the star
machine-sphere = 球体

# a machine's name: the janitor's closet's
machine-roomba = 扫地机器人

## Stations

# a deep station's board with nothing on it yet
station-party-empty = 还没什么可学的

# a station's name: its board's title, the pointer's label, the queue card
station-casino = 赌场

# a station's name
station-filter = 空气过滤器

# the air filter's board with nothing on it
station-filter-empty = 没什么可装的

# a station's name
station-quarry = 采石场

# the quarry's board with nothing on it
station-quarry-empty = 采石场已经挖到底了

# a station's name
station-farm = 农场

# the farm's board with nothing on it
station-farm-empty = 地全开垦完了

# a station's name
station-apothecary = 药铺

# the apothecary's board with nothing on it
station-apothecary-empty = 锅是冷的

# a station's name
station-tower = 巫师塔

# the tower's board with nothing on it
station-tower-empty = 这里还没什么动静

# a station's name
station-shack = 小屋

# the shack's board with nothing on it
station-shack-empty = 工具都在巨石那边

# the bench's board with nothing on it
station-bench-empty = 没什么可卖的

# a station's name
station-outhouse = 清洁间

# the janitor's closet's board with nothing on it
station-outhouse-empty = 扫帚都挂在钩子上

# a station's name
station-house = 房子

# a station's name: the noticeboard over the pit
station-stats = 账本

# the books with nothing on them
station-stats-empty = 还什么都没进账

# a station's name: the deep's purse
station-crusher = 碾碎机

# the crusher's pile-full mark, on a hover
station-crusher-full = 地上堆满了鳞片

# a station's name: the deep's houses
station-pods = 舱

# the pods' board with nothing on it
station-pods-empty = 没什么可建的

# the lab's board title, still in the page's markup (the lab itself is gone)
station-lab = 实验室

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (An eighth like-named station reads "undefined": what the code said before the words moved here, kept by the owner; the deep has seven.)
station-party =
    { $nth ->
        [0] { $who }
        [1] 第二个{ $who }
        [2] 第三个{ $who }
        [3] 第四个{ $who }
        [4] 第五个{ $who }
        [5] 第六个{ $who }
        [6] 第七个{ $who }
       *[other] 第undefined个{ $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (an eighth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] 一座站点
        [1] 第二座站点
        [2] 第三座站点
        [3] 第四座站点
        [4] 第五座站点
        [5] 第六座站点
        [6] 第七座站点
       *[other] 第undefined座站点
    }

## Crew

# the crew window: where a body is, standing at its station (rockhands)
crew-at-rockhands = 在巨石上

# the crew window: where a body is, standing at its station (haulers)
crew-at-haulers = 在坑边

# the crew window: where a body is, standing at its station (quarriers)
crew-at-quarriers = 在采石场

# the crew window: where a body is, standing at its station (farmhands)
crew-at-farmhands = 在田里

# the crew window: where a body is, standing at its station (purifiers)
crew-at-purifiers = 在空气过滤器

# the crew window: where a body is, standing at its station (janitors)
crew-at-janitors = 在打扫

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = 在你手里

# the crew window and a body's card: where a body is (falling)
crew-where-falling = 在半空

# the crew window and a body's card: where a body is (home)
crew-where-home = 在家

# the crew window and a body's card: where a body is (basket)
crew-where-basket = 在气球上

# the crew window and a body's card: where a body is (yard)
crew-where-yard = 在场地上

# the crew window and a body's card: where a body is (resting)
crew-where-resting = 在休息

# the crew window and a body's card: where a body is (walking)
crew-where-walking = 在路上

# the crew window and a body's card: where a body is (deep)
crew-where-deep = 在深处

# a body's card, doing: at its job with no step to name (rockhands)
crew-does-rockhands = 凿石头

# a body's card, doing: at its job with no step to name (quarriers)
crew-does-quarriers = 采矿

# a body's card, doing: at its job with no step to name (farmhands)
crew-does-farmhands = 种地

# a body's card, doing: at its job with no step to name (scholars)
crew-does-scholars = 做研究

# a body's card, doing: at its job with no step to name (purifiers)
crew-does-purifiers = 净化空气

# a body's card, doing: at its job with no step to name (janitors)
crew-does-janitors = 铲东西

# a body's card, doing: at its job with no step to name (haulers)
crew-does-haulers = 运输

# a body's card, doing: what its step is (seek)
crew-now-seek = 找石子

# a body's card, doing: what its step is (dump)
crew-now-dump = 卸货

# a body's card, doing: what its step is (muck)
crew-now-muck = 铲脏东西

# a body's card, doing: what its step is (cut)
crew-now-cut = 在采石场挖

# a body's card, doing: what its step is (up)
crew-now-up = 往上爬

# a body's card, doing: what its step is (down)
crew-now-down = 往下爬

# a body's card, doing: what its step is (tend)
crew-now-tend = 照料田地

# a body's card, doing: what its step is (home)
crew-now-home = 回家

# a body's card, doing: what its step is (idle)
crew-now-idle = 没干啥

# a body's card, doing: what its step is (in)
crew-now-in = 在里面

# a body's card, doing: what its step is (aloft)
crew-now-aloft = 在气球上

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = 看管{ $name }

# a body's card, doing: what its step is (to)
crew-now-to = 走过去

# a body's card, doing: what its step is (kit)
crew-now-kit = 在工作台配装备

# a body's card, doing: what its step is (build)
crew-now-build = 建造中

# a body's card, doing: what its step is (working)
crew-now-working = 干活中

# a body with no name, on its card and in the crew window
crew-somebody = 某人

# a body's card: the label before how long it has been here (a column of ten in monospace)
crew-card-age = 工龄

# a body's card, age: under a minute
crew-card-new = 今天新来

# a body's card, age: $mins minutes
crew-card-mins = { $mins } 分钟

# a body's card: the label before what it is doing (a column of ten in monospace)
crew-card-doing = 在做

# a heading in the crew window over the yard's crew
crew-sect-yard = 场地

# a heading in the crew window over the deep's crew
crew-sect-deep = 深处

# a heading on the house's board, and the window it opens
crew-sect-crew = 工人们

## The books

# the books: a coin, before its rate
books-dust = 石子

# the books: a coin, before its rate
books-shard = 矿石

# the books: a coin, before its rate
books-spore = 作物

# the books: a coin, before its rate
books-spark = 火花

# the books: the window the rates are taken over, in minutes ($n may be ½)
books-over-min = { $n } 分钟

# the books: the row that steps the window the rates are taken over
books-over = 统计时长

# the books: the window, in a rate's note (nothing in the last half minute)
books-last-half = 最近半分钟

# the books: the window, in a rate's note
books-last-one = 最近一分钟

# the books: the window, in a rate's note; $n minutes, more than one
books-last-mins = 最近 { $n } 分钟

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $over }收入 { $n }

# the books: a rate's note when nothing came in
books-nothing = 零

# the books: a line
books-dirt-mach = 来自机器

# the books: a line
books-dirt-dust = 来自巨石

# the books: a line
books-dirt-shard = 来自采石场

# the books: a line
books-dirt-spore = 来自农场

# the books: the sky full in, while the filter is winning
books-due-never = 照这速度不会

# the books: a line
books-sky-trend = 污染

# the books: a line
books-sky-up = 每分钟排放

# the books: a line
books-sky-down = 每分钟清除

# the books: a line
books-sky-haze = 天空

# the books: how full the sky is; $pct with its sign
books-sky-full = 已满 { $pct }

# the books: a line
books-sky-due = 多久会满

# the books: a line
books-sky-rains = 挨过的阵雨

# the books: a line
books-sky-muck = 地上的污泥

# the books: a line
books-working = 在干活

# the books: a line
books-idle = 闲着

# the books: a line
books-best-mined = 凿石最多

# the books: a line
books-best-quarried = 采矿最多

# the books: a line
books-best-farmed = 种地最多

# the books: a line
books-best-stored = 存进坑最多

# the books: a line
books-best-tidied = 清污最多

# the books: the longest on one clock, an hour or more; $n hours to a tenth
books-hours = { $n } 小时

# the books: the longest on one clock, under an hour; $n minutes
books-mins = { $n } 分钟

# the books: a line
books-eldest = 最长在职

# the books: a line
books-tally-rocks = 清掉的巨石

# the books: a line
books-tally-banked = 存进的石子

# the books: a line
books-tally-ore = 挖出的矿石

# the books: a coin earned over the whole game; $coin is books-shard, books-spore or books-spark
books-tally-earned = 赚到的{ $coin }

# the books: a line
books-tally-rift = 穿过裂隙

# the books: a line
books-tally-brews = 熬过的锅数

# the books: a line
books-tally-hats = 做完的帽子

# the books: a line
books-tally-crew = 在册人数

# the books: a line
books-tally-notes = 获得的成就

# the books: a line
books-tally-under = 妻子埋在石下已有

# the books: a line
books-tally-saved = 救出妻子用时

# a heading in the books, and on the noticeboard
books-sect-income = 每秒收入

# a heading in the books
books-sect-sky = 天空

# a heading in the books
books-sect-crew = 工人们

# a heading in the books
books-sect-tally = 总计

# the noticeboard: the way into the books (off the board for now)
books-open = 打开账本

# the noticeboard: how long this yard has been played
books-playtime = 游戏时间

## Hover

# the hover on a deep station whose Recruit still waits on its first choice
hover-choose = 选择一名战士

# the hover over a grain of ore
hover-ore = 矿石

# the hover over a crop, a grain of it or a grown plot
hover-crop = 作物

# the hover over a spark
hover-spark = 火花

# the hover over a pebble
hover-pebble = 石子

# the hover over the drowned pit
hover-abyss = 深渊

# the hover over the rift
hover-rift = 裂隙

# the hover over poop on the ground
hover-poop = 便便

# the hover over muck on the ground
hover-muck = 污泥

# the hover over a body, as the job it does (its type, rockhand)
hover-rockhand = 凿石工

# the hover over a body, as the job it does (its type, hauler)
hover-hauler = 搬运工

# the hover over a body, as the job it does (its type, quarrier)
hover-quarrier = 采石工

# the hover over a body, as the job it does (its type, farmhand)
hover-farmhand = 农工

# the hover over a body, as the job it does (its type, scholar)
hover-scholar = 学者

# the hover over a body, as the job it does (its type, purifier)
hover-purifier = 净化工

# the hover over a body, as the job it does (its type, stirrer)
hover-stirrer = 药剂师

# the hover over a body, as the job it does (its type, janitor)
hover-janitor = 清洁工

# the hover over a body, as the job it does (its type, wizard)
hover-wizard = 巫师

# the hover over a body, as the job it does (its type, builder)
hover-builder = 建筑工

# the hover over a body, as the job it does (its type, fighter)
hover-fighter = 战士

# the hover over a body, as the job it does (its type, gatherer)
hover-gatherer = 采集工

# the hover over a body, as the job it does (its type, delver)
hover-delver = 深处建造工

# the hover over the portal, from the deep
hover-portal-up = 传送门 — 上到场地

# the hover over the portal, from the yard
hover-portal-down = 传送门 — 下到深处

# the hover over the serpent
hover-serpent = 巨蛇

# the hover over the crew's houses
hover-house = 房子

# the hover over the boulder
hover-rock = 巨石

# the hover over a bird
hover-bird = 鸟

# the hover over a balloon
hover-balloon = 气球

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }，{ $way }

# the air filter's gauge: the sky filling faster than it is cleaned
hover-dial-worse = 越来越糟

# the air filter's gauge: the sky cleaned faster than it fills
hover-dial-better = 越来越好

# the air filter's gauge: neither
hover-dial-steady = 保持稳定

# the hover over the counter above the pit
hover-counter = 坑里的石子：一切都用它付

# the air filter's gauge: the needle in the first band
hover-dial-clean = 干净

# the air filter's gauge: the needle in the middle band
hover-dial-dirty = 脏

# the air filter's gauge: the needle in the last band
hover-dial-filthy = 脏透了

# the hover on a pile-full mark: a station's pile has nowhere left to go
hover-pile-full = 堆满了

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } 完成

# the hover on a done mark whose rows have no names
hover-done-work = 活干完了

# the casino's lever, by name (its hover and the pad's label)
lever-arm = 拉杆

# a pot's picker: the brew it is set to, when it is set to none
pot-nothing = 无

# a pot's picker: the heading over who the brew is for
pot-for = 给

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = 谁离得近给谁

## The deep

# a brawler's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-brawler-fork = 出拳更重，学会连招

# the brawler's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move = 连招

# what the brawler's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move-does = 连环出拳

# the brawler's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap = 击倒

# what the brawler's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap-does = { $stun }

# a sword's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sword-fork = 精通剑术

# the sword's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-move = 旋风斩

# what the sword's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-move-does = 砍得更重

# the sword's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap = 弱点

# what the sword's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap-does = { $bleed }

# a monk's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-monk-fork = 凝聚你的气

# the monk's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-move = 深呼吸

# what the monk's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-move-does = 聚气更快

# the monk's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap = 止水

# what the monk's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap-does = { $stun }

# a martial's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-martial-fork = 出手更快，收尾更快

# the martial's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-move = 华丽连击

# what the martial's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-move-does = 终结技更快

# the martial's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap = 重整旗鼓

# what the martial's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap-does = 全队{ $haste }

# a ranger's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-ranger-fork = 瞄准弱点

# the ranger's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move = 瞄准射击

# what the ranger's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move-does = 蓄力箭

# the ranger's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap = 钉身射击

# what the ranger's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap-does = { $stun }

# a assassin's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-assassin-fork = 出手快准狠

# the assassin's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move = 处决

# what the assassin's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move-does = 专打伤口

# the assassin's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap = 锯齿

# what the assassin's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap-does = { $bleed }

# a hexer's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-hexer-fork = 施放削弱咒

# the hexer's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move = 枯萎

# what the hexer's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move-does = 巨蛇受到更多伤害

# the hexer's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap = 束缚

# what the hexer's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap-does = { $held }，{ $exposed }

# a sapper's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sapper-fork = 学习爆破

# the sapper's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move = 粘弹

# what the sapper's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move-does = 先粘后炸

# the sapper's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap = 成双

# what the sapper's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap-does = 两颗炸弹，{ $stun }

# a mage's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-mage-fork = 引导强力光束

# the mage's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-move = 扩散

# what the mage's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-move-does = 光束更宽

# the mage's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap = 铝热剂

# what the mage's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap-does = 烧穿护甲

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = 让你的队伍获得{ $inspired }

# the bard's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-move = 颂歌

# what the bard's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-move-does = 双倍{ $inspired }

# the bard's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap = 节拍

# what the bard's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap-does = 全队{ $haste }

# a status, by name (bold in a line, under its icon)
status-stun = 眩晕

# a status, by name
status-bleed = 流血

# a status, by name
status-haste = 急速

# a status, by name
status-held = 禁锢

# a status, by name
status-exposed = 易伤

# a status, by name
status-inspired = 鼓舞

# what Stun does, after its name
status-stun-does = 定住不动，停止回复

# what Bleed does, after its name
status-bleed-does = 持续伤害

# what Haste does, after its name; $pct with its sign
status-haste-does = 攻击快 { $pct }

# what Held does, after its name
status-held-does = 无法回复

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = 多受 { $lo }-{ $hi } 伤害

# what Inspired does, after its name
status-inspired-does = 打得更狠

# a status's hover line: $name (status-…) and what it does
status-line = { $name }：{ $does }

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }：{ $does }

# a status's label under its icon when $n of it are on
status-label-n = { $name } x{ $n }

# a base fighter's line: the altar's (the Fighter)
base-altar-does = 出拳

# a base fighter's line: the well's (the Novice)
base-well-does = 练武

# a base fighter's line: the armory's (the Scout)
base-armory-does = 射箭

# a base fighter's line: the circle's (the Adept)
base-circle-does = 施咒

# a base fighter's line: the spire's (the Apprentice)
base-spire-does = 发射光束

# the Recruit's line, before its first choice
recruit-does = 轻轻一拳

# the Bard's line with nobody else fighting
rail-alone = 身边没人听歌

# a class that needs company, before there is any
rail-locked = 有第二座站点才开放

# a station's board at the fork: the heading over the two classes
rail-fork-ask = 专精

# a Recruit's board: the heading over its first choice
rail-recruit-ask = 选择你的战士

# a rung's number in its class's unit; $unit is unit-dmg or unit-dmg-s
rail-worth = { $n } { $unit }

# a rung's number for a class written in percent (the Bard)
rail-worth-pct = +{ $n }%

# a pip's hover line on a station's tree: $name (a fighter, a move) and $what (its number, or a few words)
rail-line = { $name }：{ $what }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = 成为{ $name }

# a station's board: stand the Recruit again, every rung handed back
rail-reset = 重置 – 全额退还

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-brawler = 斗士

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sword = 剑客

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-monk = 武僧

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = 武术家

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-ranger = 游侠

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-assassin = 刺客

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-hexer = 咒术师

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sapper = 工兵

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-mage = 法师

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-bard = 吟游诗人

# a base fighter's name: the altar's, below the fork
base-altar = 战士

# a base fighter's name: the well's
base-well = 新手

# a base fighter's name: the armory's
base-armory = 斥候

# a base fighter's name: the circle's
base-circle = 术士

# a base fighter's name: the spire's
base-spire = 学徒

# every station's first fighter, before its first choice
class-recruit = 新兵

# the serpent's lash, its tile's hover while it waits
serp-lash-calm = 鞭笞：眩晕近战攻击者

# the serpent's lash, its tile's hover while it is warned
serp-lash-coming = 鞭笞来袭

# the serpent's lash, its tile's hover while it is on
serp-lash-on = 鞭笞：眩晕近战攻击者

# the serpent's lash, its tile's hover once answered
serp-lash-stopped = 鞭笞：已打断

# the serpent's cloak, warned
serp-sink-coming = 隐身来袭

# the serpent's cloak, on
serp-sink-on = 隐身：够不着

# the serpent's constrict, warned
serp-orb-coming = 缠绕来袭

# the serpent's constrict, on
serp-orb-on = 缠绕

# the serpent's constrict, answered
serp-orb-stopped = 缠绕

# a fighter's tile: dazed, its hover
serp-dazed = 晕头转向：被甩开，眼冒金星

# a fighter's tile: constricted, its hover
serp-constricted = 被缠住

# the serpent's barrier, its tile's hover
serp-barrier = 屏障：吸收爆炸伤害

# the serpent's ward, its tile's hover
serp-ward = 结界：魔法伤害减半

# the serpent's plates, its tile's hover
serp-plates = 甲片：物理伤害减半

# the lash's tile, its label
serp-lash = 鞭笞

# the cloak's tile, its label
serp-sink = 隐身

# the constrict's tile, its label
serp-orb = 缠绕

# a fighter's dazed tile, its label
serp-dazed-name = 晕头转向

# a fighter's constricted tile, its label
serp-constricted-name = 被缠住

# the barrier's tile, its label
serp-barrier-name = 屏障

# the ward's tile, its label
serp-ward-name = 结界

# the plates' tile, its label
serp-plates-name = 甲片

# the pods: one more of the crew, living down here
row-pod = 再加一个舱

# the pods: the pod's line
row-pod-note = 深处远端的一个舱：又一个工人住在下面

# a deep station's board: the heading over its one fighter, with the count
rail-fighter = 战士

# the deep: the build of a new fighter's station (the queue card names it)
row-raise-station = 建一座站点

# the deep's build button: the first station costs no fang
build-free = 免费

# the serpent's level after the pips on its bar, from level 2 on; $n is the level.
# [owner's words: a level label, e.g. "Lv 7"] -- until then the bare number. Drawn in the pixel number font
# (NUM_FONT), which draws only the glyphs it has: words want their letters drawn into the font
serp-level = { $n }
