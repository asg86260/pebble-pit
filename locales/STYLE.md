# Translating Pebble Pit

One page for whoever translates or reviews `locales/<code>.ftl`. The
English source is `locales/en.ftl`; the comment over each message says
where it shows. This is a draft for the owner to approve, and the glossary's
renderings of the made-up words are proposals, not decisions.

## The voice

- **Lowercase, short, deadpan.** A line says what is there and stops. Nothing
  is explained that the yard already shows. No exclamation marks the English
  does not have, and no softening the English does not have.
- **Keep the case the English line has.** Most lines are all lowercase: write
  them lowercase, including the first word, in every language that has case.
  In German that includes nouns (`der fels`, not `der Fels`): the game is set
  in lowercase as a look, and the stylesheet raises what it wants raised.
  Where the English line is in sentence case (the deep's fighter lines,
  `Choose your fighter`) or title case (`Happily Ever After`, class names),
  use the language's normal capitalization for that shape.
- **Talk to the player as a friend.** German `du`, French `tu`, Spanish `tú`,
  Brazilian Portuguese `você`, Russian `ты`, Japanese plain form, Korean plain
  (반말/해라체) style, Chinese plain and colloquial, with no 您.
- **The player has no gender.** Where a past tense or an adjective would
  give the player one (Russian `ты спас`/`ты спасла`, French `tu es allé`),
  turn the line round so it does not (`квадражена спасена`).
- **Deliberate slips stay casual, not wrong.** The English drops apostrophes
  (`cant`, `lets`, `thats`) to sound offhand. Do not copy a spelling error into
  your language; give the line the same offhand register instead.
- **Jokes are rendered, not glossed.** An achievement name that quotes a game,
  a film or a meme takes the line your language's players know (the dubbed
  film's line, the localized game's line) if one exists; otherwise a joke of
  the same kind and size. Never add an explanation.
- **Length.** A board row, a button and a status take the English line's room
  plus about a third. Count a CJK character as two columns (the faces are
  monospace). If it will not fit, cut words, not meaning.

## What is never translated

- Anything inside `{ }`: `{ $n }`, `{ $name }`, a `{ "{" }`. It may move.
- Markup: `<br>`, and `<span data-l10n-name="..."></span>` (the game puts a
  thing there: a time, a button's drawing). Keep it exactly; move it if the
  sentence wants it elsewhere.
- **Pebble Pit** where it is the game's name (`title-gamename`,
  `title-doctitle`, `play-doctitle`).
- The crew's own names.
- `undefined` in `station-party` and `station-party-lot`: it is a placeholder
  the owner has kept on purpose (see the comment there).

## Plurals and numbers

A message that changes with a number is a Fluent select, and you choose the
variants by **your language's** CLDR plural categories, not English's:

| | cardinal categories | ordinal |
|---|---|---|
| de | one, other | other |
| fr | one, many, other (`many` is for millions; leave it to `other`) | one, other |
| es | one, many, other (same) | other |
| pt-BR | one, many, other (same) | other |
| ru | one, few, many, other (write all four) | other |
| zh-CN, ja, ko | other only (write no select at all) | other |

The file's own example:

```
slots-since-days = { $d ->
        [one] a day ago
       *[other] { $d } days ago
    }
```

in Russian is

```
slots-since-days = { $d ->
        [one] { $d } день назад
        [few] { $d } дня назад
        [many] { $d } дней назад
       *[other] { $d } дня назад
    }
```

(`one` in Russian is also 21 and 31, so it keeps the number), and in
Japanese simply `slots-since-days = { $d }日前`. A message that has no select
in English but puts a noun after a number (`{ $n } squares`) may need one in
your language: add it. A message that has a select in English but does not
need one in yours may drop it.

A variable that stands for words (`$name`, `$who`, `$place`) is filled in
with another message, already translated, in its basic form. If your grammar
needs a different case or article around it, rephrase so it does not
(`{ $name }: { $does } ({ $place })` rather than `at { $place }`), and say so
in a comment for the owner.

## The glossary

The terms, what each is in the yard, and the rendering this draft uses. A
line marked **(proposal)** is a coinage the owner must approve.

