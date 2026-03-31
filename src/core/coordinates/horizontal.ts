import { normalizeRad } from "../math";
import type { EquatorialCoords, HorizontalCoords } from "./index";
import { applyRefraction, RefractionModel } from "./refraction";

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
    refractionModel: RefractionModel = 'none',
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
    const altitudeRad = Math.asin(sinAlt);

    // Stable Azimuth using atan2(y, x)
    // y = sin(H)
    // x = cos(H) * sin(Lat) - tan(Dec) * cos(Lat)
    // (We multiply both sides by cos(Dec) to avoid the tan(Dec) division)
    const y = -cosDec * sinH;
    const x = cosLat * sinDec - sinLat * cosDec * cosH;

    let azimuthRad = Math.atan2(y, x);

    // Normalize to [0, 2π)
    azimuthRad = normalizeRad(azimuthRad);

    return {
        azimuthRad,
        altitudeRad: applyRefraction(altitudeRad, refractionModel)
    };
}