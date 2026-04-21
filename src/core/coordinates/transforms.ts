import type { EquatorialCoords, HorizontalCoords } from ".";
import { degToRad, Radians } from "../angles";
import { normalizeRad } from "../math";
import { MEAN_OBLIQUITY_J2000_DEG, OBLIQUITY_DEG_PER_CENTURY } from "../orbit/propagate";
import { DaysSinceJ2000, JULIAN_CENTURY } from "../time";
import { RefractionModel } from "../types";
import { applyRefraction } from "./refraction";

export type Vec3 = [number, number, number];

export function sphericalToCartesian(longitudeRad: Radians, latitudeRad: Radians, radius: number = 1): Vec3 {
    const cosB = Math.cos(latitudeRad);
    return [
        radius * cosB * Math.cos(longitudeRad),
        radius * cosB * Math.sin(longitudeRad),
        radius * Math.sin(latitudeRad),
    ];
}

export function cartesianToSpherical([x, y, z]: Vec3): { longitudeRad: Radians, latitudeRad: Radians, radius: number } {
    return {
        latitudeRad: Math.atan2(z, Math.hypot(x, y)) as Radians,
        longitudeRad: normalizeRad(Math.atan2(y, x)) as Radians,
        radius: Math.hypot(x, y, z)
    };
}

/**
 * Convert equatorial coordinates (RA/Dec) to horizontal coordinates (Az/Alt)
 * for a given observer latitude and local sidereal time.
 *
 * @param eq  Equatorial coordinates (radians)
 * @param latitudeRad  Observer latitude, radians (north positive)
 * @param localSiderealTimeRad  LST at observer, radians
 */
export function equatorialToHorizontal(
    eq: EquatorialCoords,
    latitudeRad: Radians,
    localSiderealTimeRad: Radians,
    refractionModel: RefractionModel = RefractionModel.None
): HorizontalCoords {
    const { rightAscensionRad: ra, declinationRad: dec } = eq;

    const H = localSiderealTimeRad - ra;
    // (Normalization is good, but Math.sin/cos handle any value)
    const sinDec = Math.sin(dec);
    const cosDec = Math.cos(dec);
    const sinLat = Math.sin(latitudeRad);
    const cosLat = Math.cos(latitudeRad);
    const cosH = Math.cos(H);
    const sinH = Math.sin(H);

    // Altitude
    const sinAlt = sinDec * sinLat + cosDec * cosLat * cosH;
    const altitudeRad = Math.asin(sinAlt) as Radians;

    // Stable Azimuth using atan2(y, x)
    // y = sin(H)
    // x = cos(H) * sin(Lat) - tan(Dec) * cos(Lat)
    // (We multiply both sides by cos(Dec) to avoid the tan(Dec) division)
    const y = -cosDec * sinH;
    const x = cosLat * sinDec - sinLat * cosDec * cosH;

    let azimuthRad = Math.atan2(y, x) as Radians;

    // Normalize to [0, 2π)
    azimuthRad = normalizeRad(azimuthRad) as Radians;

    return {
        azimuthRad,
        altitudeRad: applyRefraction(altitudeRad, refractionModel)
    };
}
export function eclipticCartesianToEquatorial(
    x: number,
    y: number,
    z: number,
    daysSinceJ2000: DaysSinceJ2000
): EquatorialCoords {
    const T = daysSinceJ2000 / JULIAN_CENTURY;
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
export function subtractCartesian(
    [x, y, z]: [number, number, number],
    [earthX, earthY, earthZ]: [number, number, number]
): [number, number, number] {
    return [x - earthX, y - earthY, z - earthZ];
}

export function normalizeVec3([x, y, z]: Vec3): Vec3 {
    const len = Math.hypot(x, y, z);
    return [x / len, y / len, z / len];
}

export function slerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
    const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const omega = Math.acos(dot);

    if (omega === 0) return a;

    const sinOmega = Math.sin(omega);
    const scaleA = Math.sin((1 - t) * omega) / sinOmega;
    const scaleB = Math.sin(t * omega) / sinOmega;

    return normalizeVec3([
        scaleA * a[0] + scaleB * b[0],
        scaleA * a[1] + scaleB * b[1],
        scaleA * a[2] + scaleB * b[2],
    ]);
}