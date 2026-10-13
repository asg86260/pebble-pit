// The rescue's sheet on the page (ending.js): its last part follows the
// second half's switch. With the half on the snatch comes next, so the sheet
// has no button and goes by itself; with it off the story ends here and the
// button puts the sheet down. The time line is on it either way.

import { newRun, settle, ok, run, raf } from './kit.js';
import { S } from '../state.js';

export const TESTS = [
  ['the rescue sheet has its button when the story ends there and none when the second half follows it', async () => {
    const seen = async on => {
      window.__serpentOn(on);
      newRun();
      await settle();
      S.rescued = true; S.buried = false; S.buriedMs = 600000;
      run(1 / 60);
      await raf();
      const sheet = document.getElementById('saved');
      const time = document.getElementById('savedin').textContent;
      const button = !document.getElementById('keepplaying').hidden;
      const rule = !sheet.querySelector('.rule.endonly').hidden;
      window.__skipBeat('sheet');
      return { up: !sheet.hidden, time, button, rule };
    };
    try {
      const on = await seen(true), off = await seen(false);
      return [
        ok(on.up && off.up, 'the sheet comes up either way', `on ${on.up}, off ${off.up}`),
        ok(on.time === '10:00' && off.time === '10:00', 'and says how long the rescue took', `${on.time} / ${off.time}`),
        ok(!on.button && !on.rule, 'with the half on it has no button: it goes by itself', JSON.stringify(on)),
        ok(off.button && off.rule, 'with it off it keeps its button', JSON.stringify(off))
      ];
    } finally { window.__serpentOn(null); }
  }],
  ['the store links on the demo and teaser sheets are drawn as the sheet buttons', async () => {
    const out = [];
    for (const [link, btn] of [['demostore', 'demokeep'], ['teasestore', 'teasekeep']]) {
      const a = document.getElementById(link), b = document.getElementById(btn);
      const was = a.hidden; a.hidden = false;
      const sa = getComputedStyle(a), sb = getComputedStyle(b);
      const same = ['borderTopWidth', 'borderTopColor', 'color', 'fontSize', 'letterSpacing', 'textTransform', 'paddingLeft']
        .every(k => sa[k] === sb[k]);
      out.push(ok(same && sa.textDecorationLine === 'none' && a.tagName === 'A' && a.hasAttribute('href'),
        link + ' looks like ' + btn, sa.textDecorationLine + ' ' + sa.color));
      a.hidden = was;
    }
    return out;
  }],
];
