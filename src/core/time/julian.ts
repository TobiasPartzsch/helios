/**
 * Standard J2000.0 Epoch (January 1, 2000, 12:00 UTC)
 */
export type DaysSinceJ2000 = number & { __brand: "DaysSinceJ2000" };

export const J2000_EPOCH = 2451545.0;
export const JULIAN_CENTURY = 36525.0;

/**
 * Alternative J2000.5 Epoch (January 1.5, 2000) 
 * used by some simplified lunar models.
 */
export const J2000_5_EPOCH = 2451543.5;

export function dateToJulianDate(date: Date): number {
    const time = date.getTime();
    const JD_UNIX_EPOCH = 2440587.5;
    const msPerDay = 86400000;
    return JD_UNIX_EPOCH + time / msPerDay;
}

export function getDaysSinceJ2000(jd: number): DaysSinceJ2000 {
    return toDaysSinceJ2000(jd - J2000_EPOCH);
}

export function toDaysSinceJ2000(n: number): DaysSinceJ2000 {
    return n as DaysSinceJ2000;
}