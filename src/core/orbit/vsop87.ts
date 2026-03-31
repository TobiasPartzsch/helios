import { normalizeRad } from "../math";
import { J2000_EPOCH, JULIAN_CENTURY } from "../time/julian";
import { VSOP87_DATA } from "./vsop87Data";
import type { PlanetSeries } from "./vsop87Types";

function evaluateSeries(series: PlanetSeries[keyof PlanetSeries], tau: number): number {
    return series.reduce((sum, s, k) =>
        sum + Math.pow(tau, k) * s.reduce((t, [A, B, C]) =>
            t + A * Math.cos(B + C * tau), 0)
        , 0);
}

export function vsop87(name: string, jd: number): [number, number, number] {
    const data = VSOP87_DATA[name];
    if (!data) throw new Error(`Unknown planet: ${name}`);
    const T = (jd - J2000_EPOCH) / JULIAN_CENTURY;
    const tau = T / 10;

    const L = normalizeRad(evaluateSeries(data.L, tau));
    const B = evaluateSeries(data.B, tau);
    const R = evaluateSeries(data.R, tau);

    return [L, B, R];
}