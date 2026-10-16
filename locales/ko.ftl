### Pebble Pit, in Korean (ko): every message in locales/en.ftl, same ids, same order.
### Drafted by Claude (Opus 5.5) on 2026-10-13 to locales/STYLE.md; not yet reviewed by a native speaker.
### The comment over each message is the English file's, saying where it shows.
### Messages still [owner's words: ...] in English are left out, so the English shows.

## Sheets

# rescue sheet heading, end of first half
saved-word = 끝난 건가?

# rescue sheet line; the span is the time it took, filled in by the game
saved-why = <span data-l10n-name="time"></span> 만에 아내를 구했다!

# rescue sheet dismiss button
saved-keepplaying = 오래오래 행복하게

# demo end sheet heading
demoend-word = 체험판은 여기까지!

# demo end sheet line
demoend-why = 아직은 아내를 구할 수 없다.

# demo end store link (if STORE_URL)
demoend-store = 찜 목록에 추가!

# demo end dismiss button
demoend-keep = 계속하기

# free-build teaser end sheet heading
teaseend-word = 다음 이야기는 정식판에서!

# teaser end store link (if STORE_URL)
teaseend-store = 정식판 받기

# teaser end dismiss button
teaseend-keep = 계속하기

# second-half end sheet heading
freed-word = 좋아, 이제 진짜 끝

# second-half end sheet line
freed-why = 구렁이 배 속에서 남편을 구했다.

# second-half end sheet line
freed-end = 이걸로 끝. 구렁이 사냥도 지상 농사도 계속해도 된다!

# second-half end sheet line
freed-thanks = 고마워!

# second-half end dismiss button
freed-keep = 계속하기

# crash sheet heading
crashed-word = 멈췄다

# crash sheet button
crashed-copysave = 저장 복사

# pause sheet heading
held-word = 일시정지

# pause sheet button
held-resume = 계속

# pause sheet button (relabelled from JS)
held-slotsbtn = 저장

# saves page heading
held-slots-word = 저장

# saves page button
held-savecopy = 저장 복사

# saves page button
held-loadsave = 저장 불러오기

# saves page paste box confirm
held-loadit = 불러오기

# saves page paste box cancel
held-nevermind = 됐어

# saves page back button
held-slotsback = 뒤로

# pause sheet button (relabelled from JS)
held-recordbtn = 업적

# achievements page heading
held-record-word = 업적

# achievements page back
held-recordback = 뒤로

# pause sheet button (also src/indexpage.js:24)
held-indexbtn = 도감

# index page heading
held-index-word = 도감

# index page back
held-indexback = 뒤로

# pause sheet button to landing page
held-titlebtn = 타이틀로

# pause sheet button, desktop build only
held-quit = 바탕화면으로 나가기

# pause sheet footer hint
held-keys = esc 일시정지 · ← → 둘러보기 · 스페이스 길게 눌러 장면 건너뛰기

# window close button label
modal-close =
    .aria-label = 닫기

# pause sheet reply, desktop export ok
said-saved = 저장됨

# pause sheet reply, desktop export failed
said-notsaved = 저장 안 됨

# pause sheet reply, store fallback
said-fellback = 마지막 저장을 불러오지 못했다; 이건 그 전 것

# pause sheet reply, unreadable save
said-broken = 마지막 저장을 읽을 수 없다. 저장 복사로 꺼낼 수 있다

# pause sheet reply, yard open elsewhere
said-yielded = 이 작업장은 다른 탭에 열려 있다; 저장은 그쪽에서

# pause sheet reply, storage blocked
said-unsaved-blocked = 저장 안 됨: 브라우저가 이 페이지의 저장을 막고 있다. 저장 복사는 여전히 된다

# sheet reply after loading a save
said-loaded = 불러옴

# sheet reply, pasted text invalid
said-notasave = 저장 데이터가 아니다

# crash sheet line when error has no message
crashed-why-fallback = 뭔가 오류가 났다

# save row age
slots-since-now = 방금

# save row age
slots-since-min = { $m }분 전

# save row age
slots-since-h = { $h }시간 전

# save row item
slots-row-rock = 바위 { $n }

# save row item
slots-row-crew = 일꾼 { $n }명

# save row item for open slot in play
slots-row-playing = 플레이 중

# save row, no yard
slots-row-empty = 빈칸

# save row, broken blob
slots-row-unreadable = 읽을 수 없음

# saves button label on both fronts
held-slotsbtn-label = 저장 · { $n }/{ $total }

# empty save row after first press
slots-arm = 새 작업장을 시작할까?

# sheet reply after opening empty slot
slots-said-new = 새 작업장

# sheet reply after opening a slot
slots-said-loaded = 불러옴

# save row delete cross label
slots-del-aria = 삭제

# achievements button label with count
held-recordbtn-label = 업적 · { $count }/{ $total }

# achievements page, nothing earned
held-record-none = 아직 아무것도 안 했다.

# saves row: how long ago it was saved, in whole days
slots-since-days = { $d }일 전

# saves row delete confirm
slots-confirm-yes = 삭제

# saves row delete cancel
slots-confirm-no = 뒤로

# sheet reply, copy with no save
said-copyout-none = 아직 저장된 게 없다

# sheet reply when clipboard unavailable
said-copyout-window = window.__save에 넣었다

# saves page cloud section heading
cloud-head = 클라우드 저장

# cloud section button
cloud-btn-linkcode = 연결 코드 입력

# cloud section button
cloud-btn-recovery = 복구 코드 사용

# cloud section button
cloud-btn-stop = 클라우드 저장 끄기

# cloud section reply after stop
cloud-said-off = 이 기기에서 클라우드는 꺼짐

# cloud section button
cloud-btn-enable = 클라우드 동기화 켜기

# cloud section reply on failure (also cloud.js:768)
cloud-why-noanswer = 클라우드가 응답하지 않았다

# cloud section, copy recovery code
cloud-btn-copy = 복사

# cloud section under recovery code
cloud-writedown = 적어 둘 것: 새 기기에서 작업장을 되찾는 열쇠

# cloud section, another device ahead
cloud-btn-take = 그걸로

# cloud section, another device ahead
cloud-btn-keep = 이걸 유지

# cloud section reply (also :316)
cloud-said-kept = 유지함

# cloud section above pairing code
cloud-pair-enter = 다른 기기에서 입력:

# cloud section, hide pairing code
cloud-btn-done = 완료

# cloud section button
cloud-btn-link = 기기 연결

# cloud section toggle
cloud-btn-hidecode = 복구 코드 숨기기

# cloud section toggle
cloud-btn-showcode = 복구 코드 보기

# cloud section button
cloud-btn-newcode = 새 복구 코드

# cloud section button, first press
cloud-btn-newcode-armed = 다른 기기 로그아웃?

# link code box placeholder
cloud-box-linkph = ···-···

# recovery code box placeholder
cloud-box-recph = ····-····-····

# link code box label
cloud-box-aria-link = 연결 코드

# recovery code box label
cloud-box-aria-rec = 복구 코드

# cloud section reply, bad code
cloud-wrong = 그 코드는 안 됐다

# cloud section reply after linking
cloud-said-linked = 연결됨

# cloud code entry confirm
cloud-btn-dolink = 연결

# cloud code entry cancel
cloud-btn-nevermind = 됐어

# cloud code entry prompt
cloud-typing-link = 다른 기기에 뜬 코드

# cloud code entry prompt
cloud-typing-rec = 네 복구 코드

# a cloud button's answer: the daily cap on tries is spent
cloud-why-today = 오늘 여기서 시도가 너무 많다; 내일 다시

# cloud section reply, 503
cloud-why-resting = 클라우드가 쉬는 중; 나중에 다시

# cloud section reply, 403
cloud-why-forbidden = 클라우드가 이 페이지를 모른다

# the cloud's line in the landing page's foot bar: $state is one of the cloud-state lines below
# (with no state, it stands before the choose-a-yard button)
cloud-line = 클라우드 · { $state }

# cloud state: not turned on (in cloud-line, and alone in the saves page section)
cloud-state-off = 꺼짐

# cloud state
cloud-state-out = 로그아웃됨

# cloud state
cloud-state-refused = 저장이 거부됐다

# cloud state
cloud-state-offline = 저장 안 됨: 오프라인

# cloud state
cloud-state-behind = 다른 기기가 더 최신

# cloud state
cloud-state-newer = 업데이트하면 최신 저장을 받는다

# cloud state
cloud-state-big = 클라우드엔 너무 크다

# cloud state
cloud-state-full = 클라우드가 가득 찼다

# cloud state
cloud-state-paused = 일시정지

# cloud state
cloud-state-conflict = 작업장 선택

# cloud state: saved; $since is how long ago, as a saves row says it (just now, 3 min ago)
cloud-state-saved = 저장됨 { $since }

# cloud state: on, nothing pushed yet
cloud-state-on = 켬

# link a device: the pairing code's countdown; $time is m:ss
cloud-pair-left = { $time } 남음

# choose a yard: this device's copy of slot $n; $here is the yard as a saves row says it
cloud-clash-here = 이 기기 · { $n } · { $here }

# choose a yard: the cloud's copy of slot $n; $cloud is the yard as a saves row says it
cloud-clash-cloud = 클라우드 · { $n } · { $cloud }

