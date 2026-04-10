import { degToRad } from "../angles";

/**
 * Keplerian orbital elements at a given epoch, with secular rates.
 * Angles in radians, distances in AU.
 */
export interface OrbitalElements {
    /** Semi-major axis (AU) */
    a: number;
    /** Eccentricity */
    e: number;
    /** Inclination (rad) */
    i: number;
    /** Longitude of ascending node Ω (rad) */
    omega: number;
    /** Argument of perihelion ω (rad) */
    w: number;
    /** Mean longitude L (rad) — used to derive M */
    L: number;
}

/**
 * Secular rates per Julian century (T) for each element.
 * Same shape as OrbitalElements.
 */
export interface OrbitalRates {
    a: number;
    e: number;
    i: number;
    omega: number;
    w: number;
    L: number;
}

export interface PlanetRecord {
    epoch: OrbitalElements;
    rates: OrbitalRates;
}

/** Convert a raw degree-based record to radians */
function r(a: number, e: number, i: number, omega: number, w: number, L: number): OrbitalElements {
    return { a, e, i: degToRad(i), omega: degToRad(omega), w: degToRad(w), L: degToRad(L) };
}

/**
 * J2000.0 mean orbital elements and their rates per Julian century.
 * Source: Meeus, "Astronomical Algorithms" Table 31.a
 * Valid roughly 1800–2050.
 */
export const PLANETS: Record<string, PlanetRecord> = {
    mercury: {
        epoch: r(0.38709927, 0.20563593, 7.00497902, 48.33076593, 77.45779628, 252.25032350),
        rates: r(0.00000037, 0.00001906, -0.00594749, -0.12534081, 0.16047689, 149472.67411175),
    },
    venus: {
        epoch: r(0.72333566, 0.00677672, 3.39467605, 76.67984255, 131.60246718, 181.97909950),
        rates: r(0.00000390, -0.00004107, -0.00078890, -0.27769418, 0.00268329, 58517.81538729),
    },
    earth: {
        epoch: r(1.00000261, 0.01671123, -0.00001531, 0.0, 102.93768193, 100.46457166),
        rates: r(0.00000562, -0.00004392, -0.01294668, 0.0, 0.32327364, 35999.37244981),
    },
    mars: {
        epoch: r(1.52371034, 0.09339410, 1.84969142, 49.55953891, -23.94362959, -4.55343205),
        rates: r(0.00001847, 0.00007882, -0.00813131, -0.29257343, 0.44441088, 19140.30268499),
    },
    jupiter: {
        epoch: r(5.20288700, 0.04838624, 1.30439695, 100.47390909, 14.72847983, 34.39644501),
        rates: r(-0.00011607, -0.00013253, -0.00183714, 0.20469106, 0.21252668, 3034.74612775),
    },
    saturn: {
        epoch: r(9.53667594, 0.05386179, 2.48599187, 113.66242448, 92.59887831, 49.95424423),
        rates: r(-0.00125060, -0.00050991, 0.00193609, -0.28867794, -0.41897216, 1222.49362201),
    },
};