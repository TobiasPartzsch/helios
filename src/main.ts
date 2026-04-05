import { moonEquatorialCoordinates, moonPhase } from "./core/bodies/moon";
import { sunEquatorialCoordinates } from "./core/bodies/sun";
import type { EquatorialCoords, HorizontalCoords } from "./core/coordinates";
import { equatorialToHorizontal } from "./core/coordinates";
import { HorizonProfile } from "./core/horizon";
import { degToRad, radToDeg, radToHours } from "./core/math";
import { planetEquatorialCoordinates } from "./core/orbit/propagate";
import { formatEoT, formatHours } from "./core/time/format";
import { dateToJulianDate } from "./core/time/julian";
import { localSiderealTimeHours } from "./core/time/sidereal";
import { MoonFaceRenderer } from "./render/moonFaceRenderer";
import { SkyRenderer } from "./render/skyRenderer";
import "./style.css";
import { BODY_NAMES, BodyName, getObserverState, syncUiFromDate, UI } from "./ui/elements";
import { initHorizonFetch } from "./ui/horizonController";

// Renderers
const skyRenderer = new SkyRenderer(UI.canvas.main);
const moonFaceRenderer = new MoonFaceRenderer(UI.canvas.moonFace);

// Simulation state
let currentHorizonProfile: HorizonProfile | null = null;
let isPlaying = false;
let lastTimestamp = 0;
let simTime = new Date(
    Date.UTC(
        parseInt(UI.inputs.year.value),
        parseInt(UI.inputs.month.value) - 1,
        parseInt(UI.inputs.day.value),
        ...UI.inputs.clockTime.value.split(":").map(Number),
    ),
).getTime();

// Planet names handled by the Kepler engine (excludes sun and moon)
const PLANET_NAMES = BODY_NAMES.filter((n) => n !== "sun" && n !== "moon");

function formatAltAz(horiz: HorizontalCoords): string {
    return `Alt: ${radToDeg(horiz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(horiz.azimuthRad).toFixed(2)}°`;
}

function formatRaDec(eq: EquatorialCoords): string {
    return `RA: ${radToHours(eq.rightAscensionRad).toFixed(3)}h, Dec: ${radToDeg(eq.declinationRad).toFixed(2)}°`;
}

function update(providedJd?: number) {
    const { outputs } = UI;
    const state = getObserverState();
    const jd = providedJd ?? dateToJulianDate(state.date);
    const latRad = degToRad(state.latDeg);
    const lstHours = localSiderealTimeHours(jd, state.lonDeg);
    const lstRad = degToRad(lstHours * 15);

    // Telemetry
    const utcHours =
        state.date.getUTCHours() +
        state.date.getUTCMinutes() / 60 +
        state.date.getUTCSeconds() / 3600;
    const lmtHours = ((utcHours + state.lonDeg / 15.0) % 24 + 24) % 24;

    // Sun
    let sunHoriz = null;
    if (state.bodies.sun.enabled) {
        const sunEq = sunEquatorialCoordinates(jd);
        sunHoriz = equatorialToHorizontal(sunEq, latRad, lstRad, state.refractionModel);
        const eotHours = lmtHours - 12 - (lstHours - radToHours(sunEq.rightAscensionRad));
        outputs.sun.innerText = formatAltAz(sunHoriz);
        outputs.sun.title = formatRaDec(sunEq);
        outputs.eot.innerText = formatEoT(eotHours);
    }

    // Moon
    let moonHoriz = null;
    if (state.bodies.moon.enabled) {
        const moonEq = moonEquatorialCoordinates(jd);
        moonHoriz = equatorialToHorizontal(moonEq, latRad, lstRad, state.refractionModel);
        const phaseInfo = moonPhase(jd);
        outputs.moon.innerText = formatAltAz(moonHoriz);
        outputs.moon.title = formatRaDec(moonEq);
        outputs.phase.innerText = `${phaseInfo.phaseName} (${(phaseInfo.illuminatedFraction * 100).toFixed(1)}%)`;
        moonFaceRenderer.render({
            illuminatedFraction: phaseInfo.illuminatedFraction,
            sunHoriz: sunHoriz ?? { altitudeRad: 0, azimuthRad: 0 },
            moonHoriz,
        });
    }

    // Planets
    const planetHorizMap: Partial<Record<BodyName, HorizontalCoords>> = {};
    for (const name of PLANET_NAMES) {
        if (state.bodies[name].enabled) {
            const eq = planetEquatorialCoordinates(name, jd);
            const horiz = equatorialToHorizontal(eq, latRad, lstRad, state.refractionModel);
            planetHorizMap[name] = horiz;
            const out = outputs[name as keyof typeof outputs] as HTMLElement;
            out.innerText = formatAltAz(horiz);
            out.title = formatRaDec(eq);
        }
    }

    // Time telemetry
    outputs.lst.innerText = formatHours(lstHours);
    outputs.lmt.innerText = formatHours(lmtHours);
    outputs.jd.innerText = jd.toFixed(5);

    // Render
    skyRenderer.render({
        jd,
        latRad,
        lonDeg: state.lonDeg,
        sunHoriz: sunHoriz ?? undefined,
        moonHoriz: moonHoriz ?? undefined,
        planetHorizMap,
        bodies: state.bodies,
        horizonProfile: currentHorizonProfile,
        refractionModel: state.refractionModel,
        useSymbols: state.useSymbols,
    });
}

function animate(timestamp: number) {
    if (isPlaying) {
        const dt = timestamp - lastTimestamp;
        const unit = parseFloat(UI.select.timeUnit.value);
        const multiplier = parseFloat(UI.inputs.simSpeed.value);
        UI.slider.speedVal.innerText = multiplier.toString();
        simTime += dt * unit * multiplier;
        const date = new Date(simTime);
        syncUiFromDate(date);
        update(dateToJulianDate(date));
    }
    lastTimestamp = timestamp;
    requestAnimationFrame(animate);
}

// Start loop
requestAnimationFrame(animate);

// Initialize to UTC now
const now = new Date();
syncUiFromDate(now);
simTime = now.getTime();
update(dateToJulianDate(now));

// Manual input handler
const handleManualInput = () => {
    console.log("handleManualInput called");
    const d = new Date(
        Date.UTC(
            parseInt(UI.inputs.year.value),
            parseInt(UI.inputs.month.value) - 1,
            parseInt(UI.inputs.day.value),
            ...UI.inputs.clockTime.value.split(":").map(Number),
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
UI.buttons.play.onclick = () => (isPlaying = true);
UI.buttons.pause.onclick = () => (isPlaying = false);
UI.inputs.simSpeed.addEventListener("input", (e) => {
    UI.slider.speedVal.innerText = (e.target as HTMLInputElement).value;
});
Object.values(UI.inputs).forEach(
    (el) => el.addEventListener("change", handleManualInput),
);
Object.values(UI.select).forEach(
    (el) => el.addEventListener("change", handleManualInput),
);

// Body toggle listeners - recalculate immediately on change
for (const name of BODY_NAMES) {
    UI.bodies[name].enabled.addEventListener("change", handleManualInput);
    UI.bodies[name].visible.addEventListener("change", () => update());
}