# a cloud button's answer: too many tries; $m is minutes to wait
cloud-why-wait = 시도가 너무 많다; { $m }분 뒤에 다시

# window title opened off the books
modal-books = 장부

# window title, crew list
modal-crew = 여기 사는 이들

## Settings

# pause sheet button
held-settingsbtn = 설정

# settings page heading
held-settings-word = 설정

# settings note where fullscreen unavailable
set-fullscreen-note = 전체 화면으로 보려면 이 페이지를 홈 화면에 추가

# settings volume slider label
set-volume =
    .aria-label = 볼륨

# settings tab strip: the touch switch and the controls table
set-tab-controls = 조작

# controls page back
set-controlsback = 뒤로

# settings page back
set-settingsback = 뒤로

# settings motion switch
set-motion-less = 움직임: 적게

# settings motion switch
set-motion-full = 움직임: 전부

# settings touch switch (play only)
set-touch-on = 터치: 켬

# settings touch switch (play only)
set-touch-off = 터치: 끔

# settings dark switch
set-dark-on = 어둡게: 켬

# settings dark switch
set-dark-off = 어둡게: 끔

# settings sound switch
set-sound-off = 소리: 끔

# settings sound switch
set-sound-on = 소리: 켬

# pause sheet line: a save from a newer build; $build is the build's name
said-newer = 더 새 빌드에서 만든 저장이다 ({ $build })

# pause sheet line: storage full; $used is megabytes used (one decimal), $ours kilobytes
said-unsaved-full = 저장 안 됨: 이 사이트 저장 공간이 가득 참 ({ $used } mb 사용, 그중 { $ours } kb가 우리 것). 저장 복사는 여전히 된다

# pause sheet line: storage refused a save; $name is the browser's error name
said-unsaved-refused = 저장 안 됨: 저장 공간이 저장을 거부했다 ({ $name }). 저장 복사는 여전히 된다

# pause sheet line: storage refused a save, with no error to name
said-unsaved-refused-why = 저장 안 됨: 저장 공간이 저장을 거부했다. 저장 복사는 여전히 된다

# pause sheet line: a pasted save threw; $message is the error's own words
said-couldnotload = 불러오기 실패: { $message }

# controls page input column
ctl-leftclick-in = 왼쪽 클릭

# controls page action column
ctl-leftclick-do = 상호작용

# controls page input column
ctl-rightclick-in = 오른쪽 클릭

# controls page action column
ctl-rightclick-do = 일꾼 포커스

# controls page input column
ctl-rightleft-in = 오른쪽 클릭 + 왼쪽 클릭

# controls page action column
ctl-rightleft-do = 일꾼 들어 올리기

# controls page input column
ctl-middle-in = 가운데 클릭

# controls page action column
ctl-middle-do = 카메라 이동

# controls page input column
ctl-wheel-in = 휠 스크롤

# controls page action column
ctl-wheel-do = 카메라 이동

# controls page input column
ctl-arrows-in = ← → / a d

# controls page action column
ctl-arrows-do = 카메라 이동

# controls page input column
ctl-digits-in = 1 – 9

# controls page action column
ctl-digits-do = 장소로 이동

# settings fullscreen row
set-fullscreen-on = 전체 화면: 켬

# settings fullscreen row
set-fullscreen-off = 전체 화면: 끔

# a sheet line: the save is on the clipboard; $n is its size in kilobytes
said-copyout-copied = { $n }kb 복사함

## Title page

# browser tab title, landing
title-doctitle = Pebble Pit

# landing page game name
title-gamename = pebble<br>pit

# landing page tagline
title-line = 바위 하나. 구덩이 하나. 그 사이에 몇 사람.

# landing page main button
title-play = 시작

# landing page button (relabelled saves · n of 3)
title-slotsbtn = 저장

# landing page button (relabelled, src/record.js:33)
title-recordbtn = 업적

# landing page button
title-settingsbtn = 설정

# landing page, desktop build only
title-quit = 바탕화면으로 나가기

# landing saves page heading
title-slots-word = 저장

# landing saves page button
title-savecopy = 저장 복사

# landing saves page button
title-loadsave = 저장 불러오기

# landing paste confirm
title-loadit = 불러오기

# landing paste cancel
title-nevermind = 됐어

# landing saves page back
title-slotsback = 뒤로

# landing achievements page heading
title-record-word = 업적

# landing achievements page back
title-recordback = 뒤로

# landing settings page heading
title-settings-word = 설정

# landing settings back
title-settingsback = 뒤로

# landing controls back
title-controlsback = 뒤로

# landing cloud conflict page heading
title-conflict-word = 작업장 선택

# landing cloud conflict back
title-conflictback = 뒤로

# landing foot link
title-link-itch = itch

# landing foot link
title-link-github = github

# under play, empty open slot
title-playlabel-new = 새 작업장

# landing achievements page, nothing earned
title-record-none = 아직 없음

# title foot bar conflict link
cloud-foot-choose = 작업장 선택

# landing reply, bad paste
title-said-notasave = 저장 데이터가 아니다

# landing reply after load
title-said-loaded = 불러옴

# landing reply after deleting open slot
title-said-erased = 지움

## Objectives

# label before story line
obj-next = 다음

# story line, first step
obj-rock = 바위를 파서 아내를 구하자!

# intro quest item
obj-rock-q-chip = 바위 캐기

# intro quest item
obj-rock-q-pickup = 자갈 줍기

# intro quest item
obj-rock-q-toss = 자갈을 구덩이에 던지기

# story line after first fall
obj-falling = 다시 바위를 파 보자!

# story line, wooden roof barrier
obj-props = 나무 지붕을 지으면 다음 바위를 막을 수 있을까?

# story line, net barrier
obj-net = 안 되네, 바위를 받아서 속도를 늦춰 보자

# story line, arch barrier
obj-arch = 캐낸 광석과 돌로 아치를 쌓아 보자. 이 정도면 버티겠지.

# story line, wizards' barrier
obj-dome = 방법이 없다, 마법사들이 도와줄 수 있는지 보자.

# story line before rescue
obj-rescue = 아내를 구하자

# story line, second half
obj-drown = 구덩이를 물에 잠그자

# story line after snatch
obj-tower = 마법사의 탑을 짓자

# story line after snatch
obj-talk = 방금 일어난 일을 마법사들과 얘기해 보자

# story line, deep half
obj-portal = 심연으로 가는 포털을 불러내자, 아래엔 뭐가 있을까?

# story line, final step
obj-free = 구렁이 배 속에서 남편을 구하자

# objective card cancel while building
obj-barrier-cancel = 취소 ×{ $n }

## Other

# browser tab title, game page
play-doctitle = Pebble Pit

# skip hint during cutscene, desktop (skiphint.js:27)
other-skip-desk = 스페이스 길게 눌러 건너뛰기

# top-edge mess tag
other-messtag-muck = 오물

# top-edge mess tag
other-messtag-poop = 똥

# floating button over bench site
other-raise = 작업대 짓기

# phone pause button label
other-pause =
    .aria-label = 일시정지

title-recordbtn-label = 업적 · { $count }/{ $total }

# corner fullscreen button tooltip
other-fullscreen-title-on = 전체 화면 끝내기

# corner fullscreen button tooltip
other-fullscreen-title-off = 전체 화면

# crew-fade corner button label
other-corner-show = 일꾼 보이기

# crew-fade corner button label
other-corner-fade = 일꾼 흐리게

# crew-fade corner button label
other-corner-hide = 일꾼 숨기기

# way corner button tip
other-corner-up = 작업장으로 올라가기

# way corner button tip
other-corner-down = 깊은 곳으로 내려가기

# queue card line hover
other-queue-site-yard = 작업장

# queue card line hover
other-queue-site-sphere = 구체

# queue card, nobody working
other-queue-queued = 대기 중

# board footer toggle
other-hidedone-show = 끝난 것 보기

# board footer toggle
other-hidedone-hide = 끝난 것 숨기기

# the queue card: the first in line to be built after the one going up
queue-place-next = 다음

# the house's board and the crew window, with no crew yet
crew-empty = 아직 아무도 안 산다

# a station's name: its board's title, the pointer's label, the queue card
station-bench = 작업대

# skip hint during cutscene, phone
other-skip-touch = 길게 눌러 건너뛰기

# skip hint during a cutscene, with a pad: the span is the pad's A button, drawn
other-skip-pad = <span data-l10n-name="key"></span> 길게 눌러 건너뛰기

# the queue card: a run of copies of one row; $name is the row, $n how many
queue-run = { $name } ×{ $n }

# the casino's marquee, idle (drawn in the sign's own pixel capitals)
casino-sign = CASINO

# the casino's marquee when a hand is ready to let go (drawn in the sign's own pixel capitals)
casino-drop = DROP IT

## Notices

# toast-shaped card, another device ahead
note-cloud-name = 다른 기기가 더 최신

# toast-shaped card, another device ahead
note-cloud-note = 답은 저장 화면에

## Numbers

# how long a yard has been played, an hour or more (saves rows, the books)
played-hm = { $h }시간 { $m }분

# how long a yard has been played, under an hour
played-m = { $m }분

# a place in a line as a number: 2nd, 3rd, 11th (the queue card)
ordinal = { $n }번째

## Achievements

# toast and achievements card name
ach-firstgrain-name = 돈 벌자

