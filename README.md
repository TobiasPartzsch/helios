# Helios

Helios is a browser-based astronomy visualization focused on the sky as seen by an observer on Earth. It models time systems, coordinate transformations, and solar-system bodies to render the visible sky and related telemetry in the browser.

## Goals

- Model time internally using Julian Dates and sidereal time.
- Compute:
  - Sun position (RA/Dec, Alt/Az).
  - Moon position (RA/Dec, Alt/Az).
  - Basic Moon phases (illumination fraction).
  - Planet positions.
  - Eclipse candidate geometry from Sun-Moon alignment.
- Render a simple sky view in a web browser, based on:
  - Observer location (latitude/longitude).
  - Date and time.
  - Ability to import a horizon profile
  - Magnifying lens

Planned features include:

- Adding more planets.
- A starfield or night-sky background.
- Refining eclipse detection and presentation.
- Generalizing conjunction / plane-crossing logic to other bodies.

## Tech Stack

- TypeScript
- Custom astronomy/math modules:
  - `core/time` – Julian Date and sidereal time.
  - `core/coordinates` – RA/Dec ↔ Alt/Az transforms and atmospheric refraction models.
  - `core/bodies` – Sun and Moon positions and phases.
  - `core/orbit` – planetary propagation and VSOP87B pipeline.
  - `core/eclipse` – eclipse candidate logic.

- Vitest for unit tests.

## Development

Install dependencies:

```bash
npm install
```

## Run tests:

```bash
npm test
```

## Current Scope

Implemented:

- Julian Date and sidereal time handling
- RA/Dec ↔ Alt/Az transforms
- Sun and Moon positions
- Moon phase and orientation rendering
- Planetary positions for Mercury through Neptune
- Browser-based sky rendering
- Time simulation controls
- Horizon profile integration
- Optional astronomical symbol rendering for all bodies
- Zoom / Magnifying Lens: Cursor-following lens overlay with adjustable zoom and size.
  Offscreen rendering decoupled from display for performance. FOV readout in degrees.
- Atmospheric refraction option
- Eclipse candidate detection based on Moon-Sun ecliptic geometry
- Sun and Moon telemetry including eclipse candidate readouts
- Lunar detail panel with Moon phase readout

## Current Engine

Planetary positions are currently driven by a VSOP87B-based pipeline generated from
canonical series data. Earlier simple trigonometry and Keplerian implementations are preserved in branches
for comparison and rollback, but are no longer the primary engine.
Solar and lunar rendering still use lightweight direct models suitable for visualization, with eclipse handling currently limited to candidate detection rather than full classification.

## Validation Status

- Core solar/lunar events have been checked manually against known 2024-2025 dates
- Eclipse candidate detection has been tested against known solar and lunar eclipse dates using search windows around event times
- Planetary regression fixtures include JPL Horizons geocentric ICRF reference cases across multiple epochs
- Invariant tests cover core math, time, coordinate, refraction, and orbit helper transformations

## Next Steps by priority
- **Body distance from observer body:** Sort the bodies by distance from the observing one for rendering and later transit logic. Can probably be heavily cached.
- **State Transition Refinement:** Improve the "wonky" feeling when switching between Horizon and Route modes while the simulation is playing. Ensure a clean "hand-off" of observer coordinates.
- **Automated Playback Logic:** Implement logic to prevent "Play" execution if a route is selected but no CSV is loaded, or provide a default "stationary" behavior.- **Draw by distance:** Currently we draw bodies in an arbitrary order. We should probably go from farthest to closest.
- **Eclipse refinement:** Move from candidate detection toward better event characterization and presentation.
- **More general conjunction/plane-crossing pattern:** Reuse the current Moon-Sun logic for other phenomena such as planetary conjunctions and transits.
- **Voyage Mode**: Import a CSV waypoint list (`timestamp_utc, lat, lon, elev_m`) and animate observer 
  position over time, interpolating along great circle routes. Playback controls with rewind support. 
  Track extent shown as overlay on sky canvas. Demonstrates why globe geometry produces 
  "curved" flight paths and shows the sky shifting continuously across hemispheres.
  No real data format support planned -- CSV as demonstration only.
- **Solar plane view**: Alternatively to a position on Earth (or another body), render the solar plane.
- **Gravity based engine**: Experiment with direct dynamical simulation instead of relying only on precomputed series data.
- **Sky Color**: Change the sky depending on time representing illumination from the sun and moon. Probably not worth it.
- **Stars and Constellations**: Import a basic star catalog (e.g., Yale Bright Star) to fill the celestial vault. Probably not.
- **Lunar Detail Tooltip**: Convert the moon face canvas to a hover overlay to 
  reclaim sidebar space on smaller screens. Somewhat quick win to be used as a filler.
