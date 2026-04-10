import { describe, expect, it } from "vitest";
import { degToRad, radToDeg } from "../angles";
import { angularDifferenceDeg, } from "../math";
import { J2000_EPOCH } from "../time";
import { planetEquatorialReferenceCases } from "./fixtures/planet-equatorial-reference";
import { eclipticCartesianToEquatorial, MEAN_OBLIQUITY_J2000_DEG, planetEquatorialCoordinates, sphericalToCartesian, subtractCartesian } from "./propagate";

describe("planetEquatorialCoordinates", () => {
    it("throws on unknown planet", () => {
        expect(() => planetEquatorialCoordinates("pluto", J2000_EPOCH))
            .toThrow("Unknown planet: pluto");
    });
    const referenceCases = planetEquatorialReferenceCases;

    for (const testCase of referenceCases) {
        it(`${testCase.bodyName} at JD ${testCase.label} matches ${testCase.source}`, () => {
            const coords = planetEquatorialCoordinates(testCase.bodyName, testCase.jd);
            const raDeg = radToDeg(coords.rightAscensionRad);
            const decDeg = radToDeg(coords.declinationRad);

            expect(angularDifferenceDeg(raDeg, testCase.expectedRaDeg)).toBeLessThan(testCase.toleranceDeg);
            expect(Math.abs(decDeg - testCase.expectedDecDeg)).toBeLessThan(testCase.toleranceDeg);
        });
    }
});

describe("orbit helpers", () => {
    it("converts spherical ecliptic coordinates on the x-axis to cartesian", () => {
        const [x, y, z] = sphericalToCartesian(0, 0, 1);

        expect(x).toBeCloseTo(1, 12);
        expect(y).toBeCloseTo(0, 12);
        expect(z).toBeCloseTo(0, 12);
    });

    it("converts spherical ecliptic coordinates on the y-axis to cartesian", () => {
        const [x, y, z] = sphericalToCartesian(degToRad(90), 0, 1);

        expect(x).toBeCloseTo(0, 12);
        expect(y).toBeCloseTo(1, 12);
        expect(z).toBeCloseTo(0, 12);
    });

    it("converts spherical ecliptic coordinates at the north pole to cartesian", () => {
        const [x, y, z] = sphericalToCartesian(0, degToRad(90), 1);

        expect(x).toBeCloseTo(0, 12);
        expect(y).toBeCloseTo(0, 12);
        expect(z).toBeCloseTo(1, 12);
    });

    it("subtracts Earth cartesian coordinates from planet coordinates", () => {
        const [x, y, z] = subtractCartesian([3, 5, 7], [1, 2, 3]);

        expect(x).toBeCloseTo(2, 12);
        expect(y).toBeCloseTo(3, 12);
        expect(z).toBeCloseTo(4, 12);
    });

    it("maps the ecliptic x-axis to RA=0h, Dec=0°", () => {
        const coords = eclipticCartesianToEquatorial(1, 0, 0, J2000_EPOCH);

        expect(coords.rightAscensionRad).toBeCloseTo(0, 12);
        expect(coords.declinationRad).toBeCloseTo(0, 12);
    });

    it("maps the negative ecliptic x-axis to RA=12h, Dec=0°", () => {
        const coords = eclipticCartesianToEquatorial(-1, 0, 0, J2000_EPOCH);

        expect(coords.rightAscensionRad).toBeCloseTo(Math.PI, 12);
        expect(coords.declinationRad).toBeCloseTo(0, 12);
    });

    it("maps the ecliptic y-axis to RA≈90° and Dec≈obliquity", () => {
        const coords = eclipticCartesianToEquatorial(0, 1, 0, J2000_EPOCH);

        expect(coords.rightAscensionRad).toBeCloseTo(Math.PI / 2, 12);
        expect(coords.declinationRad).toBeCloseTo(degToRad(MEAN_OBLIQUITY_J2000_DEG), 6);
    });
});