import { degToRad, radToDeg } from "../math";

export type RefractionModel = 'none' | 'bennett';

export function applyRefraction(
    altitudeRad: number,
    model: RefractionModel
): number {
    if (model === 'none') return altitudeRad;

    // Bennett (1982): R in arcminutes, h in degrees
    const altDeg = radToDeg(altitudeRad);
    if (altDeg < -0.5) return altitudeRad;

    const R = 1 / Math.tan(degToRad(altDeg + 7.31 / (altDeg + 4.4)));
    return altitudeRad + degToRad(R / 60);
}