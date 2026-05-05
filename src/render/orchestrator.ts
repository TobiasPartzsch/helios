import { degToRad, Radians, radToDeg } from "../core/angles";
import { moonEquatorialCoordinates, moonPhase } from "../core/bodies/moon";
import { sunEquatorialCoordinates } from "../core/bodies/sun";
import { EquatorialCoords, HorizontalCoords } from "../core/coordinates";
import { equatorialToHorizontal } from "../core/coordinates/transforms";
import { getLunarEclipseCandidateInfo, getSolarEclipseCandidateInfo } from "../core/eclipse";
import { normalizeRad, radToHours } from "../core/math";
import { geocentricDistance, planetGeocentricEquatorialCoordinates } from "../core/orbit/propagate";
import { daysSinceJ2000ToUnixMs, J2000_EPOCH } from "../core/time";
import { formatEclipseInfo, formatEoT, formatHours } from "../core/time/format";
import { localSiderealTimeRad } from "../core/time/sidereal";
import { calculateEoT, calculateLMTFromDays } from "../core/time/telemetry";
import { DaysSinceJ2000 } from "../core/time/types";
import { AU, SimulationState } from "../core/types";
import { applyEasterEgg } from "../ui/easteregg";
import { BODY_NAMES, BodyName, UI } from "../ui/elements";
import { LensController } from "../ui/lensController";
import { MoonFaceRenderer } from "./moonFaceRenderer";
import { SkyRenderer } from "./skyRenderer";
import { SkyRenderState } from "./types";

const PLANET_NAMES = BODY_NAMES.filter((n) => n !== "sun" && n !== "moon");

const skyRenderer = new SkyRenderer(UI.canvas.main);
const moonFaceRenderer = new MoonFaceRenderer(UI.canvas.moonFace);
const lensController = new LensController();

let distanceCache: Partial<Record<BodyName, AU>> = {};
let lastDistanceUpdate: DaysSinceJ2000 = -1 as DaysSinceJ2000;
const DISTANCE_REFRESH_THRESHOLD = 1; // 1 day

export function updateTelemetryAndRender(state: SimulationState) {
    const { time: daysSinceJ2000, observer, bodies, refractionModel } = state;
    const { outputs } = UI;

    // Fundamental Angles
    const latRad = degToRad(observer.latDeg);
    const lonRad = degToRad(observer.lonDeg);
    const lstRad = localSiderealTimeRad(daysSinceJ2000, lonRad);

    // Celestial Calculations (Sun, Moon, Planets)
    // Sun needs to always be processed
    const sunEq = sunEquatorialCoordinates(daysSinceJ2000);
    const sunHoriz = equatorialToHorizontal(sunEq, latRad, lstRad, state.refractionModel);
    const sunHourAngleRad = normalizeRad(lstRad - sunEq.rightAscensionRad);

    const solarEclipse = getSolarEclipseCandidateInfo(daysSinceJ2000);

    outputs.sun.innerText = solarEclipse.isCandidate
        ? `${formatAltAz(sunHoriz)} | ${formatEclipseInfo("Solar cand.", solarEclipse.longitudeErrorDeg, solarEclipse.eclipticLatitudeDeg)}`
        : formatAltAz(sunHoriz);
    outputs.sun.title = formatRaDec(sunEq);

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

    // Distances to Earth
    const distanceMap = getUpdatedDistances(daysSinceJ2000);

    // High-precision math for Telemetry
    // (Adding 0.5 because J2000 epoch is at Noon UTC)
    const dayFraction = (daysSinceJ2000 + 0.5) % 1;
    const utcHours = ((dayFraction * 24) % 24 + 24) % 24;
    const lmtHours = calculateLMTFromDays(utcHours, observer.lonDeg);
    const eotHours = calculateEoT(lmtHours, radToHours(sunHourAngleRad));

    // Calendar-precision for Easter Eggs & legacy JD display
    const unixMs = daysSinceJ2000ToUnixMs(daysSinceJ2000)
    const date = new Date(unixMs);
    const fullJD = daysSinceJ2000 + J2000_EPOCH;

    applyEasterEgg(date)

    // UI Telemetry Output
    outputs.lst.innerText = formatHours(radToHours(lstRad));
    outputs.lmt.innerText = formatHours(lmtHours);
    outputs.eot.innerText = formatEoT(eotHours);
    UI.outputs.jd.innerText = fullJD.toFixed(5);

    // Final Render Call
    const renderState: SkyRenderState = {
        daysSinceJ2000, latRad, lonRad,
        sunHoriz: sunHoriz ?? undefined,
        moonHoriz: moonHoriz ?? undefined,
        planetHorizMap,
        distanceMap,
        bodies: state.bodies,
        horizonProfile: state.horizonProfile,
        refractionModel: state.refractionModel,
        useSymbols: state.useSymbols,
    };
    skyRenderer.render(renderState);
    lensController.setRenderState(renderState);
}

function formatAltAz(horiz: HorizontalCoords): string {
    return `Alt: ${radToDeg(horiz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(horiz.azimuthRad).toFixed(2)}°`;
}

function formatRaDec(eq: EquatorialCoords): string {
    return `RA: ${radToHours(eq.rightAscensionRad).toFixed(3)}h, Dec: ${radToDeg(eq.declinationRad).toFixed(2)}°`;
}

function getUpdatedDistances(currentTime: DaysSinceJ2000): Partial<Record<BodyName, AU>> {
    if (Math.abs(currentTime - lastDistanceUpdate) < DISTANCE_REFRESH_THRESHOLD && Object.keys(distanceCache).length > 0) {
        return distanceCache;
    }

    const newDistances: Partial<Record<BodyName, AU>> = {};
    for (const name of BODY_NAMES) {
        newDistances[name] = geocentricDistance(name, currentTime);
    }

    distanceCache = newDistances;
    lastDistanceUpdate = currentTime;
    return newDistances;
}