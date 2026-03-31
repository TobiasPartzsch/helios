import { describe, expect, it } from "vitest";
import { degToRad } from "../math";
import { applyRefraction } from "./refraction";

describe("coordinates: applyRefraction", () => {
    it('returns the input altitude unchanged for model "none"', () => {
        const altitudeRad = degToRad(12.5);
        expect(applyRefraction(altitudeRad, "none")).toBeCloseTo(altitudeRad, 12);
    });

    it("returns the input altitude unchanged below the Bennett cutoff", () => {
        const altitudeRad = degToRad(-1);
        expect(applyRefraction(altitudeRad, "bennett")).toBeCloseTo(altitudeRad, 12);
    });

    it("raises apparent altitude slightly near the horizon", () => {
        const altitudeRad = degToRad(1);
        const refracted = applyRefraction(altitudeRad, "bennett");

        expect(refracted).toBeGreaterThan(altitudeRad);
    });

    it("returns a finite value near the horizon", () => {
        const altitudeRad = degToRad(0);
        const refracted = applyRefraction(altitudeRad, "bennett");

        expect(Number.isFinite(refracted)).toBe(true);
    });
});