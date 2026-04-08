import { normalizeDeg } from "./math";

export function linearAngleDeg(baseDeg: number, rateDegPerDay: number, days: number): number {
    return normalizeDeg(baseDeg + rateDegPerDay * days);
}