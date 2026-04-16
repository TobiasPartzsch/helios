import { BODY_NAMES, BodyConfig, BodyDisplayMode, BodyName, UI } from "../../ui/elements";
import { asDeg } from "../angles";
import { dateToJulianDate, getDaysSinceJ2000 } from "../time";
import { RefractionModel, SimulationSpeedUnit, SimulationState } from "../types";
import { SimulationEngine } from "./simulationEngine";

const initialState: SimulationState = {
    time: getDaysSinceJ2000(dateToJulianDate(new Date())),
    observer: {
        latDeg: asDeg(parseFloat(UI.inputs.location.lat.value)),
        lonDeg: asDeg(parseFloat(UI.inputs.location.lon.value)),
        elevationAmsl: parseFloat(UI.inputs.location.elev.value),
    },
    refractionModel: UI.selects.refraction.value as RefractionModel,
    bodies: Object.fromEntries(
        BODY_NAMES.map((name) => [
            name,
            {
                enabled: UI.bodies[name].enabled?.checked ?? true,
                displayMode: UI.bodies[name].displayMode?.value as BodyDisplayMode ?? true,
            } satisfies BodyConfig,
        ])
    ) as Record<BodyName, BodyConfig>,
    isPaused: true,
    isRouteMode: false,
    timeMultiplier: 1,
    timeUnit: SimulationSpeedUnit.RealTime,
    useSymbols: UI.inputs.settings.useSymbols?.checked ?? false,
    horizonProfile: null
};

export const engine = new SimulationEngine(initialState);