# toast and achievements card note
ach-firstgrain-note = 자갈 하나를 구덩이에 던지기

# achievement name
ach-firstrock-name = 계속 파는 수밖에

# achievement note
ach-firstrock-note = 첫 바위 치우기

# achievement name
ach-gotout-name = 아내를 구했다

# achievement note
ach-gotout-note = 더는 바위가 없다, 해냈다.

# achievement name
ach-firsthire-name = 수정탑을 추가로 건설했다

# achievement note
ach-firsthire-note = 집 한 채 더 짓기

# achievement name
ach-firstshard-name = 첫 광석

# achievement note
ach-firstshard-note = 채석장에서 광석 꺼내 오기

# achievement name
ach-firstspore-name = 재배

# achievement note
ach-firstspore-note = 첫 작물 키우기

# achievement name
ach-firstspark-name = 마법의 기운

# achievement note
ach-firstspark-note = 첫 불꽃 얻기

# achievement name
ach-holefull-name = 구덩이가 꽉 찼다

# achievement note
ach-holefull-note = 구덩이를 가장자리까지 채우기

# achievement name
ach-rifttorn-name = 균열이 찢어졌다, 보관 문제 해결

# achievement note
ach-rifttorn-note = 구덩이를 채워 차원 간 균열을 일으키기

# achievement name
ach-drowned-name = 균열이 커졌다

# achievement note
ach-drowned-note = 차원 간 보관소로 된 바다 하나.

# achievement name
ach-star-name = 별 소환

# achievement note
ach-star-note = 탑에서 별을 불러 내리기

# achievement name
ach-firsthat-name = 넌 마법사야, 네모

# achievement note
ach-firsthat-note = 탑에서 마법사 모자 하나 완성하기

# achievement name
ach-firstbrew-name = 안녕, 물약 장수

# achievement note
ach-firstbrew-note = 약방에서 한 솥 달이기

# achievement name
ach-firsttrade-name = 첫 모자

# achievement note
ach-firsttrade-note = 스테이션에 첫 모자 사 주기

# achievement name
ach-alltrades-name = 대중 교육

# achievement note
ach-alltrades-note = 모든 스테이션에 모자 갖추기

# achievement name
ach-allbuilt-name = 건설 완료

# achievement note
ach-allbuilt-note = 전부 지었다

# achievement name
ach-rift1e6-name = 균열로 100만

# achievement note
ach-rift1e6-note = 자갈 100만 개를 균열로 보내기

# achievement name
ach-brew100-name = 100솥

# achievement note
ach-brew100-note = 100솥 달이기

# achievement name
ach-lived1h-name = 한 시계로 한 시간

# achievement note
ach-lived1h-note = 한 명을 한 시간 동안 계속 고용하기

# achievement name
ach-nobodyhired-name = 아무도 안 고용

# achievement note
ach-nobodyhired-note = 아무도 고용하지 않고 바위 하나 치우기

# achievement name
ach-ownhand-name = 오직 내 손으로

# achievement note
ach-ownhand-note = 일꾼이 한 번도 손대지 않고 바위 치우기

# achievement name
ach-nevertouched-name = 손도 안 댔다

# achievement note
ach-nevertouched-note = 직접 한 번도 안 치고 바위 치우기

# achievement name
ach-underminute-name = 1분 안에 바위 하나

# achievement note
ach-underminute-note = 1분 안에 바위 치우기

# achievement name
ach-everyjob-name = 모든 일에 일손

# achievement note
ach-everyjob-note = 모든 일에 동시에 한 명 이상 배치하기

# achievement name
ach-tablebeaten-name = 우리 다시 살아났다

# achievement note
ach-tablebeaten-note = 카지노 한 판에서 5만 따기

# achievement name
ach-tableruin-name = 대출받을 시간

# achievement note
ach-tableruin-note = 카지노 한 판에서 5만 잃기

# achievement name
ach-bird-name = 내 땅에서 나가

# achievement note
ach-bird-note = 새 놀래키기

# achievement name
ach-wholelot-name = 한 마리도 남김없이

# achievement note
ach-wholelot-note = 한 구역의 새를 전부 놀래키기

# achievement name
ach-catchall-name = 저글러

# achievement note
ach-catchall-note = 가장 큰 흙먼지 한 줌을 던지고 한 알도 빠짐없이 받기

# achievement name
ach-lifted-name = 이리 와

# achievement note
ach-lifted-note = 일꾼 들어 올리기

# achievement name
ach-shookload-name = 주머니 털어

# achievement note
ach-shookload-note = 일꾼을 흔들어 짐을 전부 털기

# achievement name
ach-hatoff-name = 모자 벗어

# achievement note
ach-hatoff-note = 일꾼을 흔들어 모자 떨어뜨리기

# achievement name
ach-dizzy-name = 흔들린 아기 증후군

# achievement note
ach-dizzy-note = 일꾼을 흔들어 어지럽게 하기

# achievement name
ach-muckrain-name = 설상가상

# achievement note
ach-muckrain-note = 오물 비를 버텨 내기

# achievement name: rocks cleared; $n is the count as written (10, 25, 50, 100)
ach-rocks-name = 바위 { $n }개

# achievement note: rocks cleared; $n is the count
ach-rocks-note = 바위 { $n }개 치우기

# achievement note: the last of the rocks-cleared ladder; $n is the count
ach-rocks-note-last = 바위 { $n }개 치우기, 돌이 참 많다

# achievement name: pebbles banked; $n is the count, short (10k, 1m)
ach-pebbles-name = 자갈 { $n }

# achievement note: pebbles banked; $n is the count, short
ach-pebbles-note = 자갈 { $n } 모으기

# achievement name: crew hired; $n is the count
ach-crew-name = 네모 { $n }명

# achievement note: crew hired; $n is the count
ach-crew-note = 일꾼 { $n }명 고용하기

# achievement name: the first ore ladder rung
ach-ore0-name = 캐낸 광석 1000

# achievement name: the second ore ladder rung
ach-ore1-name = 광석 1만

# achievement note: ore dug; $n is the count, short (1k, 10k)
ach-ore-note = 채석장에서 광석 { $n } 캐내기

## Index

# index entry name
idx-dust-name = 자갈

# index entry text
idx-dust-text = 바위에서 캐낸 것.

# index entry name
idx-shard-name = 광석

# index entry text
idx-shard-text = 채석장에서 캐낸 것.

# index entry name
idx-spore-name = 작물

# index entry text
idx-spore-text = 농장에서 자란다.

# index entry name
idx-spark-name = 불꽃

# index entry text
idx-spark-text = 마법사들이 번개로 별에서 떼어 낸 것.

# index entry name
idx-scale-name = 비늘

# index entry text
idx-scale-text = 구렁이가 떨군 것을 부숴서 얻는다.

# index entry name
idx-crit-name = 치명타

# index entry text
idx-crit-text = 확률적으로 더 큰 피해를 준다.

# index entry name
idx-rock-name = 바위

# index entry text
idx-rock-text = 아내를 깔아뭉갰다. 귀한 자갈을 캐낼 수 있다.

# index entry name
idx-pit-name = 구덩이

# index entry text
idx-pit-text = 자갈이든 뭐든 여기 던져 넣어 보관한다.

# index entry name
idx-rift-name = 균열

# index entry text
idx-rift-text = 자갈이 너무 몰려서 현실에 균열이 생겼나?

# index entry name
idx-abyss-name = 심연

# index entry text
idx-abyss-text = 균열이 자갈을 너무 많이 삼켜 불안정해지더니, 구덩이 전체를 집어삼켰다.

# index entry name
idx-muck-name = 오물

# index entry text
idx-muck-text = 오염이 생태계를 망가뜨리고, 비가 끈적한 더미를 남긴다.

# index entry name
idx-poop-name = 똥

# index entry text
idx-poop-text = 으엑.

# index entry name
idx-bird-name = 새

# index entry text
idx-bird-text = 평범한 새.

# index entry name
idx-house-name = 집

# index entry text
idx-house-text = 일꾼들이 사는 곳.

# index entry name
idx-pollution-name = 오염

# index entry text
idx-pollution-text = 산업의 대가. 채굴, 농사, 채석, 마법, 모두 오염을 만들어 공기를 더럽힌다.

# index entry name
idx-star-name = 별

# index entry text
idx-star-text = 마법사의 마법으로 만든 진짜 별. 부숴서 불꽃을 얻는다.

# index entry name
idx-balloon-name = 풍선

# index entry text
idx-balloon-text = 구름에서 오염을 걸러 내는 공기 필터를 달았다.

# index entry name
idx-recycler-name = 재활용기

# index entry text
idx-recycler-text = 대기 오염을 뭉쳐서 쓸 만한 자갈로 만든다.

# index entry name
idx-bench-name = 작업대

# index entry text
idx-bench-text = 말하자면 잡화점. 운반 강화, 손 강화, 새 건물.

# index entry name
idx-shack-name = 오두막

# index entry text
idx-shack-text = 채굴 강화를 사는 가게.

# index entry name
idx-stats-name = 장부

# index entry text
idx-stats-text = 게임의 여러 기록: 수입, 플레이 시간.

# index entry name
idx-farm-name = 농장

# index entry text
idx-farm-text = 작물이 자라는 밭.

# index entry name
idx-quarry-name = 채석장

# index entry text
idx-quarry-text = 깊이 파서 광석을 캔다.

