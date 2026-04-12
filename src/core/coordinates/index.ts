import { Radians } from "../angles";

export interface EquatorialCoords {
    rightAscensionRad: Radians; // RA in radians
    declinationRad: Radians;    // Dec in radians
}

export interface HorizontalCoords {
    azimuthRad: Radians;  // measured from north, increasing toward east (common convention)
    altitudeRad: Radians; // height above horizon
}

export interface EclipticCoords {
    longitudeRad: number;
    latitudeRad: number;
}
