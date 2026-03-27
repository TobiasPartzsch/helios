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