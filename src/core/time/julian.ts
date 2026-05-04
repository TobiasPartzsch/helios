import { DaysSinceJ2000 } from "./types";

/**
 * Standard J2000.0 Epoch (January 1, 2000, 12:00 UTC)
 */
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

export function daysSinceJ2000ToUnixMs(days: DaysSinceJ2000): number {
    const jd = days + J2000_EPOCH;
    const JD_UNIX_EPOCH = 2440587.5;
    return (jd - JD_UNIX_EPOCH) * 86400000;
}

export function getDaysSinceJ2000(jd: number): DaysSinceJ2000 {
    return asDaysSinceJ2000(jd - J2000_EPOCH);
}

export function asDaysSinceJ2000(n: number): DaysSinceJ2000 {
    return n as DaysSinceJ2000;
}