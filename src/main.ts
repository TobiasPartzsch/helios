import { degToRad, Radians, radToDeg } from "./core/angles";
import { moonEquatorialCoordinates, moonPhase } from "./core/bodies/moon";
import { sunEquatorialCoordinates } from "./core/bodies/sun";
import type { EquatorialCoords, HorizontalCoords } from "./core/coordinates";
import { equatorialToHorizontal } from "./core/coordinates/transforms";
import { getLunarEclipseCandidateInfo, getSolarEclipseCandidateInfo } from "./core/eclipse";
import { normalizeRad, radToHours } from "./core/math";
import { planetGeocentricEquatorialCoordinates } from "./core/orbit/propagate";
import { loadRouteCsv, parseRouteCsv } from "./core/routes/parseCsv";
import { engine } from "./core/simulation/instance";
import { formatEclipseInfo, formatEoT, formatHours } from "./core/time/format";
import { dateToJulianDate, DaysSinceJ2000, getDaysSinceJ2000, J2000_EPOCH } from "./core/time/julian";
import { localSiderealTimeRad } from "./core/time/sidereal";
import { SimulationState } from "./core/types";
import { MoonFaceRenderer } from "./render/moonFaceRenderer";
import { SkyRenderer, SkyRenderState } from "./render/skyRenderer";
import "./style.css";
import { applyEasterEgg } from "./ui/easteregg";
import { BODY_NAMES, BodyConfig, BodyName, syncBodyControls, syncTimeControlsFromDate, UI } from "./ui/elements";
import { initHorizonFetch } from "./ui/horizonController";
import { LensController } from "./ui/lensController";
import { handleLoadedRoute, initRouteController, syncRouteUI } from "./ui/routeController";
import { getPlaying, setPlaying } from "./ui/simulationController";

// Renderers
const skyRenderer = new SkyRenderer(UI.canvas.main);
const moonFaceRenderer = new MoonFaceRenderer(UI.canvas.moonFace);
const lensController = new LensController();

// Simulation state
let lastTimestamp = 0;

// Planet names handled by the Kepler engine (excludes sun and moon)
const PLANET_NAMES = BODY_NAMES.filter((n) => n !== "sun" && n !== "moon");

function formatAltAz(horiz: HorizontalCoords): string {
    return `Alt: ${radToDeg(horiz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(horiz.azimuthRad).toFixed(2)}°`;
}

function formatRaDec(eq: EquatorialCoords): string {
    return `RA: ${radToHours(eq.rightAscensionRad).toFixed(3)}h, Dec: ${radToDeg(eq.declinationRad).toFixed(2)}°`;
}

export function update(daysSinceJ2000: DaysSinceJ2000) {
    // TODO: remove performance check
    const start = performance.now();

    const engineState = engine.getState();
    const { outputs } = UI;

    // 1. Calculate fundamental observer angles
    const latRad = degToRad(engineState.observer.latDeg);
    const lonRad = degToRad(engineState.observer.lonDeg);
    const lstRad = localSiderealTimeRad(daysSinceJ2000, lonRad);

    // 2. Convert J2000 to a Date JUST for the legacy formatters/telemetry
    const unixMs = (daysSinceJ2000 + 2451545.0 - 2440587.5) * 86400000;
    const date = new Date(unixMs);

    // 3. Telemetry (LMT/EoT)
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const lmtHours = ((utcHours + engineState.observer.lonDeg / 15.0) % 24 + 24) % 24;

    // Sun needs to always be processed
    const sunEq = sunEquatorialCoordinates(daysSinceJ2000);
    const sunHoriz = equatorialToHorizontal(sunEq, latRad, lstRad, engineState.refractionModel);
    const sunHourAngleRad = normalizeRad(lstRad - sunEq.rightAscensionRad);

    const solarEclipse = getSolarEclipseCandidateInfo(daysSinceJ2000);

    outputs.sun.innerText = solarEclipse.isCandidate
        ? `${formatAltAz(sunHoriz)} | ${formatEclipseInfo("Solar cand.", solarEclipse.longitudeErrorDeg, solarEclipse.eclipticLatitudeDeg)}`
        : formatAltAz(sunHoriz);
    outputs.sun.title = formatRaDec(sunEq);

    const eotHours = lmtHours - 12 - (radToHours(sunHourAngleRad));
    outputs.eot.innerText = formatEoT(eotHours);

    // Moon
    let moonHoriz = null;
    if (engineState.bodies.moon.enabled) {
        const moonEq = moonEquatorialCoordinates(daysSinceJ2000);
        moonHoriz = equatorialToHorizontal(moonEq, latRad, lstRad, engineState.refractionModel);
        const phaseInfo = moonPhase(daysSinceJ2000);
        const lunarEclipse = getLunarEclipseCandidateInfo(daysSinceJ2000);

        outputs.moon.innerText = lunarEclipse.isCandidate
            ? `${formatAltAz(moonHoriz)} | ${formatEclipseInfo("Lunar cand.", lunarEclipse.longitudeErrorDeg, lunarEclipse.eclipticLatitudeDeg)}`
            : formatAltAz(moonHoriz);
        outputs.moon.title = formatRaDec(moonEq);
        outputs.phase.innerText = `${phaseInfo.phaseName} (${(phaseInfo.illuminatedFraction * 100).toFixed(1)}%)`;
        moonFaceRenderer.render({
            illuminatedFraction: phaseInfo.illuminatedFraction,
            sunHoriz: sunHoriz ?? { altitudeRad: 0 as Radians, azimuthRad: 0 as Radians },
            moonHoriz,
        });
    }

    // Planets
    const planetHorizMap: Partial<Record<BodyName, HorizontalCoords>> = {};
    for (const name of PLANET_NAMES) {
        if (engineState.bodies[name].enabled) {
            const eq = planetGeocentricEquatorialCoordinates(name, daysSinceJ2000);
            const horiz = equatorialToHorizontal(eq, latRad, lstRad, engineState.refractionModel);
            planetHorizMap[name] = horiz;
            const out = outputs[name as keyof typeof outputs] as HTMLElement;
            out.innerText = formatAltAz(horiz);
            out.title = formatRaDec(eq);
        }
    }

    applyEasterEgg(date);

    // Time telemetry
    outputs.lst.innerText = formatHours(radToHours(lstRad));
    outputs.lmt.innerText = formatHours(lmtHours);
    const fullJD = daysSinceJ2000 + J2000_EPOCH;
    UI.outputs.jd.innerText = fullJD.toFixed(5);

    // Render
    const renderState: SkyRenderState = {
        daysSinceJ2000, latRad, lonRad,
        sunHoriz: sunHoriz ?? undefined,
        moonHoriz: moonHoriz ?? undefined,
        planetHorizMap,
        bodies: engineState.bodies,
        horizonProfile: engineState.horizonProfile,
        refractionModel: engineState.refractionModel,
        useSymbols: engineState.useSymbols,
    };
    skyRenderer.render(renderState);
    lensController.setRenderState(renderState);

    const end = performance.now();
    if (end - start > 16) {
        console.warn(`Slow frame: ${(end - start).toFixed(2)}ms`);
    }
}

