// The seam between the clouds and what lives among them. The balloons are
// drawn between the cloud sheets (weather.js asks `list` for them each frame)
// and travel from cloud to cloud (balloon.js asks `clouds` and `spot`). Both
// sides hang what they own here at load and read the other's at run time, so
// neither imports the other: weather.js reaches the renderer and the boards,
// and a craft importing it closed a ring through the shop that read the
// upgrade list before it existed.
export const GUESTS = {
  list: () => [],        // render/balloon.js: `{ far, draw }` a craft
  clouds: () => [],      // weather.js: the clouds in the sky
  spot: () => null       // weather.js: where a craft hangs under one (`cloudSpot`)
};
