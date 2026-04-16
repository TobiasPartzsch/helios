import { degToRad, Radians, radToDeg } from "../angles";
import { RefractionModel } from "../types";

export function applyRefraction(
    altitudeRad: Radians,
    model: RefractionModel
): Radians {
    if (model === 'none') return altitudeRad;

    // Bennett (1982): R in arcminutes, h in degrees
    const altDeg = radToDeg(altitudeRad);
    if (altDeg < -0.5) return altitudeRad;

    const R = 1 / Math.tan(degToRad(altDeg + 7.31 / (altDeg + 4.4)));
    return altitudeRad + degToRad(R / 60) as Radians;
}