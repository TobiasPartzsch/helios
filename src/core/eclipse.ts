import {
    moonEclipticLatitudeRad,
    moonSunEclipticLongitudeDifferenceRad,
} from "./bodies/moon";
import { radToDeg } from "./math";

export interface EclipseCandidateInfo {
    isCandidate: boolean;
    longitudeErrorDeg: number;
    eclipticLatitudeDeg: number;
}

const ECLIPSE_LIMITS = {
    maxConjunctionErrorDeg: 15,
    maxOppositionErrorDeg: 20,
    maxEclipticLatitudeDeg: 1.5,
};

export function getSolarEclipseCandidateInfo(daysSinceJ2000: number): EclipseCandidateInfo {
    const longitudeErrorDeg = Math.abs(
        radToDeg(moonSunEclipticLongitudeDifferenceRad(daysSinceJ2000)),
    );
    const eclipticLatitudeDeg = Math.abs(radToDeg(moonEclipticLatitudeRad(daysSinceJ2000)));

    return {
        isCandidate:
            longitudeErrorDeg <= ECLIPSE_LIMITS.maxConjunctionErrorDeg &&
            eclipticLatitudeDeg <= ECLIPSE_LIMITS.maxEclipticLatitudeDeg,
        longitudeErrorDeg,
        eclipticLatitudeDeg,
    };
}

export function getLunarEclipseCandidateInfo(daysSinceJ2000: number): EclipseCandidateInfo {
    const longitudeDifferenceDeg = Math.abs(
        radToDeg(moonSunEclipticLongitudeDifferenceRad(daysSinceJ2000)),
    );
    const oppositionErrorDeg = Math.abs(180 - longitudeDifferenceDeg);
    const eclipticLatitudeDeg = Math.abs(radToDeg(moonEclipticLatitudeRad(daysSinceJ2000)));

    return {
        isCandidate:
            oppositionErrorDeg <= ECLIPSE_LIMITS.maxOppositionErrorDeg &&
            eclipticLatitudeDeg <= ECLIPSE_LIMITS.maxEclipticLatitudeDeg,
        longitudeErrorDeg: oppositionErrorDeg,
        eclipticLatitudeDeg,
    };
}

export function isSolarEclipseCandidate(jd: number): boolean {
    return getSolarEclipseCandidateInfo(jd).isCandidate;
}

export function isLunarEclipseCandidate(jd: number): boolean {
    return getLunarEclipseCandidateInfo(jd).isCandidate;
}