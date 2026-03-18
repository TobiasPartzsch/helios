import { describe, expect, it } from "vitest";
import { equatorialToHorizontal } from "./horizontal";
import type { EquatorialCoords } from "./index";

const degToRad = (d: number) => (d * Math.PI) / 180;

describe("coordinates: equatorialToHorizontal", () => {
    it("puts object on meridian at given RA", () => {
        const latRad = degToRad(0); // equator
        const lstRad = degToRad(0); // LST = 0°

        const eq: EquatorialCoords = {
            rightAscensionRad: degToRad(0),
            declinationRad: degToRad(0),
        };

        const { azimuthRad, altitudeRad } = equatorialToHorizontal(eq, latRad, lstRad);

        // On equator, object on meridian at decl 0 should be at alt ~90° (directly overhead)
        expect(altitudeRad).toBeCloseTo(degToRad(90), 3);

        // Azimuth is undefined at zenith; just check it's a valid angle
        expect(azimuthRad).toBeGreaterThanOrEqual(0);
        expect(azimuthRad).toBeLessThanOrEqual(2 * Math.PI);
    });
});