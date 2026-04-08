import { describe, expect, it } from "vitest";
import { moonEclipticLatitudeRad, moonSunEclipticLongitudeDifferenceRad } from "./bodies/moon";
import { isLunarEclipseCandidate, isSolarEclipseCandidate } from "./eclipse";
import { radToDeg } from "./math";

describe("eclipse candidates", () => {
    it("detects a solar eclipse candidate near 2024-04-08", () => {
        // 2024-04-08 18:00 UTC, total solar eclipse day
        const jd = 2460409.25;
        console.log({
            lonDiffDeg: radToDeg(moonSunEclipticLongitudeDifferenceRad(jd)),
            latDeg: radToDeg(moonEclipticLatitudeRad(jd)),
        });
        expect(hasCandidateNear(isSolarEclipseCandidate, jd, 24, 30)).toBe(true);
    });

    it("detects a lunar eclipse candidate near 2025-03-14", () => {
        // 2025-03-14 06:00 UTC, total lunar eclipse day
        const jd = 2460748.75;
        console.log({
            lonDiffDeg: radToDeg(moonSunEclipticLongitudeDifferenceRad(jd)),
            latDeg: radToDeg(moonEclipticLatitudeRad(jd)),
        });
        expect(hasCandidateNear(isLunarEclipseCandidate, jd, 24, 30)).toBe(true);
    });

    it("does not mark an ordinary date as an eclipse candidate", () => {
        const jd = 2460310.5; // arbitrary non-eclipse date
        console.log({
            lonDiffDeg: radToDeg(moonSunEclipticLongitudeDifferenceRad(jd)),
            latDeg: radToDeg(moonEclipticLatitudeRad(jd)),
        });
        expect(isSolarEclipseCandidate(jd)).toBe(false);
        expect(isLunarEclipseCandidate(jd)).toBe(false);
    });
});

function hasCandidateNear(
    predicate: (jd: number) => boolean,
    centerJd: number,
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
        if (predicate(centerJd + offsetDays)) {
            return true;
        }
    }

    return false;
}