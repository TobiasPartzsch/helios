import { describe, expect, it } from "vitest";
import { getDaysSinceJ2000 } from "../time";
import { sunEquatorialCoordinates } from "./sun";

describe("sun Equatorial coordinates", () => {
    it("has near-zero declination around March equinox 2000", () => {
        // JD ~ 2451623.5 is 2000-03-20 00:00 UT (approx)
        const jd = 2451623.5;
        const n = getDaysSinceJ2000(jd);
        const { declinationRad } = sunEquatorialCoordinates(n);
        expect(declinationRad).toBeCloseTo(0, 0); // within ~1° is fine
    });

    it("has positive declination around June solstice 2000", () => {
        const jd = 2451716.5; // ~2000-06-21
        const n = getDaysSinceJ2000(jd);
        const { declinationRad } = sunEquatorialCoordinates(n);
        expect(declinationRad).toBeGreaterThan(0);
    });

    it("has negative declination around December solstice 2000", () => {
        const jd = 2451900.5; // ~2000-12-21
        const n = getDaysSinceJ2000(jd);
        const { declinationRad } = sunEquatorialCoordinates(n);
        expect(declinationRad).toBeLessThan(0);
    });
});