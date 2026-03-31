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
        expect(azimuthRad).toBeLessThan(2 * Math.PI);
    });

    it("returns finite alt/az values for a typical input", () => {
        const latRad = degToRad(52);
        const lstRad = degToRad(40);

        const eq: EquatorialCoords = {
            rightAscensionRad: degToRad(15),
            declinationRad: degToRad(20),
        };

        const { azimuthRad, altitudeRad } = equatorialToHorizontal(eq, latRad, lstRad);

        expect(Number.isFinite(azimuthRad)).toBe(true);
        expect(Number.isFinite(altitudeRad)).toBe(true);
    });

    it("keeps altitude within [-90°, 90°]", () => {
        const latRad = degToRad(52);
        const lstRad = degToRad(100);

        const eq: EquatorialCoords = {
            rightAscensionRad: degToRad(20),
            declinationRad: degToRad(-10),
        };

        const { altitudeRad } = equatorialToHorizontal(eq, latRad, lstRad);

        expect(altitudeRad).toBeGreaterThanOrEqual(-Math.PI / 2);
        expect(altitudeRad).toBeLessThanOrEqual(Math.PI / 2);
    });

    it("normalizes azimuth into [0, 2π]", () => {
        const latRad = degToRad(52);
        const lstRad = degToRad(100);

        const eq: EquatorialCoords = {
            rightAscensionRad: degToRad(20),
            declinationRad: degToRad(-10),
        };

        const { azimuthRad } = equatorialToHorizontal(eq, latRad, lstRad);

        expect(azimuthRad).toBeGreaterThanOrEqual(0);
        expect(azimuthRad).toBeLessThanOrEqual(2 * Math.PI);
    });

    it("puts opposite meridian object below the observer", () => {
        const latRad = degToRad(0);
        const lstRad = degToRad(180);

        const eq: EquatorialCoords = {
            rightAscensionRad: degToRad(0),
            declinationRad: degToRad(0),
        };

        const { altitudeRad } = equatorialToHorizontal(eq, latRad, lstRad);

        expect(altitudeRad).toBeCloseTo(degToRad(-90), 3);
    });

    it('leaves altitude unchanged when refraction model is "none"', () => {
        const latRad = degToRad(52);
        const lstRad = degToRad(40);

        const eq: EquatorialCoords = {
            rightAscensionRad: degToRad(15),
            declinationRad: degToRad(20),
        };

        const withExplicitNone = equatorialToHorizontal(eq, latRad, lstRad, "none");
        const withDefault = equatorialToHorizontal(eq, latRad, lstRad);

        expect(withExplicitNone.altitudeRad).toBeCloseTo(withDefault.altitudeRad, 12);
        expect(withExplicitNone.azimuthRad).toBeCloseTo(withDefault.azimuthRad, 12);
    });
});