| term | what it is | de | fr | es | pt-BR | ru | zh-CN | ja | ko |
|---|---|---|---|---|---|---|---|---|---|
| sqwife | the player's wife, a square, buried under the first rock. "sq" is "square": the people are squares | quadratfrau (proposal) | carrépouse (proposal) | cuadresposa (proposal) | quadresposa (proposal) | квадражена (proposal) | 方妻 (proposal) | 四角妻 (proposal) | 네모아내 (proposal) |
| sqhusband | her husband, swallowed by the serpent in the second half | quadratmann (proposal) | carrémari (proposal) | cuadresposo (proposal) | quadresposo (proposal) | квадрамуж (proposal) | 方夫 (proposal) | 四角夫 (proposal) | 네모남편 (proposal) |
| squares, sq- | the people of the yard (`{ $n } squares`, `sqworkers`) | quadrate, quadrat- | carrés, carr- | cuadrados, cuadr- | quadrados, quadr- | квадраты, квадра- | 方块, 方- | 四角, 四角- | 네모, 네모- |
| pebbles | the first coin, chipped off the boulder | kiesel | cailloux | piedritas | pedrinhas | камушки | 石子 | 小石 | 자갈 |
| ore | the second coin, from the quarry | erz | minerai | mineral | minério | руда | 矿石 | 鉱石 | 광석 |
| crops | the third coin, from the farm | ernte | récoltes | cosechas | colheitas | урожай | 作物 | 作物 | 작물 |
| sparks | the machines' coin, shed by the star | funken | étincelles | chispas | faíscas | искры | 火花 | 火花 | 불꽃 |
| scales | the deep's coin | schuppen | écailles | escamas | escamas | чешуя | 鳞片 | 鱗 | 비늘 |
| the boulder, the rock | falls from the sky; the player chips it | der fels | le rocher | la roca | a rocha | валун | 巨石 | 岩 | 바위 |
| the pit, the hole | where everything banked lands | die grube | la fosse | el pozo | o poço | яма | 坑 | 穴 | 구덩이 |
| the yard | the whole works above ground | der hof | le chantier | el patio | o pátio | двор | 场地 | 作業場 | 작업장 |
| the rift | torn over the full pit | der riss | la faille | la grieta | a fenda | разлом | 裂隙 | 裂け目 | 균열 |
| the abyss | the pit, drowned | der abgrund | l'abîme | el abismo | o abismo | бездна | 深渊 | 奈落 | 심연 |
| the deep | the water under it, where the serpent lives | die tiefe | les profondeurs | las profundidades | as profundezas | пучина | 深处 | 深み | 깊은 곳 |
| the serpent | the second half's enemy | die schlange | le serpent | la serpiente | a serpente | змей | 巨蛇 | 大蛇 | 구렁이 |
| the crew | everybody hired | die leute | l'équipe | la cuadrilla | a equipe | бригада | 工人们 | 作業員 | 일꾼들 |
| wizards | the tower's people | zauberer | sorciers | magos | magos | волшебники | 巫师 | 魔法使い | 마법사 |
| the bench | the player's own board | die werkbank | l'établi | el banco | a bancada | верстак | 工作台 | 作業台 | 작업대 |
| muck | dirty rain on the ground | schlamm | boue | lodo | lama | грязь | 污泥 | 泥 | 오물 |
| poop | what the crew leave about | kacke | caca | caca | cocô | какашки | 便便 | うんち | 똥 |
| diggers | the trade at the rock | steinklopfer | casseurs | picadores | britadores | камнебои | 凿石工 | 石割り | 돌깨는 이 |
| grower (hat) | the farmers' hat, sold as a set | gärtner | jardinier | cultivador | cultivador | садовод | 园丁 | 栽培師 | 재배꾼 |

**Why adapt sqwife and sqhusband rather than keep them.** In English the
word is a blend a reader takes apart at once: square plus wife. Kept as
`sqwife`, it is a meaningless string in every one of these languages, and
the engine the pilot compared turns it into plain "wife" or into nonsense
(Russian rendered it once as "pork"). A blend of the language's own word for
square with its own word for wife keeps both the joke and the meaning, as
English does. The proposals are short where the language allows; the
Japanese and Korean ones use the native everyday word for a square shape
(四角, 네모) rather than a loanword.
