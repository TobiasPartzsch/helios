import { degToRad, radToDeg } from "../angles";
import { cartesianToSpherical, slerpVec, sphericalToCartesian } from "../coordinates/transforms";
import { RoutePoint, RoutePosition } from "./types";

function findRouteSegment(points: RoutePoint[], timeMs: number): [RoutePoint, RoutePoint, number] {
    if (points.length === 0) {
        throw new Error("Route is empty");
    }

    if (points.length === 1) {
        return [points[0], points[0], 0];
    }

    if (timeMs <= Date.parse(points[0].timestampUtc)) {
        return [points[0], points[0], 0];
    }

    const last = points[points.length - 1];
    if (timeMs >= Date.parse(last.timestampUtc)) {
        return [last, last, 0];
    }

    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const ta = Date.parse(a.timestampUtc);
        const tb = Date.parse(b.timestampUtc);

        if (timeMs >= ta && timeMs <= tb) {
            const t = (timeMs - ta) / (tb - ta);
            return [a, b, t];
        }
    }

    throw new Error("No route segment found");
}

export function interpolateRoute(points: RoutePoint[], timeMs: number): RoutePosition {
    const [a, b, t] = findRouteSegment(points, timeMs);

    if (a === b) {
        return {
            latDeg: a.latDeg,
            lonDeg: a.lonDeg,
            label: a.label,
            note: a.note,
        };
    }

    const va = sphericalToCartesian(degToRad(a.lonDeg), degToRad(a.latDeg));
    const vb = sphericalToCartesian(degToRad(b.lonDeg), degToRad(b.latDeg));
    const vm = slerpVec(va, vb, t);
    const { latitudeRad: latRad, longitudeRad: lonRad } = cartesianToSpherical(vm);

    return {
        latDeg: radToDeg(latRad),
        lonDeg: radToDeg(lonRad),
        label: t < 0.5 ? a.label : b.label,
        note: t < 0.5 ? a.note : b.note,
    };
}