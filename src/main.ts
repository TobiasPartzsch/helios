import { engine } from "./core/simulation/instance";
import { daysSinceJ2000ToUnixMs } from "./core/time/julian";
import { updateTelemetryAndRender } from "./render/orchestrator";
import "./style.css";
import { initBodyController } from "./ui/bodyController";
import { syncBodyControls } from "./ui/elements";
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
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = timestamp - lastTimestamp;
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

    requestAnimationFrame(animate);
}

// Boot Sequence (The "Initial Handshake")
const initialState = engine.getState();

const routeRadio = document.querySelector('input[name="source-mode"][value="route"]') as HTMLInputElement;
const isCurrentlyRoute = routeRadio?.checked ?? false;
console.log(isCurrentlyRoute)

syncBodyControls(initialState);
requestAnimationFrame(animate);