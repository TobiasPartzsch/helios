import type { EquatorialCoords } from "../coordinates";

function degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
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
 * Compute the Sun's apparent equatorial coordinates (RA/Dec) for a given Julian Date.
 * Low-precision but adequate for visualization.
 */
export function sunEquatorialCoordinates(jd: number): EquatorialCoords {
    const n = jd - 2451545.0; // days since J2000.0

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

    // Obliquity of the ecliptic epsilon (deg)
    const epsilon = 23.439 - 0.0000004 * n;

    const lambdaRad = degToRad(lambda);
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