import { normalizeRad } from "../math";

const MAX_ITERATIONS = 10;
const TOLERANCE = 1e-10;

/**
 * Solve Kepler's equation M = E - e·sin(E) for the eccentric anomaly E,
 * given mean anomaly M (radians) and eccentricity e.
 * Uses Newton-Raphson iteration.
 */
export function solveKepler(M: number, e: number): number {
    M = normalizeRad(M);

    // Initial guess: good for low eccentricities
    let E = M;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
        E += dE;
        if (Math.abs(dE) < TOLERANCE) break;
    }

    return E;
}

/**
 * Convert eccentric anomaly E to true anomaly ν (both in radians).
 */
export function eccentricToTrue(E: number, e: number): number {
    return 2 * Math.atan2(
        Math.sqrt(1 + e) * Math.sin(E / 2),
        Math.sqrt(1 - e) * Math.cos(E / 2)
    );
}

/**
 * Compute true anomaly ν from mean anomaly M and eccentricity e (all radians).
 */
export function trueAnomaly(M: number, e: number): number {
    return eccentricToTrue(solveKepler(M, e), e);
}