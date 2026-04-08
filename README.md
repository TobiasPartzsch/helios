# Helios

Helios is a browser-based visualization of the heliocentric model and the sky as seen from Earth. It aims to show the positions of the Sun, Earth, and Moon (and later other bodies) and render what an observer sees in the sky.

## Goals

- Model time internally using Julian Dates and sidereal time.
- Compute:
  - Sun position (RA/Dec, Alt/Az).
  - Moon position (RA/Dec, Alt/Az).
  - Basic Moon phases (illumination fraction).
- Render a simple sky view in a web browser, based on:
  - Observer location (latitude/longitude).
  - Date and time.

Planned features include:

- Adding more planets.
- A starfield or night-sky background.
- Importing a custom horizon silhouette (e.g. SVG).
- Visualizing phases of the Moon and eclipses.

## Tech Stack

- TypeScript
- Custom astronomy/math modules:
  - `core/time` – Julian Date and sidereal time.
  - `core/coordinates` – RA/Dec ↔ Alt/Az.
  - `core/bodies` – Sun and Moon positions and phases.
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

## Current Engine

Planetary positions are currently driven by a VSOP87B-based pipeline generated from
canonical series data. Earlier simple trigonometry and Keplerian implementations are preserved in branches
for comparison and rollback, but are no longer the primary engine.

## Validation Status

Core solar/lunar events have been checked manually against known 2024 dates
Planetary regression fixtures now include JPL Horizons geocentric ICRF reference cases across multiple epochs.
Invariant tests now cover core math, time, coordinate, refraction, and orbit helper transformations

## Next Steps by priority
- **Lunar Elongation**: Add the angular distance readout to the Lunar Detail panel to refine eclipse and phase prediction.
- **Voyage Mode**: Import a CSV waypoint list (`timestamp_utc, lat, lon, elev_m`) and animate observer 
  position over time, interpolating along great circle routes. Playback controls with rewind support. 
  Track extent shown as overlay on sky canvas. Demonstrates why globe geometry produces 
  "curved" flight paths and shows the sky shifting continuously across hemispheres.
  No real data format support planned -- CSV as demonstration only.
- **Solar plane view**: Alternatively to a position on Earth (or another body), render the solar plane.
- **Gravity based engine**: Switch gravity based simulation instead of pre-computed data points (VSOP87B).
- **Sky Color**: Change the sky depending on time representing illumination from the sun and moon. Probably not worth it.
- **Stars and Constellations**: Import a basic star catalog (e.g., Yale Bright Star) to fill the celestial vault. Probably not.
- **Lunar Detail Tooltip**: Convert the moon face canvas to a hover overlay to 
  reclaim sidebar space on smaller screens. Somewhat quick win to be used as a filler.
- **Position on different bodies**: Instead of only earth, allow the option to render the sky on any body that is simulated.
- **Planet Tracks**: Basic track rendering is implemented and cached. The planets don't render correctly
  but inner planets match their mid position at least. Outer planets (Mars, Jupiter, Saturn) show a 
  positional discrepancy between the track midpoint and the current position dot, 
  likely due to LST mismatch between track sampling and dot computation. 
  Needs investigation: compare `lstRad` at track midpoint vs dot computation for an 
  outer planet to confirm root cause.
  Further development on pause.

## Project Log

Detailed session-by-session engineering notes live in `docs/project-log.md`.
