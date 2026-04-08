import { linearAngleDeg } from "../angles";
import type { EquatorialCoords } from "../coordinates";
import { angularSeparationRad, degToRad, normalizeDeg, normalizeRad, PI, radToDeg, signedAngularDifferenceRad } from "../math";
import { getDaysSinceJ2000_5 } from '../time/julian';
import { MEAN_OBLIQUITY, sunEclipticLongitudeRad, sunEquatorialCoordinates } from "./sun";

export interface EclipticCoords {
    longitudeRad: number;
    latitudeRad: number;
}

const MOON_MEAN_LONGITUDE = { baseDeg: 218.316, rateDegPerDay: 13.176396 };
const MOON_MEAN_ELONGATION = { baseDeg: 297.8501921, rateDegPerDay: 12.19074912 };
const MOON_MEAN_ANOMALY = { baseDeg: 134.963, rateDegPerDay: 13.064993 };
const SUN_MEAN_ANOMALY = { baseDeg: 357.529, rateDegPerDay: 0.98560028 };
const MOON_ARGUMENT_OF_LATITUDE = { baseDeg: 93.272, rateDegPerDay: 13.22935 };

const MOON_LONGITUDE_TERMS_DEG = {
    evection: 1.274,
    variation: 0.658,
    annualEquation: -0.186,
    equationOfCenter: 6.289,
    secondHarmonic: 0.214,
};

const MOON_LATITUDE_TERMS_DEG = {
    primary: 5.128,
    plus: 0.280,
    minus: 0.277,
    evectionLike: 0.173,
};

/**
 * Compute the Moon's approximate equatorial coordinates (RA/Dec) for a given Julian Date.
 */
export function moonEquatorialCoordinates(jd: number): EquatorialCoords {
    const daysSinceJ2000_5 = getDaysSinceJ2000_5(jd);
    const { longitudeRad: lambdaRad, latitudeRad: betaRad } = moonEclipticCoordinates(jd);

    const epsilon = MEAN_OBLIQUITY.baseDeg + MEAN_OBLIQUITY.rateDegPerDay * daysSinceJ2000_5;
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
    const { longitudeRad: lambdaMoonRad } = moonEclipticCoordinates(jd);
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

/**
 * Calculates the precise illuminated fraction based on 
 * the angular separation between the Sun and Moon.
 */
export function calculateIllumination(
    sunEq: { ra: number, dec: number },
    moonEq: { ra: number, dec: number }
): number {
    // Angular separation using spherical trigonometry
    const cosPsi = Math.sin(sunEq.dec) * Math.sin(moonEq.dec) +
        Math.cos(sunEq.dec) * Math.cos(moonEq.dec) *
        Math.cos(sunEq.ra - moonEq.ra);

    // Safety clamp for acos
    const psi = Math.acos(Math.max(-1, Math.min(1, cosPsi)));

    // For a rough approximation, the Phase Angle is roughly 180 - psi
    const phaseAngle = PI - psi;

    // Illuminated fraction (0.0 to 1.0)
    return (1 + Math.cos(phaseAngle)) / 2;
}

export function moonSunAngularSeparationRad(jd: number): number {
    const moonEq = moonEquatorialCoordinates(jd);
    const sunEq = sunEquatorialCoordinates(jd);

    return angularSeparationRad(
        moonEq.rightAscensionRad,
        moonEq.declinationRad,
        sunEq.rightAscensionRad,
        sunEq.declinationRad,
    );
}

export function lunarElongationDeg(jd: number): number {
    return radToDeg(moonSunAngularSeparationRad(jd));
}

export function moonEclipticCoordinates(jd: number): EclipticCoords {
    const daysSinceJ2000_5 = getDaysSinceJ2000_5(jd);

    const meanLongitudeDeg = linearAngleDeg(MOON_MEAN_LONGITUDE.baseDeg, MOON_MEAN_LONGITUDE.rateDegPerDay, daysSinceJ2000_5);
    const moonMeanAnomalyDeg = linearAngleDeg(MOON_MEAN_ANOMALY.baseDeg, MOON_MEAN_ANOMALY.rateDegPerDay, daysSinceJ2000_5);
    const sunMeanAnomalyDeg = linearAngleDeg(SUN_MEAN_ANOMALY.baseDeg, SUN_MEAN_ANOMALY.rateDegPerDay, daysSinceJ2000_5);
    const argumentOfLatitudeDeg = linearAngleDeg(MOON_ARGUMENT_OF_LATITUDE.baseDeg, MOON_ARGUMENT_OF_LATITUDE.rateDegPerDay, daysSinceJ2000_5);

    const MmRad = degToRad(moonMeanAnomalyDeg);
    const MsRad = degToRad(sunMeanAnomalyDeg);
    const FRad = degToRad(argumentOfLatitudeDeg);
    const meanElongationDeg = linearAngleDeg(MOON_MEAN_ELONGATION.baseDeg, MOON_MEAN_ELONGATION.rateDegPerDay, daysSinceJ2000_5);
    const meanElongationRad = degToRad(meanElongationDeg);
    const twoMeanElongationRad = 2 * meanElongationRad;

    let lambda =
        meanLongitudeDeg +
        MOON_LONGITUDE_TERMS_DEG.equationOfCenter * Math.sin(MmRad) +
        MOON_LONGITUDE_TERMS_DEG.evection * Math.sin(twoMeanElongationRad - MmRad) +
        MOON_LONGITUDE_TERMS_DEG.variation * Math.sin(twoMeanElongationRad) +
        MOON_LONGITUDE_TERMS_DEG.secondHarmonic * Math.sin(2 * MmRad) +
        MOON_LONGITUDE_TERMS_DEG.annualEquation * Math.sin(MsRad);
    lambda = normalizeDeg(lambda);

    const beta =
        MOON_LATITUDE_TERMS_DEG.primary * Math.sin(FRad) +
        MOON_LATITUDE_TERMS_DEG.plus * Math.sin(MmRad + FRad) +
        MOON_LATITUDE_TERMS_DEG.minus * Math.sin(MmRad - FRad) +
        MOON_LATITUDE_TERMS_DEG.evectionLike * Math.sin(twoMeanElongationRad - FRad);

    return {
        longitudeRad: degToRad(lambda),
        latitudeRad: degToRad(beta),
    };
}

export function moonSunEclipticLongitudeDifferenceRad(jd: number): number {
    const moon = moonEclipticCoordinates(jd);
    const sunLongitudeRad = sunEclipticLongitudeRad(jd);
    return signedAngularDifferenceRad(moon.longitudeRad, sunLongitudeRad);
}

export function moonEclipticLatitudeRad(jd: number): number {
    return moonEclipticCoordinates(jd).latitudeRad;
}