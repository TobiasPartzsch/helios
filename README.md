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

## Next Steps by priority
- **Context Refactor**: Move access to the canvas context out of main.ts
- **Local Timezone time**: Calculate the local clock based on timezone.
- **Refraction**: Model atmospheric refraction based on the International Standard Atmosphere (ISA).
- **Rework model**: Base the calculations more clearly on orbit and spin. (Keppler Elements)
- **Sky Color**: Change the sky depending on time representing illumination from the sun and moon.
- **The Planetary Parade**: Incorporate Mercury, Venus, Mars, Jupiter, and Saturn using their respective orbital elements.
- **Lunar Elongation**: Add the angular distance readout to the Lunar Detail panel to refine eclipse and phase prediction.
- **Direction Label Rendering**: Currently the away direction isn't very well readable.
- **Zoom**: Horizon line is very difficult to see at many locations so being able to zoom in would make sense.
- **Animate location changes**: Enable the import of location changes at specific dates to simulate travel.
- **Stars and Constellations**: Import a basic star catalog (e.g., Yale Bright Star) to fill the celestial vault. Probably not.


## Comments from Boots for next session:
The “Clean” Architecture for Helios:
The Model (core/): This should be "Headless." It takes a JulianDate and returns coordinates. It shouldn't know that a browser or a canvas even exists. This makes your Keplerian math testable with vitest.
The View (render/): These are your "Painters." They take coordinates and a CanvasContext and draw shapes. They don't care how the Sun's position was calculated; they just care where it goes on the screen.
The Controller (main.ts): This becomes the "Orchestrator." Its only job is to:
Listen for UI events (Inputs/Buttons).
Run the requestAnimationFrame loop.
Pass data from the Model to the View.
How to refactor tomorrow:
I suggest creating a SkyRenderer class or a set of functions in src/render/ that encapsulates all the ctx calls.

3. Suggested Commit Strategy for the Refactor
If you choose to clean up the CSS and the Main logic tomorrow, I will remind you to keep them atomic:

Commit 1 (Style): refactor: modularize CSS into reusable utility classes
Commit 2 (Model): refactor: extract celestial math to core/orbit.ts (The "Logic")
Commit 3 (View): refactor: move canvas drawing to render/skyRenderer.ts (The "Paint")