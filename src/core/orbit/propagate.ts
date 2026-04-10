import { degToRad, Radians } from "../angles";
import type { EquatorialCoords } from "../coordinates";
import { normalizeRad } from "../math";
import { J2000_EPOCH, JULIAN_CENTURY } from "../time/julian";
import { vsop87 } from "./vsop87";

export const MEAN_OBLIQUITY_J2000_DEG = 23.439291111;
export const OBLIQUITY_DEG_PER_CENTURY = 0.013004167;


export function sphericalToCartesian(L: number, B: number, R: number): [number, number, number] {
    const cosB = Math.cos(B);
    return [
        R * cosB * Math.cos(L),
        R * cosB * Math.sin(L),
        R * Math.sin(B),
    ];
}

export function subtractCartesian(
    [x, y, z]: [number, number, number],
    [earthX, earthY, earthZ]: [number, number, number],
): [number, number, number] {
    return [x - earthX, y - earthY, z - earthZ];
}

export function eclipticCartesianToEquatorial(
    x: number,
    y: number,
    z: number,
    jd: number
): EquatorialCoords {
    const T = (jd - J2000_EPOCH) / JULIAN_CENTURY;
    const eps = degToRad(MEAN_OBLIQUITY_J2000_DEG - OBLIQUITY_DEG_PER_CENTURY * T);
    const cosEps = Math.cos(eps);
    const sinEps = Math.sin(eps);

    const eqX = x;
    const eqY = y * cosEps - z * sinEps;
    const eqZ = y * sinEps + z * cosEps;

    return {
        rightAscensionRad: normalizeRad(Math.atan2(eqY, eqX)) as Radians,
        declinationRad: Math.atan2(eqZ, Math.sqrt(eqX * eqX + eqY * eqY)) as Radians,
    };
}

export function planetEquatorialCoordinates(name: string, jd: number): EquatorialCoords {
    const [L, B, R] = vsop87(name, jd);
    const [x, y, z] = sphericalToCartesian(L, B, R);
    const [eL, eB, eR] = vsop87("earth", jd);
    const [ex, ey, ez] = sphericalToCartesian(eL, eB, eR);

    const [dx, dy, dz] = subtractCartesian([x, y, z], [ex, ey, ez]);
    return eclipticCartesianToEquatorial(dx, dy, dz, jd);
}