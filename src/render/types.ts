import { Radians } from "../core/angles";
import { HorizontalCoords } from "../core/coordinates";
import { HorizonProfile } from "../core/horizon";
import { DaysSinceJ2000 } from "../core/time/types";
import { AU, RefractionModel } from "../core/types";
import { BodyConfig, BodyName } from "../ui/elements";

export type ScreenX = number & { readonly __brand: "ScreenX" };
export type ScreenY = number & { readonly __brand: "ScreenY" };
export type ScreenWidth = number & { __brand: "ScreenWidth" };
export type ScreenHeight = number & { __brand: "ScreenHeight" };

export type WorldX = number & { readonly __brand: "WorldX" };
export type WorldY = number & { readonly __brand: "WorldY" };
export type WorldWidth = number & { __brand: "WorldWidth" };
export type WorldHeight = number & { __brand: "WorldHeight" };

export interface Viewport {
    world: WorldRect;  // source region in the sky canvas
    screen: ScreenRect;  // destination region in the lens canvas
    zoom: number;
}

export interface SkyRenderState {
    daysSinceJ2000: DaysSinceJ2000;
    latRad: Radians;
    lonRad: Radians;
    sunHoriz?: HorizontalCoords;
    moonHoriz?: HorizontalCoords;
    planetHorizMap: Partial<Record<BodyName, HorizontalCoords>>;
    distanceMap: Partial<Record<BodyName, AU>>;
    bodies: Record<BodyName, BodyConfig>;
    horizonProfile: HorizonProfile | null;
    refractionModel: RefractionModel;
    useSymbols: boolean;
}

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

export const VIRTUAL_WORLD_WIDTH = 3600 as ScreenWidth;
export const VIRTUAL_WORLD_HEIGHT = 1800 as ScreenHeight;