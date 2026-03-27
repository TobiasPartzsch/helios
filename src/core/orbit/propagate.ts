import type { EquatorialCoords } from "../coordinates";
import { degToRad, normalizeRad } from "../math";
import { J2000_EPOCH, JULIAN_CENTURY } from "../time/julian";
import { trueAnomaly } from "./kepler";
import { OrbitalElements, OrbitalRates, PLANETS } from "./keplerElements";

/**
 * Interpolate orbital elements to a given Julian Date.
 */
function elementsAtJD(jd: number, record: { epoch: OrbitalElements; rates: OrbitalRates }): OrbitalElements {
    const T = (jd - J2000_EPOCH) / JULIAN_CENTURY;
    const { epoch: e0, rates: r } = record;
    return {
        a: e0.a + r.a * T,
        e: e0.e + r.e * T,
        i: e0.i + r.i * T,
        omega: e0.omega + r.omega * T,
        w: e0.w + r.w * T,
        L: e0.L + r.L * T,
    };
}

/**
 * Heliocentric ecliptic XYZ (AU) from orbital elements.
 */
export function heliocentricEcliptic(el: OrbitalElements): [number, number, number] {
    const M = el.L - el.w;
    const nu = trueAnomaly(M, el.e);

    // Distance from Sun
    const r = el.a * (1 - el.e * el.e) / (1 + el.e * Math.cos(nu));

    // ω = ϖ - Ω
    const argPerihelion = el.w - el.omega;
    const u = nu + argPerihelion;

    const cosO = Math.cos(el.omega);
    const sinO = Math.sin(el.omega);
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    const cosI = Math.cos(el.i);

    const x = r * (cosO * cosU - sinO * sinU * cosI);
    const y = r * (sinO * cosU + cosO * sinU * cosI);
    const z = r * sinU * Math.sin(el.i);

    return [x, y, z];
}

/**
 * Convert heliocentric ecliptic XYZ to geocentric equatorial RA/Dec.
 */
function eclipticToEquatorial(
    x: number, y: number, z: number,
    earthX: number, earthY: number, earthZ: number,
    jd: number
): EquatorialCoords {
    // Geocentric position
    const dx = x - earthX;
    const dy = y - earthY;
    const dz = z - earthZ;

    // Obliquity of the ecliptic
    const T = (jd - J2000_EPOCH) / JULIAN_CENTURY;
    const eps = degToRad(23.439291111 - 0.013004167 * T);

    const cosEps = Math.cos(eps);
    const sinEps = Math.sin(eps);

    const eqX = dx;
    const eqY = dy * cosEps - dz * sinEps;
    const eqZ = dy * sinEps + dz * cosEps;

    const rightAscensionRad = normalizeRad(Math.atan2(eqY, eqX));
    const declinationRad = Math.atan2(eqZ, Math.sqrt(eqX * eqX + eqY * eqY));

    return { rightAscensionRad, declinationRad };
}

/**
 * Compute geocentric equatorial coordinates for a named planet.
 */
export function planetEquatorialCoordinates(name: string, jd: number): EquatorialCoords {
    const record = PLANETS[name];
    if (!record) throw new Error(`Unknown planet: ${name}`);

    const el = elementsAtJD(jd, record);
    const earthEl = elementsAtJD(jd, PLANETS.earth);

    const [x, y, z] = heliocentricEcliptic(el);
    const [ex, ey, ez] = heliocentricEcliptic(earthEl);

    return eclipticToEquatorial(x, y, z, ex, ey, ez, jd);
}