- **Position on different bodies**: Instead of only earth, allow the option to render the sky on any body that is simulated.
- **Planet Tracks (Improved):** Diurnal paths now use optimized sampling (1/72 for planets) and 'pinned' equatorial coordinates for the 24h window. Note: The 'North gap' and minor drift in outer planet tracks remain under investigation—likely a sidereal vs. solar day alignment or equirectangular wrapping artifact.
- **Easteregg idea:** change something into the Brand from Berserk on Solar eclipses, maybe a watermark

## Project Log

Detailed session-by-session engineering notes live in `docs/project-log.md`.



Aye, that sounds like a healthy plan.

Good near-term order
optimize current engine
make the engine boundary cleaner
create an experimental branch for N-body
later support multiple selectable engines
That is much safer than throwing gravity into the middle of today’s code.

On the “recording branch”
You probably mean one of these:

spike branch — quick experiment, may be ugly
prototype branch — exploratory but a bit more serious
research branch — if the goal is learning/feasibility
For your N-body idea, I’d call it a spike branch first.

Something like:

git checkout -b spike/n-body-engine

That signals:

exploratory
not yet production architecture
allowed to be rough
Multiple engines
That is a very good long-term design target.

You could eventually have something like:

engine/simple
engine/vsop87
engine/nbody
perhaps engine/jpl someday
with a shared interface for:

body positions at time jd
observer-facing coordinates
optional metadata like accuracy/performance
That would make comparisons delightful.

On a “flerf engine”
If one existed, plugging it in as a joke/reference engine would honestly be a fine architecture test:

can the app support radically different world models?
can rendering stay decoupled from ephemeris source?
So even absurdity can be a useful design benchmark.

Best optimization targets first
From what you described, I’d look at:

repeated Sun/Moon coordinate calculations in one update cycle
repeated calculations between telemetry and rendering
lens redraw frequency and what exactly is recomputed per mouse move
whether offscreen render is still doing too much work per frame
Strategic advice
Before optimizing heavily, define a seam like:

“engine gives me body positions for jd”
UI/rendering consumes that snapshot
Then optimization becomes easier because you can cache the snapshot per frame instead of chasing function calls everywhere.

If you want, next we can inspect either:

the lens code for performance, or
the Sun/Moon repeated-call path for cheap wins
I’d probably start with the latter, unless the lens is currently painful to use.


Putting it near animation controls is probably the better UX choice.

Reason:

a route is not just static observer data
it is fundamentally tied to time playback
users will think of it as “animate this journey”, not “set my latitude”
Good split
Observer section
Keep:

manual lat/lon/elev inputs
horizon fetch
Animation section
Add:

route import
route enabled/disabled
maybe “follow route” / “use live route position”
maybe route status summary
That tells a clearer story:

static observer settings live in Observer
time-varying observer settings live in Animation
Nice compromise
If you want conceptual correctness and visual sanity, you could label it something like:

Playback & Route
or
Simulation & Route
Then the route controls naturally sit beside play/pause/speed.

Suggested first features
For a first pass, near animation controls:

Import Route button
filename/status text
checkbox: Use route
maybe later: Loop or Clamp at end
That should be enough to start.

Design note
Internally, a route should probably override:

lat
lon
elev
for the current simulation time
while the manual inputs remain visible as:

defaults
fallback when no route is active
That’s a clean mental model.

So yes: conceptually observer-related, but practically belongs with animation. I’d put it near animation.


Yes, that’s quite all right — and I don’t object.

Your proposed placement makes sense.

And yes, the key is simply to define precedence cleanly.

Sensible rule
At any moment, observer position comes from exactly one source:

manual inputs, or
active route playback
Not both.

Easiest model
Use something like this conceptually:

if route mode is enabled and route data exists:
observer position = interpolated route position at current sim time
else:
observer position = manual lat/lon/elev inputs
That keeps interference low.

UX nicety
You may later choose to:

disable manual lat/lon/elev fields while route mode is active
or leave them editable but ignored
I’d lean toward:

editable but visually dimmed/disabled
so it’s obvious which source is in control
Good next-session starting point
When you return, the first tiny feature can be:

allow negative speed multipliers
That alone already improves the animation model and prepares the ground for route playback.

A good stopping point for today, I’d say.