# index entry name
idx-apothecary-name = 약방

# index entry text
idx-apothecary-text = 물약을 만드는 곳.

# index entry name
idx-tower-name = 탑

# index entry text
idx-tower-text = 마법사들의 집.

# index entry name
idx-casino-name = 카지노

# index entry text
idx-casino-text = 구슬 떨어뜨리는 카지노.

# index entry name
idx-outhouse-name = 청소 도구실

# index entry text
idx-outhouse-text = 청소부들의 집.

# index entry name
idx-filter-name = 공기 필터

# index entry text
idx-filter-text = 하늘에서 오염을 빨아낸다.

# index entry name
idx-ram-name = 공성추

# index entry text
idx-ram-text = 바위를 빠르게 깎아 낸다.

# index entry name
idx-jaw-name = 드릴

# index entry text
idx-jaw-text = 빠른 굴착을 위한 기계 드릴.

# index entry name
idx-tiller-name = 경운기

# index entry text
idx-tiller-text = 트랙터면 작물도 금방이다.

# index entry name
idx-belt-name = 벨트

# index entry text
idx-belt-text = 자갈을 자동으로 구덩이에 쏟아붓는다.

# index entry name
idx-sphere-name = 구체

# index entry text
idx-sphere-text = 별의 힘을 거두는 다이슨 구.

# index entry name
idx-roomba-name = 로봇 청소기

# index entry text
idx-roomba-text = 어질러진 것을 치우는 자동 청소기.

# index entry name
idx-driver-name = 지게차

# index entry text
idx-driver-text = 자원 짐을 아주 빨리 나르는 자동 지게차.

# index entry name
idx-props-name = 나무 방벽

# index entry text
idx-props-text = 바위를 막아 보려는 필사의 시도.

# index entry name
idx-net-name = 그물

# index entry text
idx-net-text = 작물로 그물을 엮어 바위를 받아 속도를 줄인다.

# index entry name
idx-arch-name = 아치

# index entry text
idx-arch-text = 바위를 막기 위한 돌과 금속의 튼튼한 아치.

# index entry name
idx-dome-name = 방어막

# index entry text
idx-dome-text = 마법사들이 불러낸 에너지 방어막.

# index entry name
idx-deep-name = 심연

# index entry text
idx-deep-text = 우주도 바다도 아닌, 그 사이 어딘가.

# index entry name
idx-portal-name = 포털

# index entry text
idx-portal-text = 심연을 드나드는 유일한 길.

# index entry name
idx-crusher-name = 분쇄기

# index entry text
idx-crusher-text = 깊은 곳의 비늘을 보관하는 곳.

# index entry name
idx-pods-name = 포드

# index entry text
idx-pods-text = 심연 일꾼들을 위한 포드.

# index entry text
idx-haul-text = 자갈을 구덩이로 나른다.

# index entry name
idx-rockcrew-name = 돌깨는 이

# index entry text
idx-rockcrew-text = 바위를 내리친다.

# index entry name
idx-quarrycrew-name = 광부

# index entry text
idx-quarrycrew-text = 채석장에서 광석을 캔다.

# index entry name
idx-farmcrew-name = 농부

# index entry text
idx-farmcrew-text = 작물을 키운다.

# index entry name
idx-purify-name = 공기 정화꾼

# index entry text
idx-purify-text = 공기 정화 풍선을 몰고 다니며 하늘을 청소한다.

# index entry name
idx-stir-name = 약사

# index entry text
idx-stir-text = 물약 한 솥을 맡는다.

# index entry text
idx-janitor-text = 똥과 오물을 치운다.

# index entry text
idx-wizard-text = 별 조각을 떼어 낼 줄 아는, 배운 마법사들.

# index entry text
idx-build-text = 건물과 기계를 세운다.

# index entry name
idx-breaker-name = 파쇄꾼

# index entry text
idx-breaker-text = 바위를 팔 때 훨씬 강력하다.

# index entry name
idx-carter-name = 수레꾼

# index entry text
idx-carter-text = 운반꾼이 수레를 끌어 운반량을 두 배로 늘린다.

# index entry name
idx-blaster-name = 발파꾼

# index entry text
idx-blaster-text = 작은 폭약을 달고 광석을 제대로 캐낸다.

# index entry name
idx-grower-name = 재배꾼

# index entry text
idx-grower-text = 작물을 두 배로 돌볼 수 있다.

# index entry name
idx-brews-name = 물약

# index entry text
idx-brews-text = 약방의 특제 물약.

# index entry text
idx-party-text = 구렁이를 쓰러뜨리려 목숨을 거는 용감한 모험가 일행.

# index entry name
idx-sqwife-name = 아내

# index entry text
idx-sqwife-text = 평범하게 살고 있었다, 그 사건(들) 전까지는. 하늘에서 끝없이 떨어지는 바위 밑에 깔렸다. 미쳤다.

# index entry name
idx-notices-name = 업적

# index entry text
idx-notices-text = 작업장의 이정표.

# index entry name
idx-serpent-name = 구렁이

# index entry text
idx-serpent-text = 심연에 사는, 뱀 비슷한 이상한 생물.

## Jobs

# a job, as the boards, the crew and the index say it (the save's key is rockhands)
job-rockhands = 돌깨는 이

# a job, as the boards, the crew and the index say it (the save's key is haulers)
job-haulers = 운반꾼

# a job, as the boards, the crew and the index say it (the save's key is quarriers)
job-quarriers = 광부

# a job, as the boards, the crew and the index say it (the save's key is farmhands)
job-farmhands = 농부

# a job, as the boards, the crew and the index say it (the save's key is scholars)
job-scholars = 학자

# a job, as the boards, the crew and the index say it (the save's key is purifiers)
job-purifiers = 공기 정화꾼

# a job, as the boards, the crew and the index say it (the save's key is stirrers)
job-stirrers = 약사

# a job, as the boards, the crew and the index say it (the save's key is janitors)
job-janitors = 청소부

# a job, as the boards, the crew and the index say it (the save's key is wizards)
job-wizards = 마법사

# a job, as the boards, the crew and the index say it (the save's key is builders)
job-builders = 건설꾼

# a job, as the boards, the crew and the index say it (the save's key is fighters)
job-fighters = 전사

# a job, as the boards, the crew and the index say it (the save's key is gatherers)
job-gatherers = 채집꾼

# a job, as the boards, the crew and the index say it (the save's key is delvers)
job-delvers = 깊은 곳 건축가

## Boards

# a row's unit: so many a second; $icon is the coin's mark (html)
unit-per-s = { $icon }/초

# a row's unit: so many a minute; $icon is the coin's mark (html)
unit-per-min = { $icon }/분

# a row's unit: so many a dig; $icon is the coin's mark (html)
unit-per-dig = { $icon }/채굴

# a row's unit: so many a harvest; $icon is the coin's mark (html)
unit-per-harvest = { $icon }/수확

# a row's unit after its number: swings a second
unit-hits-s = 타/초

# a row's unit after its number: swings a second, from one
unit-hit-s = 타/초

# a row's unit after its number: throws a second
unit-throws-s = 투/초

# a row's unit after its number: a wizard's bolts a minute
unit-bolts-min = 발/분

# a row's unit after its number: star cells a bolt knocks off
unit-cells-bolt = 칸/발

# a row's unit after its number: haze a balloon takes in a second
unit-motes-s = 알/초

# a row's unit after its number: farm plots
unit-plots = 밭

# a row's unit after its number: the quarry's shovels
unit-shovels = 삽

# a row's unit after its number: the apothecary's pots
unit-pots = 솥

# a row's unit after its number: doses a batch
unit-doses = 회분

# a unit after a number: seconds
unit-s = 초

# a deep row's unit after its number: damage
unit-dmg = 피해

# a deep row's unit after its number: damage a second
unit-dmg-s = 피해/초

# a brew's unit after its percentage: how much faster
unit-faster = 속도

# a brew's unit after its percentage: how much stronger
unit-stronger = 힘

# a brew's unit after its number: crit chance
unit-crit = 치명

# a row's gain line: $does is its verb (does-…), $amount the change (3 → 4, +25%; html)
gain-does = { $does } { $amount }

# a machine's row until its station's set of grower hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-grower =
    { $more ->
        [yes] 재배꾼을 { $left }명 더 사면 해제
       *[no] 재배꾼을 { $left }명 사면 해제
    }

# a machine's row until its station's set of blaster hats is bought: $left is how many are still to buy;
# $more is yes once one is bought
unlock-blaster =
    { $more ->
        [yes] 발파꾼을 { $left }명 더 사면 해제
       *[no] 발파꾼을 { $left }명 사면 해제
    }

# a price in time, a minute or more: $n minutes
price-min = { $n }분

# a row's verb, before its gain: how much a hand holds
does-hold = 쥐기

# the bench: your carry ladder
row-carry = 운반량

# a row's verb, before its gain: swings
does-hit = 타격

# the bench: your swing pace ladder
row-speed = 자동 타격

# a row's verb, before its gain: throws
does-throw = 던지기

# the bench: how often a held hand lets go
row-toss = 던지는 속도

# a row's verb, before its gain: how far a throw carries
does-reach = 사거리

# the bench: how far a handful carries
row-reach = 던지는 거리

# a row's verb, before its gain: what a swing takes
does-per-swing = 한 번에

