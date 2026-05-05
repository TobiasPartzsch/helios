import { BodyName } from "../ui/elements";
import { Degrees } from "./angles";
import { HorizonProfile } from "./horizon";
import { DaysSinceJ2000 } from "./time/types";

export enum SimulationSpeedUnit {
    RealTime = 1,
    MinutePerSec = 60,
    HourPerSec = 3600,
    DayPerSec = 86400,
    WeekPerSec = 604800
}

export enum RefractionModel {
    None = "none",
    Bennett = "bennett"
}

export interface SimulationState {
    // Temporal
    time: DaysSinceJ2000;

    // Spatial
    observer: {
        latDeg: Degrees;
        lonDeg: Degrees;
        elevationAmsl: number;
    };

    refractionModel: RefractionModel;
    horizonProfile: HorizonProfile | null;

    // Celestial bodies settings
    bodies: Record<BodyName, {
        enabled: boolean;
        displayMode: "hidden" | "shown" | "shownWithPath";
    }>;

    // Configuration
    isPaused: boolean;
    isRouteMode: boolean;
    timeMultiplier: number;
    timeUnit: SimulationSpeedUnit;
    useSymbols: boolean;
}

export type AU = number & { readonly __brand: "AU" };

export const KM_PER_AU = 149597870.7;
export const kmToAU = (km: number): AU => (km / KM_PER_AU) as AU;