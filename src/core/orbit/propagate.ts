// propagate.ts
import type { EquatorialCoords } from "../coordinates";
import { degToRad, normalizeRad, radToDeg } from "../math";
import { J2000_EPOCH, JULIAN_CENTURY } from "../time/julian";
import { vsop87 } from "./vsop87";

function sphericalToCartesian(L: number, B: number, R: number): [number, number, number] {
    const cosB = Math.cos(B);
    return [
        R * cosB * Math.cos(L),
        R * cosB * Math.sin(L),
        R * Math.sin(B),
    ];
}

function eclipticToEquatorial(
    x: number, y: number, z: number,
    earthX: number, earthY: number, earthZ: number,
    jd: number
): EquatorialCoords {
    const dx = x - earthX;
    const dy = y - earthY;
    const dz = z - earthZ;

    const T = (jd - J2000_EPOCH) / JULIAN_CENTURY;
    const eps = degToRad(23.439291111 - 0.013004167 * T);
    const cosEps = Math.cos(eps);
    const sinEps = Math.sin(eps);

    const eqX = dx;
    const eqY = dy * cosEps - dz * sinEps;
    const eqZ = dy * sinEps + dz * cosEps;

    return {
        rightAscensionRad: normalizeRad(Math.atan2(eqY, eqX)),
        declinationRad: Math.atan2(eqZ, Math.sqrt(eqX * eqX + eqY * eqY)),
    };
}

export function planetEquatorialCoordinates(name: string, jd: number): EquatorialCoords {
    const [L, B, R] = vsop87(name, jd);
    const [x, y, z] = sphericalToCartesian(L, B, R);
    const [eL, eB, eR] = vsop87("earth", jd);
    const [ex, ey, ez] = sphericalToCartesian(eL, eB, eR);

    // if (name === "jupiter") {
    //     console.log(`helio xyz: ${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}`);
    //     console.log(`earth xyz: ${ex.toFixed(4)}, ${ey.toFixed(4)}, ${ez.toFixed(4)}`);
    //     console.log(`geo   xyz: ${(x - ex).toFixed(4)}, ${(y - ey).toFixed(4)}, ${(z - ez).toFixed(4)}`);
    // }

    // if (name === "mars" || name === "jupiter") {
    //     const result = eclipticToEquatorial(x, y, z, ex, ey, ez, jd);
    //     console.log(`${name} RA=${radToDeg(result.rightAscensionRad).toFixed(4)}° Dec=${radToDeg(result.declinationRad).toFixed(4)}°`);
    //     console.log(`mars geo ecliptic: dx=${(x - ex).toFixed(4)} dy=${(y - ey).toFixed(4)} dz=${(z - ez).toFixed(4)}`);
    //     console.log(`mars L=${radToDeg(L).toFixed(4)}° earth L=${radToDeg(eL).toFixed(4)}°`);
    // }
    const coords = eclipticToEquatorial(x, y, z, ex, ey, ez, jd);

    console.log(`${name.padEnd(8)} RA=${radToDeg(coords.rightAscensionRad).toFixed(4)}° Dec=${radToDeg(coords.declinationRad).toFixed(4)}°`);

    return eclipticToEquatorial(x, y, z, ex, ey, ez, jd);
}