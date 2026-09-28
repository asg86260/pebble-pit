// Cloud saves, the game's side (DESIGN.md, "Cloud saves: a sync code and a
// worker"; docs/wave-cloud.md, "src/cloud.js"). The only module that talks to
// the worker. Skeleton: every export the other tracks call, answering as a
// build with no cloud does. SYNC fills the bodies.

export const cloudReady = () => false;
export const cloudBoot = async () => {};
export const pump = () => {};
export const flush = () => {};
export const startCloud = async () => null;
export const makePair = async () => null;
export const claimPair = async () => false;
export const useRecovery = async () => false;
export const rotate = async () => null;
export const stopCloud = async () => {};
export const conflicts = () => [];
export const choose = async () => {};
export const takeCloud = async () => {};
export const keepHere = async () => {};
export const cloudStatus = () => ({ state: 'off', at: null, pair: null });
export const recoveryCode = () => null;
export const setCloudUrl = () => {};
export const setCloudFetch = () => {};
