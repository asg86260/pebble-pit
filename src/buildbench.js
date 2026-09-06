// The construction bench: the post the builders are hired at.
//
// Before it stands, builds work the way they always have -- the yard derives a
// spare body per busy site and lends one when nobody is spare. Once it stands,
// a builder is a post like the quarry's or the farm's: you hire so many, they
// walk to whatever is going up, and a build with nobody on it waits, fenced,
// with its bar empty. See DESIGN.md, "The build yard", and `rebalance` in
// upgrades.js, which is where the one `if` between those two worlds lives.
//
// This file is deliberately small and leaf-shaped: it answers "how many posts"
// and "how fast a builder works", and registers the yard's room, so upgrades.js
// and works.js can both ask without either importing the other.

import { S } from './state.js';
import { BUILD_PACE_STEP } from './config.js';
import { registerSite } from './works.js';

// How many builders the bench holds, and therefore how many builds can rise at
// once -- one body to a work, so the cap and the concurrency are one number.
export const buildPosts = () => 1 + S.buildPostLevel;

// How hard one builder swings: BUILD_GANG's old pace meaning, back as a ladder.
export const buildPace = () => Math.pow(BUILD_PACE_STEP, S.buildPaceLevel);

// The yard holds one build at a time until the bench stands; after that it
// takes one per post plus one waiting -- a queue you can see standing fenced,
// which is itself the signal to buy the next post. The queue depth (one past
// the posts) is a judgment call the spec left open.
registerSite('yard', {
  room: () => (S.buildbenchOpen ? buildPosts() + 1 : 1)
});
