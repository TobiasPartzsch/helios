import { radToDeg } from "./angles";
import {
    moonEclipticLatitudeRad,
    moonSunEclipticLongitudeDifferenceRad,
} from "./bodies/moon";
import { DaysSinceJ2000 } from "./time/types";

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

export function getSolarEclipseCandidateInfo(daysSinceJ2000: DaysSinceJ2000): EclipseCandidateInfo {
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

export function getLunarEclipseCandidateInfo(daysSinceJ2000: DaysSinceJ2000): EclipseCandidateInfo {
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

export function isSolarEclipseCandidate(daysSinceJ2000: DaysSinceJ2000): boolean {
    return getSolarEclipseCandidateInfo(daysSinceJ2000).isCandidate;
}

export function isLunarEclipseCandidate(daysSinceJ2000: DaysSinceJ2000): boolean {
    return getLunarEclipseCandidateInfo(daysSinceJ2000).isCandidate;
}