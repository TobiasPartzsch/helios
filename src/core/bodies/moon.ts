import { angularSeparationRad, degToRad, linearAngleRad, Radians, radToDeg } from "../angles";
import type { EclipticCoords, EquatorialCoords } from "../coordinates";
import { eclipticCartesianToEquatorial } from "../coordinates/transforms";
import { normalizeRad, signedAngularDifferenceRad } from "../math";
import { sunGeocentricEquatorialCoordinates } from "../orbit/propagate";
import { DaysSinceJ2000 } from "../time";
import { sunEclipticLongitudeRad } from "./sun";

const MOON_MEAN_LONGITUDE = {
    baseRad: degToRad(218.316),
    rateRadPerDay: degToRad(13.176396),
};
const MOON_MEAN_ELONGATION = {
    baseRad: degToRad(297.8501921),
    rateRadPerDay: degToRad(12.19074912),
};
const MOON_MEAN_ANOMALY = {
    baseRad: degToRad(134.963),
    rateRadPerDay: degToRad(13.064993),
};
const SUN_MEAN_ANOMALY = {
    baseRad: degToRad(357.529),
    rateRadPerDay: degToRad(0.98560028)
};
const MOON_ARGUMENT_OF_LATITUDE = {
    baseRad: degToRad(93.272),
    rateRadPerDay: degToRad(13.22935),
};

const MOON_LONGITUDE_TERMS_RAD = {
    evection: degToRad(1.274),
    variation: degToRad(0.658),
    annualEquation: degToRad(-0.186),
    equationOfCenter: degToRad(6.289),
    secondHarmonic: degToRad(0.214),
};

const MOON_LATITUDE_TERMS_RAD = {
    primary: degToRad(5.128),
    plus: degToRad(0.280),
    minus: degToRad(0.277),
    evectionLike: degToRad(0.173),
};

/**
 * Compute the Moon's approximate equatorial coordinates (RA/Dec) for a given Julian Date.
 */
export function moonEquatorialCoordinates(daysSinceJ2000: DaysSinceJ2000): EquatorialCoords {
    const { longitudeRad, latitudeRad } = moonEclipticCoordinates(daysSinceJ2000);
    const [x, y, z] = [
        Math.cos(latitudeRad) * Math.cos(longitudeRad),
        Math.cos(latitudeRad) * Math.sin(longitudeRad),
        Math.sin(latitudeRad),
    ];

    return eclipticCartesianToEquatorial(x, y, z, daysSinceJ2000);
}

/**
 * Moon phase info.
 */
export interface MoonPhaseInfo {
    /** Illuminated fraction of the lunar disk, 0 = new, 1 = full */
    illuminatedFraction: number;
    /** Phase angle (Sun–Moon–Earth) in radians */
    phaseAngleRad: number;
    /** Phase as 0..1 (0 new → 0.5 full → 1 new) */
    phase: number;
    /** Rough human-readable phase name */
    phaseName: string;
}

/**
 * Compute approximate Moon phase for a given Julian Date.
 */
export function moonPhase(daysSinceJ2000: DaysSinceJ2000): MoonPhaseInfo {
    const moonEq = moonEquatorialCoordinates(daysSinceJ2000);
    const sunEq = sunGeocentricEquatorialCoordinates(daysSinceJ2000);

    const illuminatedFraction = calculateIllumination(sunEq, moonEq);

    const moonEcl = moonEclipticCoordinates(daysSinceJ2000);
    const sunLon = sunEclipticLongitudeRad(daysSinceJ2000);
    const signedElongationRad = signedAngularDifferenceRad(moonEcl.longitudeRad, sunLon);

    const phase = illuminatedFraction;
    const phaseName = classifyPhase(illuminatedFraction, signedElongationRad);

    return { illuminatedFraction, phaseAngleRad: signedElongationRad, phase, phaseName };
}

export function calculateIllumination(sunEq: EquatorialCoords, moonEq: EquatorialCoords): number {
    const psi = angularSeparationRad(
        moonEq.rightAscensionRad,
        moonEq.declinationRad,
        sunEq.rightAscensionRad,
        sunEq.declinationRad,
    );
    return (1 + Math.cos(Math.PI - psi)) / 2;
}

