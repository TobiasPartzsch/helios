// src/core/time/julian.ts
export function dateToJulianDate(date: Date): number {
    const time = date.getTime();
    const JD_UNIX_EPOCH = 2440587.5;
    const msPerDay = 86400000;

    return JD_UNIX_EPOCH + time / msPerDay;
}