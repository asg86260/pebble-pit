export default (async()=>{
const {YARD_BOARDS}=await import('/src/stations.js');
const res={};
for (const lang of ['en','de','es','fr','ja','ko','pt-BR','ru','zh-CN']) for (const q of ['','&readable']) {
 const f=document.createElement('iframe');
 f.src=`./play.html?bench&lang=${lang}${q}`;
 f.style.cssText='position:fixed;left:0;top:0;width:1440px;height:900px;border:0;opacity:0';
 document.body.appendChild(f);
 const raf=()=>new Promise(r=>requestAnimationFrame(r));
 const t0=performance.now();
 const booted=()=>{const x=f.contentWindow;return !!(x?.__scene&&x.__board&&x.__fast)};
 while(!booted()&&performance.now()-t0<20000) await raf();
 const w=f.contentWindow; await w.document.fonts.ready;
 const step=()=>new Promise(r=>{w.__fast(1/60);w.requestAnimationFrame(()=>r())});
 for (const [scene,boards] of [['boards',YARD_BOARDS],['queuerepeat',['bench','house']],['queue',['bench']],['shieldbuilding',['bench']]]) {
  w.__scene(scene); w.__fast(1);
  for (const b of boards){ try{w.__board(b)}catch{continue}
   for(let i=0;i<4;i++) await step();
   const k=`${lang}${q}`; const s=w.__slotLog&&w.__slotLog[b];
   if(s>140){ (res[k]??={})[b]=Math.max(res[k]?.[b]||0,s); } }
  w.__board(null);
 }
 f.remove();
}
console.log("SLOTS "+JSON.stringify(res)); return 1;
})()
