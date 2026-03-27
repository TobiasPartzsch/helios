import { describe, expect, it } from "vitest";
import { radToDeg } from "../math";
import { J2000_EPOCH } from "../time";
import { planetEquatorialCoordinates } from "./propagate";

describe("planetEquatorialCoordinates", () => {
    it("Jupiter at J2000.0 matches approximate ephemeris", () => {
        const coords = planetEquatorialCoordinates("jupiter", J2000_EPOCH);
        const raDeg = radToDeg(coords.rightAscensionRad);
        const decDeg = radToDeg(coords.declinationRad);

        // Tolerance of 2° is appropriate for this model
        expect(raDeg).toBeCloseTo(24.4, 0);
        expect(decDeg).toBeCloseTo(8.9, 0);
    });

    it("throws on unknown planet", () => {
        expect(() => planetEquatorialCoordinates("pluto", J2000_EPOCH))
            .toThrow("Unknown planet: pluto");
    });

    it("Mars at J2000.0 matches approximate ephemeris", () => {
        const coords = planetEquatorialCoordinates("mars", J2000_EPOCH);
        const raDeg = radToDeg(coords.rightAscensionRad);
        const decDeg = radToDeg(coords.declinationRad);

        // Mars RA ≈ 22h 28m → ~337°, Dec ≈ -11.0°
        expect(Math.abs(raDeg - 337.0)).toBeLessThan(8);
        expect(Math.abs(decDeg - -11.0)).toBeLessThan(3);
    });
});