# the bench: what a swing of yours takes
row-pick = 곡괭이 피해

# the bench: holding a handful throws it by itself
row-autotoss = 꾹 눌러 던지기

# the bench: holding the pointer on the boulder swings by itself
row-auto = 꾹 눌러 캐기

# a row's verb, before its gain: how much a body carries
does-carry = 운반

# the bench: the haulers' load ladder
row-haulcarry = 운반꾼 운반량

# a row's verb, before its gain: walking pace
does-walk = 걸음

# the bench: the haulers' pace ladder
row-haulpace = 운반꾼 속도

# a row's verb, before its gain: crits
does-crit = 치명

# the bench: the chance a hit is a crit
row-critchance = 치명타 확률

# the bench: how much more a crit takes
row-critmult = 치명타 피해

# the shack: the diggers' swing pace ladder
row-rockhandspeed = 휘두르는 속도

# the shack: what a digger's swing takes
row-rockhandpick = 돌깨는 이 곡괭이 피해

# the bench: the row that puts up the apothecary
row-unlockapothecary = 약방 짓기

# the bench: what the apothecary is for, under its name
row-unlockapothecary-note = 네모 일꾼들을 위한 일시 강화를 달인다

# the bench: what the apothecary row gives, where a gain would go
row-unlockapothecary-blurb = 일꾼 강장제를 달인다

# the bench: the row that puts up the casino
row-unlockcasino = 카지노 짓기

# the bench: what the casino is for, under its name
row-unlockcasino-note = 판돈을 걸면 두 배 아니면 꽝인 테이블

# the bench: what the casino row gives, where a gain would go
row-unlockcasino-blurb = 두 배 아니면 꽝

# the bench: the row that puts up the farm
row-unlockfarm = 농장 짓기

# the bench: what the farm is for, under its name
row-unlockfarm-note = 작물을 좀 키우자

# the bench: what the farm row gives, where a gain would go
row-unlockfarm-blurb = 작물 재배

# the bench: the row that puts up the air filter
row-unlockfilter = 공기 필터 짓기

# the bench: what the air filter is for, under its name
row-unlockfilter-note = 하늘의 연무를 다시 빨아들이는 풍선을 팔고, 하늘 상태를 읽는다

# the bench: what the air filter row gives, where a gain would go
row-unlockfilter-blurb = 하늘을 맑게

# the bench: the row that puts up the janitor's closet
row-unlockouthouse = 청소 도구실 짓기

# the bench: what the closet is for, under its name
row-unlockouthouse-note = 똥은 볼 만큼 봤다, 치우자

# the bench: what the closet row gives, where a gain would go
row-unlockouthouse-blurb = 똥, 치웠다

# the bench: the row that puts up the quarry
row-unlockquarry = 채석장 짓기

# the bench: what the quarry is for, under its name
row-unlockquarry-note = 광석을 캐기 시작하자

# the bench: what the quarry row gives, where a gain would go
row-unlockquarry-blurb = 광석 채굴

# the bench: the row that puts up the shack
row-unlockshack = 오두막 짓기

# the bench: what the shack is for, under its name
row-unlockshack-note = 채굴 강화

# the bench: what the shack row gives, where a gain would go
row-unlockshack-blurb = 바위용 장비

# the bench: the row that puts up the tower
row-unlocktower = 탑 발견하기

# the bench: what the tower is for, under its name
row-unlocktower-note = 마법사를 불러 보자

# the bench: the first barrier against the boulder
row-props = 나무 방벽

# the bench: the wooden barrier's line
row-props-note = 아내를 구하려고 서둘러 방벽을 지어 본다

# the bench: the second barrier
row-net = 그물

# the bench: the net's line
row-net-note = 안 됐다, 그물로 바위를 받아 볼까?

# the bench: the third barrier
row-arch = 아치 깎기

# the bench: the arch's line
row-arch-note = 아직 튼튼하지 않다. 돌 아치를 짓자.

# the tower: the last barrier, the wizards'
row-dome = 마법사라면 알지도?

# the tower: the last barrier's line
row-dome-note = 땅의 것은 모두 실패했다. 남은 것은 땅의 것이 아니다

# a hat's name: the diggers' (its row, the index, the crew)
kit-breaker = 파쇄꾼

# what the breaker hat does
kit-breaker-does = 두 배로 깨문다

# where the breaker hat is worn
kit-breaker-place = 바위

# a hat's name: the haulers' cart
kit-carter = 수레꾼

# what the cart does
kit-carter-does = 두 배로 싣는다

# where the cart is used
kit-carter-place = 구덩이

# a hat's name: the miners'
kit-blaster = 발파꾼

# what the blaster hat does
kit-blaster-does = 두 배로 오간다

# where the blaster hat is worn
kit-blaster-place = 채석장

# a hat's name: the farmers'
kit-grower = 재배꾼

# what the grower hat does
kit-grower-does = 두 배로 돌본다

# where the grower hat is worn
kit-grower-place = 농장

# the bench: a forklift that drives itself
row-driver = 지게차

# the bench: the forklift's line
row-driver-note = 혼자 달리는 지게차: 아무도 안 타고 구덩이까지 나르고, 연기를 뿜는다

# the bench: the forklifts' load ladder
row-liftload = 지게차 적재량

# a row's verb, before its gain: driving pace
does-drive = 주행

# the bench: the forklifts' pace ladder
row-liftpace = 지게차 속도

# a heading on the bench's board: your own ladders
sect-you = 나

# a heading on the bench's board: the crit ladders
sect-luck = 행운의 한 방

# a heading on the bench's board: the haulers' gear
sect-haulers = 운반꾼

# a heading on the bench's board: the rows that put up a new place
sect-build = 건설

# the house's board: buy another house to hire somebody
row-house = 집 한 채 더

# the ribbon on every goal card: the barrier the story is on
goal-title = 아내 구하기

# a card greyed out: its next rung costs crops, and there is no farm yet
needs-spore = 작물 필요

# a card greyed out: its next rung costs ore, and there is no quarry yet
needs-shard = 채석장 필요

# a card greyed out: its next rung costs a spark, and none has been earned
needs-spark = 불꽃 필요

# a card greyed out: its next rung costs a scale, and the deep is not open
needs-scale = 비늘 필요

# a hat's row, its line: $name is the hat (kit-…), $does what it does, $place where it is worn
kit-note = { $name }: { $does }, { $place }

# the shack: the ram's tuning ladder
row-tuneram = 공성추 타격

# the ram's tuning ladder, its line: $n is how many times harder a rung makes it
row-tuneram-note = 공성추가 { $n }배 세게 친다

# a heading on any board over the rows no section names
sect-and = 기타

# a card the yard is at: somebody is building it (the strip's word with nothing to hand back; the gain line's word)
card-building = 짓는 중

# the strip at a card's foot: buy another copy behind the one being built
card-another = + 하나 더

# a card in line: nobody is at it yet
card-queued = 대기 중

# a finished ladder, where its price would go
card-done = 완료

# the tower: an enchantment's name
spell-drive = 기계 가속

# the tower: the enchantment's line
spell-drive-note = 작업장의 모든 기계가 50% 빨라진다

# the tower: an enchantment's name
spell-luck = 채석장 풍요

# the tower: the enchantment's line
spell-luck-note = 채석장에서 캘 때마다 광석이 25% 더 나온다

# the tower: an enchantment's name
spell-gmo = 작물 유전자 조작

# the tower: the enchantment's line
spell-gmo-note = 모든 작물이 25% 커진다

# the tower: an enchantment's name
spell-thrift = 집값 인하

# the tower: the enchantment's line
spell-thrift-note = 이제부터 모든 집이 75% 저렴

# the tower: an enchantment's name
spell-sweep = 청소부 가속

# the tower: the enchantment's line
spell-sweep-note = 청소부가 두 배 빨리 퍼 담고 걷는다

# the tower: how often a wizard throws
row-wizspeed = 빠른 시전

# the tower: how often a wizard throws, its line; $pct is the rise a rung
row-wizspeed-note = 마법사마다 별에 번개를 { $pct }% 더 자주 던진다

# a row's verb, before its gain: a wizard's casting
does-cast = 시전

# the tower: how much of the star a bolt takes
row-wizpower = 더 무거운 번개

# the tower: the bolt ladder's line; $now and $next are cells a bolt takes
row-wizpower-note = 번개 한 번에 별에서 { $now }칸 대신 { $next }칸을 떼어 낸다

# the tower: a wizard's hat
row-wizard = 마법사 소환

# the tower: a wizard's line
row-wizard-note = 날아올라 번개로 별을 부숴 불꽃을 얻고, 하늘이 비면 새 별을 부른다

# the tower: the sphere's line
row-sphere-note = 별의 힘을 붙잡는다

# the tower: the sphere's tuning ladder
row-tunesphere = 구체 수확량

# the tower: the sphere's tuning ladder, its line; $n is how many times the light
row-tunesphere-note = 구체가 { $n }배의 빛을 붙잡는다

# the tower: the barrier the wizards pour
row-dome-tower = 방어막 소환

# the tower: the barrier's line
row-dome-tower-note = 이건 아무것도 못 지나간다.

# the tower: the way down to the deep
row-portal = 포털 소환

# the tower: the portal's line
row-portal-note = 심연으로 내려가는 길, 열어 둔 채로.

