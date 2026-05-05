import { Radians } from "../angles";
import type { EquatorialCoords } from "../coordinates";
import { eclipticCartesianToEquatorial, sphericalToCartesian, subtractCartesian } from "../coordinates/transforms";
import { normalizeRad, vectorMagnitude } from "../math";
import { DaysSinceJ2000 } from "../time/types";
import { AU } from "../types";
import { vsop87 } from "./vsop87";

export const MEAN_OBLIQUITY_J2000_DEG = 23.439291111;
export const OBLIQUITY_DEG_PER_CENTURY = 0.013004167;
const MOON_AVG_DISTANCE_AU = 0.002570 as AU;


export function heliocentricSphericalCoords(name: string, daysSinceJ2000: DaysSinceJ2000): [Radians, Radians, Radians] {
    return vsop87(name, daysSinceJ2000);
}

export function heliocentricCartesianCoords(name: string, daysSinceJ2000: DaysSinceJ2000): [number, number, number] {
    const [L, B, R] = heliocentricSphericalCoords(name, daysSinceJ2000);
    return sphericalToCartesian(L, B, R);
}

export function geocentricCartesianCoords(name: string, daysSinceJ2000: DaysSinceJ2000): [number, number, number] {
    return subtractCartesian(
        heliocentricCartesianCoords(name, daysSinceJ2000),
        heliocentricCartesianCoords("earth", daysSinceJ2000),
    );
}

export function planetGeocentricEquatorialCoordinates(name: string, daysSinceJ2000: DaysSinceJ2000): EquatorialCoords {
    const [x, y, z] = geocentricCartesianCoords(name, daysSinceJ2000);
    return eclipticCartesianToEquatorial(x, y, z, daysSinceJ2000);
}

export function earthHeliocentricCartesianCoords(daysSinceJ2000: DaysSinceJ2000): [number, number, number] {
    return heliocentricCartesianCoords("earth", daysSinceJ2000);
}

export function sunGeocentricEquatorialCoordinates(daysSinceJ2000: DaysSinceJ2000): EquatorialCoords {
    const [x, y, z] = earthHeliocentricCartesianCoords(daysSinceJ2000);
    return eclipticCartesianToEquatorial(-x, -y, -z, daysSinceJ2000);
}

export function earthHeliocentricEquatorialCoordinates(daysSinceJ2000: DaysSinceJ2000): EquatorialCoords {
    const [x, y, z] = earthHeliocentricCartesianCoords(daysSinceJ2000);
    return eclipticCartesianToEquatorial(x, y, z, daysSinceJ2000);
}

export function sunEclipticLongitudeRad(daysSinceJ2000: DaysSinceJ2000): Radians {
    const [x, y] = sunGeocentricCartesianCoords(daysSinceJ2000);
    return normalizeRad(Math.atan2(y, x)) as Radians;
}

export function sunGeocentricCartesianCoords(
    daysSinceJ2000: DaysSinceJ2000
): [number, number, number] {
    const [x, y, z] = earthHeliocentricCartesianCoords(daysSinceJ2000);
    return [-x, -y, -z];
}

export function geocentricDistance(name: string, daysSinceJ2000: DaysSinceJ2000): AU {
    if (name === "sun") {
        const [x, y, z] = earthHeliocentricCartesianCoords(daysSinceJ2000);
        return vectorMagnitude(x, y, z) as AU;
    }
    if (name === "moon") {
        return MOON_AVG_DISTANCE_AU;
    }
    const [x, y, z] = geocentricCartesianCoords(name, daysSinceJ2000);
    return vectorMagnitude(x, y, z) as AU;
}