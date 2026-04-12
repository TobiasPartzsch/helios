import { degToRad, Radians, radToDeg } from "./core/angles";
import { moonEquatorialCoordinates, moonPhase } from "./core/bodies/moon";
import { sunEquatorialCoordinates } from "./core/bodies/sun";
import type { EquatorialCoords, HorizontalCoords } from "./core/coordinates";
import { equatorialToHorizontal } from "./core/coordinates/transforms";
import { getLunarEclipseCandidateInfo, getSolarEclipseCandidateInfo } from "./core/eclipse";
import { HorizonProfile } from "./core/horizon";
import { normalizeRad, radToHours } from "./core/math";
import { planetGeocentricEquatorialCoordinates } from "./core/orbit/propagate";
import { formatEclipseInfo, formatEoT, formatHours } from "./core/time/format";
import { dateToJulianDate, getDaysSinceJ2000 } from "./core/time/julian";
import { localSiderealTimeRad } from "./core/time/sidereal";
import { MoonFaceRenderer } from "./render/moonFaceRenderer";
import { SkyRenderer, SkyRenderState } from "./render/skyRenderer";
import "./style.css";
import { applyEasterEgg } from "./ui/easteregg";
import { BODY_NAMES, BodyName, getObserverState, syncUiFromDate, UI } from "./ui/elements";
import { initHorizonFetch } from "./ui/horizonController";
import { LensController } from "./ui/lensController";

// Renderers
const skyRenderer = new SkyRenderer(UI.canvas.main);
const moonFaceRenderer = new MoonFaceRenderer(UI.canvas.moonFace);
const lensController = new LensController();

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

    // Sun
    let sunHoriz = null;
    if (state.bodies.sun.enabled) {
        const sunEq = sunEquatorialCoordinates(daysSinceJ2000);
        sunHoriz = equatorialToHorizontal(sunEq, latRad, lstRad, state.refractionModel);
        const sunHourAngleRad = normalizeRad(lstRad - sunEq.rightAscensionRad);

        const solarEclipse = getSolarEclipseCandidateInfo(daysSinceJ2000);

        outputs.sun.innerText = solarEclipse.isCandidate
            ? `${formatAltAz(sunHoriz)} | ${formatEclipseInfo("Solar cand.", solarEclipse.longitudeErrorDeg, solarEclipse.eclipticLatitudeDeg)}`
            : formatAltAz(sunHoriz);
        outputs.sun.title = formatRaDec(sunEq);

        const eotHours = lmtHours - 12 - (radToHours(sunHourAngleRad));
        outputs.eot.innerText = formatEoT(eotHours);

    }

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