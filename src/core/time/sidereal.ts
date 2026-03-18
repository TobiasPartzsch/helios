// src/core/time/sidereal.ts
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

export function longitudeDegToSiderealHours(longitudeDeg: number): number {
    return longitudeDeg / 15.0;
}

export function localSiderealTimeHours(jd: number, longitudeDeg: number): number {
    const gmst = julianDateToGMSTHours(jd);
    const longHours = longitudeDegToSiderealHours(longitudeDeg);

    let lst = gmst + longHours;
    lst = ((lst % 24) + 24) % 24;
    return lst;
}