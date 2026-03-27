import { describe, expect, it } from "vitest";
import { degToRad, radToDeg } from "../math";
import { J2000_EPOCH } from "../time";
import { PLANETS } from "./elements";
import { heliocentricEcliptic, planetEquatorialCoordinates } from "./propagate";

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

it("Mars geocentric equatorial at J2000.0", () => {
    const marsEl = PLANETS["mars"].epoch;
    const earthEl = PLANETS["earth"].epoch;
    const [x, y, z] = heliocentricEcliptic(marsEl);
    const [ex, ey, ez] = heliocentricEcliptic(earthEl);

    const dx = x - ex;
    const dy = y - ey;
    const dz = z - ez;
    console.log("Geocentric ecliptic:", dx, dy, dz);

    // RA before normalization
    const eps = degToRad(23.439291111);
    const eqY = dy * Math.cos(eps) - dz * Math.sin(eps);
    const eqZ = dy * Math.sin(eps) + dz * Math.cos(eps);
    console.log("eqX, eqY, eqZ:", dx, eqY, eqZ);
    console.log("RA (deg):", radToDeg(Math.atan2(eqY, dx)));
    console.log("Dec (deg):", radToDeg(Math.atan2(eqZ, Math.sqrt(dx * dx + eqY * eqY))));
});