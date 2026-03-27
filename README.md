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

## Status
This project is a work in progress. The core time and coordinate transforms are in place, along with basic Sun and Moon models and tests. Basic UI for I/O is in place. Next is rendering.

## Recent Progress

- **Build Pipeline**: Integrated **Vite** for fast TypeScript transpilation and a live development server.
- **Telemetry Dashboard**: Implemented a browser-based control panel to input observer coordinates and UTC time.
- **Time Synchronization**: 
  - Centralized Julian Date calculations using the **Unix Epoch** (JD 2440587.5).
  - Implemented dual-epoch support: **J2000.0** (for Sun/Sidereal models) and **J2000.5** (for the simplified Lunar model).
  - Enforced **UTC** as the internal "System Truth" to avoid timezone-related drift in astronomical calculations.
- **Verification**: Calibrated the engine against NASA/USNO records for the 2024 Vernal Equinox and Lunar Eclipse windows.

## Recent Progress
- **Dynamic Render Engine**: Implemented an Equirectangular sky map with automatic Hemisphere-swapping (South-centered for North, North-centered for South).
- **Celestial Tracking**: Added 24-hour predictive paths for the Sun and Moon, utilizing custom sampling to close the "Lunar Gap."
- **High-Fidelity Lunar Model**: Integrated a dedicated "Moon Face" renderer that calculates the local Position Angle (tilt) and illumination phase.
- **Time Warp Engine**: Developed a `requestAnimationFrame` loop with adjustable simulation speeds (up to 10,000x).

## Recent Progress
- **Precision Time Engine**: Refactored to a "Single Source of Truth" model using `simTime` (Unix ms) to eliminate drift in high-speed simulations.
- **Geodesic Accuracy**: Optimized the `equatorialToHorizontal` transform to resolve singularities at the Zenith and the Equator.
- **Astronomical Dashboard**: 
    - Implemented a "Master Telemetry" panel featuring **Local Sidereal Time (LST)**, **Local Mean Time (LMT)**, and the **Equation of Time (EoT)**.
    - Standardized observer coordinates to include **Elevation (AMSL)**.
- **Viewport UX**: Centralized animation and playback controls within the main viewport for an immersive observatory experience.

## Recent Progress
- **UI Refactoring**: 
    - Implemented a compact **Observer Telemetry** row using Flexbox for Latitude, Longitude, and Elevation.
    - Added **Tooltip (Title)** documentation for astronomical units (ASML).
- **External Integration**: Prepared a proxied Fetch pipeline for **HeyWhatsThat** horizon profiles (awaiting third-party server stability).

## Recent Progress
- **Horizon Integration**:
    - Successfully implemented real-world terrain fetching via the HeyWhatsThat API.
- **Refined Data Model**:
    - Created a "Sanitized" HorizonProfile model in the core, insulating the engine from raw API quirks and handling coordinate normalization (Highest-Peak filtering).
- **UI Architecture Refactor**:
    - Centralized all DOM interactions into a Single Source of Truth (UI registry).
    - Implemented an Observer State Harvester to unify manual and simulated data entry.
- **Visual Design System**:
    - Migrated to CSS Variables for a unified "Helios" theme and restructured the viewport into a "Two-Row Command Strip" for better simulation/environment hierarchy.
- **Code Hygiene**:
    - Purged legacy SVG logic and modularized the rendering pipeline, significantly reducing the footprint and complexity of main.ts.
    - Extracted angle conversions out of main.ts

## Recent Progress
- **Renderer Refactor**: Extracted `SkyRenderer` and `MoonFaceRenderer` classes from `main.ts`,
  each owning their canvas context and resize logic.
- **UI Architecture**: Moved `syncUiFromDate` to `ui/elements.ts` and horizon fetch logic to 
  `ui/horizonController.ts`, reducing `main.ts` from ~300 to 158 lines.
- **Atmospheric Refraction**: Implemented Bennett (1982) formula in `core/coordinates/refraction.ts`
  with a dropdown selector in the observer panel. Defaults to none, preserving existing behavior.
- **Dependency Audit**: Evaluated `geo-tz` and `tzlookup` for local timezone detection; both 
  incompatible with browser environment. LMT retained as the astronomically correct alternative.

## Recent Progress
- **Keplerian Orbital Engine**: Implemented a shared `core/orbit/` module with 
  Newton-Raphson Kepler equation solver, J2000.0 mean elements for Mercury through 
  Saturn, and a heliocentric-to-geocentric propagation pipeline.
- **Planetary Parade**: Wired Mercury, Venus, Mars, Jupiter, and Saturn into the 
  renderer and telemetry panel using the new orbital engine.
- **Body Visibility Controls**: Added per-body enable/render toggles. Enabled bodies 
  show telemetry inline; the render toggle is only revealed when a body is enabled.
- **Tooltip RA/Dec**: Alt/Az telemetry rows carry RA/Dec as a hover tooltip, exposing 
  engine internals without cluttering the UI.
- **Compact Sidebar**: Reduced vertical spacing to fit full telemetry including all 
  planets on a 1080p display.
- **Direction Labels**: Added edge clamping to prevent clipping.

## Next Steps by priority
- **Precision Upgrade**: Add Meeus Table 31.b correction terms to improve planetary 
  positions beyond the current ~5° accuracy for outer planets.
- **Planet Tracks**: Extend `drawBodyTrack` to support planets via a name-based 
  wrapper around `planetEquatorialCoordinates`.
- **Lunar Elongation**: Add the angular distance readout to the Lunar Detail panel to refine eclipse and phase prediction.
- **Voyage Mode**: Import a JSON (later CSV, GPX) waypoint list and animate observer position over time,
  interpolating along great circle routes. Demonstrates why globe geometry produces 
  "curved" flight paths and shows the sky shifting continuously across hemispheres.
- **Zoom**: Horizon line is very difficult to see at many locations so being able to zoom in would make sense.
- **Sky Color**: Change the sky depending on time representing illumination from the sun and moon. Probably not worth it.
- **Stars and Constellations**: Import a basic star catalog (e.g., Yale Bright Star) to fill the celestial vault. Probably not.
- **Lunar Detail Tooltip**: Convert the moon face canvas to a hover overlay to 
  reclaim sidebar space on smaller screens. Somewhat quick win to be used as a filler.
