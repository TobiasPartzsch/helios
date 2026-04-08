export const PI = Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;

export function degToRad(deg: number): number {
    return deg * (PI / 180);
}

export function radToDeg(rad: number): number {
    return rad * (180 / PI);
}

export function radToHours(rad: number): number {
    // 2π radians = 24 hours
    return rad * (12 / PI);
}

export function hoursToRad(hours: number): number {
    return hours * (PI / 12);
}

export function normalizeDeg(angle: number): number {
    return ((angle % 360) + 360) % 360;
}

export function normalizeRad(angle: number): number {
    return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

export function hmsToDeg(hours: number, minutes: number, seconds: number): number {
    return (hours + minutes / 60 + seconds / 3600) * 15;
}

export function dmsToDeg(sign: 1 | -1, degrees: number, minutes: number, seconds: number): number {
    return sign * (degrees + minutes / 60 + seconds / 3600);
}

export function angularDifferenceDeg(a: number, b: number): number {
    const diff = ((a - b + 180) % 360 + 360) % 360 - 180;
    return Math.abs(diff);
}

export function angularSeparationRad(
    ra1: number,
    dec1: number,
    ra2: number,
    dec2: number,
): number {
    const cosSep =
        Math.sin(dec1) * Math.sin(dec2) +
        Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);

    const clamped = Math.max(-1, Math.min(1, cosSep));
    return Math.acos(clamped);
}

export function signedAngularDifferenceRad(a: number, b: number): number {
    return ((a - b + PI) % TWO_PI + TWO_PI) % TWO_PI - PI;
}