function classifyPhase(illuminatedFraction: number, deltaRad: number): string {

    // 1. Extreme Thresholds
    if (illuminatedFraction < 0.03) return "New Moon";
    if (illuminatedFraction > 0.97) return "Full Moon";

    // 2. Identify if it's Waxing (0-180) or Waning (180-360)
    const isWaxing = deltaRad > 0 && deltaRad < Math.PI;

    // 3. Quarters (near 50% illumination)
    if (illuminatedFraction > 0.45 && illuminatedFraction < 0.55) {
        return isWaxing ? "First Quarter" : "Last Quarter";
    }

    // 4. Crescent vs Gibbous
    if (illuminatedFraction < 0.5) {
        return isWaxing ? "Waxing Crescent" : "Waning Crescent";
    } else {
        return isWaxing ? "Waxing Gibbous" : "Waning Gibbous";
    }
}

export function moonSunAngularSeparationRad(daysSinceJ2000: DaysSinceJ2000): number {
    const moonEq = moonEquatorialCoordinates(daysSinceJ2000);
    const sunEq = sunGeocentricEquatorialCoordinates(daysSinceJ2000);

    return angularSeparationRad(
        moonEq.rightAscensionRad,
        moonEq.declinationRad,
        sunEq.rightAscensionRad,
        sunEq.declinationRad,
    );
}

export function lunarElongationDeg(daysSinceJ2000: DaysSinceJ2000): number {
    return radToDeg(moonSunAngularSeparationRad(daysSinceJ2000));
}

export function moonEclipticCoordinates(daysSinceJ2000: DaysSinceJ2000): EclipticCoords {
    const daysSinceJ2000_5 = daysSinceJ2000 - 0.5 as DaysSinceJ2000;

    const moonMeanLongitudeRad = linearAngleRad(
        MOON_MEAN_LONGITUDE.baseRad,
        MOON_MEAN_LONGITUDE.rateRadPerDay,
        daysSinceJ2000_5
    );
    const moonMeanAnomalyRad = linearAngleRad(
        MOON_MEAN_ANOMALY.baseRad,
        MOON_MEAN_ANOMALY.rateRadPerDay,
        daysSinceJ2000_5
    );
    const sunMeanAnomalyRad = linearAngleRad(
        SUN_MEAN_ANOMALY.baseRad,
        SUN_MEAN_ANOMALY.rateRadPerDay,
        daysSinceJ2000_5
    );
    const moonArgumentOfLatitudeRad = linearAngleRad(
        MOON_ARGUMENT_OF_LATITUDE.baseRad,
        MOON_ARGUMENT_OF_LATITUDE.rateRadPerDay,
        daysSinceJ2000_5
    );
    const moonMeanElongationRad = linearAngleRad(
        MOON_MEAN_ELONGATION.baseRad,
        MOON_MEAN_ELONGATION.rateRadPerDay,
        daysSinceJ2000_5
    );

    const twoMeanElongationRad = 2 * moonMeanElongationRad;

    const longitudeRad = normalizeRad(
        moonMeanLongitudeRad +
        MOON_LONGITUDE_TERMS_RAD.equationOfCenter * Math.sin(moonMeanAnomalyRad) +
        MOON_LONGITUDE_TERMS_RAD.evection * Math.sin(twoMeanElongationRad - moonMeanAnomalyRad) +
        MOON_LONGITUDE_TERMS_RAD.variation * Math.sin(twoMeanElongationRad) +
        MOON_LONGITUDE_TERMS_RAD.secondHarmonic * Math.sin(2 * moonMeanAnomalyRad) +
        MOON_LONGITUDE_TERMS_RAD.annualEquation * Math.sin(sunMeanAnomalyRad)
    ) as Radians;

    // 3. Compute Latitude (beta)
    const latitudeRad = (
        MOON_LATITUDE_TERMS_RAD.primary * Math.sin(moonArgumentOfLatitudeRad) +
        MOON_LATITUDE_TERMS_RAD.plus * Math.sin(moonMeanAnomalyRad + moonArgumentOfLatitudeRad) +
        MOON_LATITUDE_TERMS_RAD.minus * Math.sin(moonMeanAnomalyRad - moonArgumentOfLatitudeRad) +
        MOON_LATITUDE_TERMS_RAD.evectionLike * Math.sin(twoMeanElongationRad - moonArgumentOfLatitudeRad)
    ) as Radians;

    return {
        longitudeRad,
        latitudeRad,
    };
}

export function moonSunEclipticLongitudeDifferenceRad(daysSinceJ2000: DaysSinceJ2000): Radians {
    const moon = moonEclipticCoordinates(daysSinceJ2000);
    const sunLongitudeRad = sunEclipticLongitudeRad(daysSinceJ2000);
    return signedAngularDifferenceRad(moon.longitudeRad, sunLongitudeRad) as Radians;
}

export function moonEclipticLatitudeRad(daysSinceJ2000: DaysSinceJ2000): Radians {
    return moonEclipticCoordinates(daysSinceJ2000).latitudeRad as Radians;
}
