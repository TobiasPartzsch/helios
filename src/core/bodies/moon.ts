import type { EquatorialCoords } from "../coordinates";
import { getDaysSinceJ2000, getDaysSinceJ2000_5 } from '../time/julian';

function degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

function radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
}

function normalizeDeg(angle: number): number {
    const full = 360;
    return ((angle % full) + full) % full;
}

function normalizeRad(angle: number): number {
    const twoPi = 2 * Math.PI;
    return ((angle % twoPi) + twoPi) % twoPi;
}

/**
 * Internal helper: approximate Sun ecliptic longitude (radians)
 * for given Julian Date. Matches the Sun module’s low-precision model.
 */
function sunEclipticLongitudeRad(jd: number): number {
    const n = getDaysSinceJ2000(jd)

    // Mean longitude L (deg)
    let L = 280.460 + 0.9856474 * n;
    L = normalizeDeg(L);

    // Mean anomaly g (deg)
    let g = 357.528 + 0.9856003 * n;
    g = normalizeDeg(g);

    const gRad = degToRad(g);

    // Ecliptic longitude lambda (deg)
    let lambda = L + 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);
    lambda = normalizeDeg(lambda);

    return degToRad(lambda);
}

/**
 * Compute the Moon's approximate equatorial coordinates (RA/Dec) for a given Julian Date.
 */
export function moonEquatorialCoordinates(jd: number): EquatorialCoords {
    const D = getDaysSinceJ2000_5(jd)

    let Lp = 218.316 + 13.176396 * D;
    Lp = normalizeDeg(Lp);

    let Mm = 134.963 + 13.064993 * D;
    Mm = normalizeDeg(Mm);

    let Ms = 357.529 + 0.98560028 * D;
    Ms = normalizeDeg(Ms);

    let F = 93.272 + 13.229350 * D;
    F = normalizeDeg(F);

    const LpRad = degToRad(Lp);
    const MmRad = degToRad(Mm);
    const MsRad = degToRad(Ms);
    const FRad = degToRad(F);
    const twoD = degToRad(2 * D);

    let lambda =
        Lp +
        6.289 * Math.sin(MmRad) +
        1.274 * Math.sin(twoD - MmRad) +
        0.658 * Math.sin(twoD) +
        0.214 * Math.sin(2 * MmRad) -
        0.186 * Math.sin(MsRad);
    lambda = normalizeDeg(lambda);

    let beta =
        5.128 * Math.sin(FRad) +
        0.280 * Math.sin(MmRad + FRad) +
        0.277 * Math.sin(MmRad - FRad) +
        0.173 * Math.sin(twoD - FRad);

    const lambdaRad = degToRad(lambda);
    const betaRad = degToRad(beta);

    const epsilon = 23.439 - 0.0000004 * D;
    const epsilonRad = degToRad(epsilon);

    const sinLambda = Math.sin(lambdaRad);
    const cosLambda = Math.cos(lambdaRad);
    const sinBeta = Math.sin(betaRad);
    const cosBeta = Math.cos(betaRad);
    const sinEps = Math.sin(epsilonRad);
    const cosEps = Math.cos(epsilonRad);

    const X = cosBeta * cosLambda;
    const Y = cosBeta * sinLambda * cosEps - sinBeta * sinEps;
    const Z = cosBeta * sinLambda * sinEps + sinBeta * cosEps;

    const rightAscensionRad = normalizeRad(Math.atan2(Y, X));
    const declinationRad = Math.asin(Z);

    return { rightAscensionRad, declinationRad };
}

/**
 * Moon phase info.
 */
export interface MoonPhaseInfo {
    /** Illuminated fraction of the lunar disk, 0 = new, 1 = full */
    illuminatedFraction: number;
    /** Phase angle (Sun–Moon–Earth) in radians */
    phaseAngleRad: number;
    /** Phase as 0..1 (0 new → 0.5 full → 1 new) */
    phase: number;
    /** Rough human-readable phase name */
    phaseName: string;
}

/**
 * Compute approximate Moon phase for a given Julian Date.
 */
export function moonPhase(jd: number): MoonPhaseInfo {
    // Moon ecliptic longitude from our model
    const D = getDaysSinceJ2000_5(jd)
    let Lp = 218.316 + 13.176396 * D;
    Lp = normalizeDeg(Lp);
    let Mm = 134.963 + 13.064993 * D;
    Mm = normalizeDeg(Mm);
    let Ms = 357.529 + 0.98560028 * D;
    Ms = normalizeDeg(Ms);
    let F = 93.272 + 13.229350 * D;
    F = normalizeDeg(F);

    const LpRad = degToRad(Lp);
    const MmRad = degToRad(Mm);
    const MsRad = degToRad(Ms);
    const FRad = degToRad(F);
    const twoD = degToRad(2 * D);

    let lambdaMoon =
        Lp +
        6.289 * Math.sin(MmRad) +
        1.274 * Math.sin(twoD - MmRad) +
        0.658 * Math.sin(twoD) +
        0.214 * Math.sin(2 * MmRad) -
        0.186 * Math.sin(MsRad);
    lambdaMoon = normalizeDeg(lambdaMoon);
    const lambdaMoonRad = degToRad(lambdaMoon);

    // Sun ecliptic longitude
    const lambdaSunRad = sunEclipticLongitudeRad(jd);

    // Elongation between Moon and Sun
    const delta = normalizeRad(lambdaMoonRad - lambdaSunRad);

    // Phase angle (Sun–Moon–Earth)
    const phaseAngleRad = Math.acos(Math.cos(delta));

    // Illuminated fraction
    // const illuminatedFraction = (1 + Math.cos(phaseAngleRad)) / 2;
    const illuminatedFraction = (1 - Math.cos(delta)) / 2;

    // Normalized phase 0..1 (0 new, 0.5 full)
    const phase = (1 - Math.cos(delta)) / 2;

    const phaseName = classifyPhase(illuminatedFraction, delta);

    return { illuminatedFraction, phaseAngleRad, phase, phaseName };
}

function classifyPhase(illuminatedFraction: number, deltaRad: number): string {
    const deltaDeg = radToDeg(deltaRad);

    // 1. Extreme Thresholds
    if (illuminatedFraction < 0.03) return "New Moon";
    if (illuminatedFraction > 0.97) return "Full Moon";

    // 2. Identify if it's Waxing (0-180) or Waning (180-360)
    const isWaxing = deltaDeg > 0 && deltaDeg < 180;

    // 3. Quarters (near 50% illumination)
    if (illuminatedFraction > 0.45 && illuminatedFraction < 0.55) {
        return isWaxing ? "First Quarter" : "Last Quarter";
    }

    // 4. Crescent vs Gibbous
    if (illuminatedFraction < 0.5) {
        return isWaxing ? "Waxing Crescent" : "Waning Crescent";
    } else {
        return isWaxing ? "Waxing Gibbous" : "Waning Gibbous";
    }
}