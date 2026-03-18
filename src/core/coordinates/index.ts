export interface EquatorialCoords {
    rightAscensionRad: number; // RA in radians
    declinationRad: number;    // Dec in radians
}

export interface HorizontalCoords {
    azimuthRad: number;  // measured from north, increasing toward east (common convention)
    altitudeRad: number; // height above horizon
}

export * from "./horizontal";
