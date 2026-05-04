import { engine } from "./core/simulation/instance";
import { daysSinceJ2000ToUnixMs } from "./core/time/julian";
import { DeltaMs } from "./core/time/types";
import { updateTelemetryAndRender } from "./render/orchestrator";
import "./style.css";
import { initBodyController } from "./ui/bodyController";
import { syncBodyControls, UI } from "./ui/elements";
import { initHorizonFetch } from "./ui/horizonController";
import { initLocationController, syncLocationUI } from "./ui/locationController";
import { initRouteController, syncRouteUI } from "./ui/routeController";
import { initSimulationController } from "./ui/simulationController";
import { initTimeController, syncTimeUIFromDate } from "./ui/timeController";

// 1. Initialize Controllers (The "Wiring")
initSimulationController();
initTimeController();
initLocationController();
initBodyController();
initRouteController();
initHorizonFetch((profile) => engine.updateState({ horizonProfile: profile }));

let lastTimestamp = 0;

function animate(timestamp: number) {
    requestAnimationFrame(animate);

    const start = performance.now();

    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = timestamp - lastTimestamp as DeltaMs;
    lastTimestamp = timestamp;

    // The Engine is the Single Source of Truth for Time/State
    const state = engine.tick(dt);

    // Sync UI Inputs (with focus protection inside the helpers)
    const date = new Date(daysSinceJ2000ToUnixMs(state.time));
    syncTimeUIFromDate(date);
    syncLocationUI(state);
    if (state.isRouteMode) {
        syncRouteUI(state.time);
    }

    // Perform Math & Rendering
    updateTelemetryAndRender(state);

    const end = performance.now();
    if (end - start > 16) {
        console.warn(`Slow frame: ${(end - start).toFixed(2)}ms`);
    }
}

// Boot Sequence (The "Initial Handshake")
const initialState = engine.getState();

const isCurrentlyRoute = UI.inputs.route.modeRoute?.checked ?? false;
engine.updateState({ isRouteMode: isCurrentlyRoute });

syncBodyControls(initialState);
requestAnimationFrame(animate);