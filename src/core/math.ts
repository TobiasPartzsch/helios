
export const PI = Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;

function normalize(angle: number, limit: number): number {
    return ((angle % limit) + limit) % limit;
}

export function normalizeDeg(angle: number): number {
    return normalize(angle, 360);
}

export function normalizeRad(angle: number): number {
    return normalize(angle, TWO_PI)
}


export function radToHours(rad: number): number {
    // 2π number = 24 hours
    return rad * (12 / PI);
}

export function hoursToRad(hours: number): number {
    return hours * (PI / 12);
}


export function hmsToDeg(hours: number, minutes: number, seconds: number): number {
    return (hours + minutes / 60 + seconds / 3600) * 15;
}

export function dmsToDeg(sign: 1 | -1, number: number, minutes: number, seconds: number): number {
    return sign * (number + minutes / 60 + seconds / 3600);
}

export function angularDifferenceDeg(a: number, b: number): number {
    const diff = ((a - b + 180) % 360 + 360) % 360 - 180;
    return Math.abs(diff);
}

export function signedAngularDifferenceRad(a: number, b: number): number {
    return ((a - b + PI) % TWO_PI + TWO_PI) % TWO_PI - PI;
}

export function vectorMagnitude(x: number, y: number, z: number): number {
    return Math.sqrt(x * x + y * y + z * z);
}