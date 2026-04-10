import * as MathUtils from "./math";
import { DaysSinceJ2000 } from "./time/julian";

export type Radians = number & { readonly __brand: "Radians" };
export type Degrees = number & { readonly __brand: "Degrees" };

export const asRad = (n: number) => n as Radians;
export const asDeg = (n: number) => n as Degrees;

export function degToRad(deg: number | Degrees): Radians {
    return asRad(deg * (MathUtils.PI / 180));
}

export function radToDeg(rad: number | Radians): Degrees {
    return asDeg(rad * (180 / MathUtils.PI));
}

export function linearAngleRad(
    baseRad: Radians,
    rateRadPerDay: Radians,
    days: DaysSinceJ2000
): Radians {
    return asRad(MathUtils.normalizeRad(baseRad + rateRadPerDay * days));
}

export function angularSeparationRad(
    phi1: Radians,
    theta1: Radians,
    phi2: Radians,
    theta2: Radians,
): Radians {
    const cosSep =
        Math.sin(theta1) * Math.sin(theta2) +
        Math.cos(theta1) * Math.cos(theta2) * Math.cos(phi1 - phi2);

    return asRad(Math.acos(Math.max(-1, Math.min(1, cosSep))));
}