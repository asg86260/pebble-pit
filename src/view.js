// Which half the player is looking at, and the glide between them.
//
// SKELETON. Track RENDER owns this file and replaces every body below
// (docs/wave-serpent.md). The view is the renderer's and the pointer's: the
// sim never reads it.

import { S } from './state.js';

export const inDeep = () => S.view === 'deep';
export const goDeep = () => {};
export const goUp = () => {};
export const stepView = c => {};
