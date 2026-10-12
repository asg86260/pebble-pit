// Whether this is the demo (config/demo.js), with the one door a check uses to
// turn it on in a dev build (`__demoOn`).
import { DEMO_ON } from './config.js';

let forced = null;
export const demoOn = () => forced ?? DEMO_ON;
export function forceDemo(on) { forced = on; }
