import { describe, expect, it } from "vitest";
import { getDaysSinceJ2000 } from "../time";
import { lunarElongationDeg, moonPhase } from "./moon";

describe("moon phase", () => {
    it("is near full around 2000-01-21", () => {
        const jd = 2451565.2; // approx full Moon
        const n = getDaysSinceJ2000(jd);
        const phase = moonPhase(n);

        // illuminatedFraction near 1
        expect(phase.illuminatedFraction).toBeGreaterThan(0.9);
        // don't assert the name for now, classifier is crude
        // console.log(phase); // optional: see what it returns
    });

    it("is near new around 2000-01-06", () => {
        const jd = 2451550.0; // approx new Moon
        const n = getDaysSinceJ2000(jd);
        const phase = moonPhase(n);
        expect(phase.illuminatedFraction).toBeLessThan(0.1);
    });

    it("has elongation near 180° around full Moon", () => {
        const jd = 2451565.2;
        const n = getDaysSinceJ2000(jd);
        expect(lunarElongationDeg(n)).toBeGreaterThan(150);
    });

    it("has elongation near 0° around new Moon", () => {
        const jd = 2451550.0;
        const n = getDaysSinceJ2000(jd);
        expect(lunarElongationDeg(n)).toBeLessThan(30);
    });
});

