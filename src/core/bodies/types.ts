import { EquatorialCoords, HorizontalCoords } from "../coordinates";

export interface BodyState<TExtra = undefined> {
    equatorial: EquatorialCoords;
    horizontal?: HorizontalCoords;
    distanceAu?: number;
    extra?: TExtra;
}

export interface RotatingBodyExtra {
    rotationRad: number;
}