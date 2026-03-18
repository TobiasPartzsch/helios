import type { EquatorialCoords, HorizontalCoords } from "./index";

function normalizeAngleRad(angle: number): number {
    const twoPi = 2 * Math.PI;
    return ((angle % twoPi) + twoPi) % twoPi;
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
    localSiderealTimeRad: number
): HorizontalCoords {
    const { rightAscensionRad: ra, declinationRad: dec } = eq;

    // Hour angle H = LST - RA
    let H = localSiderealTimeRad - ra;
    H = normalizeAngleRad(H);

    const sinDec = Math.sin(dec);
    const cosDec = Math.cos(dec);
    const sinLat = Math.sin(latitudeRad);
    const cosLat = Math.cos(latitudeRad);
    const cosH = Math.cos(H);
    const sinH = Math.sin(H);

    // Altitude
    const sinAlt = sinDec * sinLat + cosDec * cosLat * cosH;
    const altitudeRad = Math.asin(sinAlt);

    // Azimuth (measured from north, increasing to east)
    const cosAlt = Math.cos(altitudeRad);
    const sinAz = -cosDec * sinH / cosAlt;
    const cosAz = (sinDec - sinAlt * sinLat) / (cosAlt * cosLat);
    let azimuthRad = Math.atan2(sinAz, cosAz);

    azimuthRad = normalizeAngleRad(azimuthRad);

    return { azimuthRad, altitudeRad };
}