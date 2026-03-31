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

## Recent Progress
- **VSOP87B Precision Upgrade**: Replaced the Keplerian orbital engine with a full 
  VSOP87B series evaluation, improving planetary position accuracy from ~5° to 
  sub-arcminute level for inner planets and ~1° for outer planets.
- **Automated Data Pipeline**: Implemented `scripts/parseVsop87.ts` (via `tsx`) to 
  parse the canonical VSOP87B data files from the Bureau des Longitudes and generate 
  `src/core/orbit/vsop87Data.ts` automatically. Run with `npm run generate:vsop87`.
  Raw data files live in `scripts/vsop87/` and are excluded from version control.
- **Extended Planet Coverage**: Added Uranus and Neptune to the renderer and telemetry 
  panel using the new engine.
- **Verified against JPL Horizons**: Confirmed sub-arcminute agreement for Jupiter 
  and Earth at J2000.0 against JPL Horizons astrometric ICRF ephemeris.
- **Legacy Branch**: Keplerian engine preserved on `kepler-legacy` branch.

## Recent Progress
- added invariant tests for math/time/coordinates
- added refraction tests
- refactored orbit propagation into smaller helpers
- added initial table-driven reference tests for planets
- calibrated Mars against Horizons
- cleaned stale Jupiter/Mars expectations