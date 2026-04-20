import { HorizontalCoords } from "../core/coordinates";
import { HorizonProfile } from "../core/horizon";
import { DaysSinceJ2000 } from "../core/time";
import { RefractionModel } from "../core/types";
import { BodyConfig, BodyName } from "../ui/elements";

export interface Viewport {
    left: number;
    top: number;
    width: number;
    height: number;
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