# a heading on the tower's board: the spells
sect-enchantments = 마법 부여

# a heading on the tower's board: the portal
sect-abyss = 심연

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign (50%)
spell-drive-blurb = 속도 +{ $pct }

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-luck-blurb = 광석 +{ $pct }

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-gmo-blurb = 작물 +{ $pct }

# the tower: what the enchantment gives, where a gain would go; $pct is a percentage with its sign
spell-thrift-blurb = { $pct } 저렴

# the tower: what the enchantment gives, where a gain would go; $x is how many times
spell-sweep-blurb = { $x }배 빠름

# the farm: what a harvest is worth, a ladder
row-crop = 작물 수확량

# a row's verb, before its gain: tending plots
does-tend = 돌봄

# the farm: how often a plot is tended, a ladder
row-tend = 농사 속도

# the farm: break another plot
row-farmplot = 밭 하나 더

# the farm: the tiller's tuning ladder
row-tunetiller = 경운기 속도

# the farm: the tiller's tuning ladder, its line; $n is how many times faster
row-tunetiller-note = 경운기가 { $n }배 빨리 일한다

# a heading on the farm's board: what a plot pays
sect-crop = 작물

# the quarry: what a dig turns up, a ladder
row-seam = 광석 산출량

# a row's verb, before its gain: digging
does-dig = 채굴

# the quarry: how often a dig happens, a ladder
row-quarrypace = 채굴 속도

# the quarry: another miner's shovel at the face
row-quarrybench = 삽 하나 더

# the quarry: the drill's tuning ladder
row-tunejaw = 드릴 위력

# the quarry: the drill's tuning ladder, its line; $n is how many times harder
row-tunejaw-note = 드릴이 { $n }배 세게 파고든다

# a heading on the quarry's board: what the hole pays
sect-ore = 광석

# a heading on the farm's board over who works the plots, with their headcount (the job's save key, as it has always read)
sect-farmhands = 농부

# a heading on the quarry's board over who works the cut, with their headcount (the job's save key, as it has always read)
sect-quarriers = 광부

# a row's verb, before its gain: a balloon's flight
does-fly = 비행

# the air filter: how fast the balloons go from cloud to cloud
row-balloonspeed = 풍선 속도

# a row's verb, before its gain: what a balloon takes in
does-filter = 여과

# the air filter: how much haze a balloon draws
row-power = 풍선 흡입력

# the air filter: another balloon
row-balloon = 풍선

# the air filter: the balloon's line
row-balloon-note = 구름을 타고 다니며 잡은 것을 아래로 떨군다

# the air filter: the recycler
row-recycler = 재활용기

# the air filter: the recycler's line
row-recycler-note = 풍선이 잡은 것이 오물이 아니라 자갈로 떨어진다

# a heading on the air filter's board
sect-equipment = 장비

# the janitor's closet: the second cap on the stand
row-loopost = 모자 하나 더

# the janitor's closet: another roomba
row-roomba = 로봇 청소기

# the janitor's closet: the roomba's line
row-roomba-note = 작업장의 어질러진 곳으로 가서 집으로 가져온다; 청소부 한 명이 지켜보고, 연기를 뿜는다

# the janitor's closet: the roombas' tuning ladder
row-tuneroomba = 청소기 흡입력

# the janitor's closet: the roombas' tuning ladder, its line; $n is how many times faster
row-tuneroomba-note = 로봇 청소기가 { $n }배 빨리 빨아들인다

# a brew's name: the speed one, priced in crops
tonic-stew = 든든한 스튜

# a brew's name: the strength one, priced in ore
tonic-strong = 독한 물약

# a brew's name: the crit one, priced in sparks
tonic-brace = 정신 드는 강장제

# the apothecary: keep the fires going, or let them die once a batch is dealt (a setting)
row-potkeep = 계속 달이기

# the apothecary's keep-brewing setting: on
row-potkeep-on = 계속 또 계속

# the apothecary's keep-brewing setting: off
row-potkeep-off = 이번 한 번만

# the apothecary: room for one more pot and its stirrer
row-anotherpot = 솥 하나 더

# a row's verb, before its gain: how long a dose lasts
does-lasts = 지속

# the apothecary: how long a dose lasts, a ladder
row-bufflength = 물약 농도

# the apothecary: doses a batch, a ladder
row-brewdoses = 한 솥 분량

# a heading on the apothecary's board over the pots, with the stirrers' headcount
sect-pot = 솥

# a heading on the apothecary's board
sect-brewing = 달이기

# a heading on the apothecary's board: one ladder a brew
sect-potency = 효력

# a brew's potency row's verb, before its gain
does-faster = 속도

# a brew's potency row's verb, before its gain
does-stronger = 힘

# what a brew does, in the picker and on its rows: $v per cent $unit (faster, stronger) for $secs seconds
tonic-gain = +{ $v }% { $unit }, { $secs }초

# what the crit brew does: $v points of crit chance for $secs seconds
tonic-gain-crit = +{ $v } 치명, { $secs }초

# the shack's heading over the diggers' gear, with their headcount
sect-diggers = 돌깨는 이

## Machines

# a machine's name: the quarry's (the save's key is jaw)
machine-jaw = 드릴

# a machine's name: the boulder's
machine-ram = 공성추

# a machine's name: the farm's
machine-tiller = 경운기

# a machine's name: carries pebbles from the boulder to the hole
machine-belt = 벨트

# a machine's name: the shell round the star
machine-sphere = 구체

# a machine's name: the janitor's closet's
machine-roomba = 로봇 청소기

## Stations

# a deep station's board with nothing on it yet
station-party-empty = 아직 배울 게 없다

# a station's name: its board's title, the pointer's label, the queue card
station-casino = 카지노

# a station's name
station-filter = 공기 필터

# the air filter's board with nothing on it
station-filter-empty = 달 게 없다

# a station's name
station-quarry = 채석장

# the quarry's board with nothing on it
station-quarry-empty = 채석장은 더 깊어지지 않는다

# a station's name
station-farm = 농장

# the farm's board with nothing on it
station-farm-empty = 땅은 다 일궜다

# a station's name
station-apothecary = 약방

# the apothecary's board with nothing on it
station-apothecary-empty = 솥이 식어 있다

# a station's name
station-tower = 탑

# the tower's board with nothing on it
station-tower-empty = 아직 여긴 아무것도 꿈틀대지 않는다

# a station's name
station-shack = 오두막

# the shack's board with nothing on it
station-shack-empty = 연장은 다 바위에 가 있다

# the bench's board with nothing on it
station-bench-empty = 팔 게 없다

# a station's name
station-outhouse = 청소 도구실

# the janitor's closet's board with nothing on it
station-outhouse-empty = 빗자루는 모두 고리에 걸려 있다

# a station's name
station-house = 집

# a station's name: the noticeboard over the pit
station-stats = 장부

# the books with nothing on them
station-stats-empty = 아직 들어온 게 없다

# a station's name: the deep's purse
station-crusher = 분쇄기

# the crusher's pile-full mark, on a hover
station-crusher-full = 바닥이 비늘로 가득하다

# a station's name: the deep's houses
station-pods = 포드

# the pods' board with nothing on it
station-pods-empty = 지을 게 없다

# the lab's board title, still in the page's markup (the lab itself is gone)
station-lab = 연구실

# a deep station's name: its fighter's (Brawler, Recruit); $nth counts the like-named stations before it.
# (An eighth like-named station reads "undefined": what the code said before the words moved here, kept by the owner; the deep has seven.)
station-party =
    { $nth ->
        [0] { $who }
        [1] 두 번째 { $who }
        [2] 세 번째 { $who }
        [3] 네 번째 { $who }
        [4] 다섯 번째 { $who }
        [5] 여섯 번째 { $who }
        [6] 일곱 번째 { $who }
       *[other] undefined 번째 { $who }
    }

# a deep station not yet given a fighter; $nth counts the empty lots before it (an eighth reads "undefined", as the code said)
station-party-lot =
    { $nth ->
        [0] 스테이션
        [1] 두 번째 스테이션
        [2] 세 번째 스테이션
        [3] 네 번째 스테이션
        [4] 다섯 번째 스테이션
        [5] 여섯 번째 스테이션
        [6] 일곱 번째 스테이션
       *[other] undefined 번째 스테이션
    }

## Crew

# the crew window: where a body is, standing at its station (rockhands)
crew-at-rockhands = 바위 위

# the crew window: where a body is, standing at its station (haulers)
crew-at-haulers = 구덩이 옆

# the crew window: where a body is, standing at its station (quarriers)
crew-at-quarriers = 채석장 안

# the crew window: where a body is, standing at its station (farmhands)
crew-at-farmhands = 밭

# the crew window: where a body is, standing at its station (purifiers)
crew-at-purifiers = 공기 필터

# the crew window: where a body is, standing at its station (janitors)
crew-at-janitors = 청소 중

# the crew window and a body's card: where a body is (lifted)
crew-where-lifted = 네 손 안

# the crew window and a body's card: where a body is (falling)
crew-where-falling = 공중

# the crew window and a body's card: where a body is (home)
crew-where-home = 집

# the crew window and a body's card: where a body is (basket)
crew-where-basket = 풍선 위

# the crew window and a body's card: where a body is (yard)
crew-where-yard = 작업장

# the crew window and a body's card: where a body is (resting)
crew-where-resting = 쉬는 중

