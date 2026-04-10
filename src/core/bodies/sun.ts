import { linearAngleRad } from "../angles";
import type { EquatorialCoords } from "../coordinates";
import { degToRad, normalizeRad } from "../math";

const SUN_MEAN_LONGITUDE = {
    baseRad: degToRad(280.46),
    rateRadPerDay: degToRad(0.9856474),
};
const SUN_MEAN_ANOMALY = {
    baseRad: degToRad(357.528),
    rateRadPerDay: degToRad(0.9856003),
};
const SUN_EQUATION_OF_CENTER_RAD = {
    firstOrder: degToRad(1.915),
    secondOrder: degToRad(0.020),
};
export const MEAN_OBLIQUITY = {
    baseRad: degToRad(23.439),
    rateRadPerDay: degToRad(-0.0000004),
};

export function sunEclipticLongitudeRad(daysSinceJ2000: number): number {
    // Mean longitude L (rad)
    const L = linearAngleRad(
        SUN_MEAN_LONGITUDE.baseRad,
        SUN_MEAN_LONGITUDE.rateRadPerDay,
        daysSinceJ2000
    );

    // Mean anomaly g (rad)
    const gRad = linearAngleRad(
        SUN_MEAN_ANOMALY.baseRad,
        SUN_MEAN_ANOMALY.rateRadPerDay,
        daysSinceJ2000
    );

    let lambda =
        L +
        SUN_EQUATION_OF_CENTER_RAD.firstOrder * Math.sin(gRad) +
        SUN_EQUATION_OF_CENTER_RAD.secondOrder * Math.sin(2 * gRad);

    return normalizeRad(lambda);
}

/**
 * Compute the Sun's apparent equatorial coordinates (RA/Dec) for a given Julian Date.
 * Low-precision but adequate for visualization.
 */
export function sunEquatorialCoordinates(daysSinceJ2000: number): EquatorialCoords {
    // Ecliptic longitude lambda (rad)
    const lambdaRad = sunEclipticLongitudeRad(daysSinceJ2000);

    // Mean obliquity of the ecliptic (rad)
    const epsilonRad = MEAN_OBLIQUITY.baseRad + MEAN_OBLIQUITY.rateRadPerDay * daysSinceJ2000;

    const sinLambda = Math.sin(lambdaRad);
    const cosLambda = Math.cos(lambdaRad);
    const sinEps = Math.sin(epsilonRad);
    const cosEps = Math.cos(epsilonRad);

    // Equatorial coordinates
    const rightAscensionRad = normalizeRad(Math.atan2(cosEps * sinLambda, cosLambda));
    const declinationRad = Math.asin(sinEps * sinLambda);

    return { rightAscensionRad, declinationRad };
}
