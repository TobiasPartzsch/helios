import { degToRad, Radians, radToDeg } from "./core/angles";
import { moonEquatorialCoordinates, moonPhase } from "./core/bodies/moon";
import { sunEquatorialCoordinates } from "./core/bodies/sun";
import type { EquatorialCoords, HorizontalCoords } from "./core/coordinates";
import { equatorialToHorizontal } from "./core/coordinates/transforms";
import { getLunarEclipseCandidateInfo, getSolarEclipseCandidateInfo } from "./core/eclipse";
import { HorizonProfile } from "./core/horizon";
import { normalizeRad, radToHours } from "./core/math";
import { planetGeocentricEquatorialCoordinates } from "./core/orbit/propagate";
import { loadRouteCsv, parseRouteCsv } from "./core/routes/parseCsv";
import { formatEclipseInfo, formatEoT, formatHours } from "./core/time/format";
import { dateToJulianDate, getDaysSinceJ2000 } from "./core/time/julian";
import { localSiderealTimeRad } from "./core/time/sidereal";
import { MoonFaceRenderer } from "./render/moonFaceRenderer";
import { SkyRenderer, SkyRenderState } from "./render/skyRenderer";
import "./style.css";
import { applyEasterEgg } from "./ui/easteregg";
import { BODY_NAMES, BodyName, getObserverState, syncBodyControls, syncTimeControlsFromDate, UI } from "./ui/elements";
import { initHorizonFetch } from "./ui/horizonController";
import { LensController } from "./ui/lensController";
import { handleLoadedRoute, initRouteController, updateObserverFromRoute } from "./ui/routeController";
import { getIsRouteMode, getPlaying, setPlaying } from "./ui/simulationController";

// Renderers
const skyRenderer = new SkyRenderer(UI.canvas.main);
const moonFaceRenderer = new MoonFaceRenderer(UI.canvas.moonFace);
const lensController = new LensController();

// Simulation state
let currentHorizonProfile: HorizonProfile | null = null;
let lastTimestamp = 0;
let simTime = new Date(
    Date.UTC(
        parseInt(UI.inputs.time.year.value),
        parseInt(UI.inputs.time.month.value) - 1,
        parseInt(UI.inputs.time.day.value),
        ...UI.inputs.time.clockTime.value.split(":").map(Number),
    ),
).getTime();
export function getSimTime() { return simTime; }
export function setSimTime(date: number) {
    simTime = date;
    // Any logic that MUST run whenever time changes goes here
}

// Planet names handled by the Kepler engine (excludes sun and moon)
const PLANET_NAMES = BODY_NAMES.filter((n) => n !== "sun" && n !== "moon");

function formatAltAz(horiz: HorizontalCoords): string {
    return `Alt: ${radToDeg(horiz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(horiz.azimuthRad).toFixed(2)}°`;
}

function formatRaDec(eq: EquatorialCoords): string {
    return `RA: ${radToHours(eq.rightAscensionRad).toFixed(3)}h, Dec: ${radToDeg(eq.declinationRad).toFixed(2)}°`;
}

export function update(providedJd?: number) {
    // TODO: remove performance check
    const start = performance.now();

    const { outputs } = UI;
    const state = getObserverState();
    const jd = providedJd ?? dateToJulianDate(state.date);
    const daysSinceJ2000 = getDaysSinceJ2000(providedJd ?? dateToJulianDate(state.date));

    const latRad = degToRad(state.latDeg);
    const lonRad = degToRad(state.lonDeg)
    const lstRad = localSiderealTimeRad(daysSinceJ2000, lonRad);

    // Telemetry
    const utcHours =
        state.date.getUTCHours() +
        state.date.getUTCMinutes() / 60 +
        state.date.getUTCSeconds() / 3600;
    const lmtHours = ((utcHours + state.lonDeg / 15.0) % 24 + 24) % 24;

    // Sun needs to always be processed
    const sunEq = sunEquatorialCoordinates(daysSinceJ2000);
    const sunHoriz = equatorialToHorizontal(sunEq, latRad, lstRad, state.refractionModel);
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
    if (state.bodies.moon.enabled) {
        const moonEq = moonEquatorialCoordinates(daysSinceJ2000);
        moonHoriz = equatorialToHorizontal(moonEq, latRad, lstRad, state.refractionModel);
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
        if (state.bodies[name].enabled) {
            const eq = planetGeocentricEquatorialCoordinates(name, daysSinceJ2000);
            const horiz = equatorialToHorizontal(eq, latRad, lstRad, state.refractionModel);
            planetHorizMap[name] = horiz;
            const out = outputs[name as keyof typeof outputs] as HTMLElement;
            out.innerText = formatAltAz(horiz);
            out.title = formatRaDec(eq);
        }
    }

    applyEasterEgg(state.date);

    // Time telemetry
    outputs.lst.innerText = formatHours(radToHours(lstRad));
    outputs.lmt.innerText = formatHours(lmtHours);
    outputs.jd.innerText = jd.toFixed(5);

    // Render
    const renderState: SkyRenderState = {
        daysSinceJ2000, latRad, lonRad,
        sunHoriz: sunHoriz ?? undefined,
        moonHoriz: moonHoriz ?? undefined,
        planetHorizMap,
        bodies: state.bodies,
        horizonProfile: currentHorizonProfile,
        refractionModel: state.refractionModel,
        useSymbols: state.useSymbols,
    };
    skyRenderer.render(renderState);
    lensController.setRenderState(renderState);

    const end = performance.now();
    if (end - start > 16) {
        console.warn(`Slow frame: ${(end - start).toFixed(2)}ms`);
    }
}

function animate(timestamp: number) {
    if (getPlaying()) {
        const dt = timestamp - lastTimestamp;
        const unit = parseFloat(UI.selects.timeUnit.value);
        const multiplier = parseFloat(UI.inputs.settings.simSpeed.value);

        // Advance Master Time
        simTime += dt * unit * multiplier;
        const date = new Date(simTime);

        // 1. Update Time UI
        syncTimeControlsFromDate(date);

        // 2. If in Route Mode, update Location and Slider
        updateObserverFromRoute(simTime); // Call it regardless of mode
        if (getIsRouteMode()) {
            // We use the new helper in the controller
            updateObserverFromRoute(simTime);
        }

        // 3. Trigger celestial engine update
        update(dateToJulianDate(date));
    }
    lastTimestamp = timestamp;
    requestAnimationFrame(animate);
}

// Start loop
requestAnimationFrame(animate);

// Initialize to UTC now
const now = new Date();
syncTimeControlsFromDate(now);
simTime = now.getTime();
syncBodyControls();
update(dateToJulianDate(now));

// Manual input handler
const handleManualInput = () => {
    console.log("handleManualInput called");
    const d = new Date(
        Date.UTC(
            parseInt(UI.inputs.time.year.value),
            parseInt(UI.inputs.time.month.value) - 1,
            parseInt(UI.inputs.time.day.value),
            ...UI.inputs.time.clockTime.value.split(":").map(Number),
        ),
    );
    simTime = d.getTime();
    update(dateToJulianDate(d));
};

initHorizonFetch((profile) => {
    currentHorizonProfile = profile;
    update();
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
    UI.bodies[name].enabled.addEventListener("change", () => {
        syncBodyControls();
        update();
    });
    UI.bodies[name].displayMode.addEventListener("change", () => {
        syncBodyControls();
        update();
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