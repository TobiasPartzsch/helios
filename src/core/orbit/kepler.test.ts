import { describe, expect, it } from "vitest";
import { eccentricToTrue, solveKepler, trueAnomaly } from "./kepler";

describe("solveKepler", () => {
    it("M=π gives E=π for any eccentricity", () => {
        expect(solveKepler(Math.PI, 0.0)).toBeCloseTo(Math.PI, 8);
        expect(solveKepler(Math.PI, 0.5)).toBeCloseTo(Math.PI, 8);
        expect(solveKepler(Math.PI, 0.093)).toBeCloseTo(Math.PI, 8);
    });

    it("circular orbit: E equals M", () => {
        const M = 1.234;
        expect(solveKepler(M, 0)).toBeCloseTo(M, 8);
    });

    it("normalizes M outside [0, 2π)", () => {
        const M = Math.PI;
        expect(solveKepler(M + 2 * Math.PI, 0.1))
            .toBeCloseTo(solveKepler(M, 0.1), 8);
    });
});

describe("eccentricToTrue", () => {
    it("circular orbit: ν equals E", () => {
        expect(eccentricToTrue(1.0, 0)).toBeCloseTo(1.0, 8);
    });
});

describe("trueAnomaly", () => {
    it("M=0 gives ν=0 (periapsis)", () => {
        expect(trueAnomaly(0, 0.093)).toBeCloseTo(0, 8);
    });

    it("M=π gives ν=π (apoapsis)", () => {
        expect(trueAnomaly(Math.PI, 0.093)).toBeCloseTo(Math.PI, 8);
    });
});