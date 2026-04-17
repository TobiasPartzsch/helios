export function calculateLMTFromDays(utcHours: number, lonDeg: number): number {
    return ((utcHours + lonDeg / 15.0) % 24 + 24) % 24;
}

export function calculateEoT(lmtHours: number, sunHourAngleHours: number): number {
    return lmtHours - 12 - sunHourAngleHours;
}