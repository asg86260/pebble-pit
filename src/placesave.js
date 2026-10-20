// One reader for a place's saved blob (act 3, hell): the saved record laid
// over the place's blank, so a save from before a field was added comes back
// with that field empty rather than missing. Each place keeps its own saver
// (persist.js, `SAVERS`) and its own blank; this is only the read.
//
// The rules, one set for every place:
//   - the blank is the shape: a key the blank lacks is dropped (a field that
//     was retired, or one nobody reads);
//   - a value of another type than the blank's falls back to the blank's;
//   - a record (an object) is laid over its blank one level down, so a field
//     added to a record comes back in every saved one;
//   - an array of records is read slot by slot over the blank's slots, an
//     array of numbers likewise, and an empty blank array takes the saved
//     one whole (a list that grows: bodies, signs);
//   - a null in the blank takes whatever was saved (a field that is
//     empty until something happens).
export function readOver(blank, saved) {
  const out = { ...blank };
  if (!saved || typeof saved !== 'object') return out;
  for (const [k, hv] of Object.entries(saved)) {
    if (!(k in blank)) continue;
    const bv = blank[k];
    if (Array.isArray(bv)) {
      if (!Array.isArray(hv)) continue;
      out[k] = bv.length && bv[0] && typeof bv[0] === 'object'
        ? bv.map((e, i) => (hv[i] && typeof hv[i] === 'object' ? { ...e, ...hv[i] } : e))
        : bv.length ? bv.map((n, i) => (+hv[i] || n)) : hv;
    } else if (bv && typeof bv === 'object') out[k] = hv && typeof hv === 'object' ? { ...bv, ...hv } : bv;
    else if (bv === null) out[k] = hv;
    else out[k] = typeof hv === typeof bv ? hv : bv;
  }
  return out;
}
