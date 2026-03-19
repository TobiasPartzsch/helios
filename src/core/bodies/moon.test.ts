import { describe, expect, it } from "vitest";
import { moonPhase } from "./moon";

describe("moon phase", () => {
    it("is near full around 2000-01-21", () => {
        const jd = 2451565.2; // approx full Moon
        const phase = moonPhase(jd);

        // illuminatedFraction near 1
        expect(phase.illuminatedFraction).toBeGreaterThan(0.9);
        // don't assert the name for now, classifier is crude
        // console.log(phase); // optional: see what it returns
    });

    it("is near new around 2000-01-06", () => {
        const jd = 2451550.0; // approx new Moon
        const phase = moonPhase(jd);
        expect(phase.illuminatedFraction).toBeLessThan(0.1);
    });
});