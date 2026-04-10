import { linearAngleDeg } from "../angles";
import type { EquatorialCoords } from "../coordinates";
import { degToRad, normalizeDeg, normalizeRad } from "../math";

const SUN_MEAN_LONGITUDE = { baseDeg: 280.46, rateDegPerDay: 0.9856474 };
const SUN_MEAN_ANOMALY = { baseDeg: 357.528, rateDegPerDay: 0.9856003 };
const SUN_EQUATION_OF_CENTER_DEG = {
    firstOrder: 1.915,
    secondOrder: 0.020,
};
export const MEAN_OBLIQUITY = { baseDeg: 23.439, rateDegPerDay: -0.0000004 };

export function sunEclipticLongitudeRad(days_since_J2000: number): number {
    // Mean longitude L (deg)
    const L = linearAngleDeg(
        SUN_MEAN_LONGITUDE.baseDeg,
        SUN_MEAN_LONGITUDE.rateDegPerDay,
        days_since_J2000
    );

    // Mean anomaly g (deg)
    const g = linearAngleDeg(
        SUN_MEAN_ANOMALY.baseDeg,
        SUN_MEAN_ANOMALY.rateDegPerDay,
        days_since_J2000
    );
    const gRad = degToRad(g);

    let lambda =
        L +
        SUN_EQUATION_OF_CENTER_DEG.firstOrder * Math.sin(gRad) +
        SUN_EQUATION_OF_CENTER_DEG.secondOrder * Math.sin(2 * gRad);
    lambda = normalizeDeg(lambda);

    return degToRad(lambda);
}

/**
 * Compute the Sun's apparent equatorial coordinates (RA/Dec) for a given Julian Date.
 * Low-precision but adequate for visualization.
 */
export function sunEquatorialCoordinates(days_since_J2000: number): EquatorialCoords {
    // Ecliptic longitude lambda (rad)
    const lambdaRad = sunEclipticLongitudeRad(days_since_J2000);

    // Mean obliquity of the ecliptic (deg -> rad)
    const epsilon = MEAN_OBLIQUITY.baseDeg + MEAN_OBLIQUITY.rateDegPerDay * days_since_J2000;
    const epsilonRad = degToRad(epsilon);

    const sinLambda = Math.sin(lambdaRad);
    const cosLambda = Math.cos(lambdaRad);
    const sinEps = Math.sin(epsilonRad);
    const cosEps = Math.cos(epsilonRad);

    // Equatorial coordinates
    const rightAscensionRad = normalizeRad(Math.atan2(cosEps * sinLambda, cosLambda));
    const declinationRad = Math.asin(sinEps * sinLambda);

    return { rightAscensionRad, declinationRad };
}