# the crew window and a body's card: where a body is (walking)
crew-where-walking = 가는 중

# the crew window and a body's card: where a body is (deep)
crew-where-deep = 깊은 곳

# a body's card, doing: at its job with no step to name (rockhands)
crew-does-rockhands = 바위 캐는 중

# a body's card, doing: at its job with no step to name (quarriers)
crew-does-quarriers = 채석장에서 채굴 중

# a body's card, doing: at its job with no step to name (farmhands)
crew-does-farmhands = 농사 중

# a body's card, doing: at its job with no step to name (scholars)
crew-does-scholars = 연구 중

# a body's card, doing: at its job with no step to name (purifiers)
crew-does-purifiers = 공기 청소 중

# a body's card, doing: at its job with no step to name (janitors)
crew-does-janitors = 퍼 담는 중

# a body's card, doing: at its job with no step to name (haulers)
crew-does-haulers = 운반 중

# a body's card, doing: what its step is (seek)
crew-now-seek = 자갈 찾는 중

# a body's card, doing: what its step is (dump)
crew-now-dump = 짐 쏟는 중

# a body's card, doing: what its step is (muck)
crew-now-muck = 오물 퍼 담는 중

# a body's card, doing: what its step is (cut)
crew-now-cut = 채석장에서 캐는 중

# a body's card, doing: what its step is (up)
crew-now-up = 기어오르는 중

# a body's card, doing: what its step is (down)
crew-now-down = 내려가는 중

# a body's card, doing: what its step is (tend)
crew-now-tend = 밭 돌보는 중

# a body's card, doing: what its step is (home)
crew-now-home = 집에 가는 중

# a body's card, doing: what its step is (idle)
crew-now-idle = 별일 없음

# a body's card, doing: what its step is (in)
crew-now-in = 안에

# a body's card, doing: what its step is (aloft)
crew-now-aloft = 풍선 타는 중

# a body's card, doing: minding a machine; $name is the machine's (the belt)
crew-minding = { $name } 지키는 중

# a body's card, doing: what its step is (to)
crew-now-to = 그리로 가는 중

# a body's card, doing: what its step is (kit)
crew-now-kit = 작업대에서 장비 맞추는 중

# a body's card, doing: what its step is (build)
crew-now-build = 짓는 중

# a body's card, doing: what its step is (working)
crew-now-working = 일하는 중

# a body with no name, on its card and in the crew window
crew-somebody = 누군가

# a body's card: the label before how long it has been here (a column of ten in monospace)
crew-card-age = 근속

# a body's card, age: under a minute
crew-card-new = 오늘 옴

# a body's card, age: $mins minutes
crew-card-mins = { $mins }분

# a body's card: the label before what it is doing (a column of ten in monospace)
crew-card-doing = 하는 일

# a heading in the crew window over the yard's crew
crew-sect-yard = 작업장

# a heading in the crew window over the deep's crew
crew-sect-deep = 깊은 곳

# a heading on the house's board, and the window it opens
crew-sect-crew = 일꾼들

## The books

# the books: a coin, before its rate
books-dust = 자갈

# the books: a coin, before its rate
books-shard = 광석

# the books: a coin, before its rate
books-spore = 작물

# the books: a coin, before its rate
books-spark = 불꽃

# the books: the window the rates are taken over, in minutes ($n may be ½)
books-over-min = { $n }분

# the books: the row that steps the window the rates are taken over
books-over = 평균 구간

# the books: the window, in a rate's note (nothing in the last half minute)
books-last-half = 최근 30초

# the books: the window, in a rate's note
books-last-one = 최근 1분

# the books: the window, in a rate's note; $n minutes, more than one
books-last-mins = 최근 { $n }분

# the books: a rate's note, what came in; $n is the sum (or books-nothing), $over the window (books-last-…)
books-got = { $over } 동안 { $n }

# the books: a rate's note when nothing came in
books-nothing = 없음

# the books: a line
books-dirt-mach = 기계에서

# the books: a line
books-dirt-dust = 바위에서

# the books: a line
books-dirt-shard = 채석장에서

# the books: a line
books-dirt-spore = 농장에서

# the books: the sky full in, while the filter is winning
books-due-never = 이 속도론 안 찬다

# the books: a line
books-sky-trend = 오염

# the books: a line
books-sky-up = 배출, 분당

# the books: a line
books-sky-down = 제거, 분당

# the books: a line
books-sky-haze = 하늘은

# the books: how full the sky is; $pct with its sign
books-sky-full = { $pct } 참

# the books: a line
books-sky-due = 가득 차기까지

# the books: a line
books-sky-rains = 버텨 낸 비

# the books: a line
books-sky-muck = 널린 오물

# the books: a line
books-working = 일하는 중

# the books: a line
books-idle = 노는 중

# the books: a line
books-best-mined = 바위에서 가장 많이

# the books: a line
books-best-quarried = 광석 가장 많이 캠

# the books: a line
books-best-farmed = 작물 가장 많이 거둠

# the books: a line
books-best-stored = 구덩이에 가장 많이

# the books: a line
books-best-tidied = 오물 가장 많이 치움

# the books: the longest on one clock, an hour or more; $n hours to a tenth
books-hours = { $n }시간

# the books: the longest on one clock, under an hour; $n minutes
books-mins = { $n }분

# the books: a line
books-eldest = 한 시계로 최장

# the books: a line
books-tally-rocks = 치운 바위

# the books: a line
books-tally-banked = 모은 자갈

# the books: a line
books-tally-ore = 캔 광석

# the books: a coin earned over the whole game; $coin is books-shard, books-spore or books-spark
books-tally-earned = { $coin } 획득

# the books: a line
books-tally-rift = 균열로 보냄

# the books: a line
books-tally-brews = 달인 솥

# the books: a line
books-tally-hats = 완성한 모자

# the books: a line
books-tally-crew = 고용 중

# the books: a line
books-tally-notes = 얻은 업적

# the books: a line
books-tally-under = 아내가 바위 밑에 있던 시간

# the books: a line
books-tally-saved = 아내 구출까지

# a heading in the books, and on the noticeboard
books-sect-income = 초당 수입

# a heading in the books
books-sect-sky = 하늘

# a heading in the books
books-sect-crew = 일꾼들

# a heading in the books
books-sect-tally = 집계

# the noticeboard: the way into the books (off the board for now)
books-open = 장부 열기

# the noticeboard: how long this yard has been played
books-playtime = 플레이 시간

## Hover

# the hover on a deep station whose Recruit still waits on its first choice
hover-choose = 전사 선택

# the hover over a grain of ore
hover-ore = 광석

# the hover over a crop, a grain of it or a grown plot
hover-crop = 작물

# the hover over a spark
hover-spark = 불꽃

# the hover over a pebble
hover-pebble = 자갈

# the hover over the drowned pit
hover-abyss = 심연

# the hover over the rift
hover-rift = 균열

# the hover over poop on the ground
hover-poop = 똥

# the hover over muck on the ground
hover-muck = 오물

# the hover over a body, as the job it does (its type, rockhand)
hover-rockhand = 돌깨는 이

# the hover over a body, as the job it does (its type, hauler)
hover-hauler = 운반꾼

# the hover over a body, as the job it does (its type, quarrier)
hover-quarrier = 광부

# the hover over a body, as the job it does (its type, farmhand)
hover-farmhand = 농부

# the hover over a body, as the job it does (its type, scholar)
hover-scholar = 학자

# the hover over a body, as the job it does (its type, purifier)
hover-purifier = 공기 정화꾼

# the hover over a body, as the job it does (its type, stirrer)
hover-stirrer = 약사

# the hover over a body, as the job it does (its type, janitor)
hover-janitor = 청소부

# the hover over a body, as the job it does (its type, wizard)
hover-wizard = 마법사

# the hover over a body, as the job it does (its type, builder)
hover-builder = 건설꾼

# the hover over a body, as the job it does (its type, fighter)
hover-fighter = 전사

# the hover over a body, as the job it does (its type, gatherer)
hover-gatherer = 채집꾼

# the hover over a body, as the job it does (its type, delver)
hover-delver = 깊은 곳 건축가

# the hover over the portal, from the deep
hover-portal-up = 포털 — 작업장으로

# the hover over the portal, from the yard
hover-portal-down = 포털 — 깊은 곳으로

# the hover over the serpent
hover-serpent = 구렁이

# the hover over the crew's houses
hover-house = 집

# the hover over the boulder
hover-rock = 바위

# the hover over a bird
hover-bird = 새

# the hover over a balloon
hover-balloon = 풍선

# the hover over the air filter's gauge: $zone is the band the needle is in (clean, dirty, filthy), $way which way it is going
hover-dial = { $zone }, { $way }

# the air filter's gauge: the sky filling faster than it is cleaned
hover-dial-worse = 나빠지는 중

# the air filter's gauge: the sky cleaned faster than it fills
hover-dial-better = 좋아지는 중

# the air filter's gauge: neither
hover-dial-steady = 그대로

# the hover over the counter above the pit
hover-counter = 구덩이 속 자갈: 모든 값은 이걸로

# the air filter's gauge: the needle in the first band
hover-dial-clean = 깨끗함

# the air filter's gauge: the needle in the middle band
hover-dial-dirty = 더러움

# the air filter's gauge: the needle in the last band
hover-dial-filthy = 새까맘

