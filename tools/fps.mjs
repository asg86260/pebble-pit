// What the yard actually runs at, in the window it is actually looked at in.
//
// Not a benchmark of the simulation: `__fast` steps the world without drawing,
// and the thing that costs is drawing. This counts real animation frames over a
// few real seconds with the scene set up as a player would have it, which is the
// only number that answers "does it hold sixty".
//
// Usage: node tools/fps.mjs [scene ...]     (WINDOW=1400,900 to change the glass)
import { execFileSync } from 'node:child_process';

const SCENES = {
  idle:     `__crew(0,0);__air({haze:0,muck:0})`,
  yard:     `__crew(8,4)`,
  smoke:    `__crew(8,4);__air({haze:1200})`,
  thick:    `__crew(8,4);__air({haze:2400})`,
  rain:     `__crew(8,4);__air({haze:2400});__fast(20)`,
  scrub:    `__crew(8,4);__air({haze:2400,open:true,purifiers:1,recycler:true})`,
  star:     `__crew(6,3);__meteor();__wizardHat(3);__assign&&0;__air({haze:900})`,
  muck:     `__crew(8,4);__air({muck:300,haze:900})`,
  // The worst the sky ever is, and the one that matters now the haze has the
  // whole window: the cap, held. It has to be re-topped -- a brimming sky rains
  // as soon as the dry gap lets it, so a scene that only sets it once is
  // measuring an empty sky by the time the count is read.
  full:     `__crew(8,4);__air({haze:4200});__fast(6);__air({haze:4200})`
};

const want = process.argv.slice(2).filter(a => SCENES[a]);
const scenes = want.length ? want : Object.keys(SCENES);
const SECONDS = 4;

for (const name of scenes) {
  const expr = `(async () => {
    __fast(2); ${SCENES[name]}; __fast(30);
    // let the browser settle after the set-up burst before counting
    await new Promise(r => setTimeout(r, 400));
    let n = 0;
    const t0 = performance.now();
    await new Promise(done => {
      const tick = () => { n++;
        if (performance.now() - t0 >= ${SECONDS * 1000}) return done();
        requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    const secs = (performance.now() - t0) / 1000;
    const s = __state();
    return { fps: +(n / secs).toFixed(1), motes: s.smog.sky, drops: s.smog.drops,
             chips: s.chips, workers: s.workers,
             px: Math.round(innerWidth * devicePixelRatio) + 'x' + Math.round(innerHeight * devicePixelRatio) };
  })()`;
  const out = execFileSync('node', ['tools/headless.mjs', expr],
                           { encoding: 'utf8', env: process.env });
  const json = out.slice(0, out.indexOf('--- console ---') >>> 0).trim();
  console.log(name.padEnd(6), json.replace(/\s+/g, ' '));
}
