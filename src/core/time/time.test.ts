import { describe, expect, it } from "vitest";
import { dateToJulianDate } from "./julian";
import { julianDateToGMSTHours } from "./sidereal";

describe("time module", () => {
    it("converts 2000-01-01T12:00:00Z to JD 2451545.0", () => {
        const d = new Date("2000-01-01T12:00:00Z");
        const jd = dateToJulianDate(d);
        expect(jd).toBeCloseTo(2451545.0, 6);
    });
    it("converts 1970-01-01T00:00:00Z to JD 2440587.5", () => {
        const d = new Date("1970-01-01T00:00:00Z");
        const jd = dateToJulianDate(d);
        expect(jd).toBeCloseTo(2440587.5, 6);
    });

    it("produces a sane GMST value", () => {
        const d = new Date("2000-01-01T12:00:00Z");
        const jd = dateToJulianDate(d);
        const gmst = julianDateToGMSTHours(jd);

        // Check it's within [0, 24) and stable around its own normalization
        expect(gmst).toBeGreaterThanOrEqual(0);
        expect(gmst).toBeLessThan(24);

        const normalized = ((gmst % 24) + 24) % 24;
        expect(gmst).toBeCloseTo(normalized, 10);
    });

    it("normalizes GMST into [0, 24) for an arbitrary timestamp", () => {
        const d = new Date("2024-03-20T00:00:00Z");
        const jd = dateToJulianDate(d);
        const gmst = julianDateToGMSTHours(jd);

        expect(gmst).toBeGreaterThanOrEqual(0);
        expect(gmst).toBeLessThan(24);
    });

    it("produces larger JD values for later times", () => {
        const earlier = new Date("2024-03-20T00:00:00Z");
        const later = new Date("2024-03-20T00:00:01Z");

        expect(dateToJulianDate(later)).toBeGreaterThan(dateToJulianDate(earlier));
    });

});