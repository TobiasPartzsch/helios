import { describe, expect, it } from "vitest";
import { radToDeg } from "./angles";
import { moonEclipticLatitudeRad, moonSunEclipticLongitudeDifferenceRad } from "./bodies/moon";
import { isLunarEclipseCandidate, isSolarEclipseCandidate } from "./eclipse";
import { asDaysSinceJ2000, DaysSinceJ2000, getDaysSinceJ2000 } from "./time";

describe("eclipse candidates", () => {
    it("detects a solar eclipse candidate near 2024-04-08", () => {
        // 2024-04-08 18:00 UTC, total solar eclipse day
        const jd = 2460409.25;
        const n = getDaysSinceJ2000(jd);
        console.log({
            lonDiffDeg: radToDeg(moonSunEclipticLongitudeDifferenceRad(n)),
            latDeg: radToDeg(moonEclipticLatitudeRad(n)),
        });
        expect(hasCandidateNear(isSolarEclipseCandidate, n, 24, 30)).toBe(true);
    });

    it("detects a lunar eclipse candidate near 2025-03-14", () => {
        // 2025-03-14 06:00 UTC, total lunar eclipse day
        const jd = 2460748.75;
        const n = getDaysSinceJ2000(jd);
        console.log({
            lonDiffDeg: radToDeg(moonSunEclipticLongitudeDifferenceRad(n)),
            latDeg: radToDeg(moonEclipticLatitudeRad(n)),
        });
        expect(hasCandidateNear(isLunarEclipseCandidate, n, 24, 30)).toBe(true);
    });

    it("does not mark an ordinary date as an eclipse candidate", () => {
        const jd = 2460310.5; // arbitrary non-eclipse date
        const n = getDaysSinceJ2000(jd);
        console.log({
            lonDiffDeg: radToDeg(moonSunEclipticLongitudeDifferenceRad(n)),
            latDeg: radToDeg(moonEclipticLatitudeRad(n)),
        });
        expect(isSolarEclipseCandidate(n)).toBe(false);
        expect(isLunarEclipseCandidate(n)).toBe(false);
    });
});

function hasCandidateNear(
    predicate: (daysSinceJ2000: DaysSinceJ2000) => boolean,
    centerDays: number,
    windowHours: number,
    stepMinutes: number,
): boolean {
    const stepDays = stepMinutes / (24 * 60);
    const halfWindowDays = windowHours / 24;

    for (
        let offsetDays = -halfWindowDays;
        offsetDays <= halfWindowDays;
        offsetDays += stepDays
    ) {
        const sampleDays = asDaysSinceJ2000(centerDays + offsetDays);
        if (predicate(sampleDays)) {
            return true;
        }
    }

    return false;
}