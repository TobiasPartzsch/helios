import { HorizontalCoords } from "../core/coordinates";
import { HorizonProfile } from "../core/horizon";
import { DaysSinceJ2000 } from "../core/time";
import { RefractionModel } from "../core/types";
import { BodyConfig, BodyName } from "../ui/elements";

export interface Viewport {
    world: WorldRect;
    screen: ScreenRect;
    zoom: number;
}

export interface SkyRenderState {
    daysSinceJ2000: DaysSinceJ2000;
    latRad: number;
    lonRad: number;
    sunHoriz?: HorizontalCoords;
    moonHoriz?: HorizontalCoords;
    planetHorizMap: Partial<Record<BodyName, HorizontalCoords>>;
    bodies: Record<BodyName, BodyConfig>;
    horizonProfile: HorizonProfile | null;
    refractionModel: RefractionModel;
    useSymbols: boolean;
}

export type ScreenX = number & { readonly __brand: "ScreenX" };
export type ScreenY = number & { readonly __brand: "ScreenY" };
export type WorldX = number & { readonly __brand: "WorldX" };
export type WorldY = number & { readonly __brand: "WorldY" };

export interface WorldPoint {
    x: WorldX;
    y: WorldY;
}

export interface ScreenPoint {
    x: ScreenX;
    y: ScreenY;
}

export interface WorldRect {
    left: WorldX;
    top: WorldY;
    right: WorldX;
    bottom: WorldY;
}

export interface ScreenRect {
    left: ScreenX;
    top: ScreenY;
    right: ScreenX;
    bottom: ScreenY;
}