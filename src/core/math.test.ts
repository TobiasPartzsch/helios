import { describe, expect, it } from "vitest";
import { degToRad, radToDeg } from "./angles";
import {
    HALF_PI,
    TWO_PI,
    hoursToRad,
    normalizeDeg,
    normalizeRad,
    radToHours,
} from "./math";

describe("math module", () => {
    it("round-trips degrees and radians", () => {
        expect(radToDeg(degToRad(180))).toBeCloseTo(180, 12);
        expect(degToRad(radToDeg(Math.PI / 3))).toBeCloseTo(Math.PI / 3, 12);
    });

    it("round-trips hours and radians", () => {
        expect(radToHours(hoursToRad(6))).toBeCloseTo(6, 12);
        expect(hoursToRad(radToHours(Math.PI))).toBeCloseTo(Math.PI, 12);
    });

    it("normalizes degrees into [0, 360)", () => {
        expect(normalizeDeg(0)).toBeCloseTo(0, 12);
        expect(normalizeDeg(360)).toBeCloseTo(0, 12);
        expect(normalizeDeg(-90)).toBeCloseTo(270, 12);
        expect(normalizeDeg(450)).toBeCloseTo(90, 12);
    });

    it("normalizes radians into [0, 2π)", () => {
        expect(normalizeRad(0)).toBeCloseTo(0, 12);
        expect(normalizeRad(TWO_PI)).toBeCloseTo(0, 12);
        expect(normalizeRad(-HALF_PI)).toBeCloseTo(1.5 * Math.PI, 12);
        expect(normalizeRad(2.5 * Math.PI)).toBeCloseTo(HALF_PI, 12);
    });
});