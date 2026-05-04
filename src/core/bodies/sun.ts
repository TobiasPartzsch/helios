import { Radians } from "../angles";
import type { EquatorialCoords } from "../coordinates";
import { sunEclipticLongitudeRad as sunEclipticLongitudeRadCore, sunGeocentricEquatorialCoordinates } from "../orbit/propagate";
import { DaysSinceJ2000 } from "../time/types";

export function sunEquatorialCoordinates(daysSinceJ2000: DaysSinceJ2000): EquatorialCoords {
    return sunGeocentricEquatorialCoordinates(daysSinceJ2000);
}

export function sunEclipticLongitudeRad(daysSinceJ2000: DaysSinceJ2000): Radians {
    return sunEclipticLongitudeRadCore(daysSinceJ2000);
}
