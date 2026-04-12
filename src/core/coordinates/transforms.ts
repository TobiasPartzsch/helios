import type { EquatorialCoords, HorizontalCoords } from ".";
import { degToRad, Radians } from "../angles";
import { normalizeRad } from "../math";
import { MEAN_OBLIQUITY_J2000_DEG, OBLIQUITY_DEG_PER_CENTURY } from "../orbit/propagate";
import { DaysSinceJ2000, JULIAN_CENTURY } from "../time";
import { applyRefraction, RefractionModel } from "./refraction";

export function sphericalToCartesian(L: number, B: number, R: number): [number, number, number] {
    const cosB = Math.cos(B);
    return [
        R * cosB * Math.cos(L),
        R * cosB * Math.sin(L),
        R * Math.sin(B),
    ];
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
    latitudeRad: number,
    localSiderealTimeRad: number,
    refractionModel: RefractionModel = 'none'
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

