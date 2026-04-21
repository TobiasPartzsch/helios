import { Degrees, Radians } from "../angles";
import { normalizeRad } from "../math";

export function julianDateToGMSTHours(jd: number): number {
    const jd0 = Math.floor(jd + 0.5) - 0.5;
    const H = (jd - jd0) * 24;

    const D = jd - 2451545.0;
    const D0 = jd0 - 2451545.0;
    const T = D / 36525.0;

    let gmst =
        6.697374558 +
        0.06570982441908 * D0 +
        1.00273790935 * H +
        0.000026 * T * T;

    gmst = ((gmst % 24) + 24) % 24;
    return gmst;
}

export function longitudeDegToSiderealHours(longitudeDeg: Degrees): number {
    return longitudeDeg / 15.0;
}

/**
 * Compute Local Sidereal Time in Radians.
 * @param daysSinceJ2000 Days since 2000-01-01 12:00:00 UTC
 * @param longitudeRad Observer's longitude in radians (East positive)
 */
export function localSiderealTimeRad(daysSinceJ2000: number, longitudeRad: Radians): Radians {
    // GMST at J2000 was approx 18.697 hours. In radians:
    const gmstBaseRad = 4.894961212735792;
    // The Earth rotates approx 1.0027379 times per solar day
    const rotationRateRadPerDay = 6.30038809898489;

    const gmstRad = gmstBaseRad + rotationRateRadPerDay * daysSinceJ2000;

    // LST = GMST + Longitude
    return normalizeRad(gmstRad + longitudeRad) as Radians;
}