# the hover on a pile-full mark: a station's pile has nowhere left to go
hover-pile-full = 더미가 가득 참

# the hover on a station's done mark: $names is what finished there, the rows' names joined by commas
hover-done = { $names } 완료

# the hover on a done mark whose rows have no names
hover-done-work = 작업 완료

# the casino's lever, by name (its hover and the pad's label)
lever-arm = 레버

# a pot's picker: the brew it is set to, when it is set to none
pot-nothing = 없음

# a pot's picker: the heading over who the brew is for
pot-for = 대상

# a pot's picker: the brew goes to whoever is nearest, not one trade
pot-nearest = 가장 가까운 사람에게

## The deep

# a brawler's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-brawler-fork = 더 세게 치고, 콤보를 배운다

# the brawler's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move = 콤보

# what the brawler's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-move-does = 연속 펀치

# the brawler's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap = 녹아웃

# what the brawler's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-brawler-cap-does = { $stun }

# a sword's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sword-fork = 검의 달인이 된다

# the sword's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-move = 회오리베기

# what the sword's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-move-does = 더 무거운 베기

# the sword's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap = 약점

# what the sword's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sword-cap-does = { $bleed }

# a monk's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-monk-fork = 기를 모은다

# the monk's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-move = 심호흡

# what the monk's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-move-does = 더 빠른 기

# the monk's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap = 명경지수

# what the monk's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-monk-cap-does = { $stun }

# a martial's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-martial-fork = 빠르게 치고 빠르게 끝낸다

# the martial's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-move = 연무

# what the martial's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-move-does = 더 빠른 마무리

# the martial's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap = 결집

# what the martial's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-martial-cap-does = 파티에 { $haste }

# a ranger's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-ranger-fork = 약점을 노린다

# the ranger's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move = 조준 사격

# what the ranger's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-move-does = 힘을 모은 화살

# the ranger's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap = 고정 사격

# what the ranger's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-ranger-cap-does = { $stun }

# a assassin's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-assassin-fork = 빠르고 정확하게 찌른다

# the assassin's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move = 처형

# what the assassin's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-move-does = 상처를 노린다

# the assassin's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap = 톱날

# what the assassin's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-assassin-cap-does = { $bleed }

# a hexer's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-hexer-fork = 약화 저주를 건다

# the hexer's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move = 쇠약

# what the hexer's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-move-does = 구렁이가 받는 피해 증가

# the hexer's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap = 속박

# what the hexer's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-hexer-cap-does = { $held }, { $exposed }

# a sapper's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-sapper-fork = 폭약을 배운다

# the sapper's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move = 끈끈이 폭탄

# what the sapper's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-move-does = 붙이고, 펑

# the sapper's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap = 쌍발

# what the sapper's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-sapper-cap-does = 폭탄 두 개, { $stun }

# a mage's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-mage-fork = 강력한 광선을 쏜다

# the mage's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-move = 넓히기

# what the mage's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-move-does = 더 넓은 광선

# the mage's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap = 테르밋

# what the mage's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-mage-cap-does = 장갑을 태운다

# a bard's line at the fork: what choosing it means; a { $status } is a status, drawn bold with its own hover line
cls-bard-fork = 파티에 { $inspired } 부여

# the bard's move (rung 4), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-move = 찬가

# what the bard's move does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-move-does = { $inspired } 두 배

# the bard's capstone (rung 8), by name; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap = 템포

# what the bard's capstone does, a few words; a { $status } is a status, drawn bold with its own hover line
cls-bard-cap-does = 파티에 { $haste }

# a status, by name (bold in a line, under its icon)
status-stun = 기절

# a status, by name
status-bleed = 출혈

# a status, by name
status-haste = 가속

# a status, by name
status-held = 구속

# a status, by name
status-exposed = 노출

# a status, by name
status-inspired = 고양

# what Stun does, after its name
status-stun-does = 움직이지 못하고, 회복도 멈춘다

# what Bleed does, after its name
status-bleed-does = 지속 피해

# what Haste does, after its name; $pct with its sign
status-haste-does = 공격이 { $pct } 빨라진다

# what Held does, after its name
status-held-does = 회복 불가

# what Exposed does, after its name; $lo and $hi with their signs
status-exposed-does = 받는 피해 { $lo }-{ $hi } 증가

# what Inspired does, after its name
status-inspired-does = 더 세게 친다

# a status's hover line: $name (status-…) and what it does
status-line = { $name }: { $does }

# a status's hover line when $n of it are on
status-line-n = { $name } x{ $n }: { $does }

# a status's label under its icon when $n of it are on
status-label-n = { $name } x{ $n }

# a base fighter's line: the altar's (the Fighter)
base-altar-does = 주먹을 날린다

# a base fighter's line: the well's (the Novice)
base-well-does = 무술을 수련한다

# a base fighter's line: the armory's (the Scout)
base-armory-does = 화살을 쏜다

# a base fighter's line: the circle's (the Adept)
base-circle-does = 저주를 건다

# a base fighter's line: the spire's (the Apprentice)
base-spire-does = 광선을 쏜다

# the Recruit's line, before its first choice
recruit-does = 가벼운 펀치

# the Bard's line with nobody else fighting
rail-alone = 노래 들어 줄 사람이 없다

# a class that needs company, before there is any
rail-locked = 두 번째 스테이션에서 열림

# a station's board at the fork: the heading over the two classes
rail-fork-ask = 전문화

# a Recruit's board: the heading over its first choice
rail-recruit-ask = 전사 선택

# a rung's number in its class's unit; $unit is unit-dmg or unit-dmg-s
rail-worth = { $n } { $unit }

# a rung's number for a class written in percent (the Bard)
rail-worth-pct = +{ $n }%

# a pip's hover line on a station's tree: $name (a fighter, a move) and $what (its number, or a few words)
rail-line = { $name }: { $what }

# the row that buys a class or a base fighter; $name is its name (Brawler, Scout)
rail-become = { $name }(으)로 전직

# a station's board: stand the Recruit again, every rung handed back
rail-reset = 초기화 – 전부 환불

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-brawler = 싸움꾼

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sword = 검사

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-monk = 수도승

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-martial = 무술가

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-ranger = 레인저

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-assassin = 암살자

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-hexer = 주술사

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-sapper = 공병

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-mage = 마도사

# a class's name: the fighter it makes (its board's title, its row, its hover)
class-bard = 음유시인

# a base fighter's name: the altar's, below the fork
base-altar = 격투가

# a base fighter's name: the well's
base-well = 수련생

# a base fighter's name: the armory's
base-armory = 정찰병

# a base fighter's name: the circle's
base-circle = 술사

# a base fighter's name: the spire's
base-spire = 견습생

# every station's first fighter, before its first choice
class-recruit = 신병

# the serpent's lash, its tile's hover while it waits
serp-lash-calm = 채찍질: 근접 공격자를 기절시킨다

# the serpent's lash, its tile's hover while it is warned
serp-lash-coming = 채찍질이 온다

# the serpent's lash, its tile's hover while it is on
serp-lash-on = 채찍질: 근접 공격자를 기절시킨다

# the serpent's lash, its tile's hover once answered
serp-lash-stopped = 채찍질: 막힘

# the serpent's cloak, warned
serp-sink-coming = 은신이 온다

# the serpent's cloak, on
serp-sink-on = 은신: 닿지 않는다

# the serpent's constrict, warned
serp-orb-coming = 조이기가 온다

# the serpent's constrict, on
serp-orb-on = 조이기

# the serpent's constrict, answered
serp-orb-stopped = 조이기

# a fighter's tile: dazed, its hover
serp-dazed = 어지러움: 튕겨 나가 눈앞에 별이 보인다

# a fighter's tile: constricted, its hover
serp-constricted = 조여지는 중

# the serpent's barrier, its tile's hover
serp-barrier = 장벽: 폭발 피해 흡수

# the serpent's ward, its tile's hover
serp-ward = 결계: 마법 피해 절반

# the serpent's plates, its tile's hover
serp-plates = 판갑: 물리 피해 절반

# the lash's tile, its label
serp-lash = 채찍질

# the cloak's tile, its label
serp-sink = 은신

# the constrict's tile, its label
serp-orb = 조이기

# a fighter's dazed tile, its label
serp-dazed-name = 어지러움

# a fighter's constricted tile, its label
serp-constricted-name = 조여짐

# the barrier's tile, its label
serp-barrier-name = 장벽

# the ward's tile, its label
serp-ward-name = 결계

# the plates' tile, its label
serp-plates-name = 판갑

# the pods: one more of the crew, living down here
row-pod = 포드 하나 더

# the pods: the pod's line
row-pod-note = 깊은 곳 저편의 캡슐: 일꾼 한 명이 더 여기서 산다

# a deep station's board: the heading over its one fighter, with the count
rail-fighter = 전사

# the deep: the build of a new fighter's station (the queue card names it)
row-raise-station = 스테이션 세우기

# the deep's build button: the first station costs no fang
build-free = 무료

# the serpent's level after the pips on its bar, from level 2 on; $n is the level.
# [owner's words: a level label, e.g. "Lv 7"] -- until then the bare number. Drawn in the pixel number font
# (NUM_FONT), which draws only the glyphs it has: words want their letters drawn into the font
serp-level = { $n }
