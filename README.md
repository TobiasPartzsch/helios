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

## Next Steps by priority
- **Horizon Silhouette**: Allow users to upload an SVG of their local horizon to see exactly when stars "rise" over their specific hills. Maybe pull from https://www.heywhatsthat.com/?
- **Eclipse Predictor**: Implement a shadow-intersection check to detect Solar and Lunar eclipses.
- **The Planetary Parade**: Incorporate Mercury, Venus, Mars, Jupiter, and Saturn using their respective orbital elements.
- **Stars and Constellations**: Import a basic star catalog (e.g., Yale Bright Star) to fill the celestial vault. Probably not.