import { normalizeRad } from "./math";

export function linearAngleRad(baseRad: number, rateRadPerDay: number, days: number): number {
    return normalizeRad(baseRad + rateRadPerDay * days);
}