function animate(timestamp: number) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const state = engine.tick(dt);

    syncUIFromState(state);
    update(state.time);

    requestAnimationFrame(animate);
}

// Start loop
requestAnimationFrame(animate);

const handleManualInput = () => {
    const d = new Date(
        Date.UTC(
            parseInt(UI.inputs.time.year.value),
            parseInt(UI.inputs.time.month.value) - 1,
            parseInt(UI.inputs.time.day.value),
            ...UI.inputs.time.clockTime.value.split(":").map(Number),
        ),
    )
    const jd = dateToJulianDate(d);

    engine.updateState({ time: getDaysSinceJ2000(jd) });
    // update() will be called by the animate loop automatically
};

initHorizonFetch((profile) => {
    engine.updateState({ horizonProfile: profile });
});

// Listeners
UI.buttons.play.onclick = () => setPlaying(!getPlaying());
UI.inputs.settings.simSpeed.addEventListener("input", (e) => {
    const value = Number((e.target as HTMLInputElement).value);
    UI.slider.speedVal.innerText = String(value);

    UI.slider.speedVal.classList.remove("speed-negative", "speed-zero", "speed-positive");

    if (value < 0) {
        UI.slider.speedVal.classList.add("speed-negative");
    } else if (value > 0) {
        UI.slider.speedVal.classList.add("speed-positive");
    } else {
        UI.slider.speedVal.classList.add("speed-zero");
    }
});

initRouteController(
    async (path) => {
        try {
            const csvText = await loadRouteCsv(path);
            const route = parseRouteCsv(csvText);
            handleLoadedRoute(route);
        } catch (e) {
            console.error("Failed to load route path:", e);
        }
    },
    async (file) => {
        try {
            const csvText = await file.text();
            const route = parseRouteCsv(csvText);
            handleLoadedRoute(route);
        } catch (e) {
            console.error("Failed to parse uploaded file:", e);
        }
    },
);

attachRecursive(UI.inputs, "change", handleManualInput);
attachRecursive(UI.selects, "change", handleManualInput);

for (const name of BODY_NAMES) {
    UI.bodies[name].enabled.addEventListener("change", (e) => {
        const isEnabled = (e.target as HTMLInputElement).checked;

        const bodiesUpdate = {
            [name]: {
                ...engine.getState().bodies[name],
                enabled: isEnabled
            }
        } as Record<BodyName, BodyConfig>;
        engine.updateState({
            bodies: bodiesUpdate,
        });

        syncBodyControls(engine.getState());
        update(engine.getState().time);
    });

    UI.bodies[name].displayMode.addEventListener("change", (e) => {
        const mode = (e.target as HTMLSelectElement).value as any;

        const bodiesUpdate = {
            [name]: {
                ...engine.getState().bodies[name],
                displayMode: mode
            }
        } as Record<BodyName, BodyConfig>;
        engine.updateState({
            bodies: bodiesUpdate
        });

        syncBodyControls(engine.getState());
        update(engine.getState().time);
    });
}

/**
 * Recursively attaches a listener to all HTML elements 
 * within a nested object structure.
 */
function attachRecursive(group: any, event: string, handler: EventListener) {
    Object.values(group).forEach((value) => {
        if (value instanceof HTMLElement) {
            // It's a leaf node (Input, Select, etc.)
            value.addEventListener(event, handler);
        } else if (value && typeof value === 'object') {
            // It's a nested group, dive deeper
            attachRecursive(value, event, handler);
        }
    });
}

function syncUIFromState(state: SimulationState) {
    // 1. Time
    // Convert DaysSinceJ2000 back to Date for the UI helpers
    const jd = state.time + 2451545.0;
    const unixMs = (jd - 2440587.5) * 86400000;
    const date = new Date(unixMs);
    syncTimeControlsFromDate(date);

    // 2. Observer Location
    UI.inputs.location.lat.value = state.observer.latDeg.toFixed(6);
    UI.inputs.location.lon.value = state.observer.lonDeg.toFixed(6);
    UI.inputs.location.elev.value = state.observer.elevationAmsl.toString();

    // 3. Route Slider (if in route mode)
    if (state.isRouteMode) {
        syncRouteUI(unixMs);
    }
}