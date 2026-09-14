// Every shield fits the rock it meets. A shield is planned against a rock
// (shield.js, `shieldPlan`): the rectangular kinds span it with a clear margin
// and a leg either side, the curved kinds stand a set share wider than it
// (ARCH_SPAN, DOME_SPAN) because their crown is the catch line and a rock
// nearly as wide as the span perched on the apex with its flanks hanging out
// over the haunches. None of them ever stands closer to the building on the
// flank than the rock itself is allowed to. And the rock it is planned for is
// the one that will actually reach it -- the one in the air, if there is one.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { P, PROP_FROM, ROCK_CLEAR, ROCK_FLANK_CLEAR, SHIELD_LEG_W,
         ARCH_SPAN, DOME_SPAN } from '../src/config.js';
import { KINDS, shieldPlan, risingShield, refitShield } from '../src/shield.js';
import { rockSize } from '../src/rock.js';

const S = yard.S;
const SPAN = { arch: ARCH_SPAN, dome: DOME_SPAN };

// The rock numbered n, as `rockSize` would build it.
const rockAt = n => {
  const was = S.boulderNo;
  S.boulderNo = n;
  const size = rockSize();
  S.boulderNo = was;
  return size;
};

// A plan for a named rock, made between rocks with the one before it down.
const planFor = (n, kind) => {
  const was = S.boulderNo, fall = S.rockFall;
  S.boulderNo = n - 1; S.rockFall = 0;
  const plan = shieldPlan(kind);
  S.boulderNo = was; S.rockFall = fall;
  return plan;
};

// Hold one plan against the rock it is for: what is wrong with it, or nothing.
const misfit = (plan, rock) => {
  const rockW = rock.w * P;
  const cap = rockW + 2 * ROCK_FLANK_CLEAR;
  const bad = [];
  if (plan.w % (2 * P)) bad.push(`w ${plan.w} is not an even count of cells`);
  if (plan.x % P) bad.push(`x ${plan.x} is off the grid`);
  if (plan.w - 2 * SHIELD_LEG_W * P < rockW + 2 * ROCK_CLEAR)
    bad.push(`inner ${plan.w - 2 * SHIELD_LEG_W * P} under rock ${rockW} + ${2 * ROCK_CLEAR}`);
  if (plan.w > cap) bad.push(`w ${plan.w} crosses the flank clearance ${cap}`);
  const span = SPAN[plan.kind];
  if (span && plan.w < Math.round(rockW * span) && plan.w !== cap)
    bad.push(`span ${plan.w}/${rockW} = ${(plan.w / rockW).toFixed(2)} under ${span}`);
  return bad;
};

group('every kind of shield fits every rock it could be planned for', async () => {
  window.__reset();
  const wrong = [];
  let capped = 0;
  for (const kind of Object.keys(KINDS)) {
    for (let n = 1; n <= 30; n++) {
      const rock = rockAt(n);
      const plan = planFor(n, kind);
      if (plan.w === rock.w * P + 2 * ROCK_FLANK_CLEAR) capped++;
      for (const b of misfit(plan, rock)) wrong.push(`${kind} for rock ${n}: ${b}`);
    }
  }
  window.__reset();
  return [
    ok(wrong.length === 0, 'every plan fits the rock it is for', wrong.slice(0, 6).join('; ')),
    ok(capped > 0, 'and the biggest rocks meet the flank cap, which is what the cap is for',
       `${capped} plans capped`)
  ];
});

// The curved kinds stand visibly wider than the rock on both sides -- the
// whole reason for the span -- and the rectangular kinds keep the margin they
// had. Read at the first rock a shield can be bought for, where the flank cap
// is nowhere near.
group('the arch and the dome stand wider than the rock, the props and the net keep their margin', async () => {
  window.__reset();
  const rock = rockAt(PROP_FROM + 1);
  const rockW = rock.w * P;
  const plans = Object.fromEntries(Object.keys(KINDS).map(k => [k, planFor(PROP_FROM + 1, k)]));
  const margin = k => (plans[k].w - rockW) / 2;
  const centered = k => Math.abs((plans[k].x + plans[k].w / 2) - S.cx) <= P;
  window.__reset();
  return [
    ok(plans.arch.w >= Math.round(rockW * ARCH_SPAN), 'the arch spans ARCH_SPAN of the rock',
       `${plans.arch.w} over ${rockW}`),
    ok(plans.dome.w >= Math.round(rockW * DOME_SPAN), 'the dome spans DOME_SPAN of the rock',
       `${plans.dome.w} over ${rockW}`),
    ok(plans.props.w === rockW + 2 * ROCK_CLEAR + 2 * SHIELD_LEG_W * P,
       'the props are the rock, its clearance and two legs', `${plans.props.w}`),
    ok(plans.net.w === plans.props.w, 'and the net the same'),
    ok(margin('arch') > margin('props') && margin('dome') > margin('arch'),
       'each curve stands further out than the last',
       `${margin('props')}, ${margin('arch')}, ${margin('dome')}`),
    ok(centered('arch') && centered('dome'), 'and both are centered on the landing spot')
  ];
});

// Bought the player's way, under a falling rock: the plan is for the rock in
// the air, not the one after it. It always planned for the next number, which
// under a falling rock is a rock too big -- the one already coming was the one
// it would meet. And a standing shield is refit for whatever rock is made next
// (`refitShield`, called by `makeBoulder`), so one outgrown by the
// rocks is widened for the one that reaches it.
group('a shield bought while a rock is falling is planned for the falling rock', async () => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(40000);
  run(1);
  // Frame by frame to the fall: it is under a second long, and a stride of a
  // game second would step clean over it.
  const fall = () => { window.__next(); for (let i = 0; i < 60 * 30 && !(S.rockFall > 0); i++) run(1 / 60); return S.rockFall > 0; };
  const falling = fall();
  const inAir = S.boulderNo;
  const bought = window.__buy('props');
  const rising = risingShield();
  const forThis = rising && misfit(rising, rockAt(inAir)).length === 0;
  const notNext = rising && rising.w !== planFor(inAir + 1, 'props').w;
  // It stands, and the rocks run on past it: the one now coming is bigger
  // than the one it was planned for, and the refit sizes it for that one.
  runUntil(() => !!S.shield, 400);
  runUntil(() => S.rock > 0 && !S.rockFall, 120);
  const stood = S.shield && { ...S.shield };
  S.boulderNo += 3;
  const again = fall();
  // Making the rock is what refits the shield, so it is never stale for a
  // frame: the moment the bigger rock is in the air the plan already fits it.
  const fits = S.shield && misfit(S.shield, rockSize()).length === 0;
  const want = shieldPlan('props');
  const asPlanned = S.shield && S.shield.w === want.w && S.shield.x === want.x && S.shield.h === want.h;
  const grew = stood && S.shield && S.shield.w > stood.w;
  const kept = S.shield && S.shield.laid === stood.laid;
  const detail = stood && S.shield && `${stood.w} -> ${S.shield.w}, want ${want.w} for rock ${S.boulderNo}`;
  window.__reset();
  return [
    ok(falling && bought, 'the props are bought under a falling rock', `rock ${inAir} in the air`),
    ok(!!rising, 'and the buy starts the build'),
    ok(forThis, 'planned for the rock in the air', rising && `w ${rising.w}`),
    ok(notNext, 'and not for the one after it'),
    ok(!!stood && again, 'it stands, and a bigger rock than it was planned for comes', detail),
    ok(fits && asPlanned && grew, 'and making that rock widens it to fit', detail),
    ok(kept, 'keeping what has been laid')
  ];
});
