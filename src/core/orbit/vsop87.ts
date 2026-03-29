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

    if (name === "jupiter") {
        console.log(`jupiter R0[0]: ${JSON.stringify(data.R[0]?.[0])}`);
        console.log(`jupiter R0 length: ${data.R[0]?.length}`);
        data.L[0].slice(0, 5).forEach(([A, B, C], i) => {
            console.log(`L0[${i}]: A=${A.toFixed(8)} B=${B.toFixed(8)} contrib=${(A * Math.cos(B + C * 0)).toFixed(6)}`);
        });
        console.log(`L raw=${evaluateSeries(data.L, tau).toFixed(6)} rad`);
    }
    return [L, B, R];
}