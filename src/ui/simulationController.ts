import { setSimTime } from "../main";
import { syncTimeControlsFromDate, UI } from "./elements";
import { getRouteData, hasRouteData } from "./routeController";

let isPlaying = false;
let isRouteMode = false;

export function getPlaying() { return isPlaying; }
export function getIsRouteMode() { return isRouteMode; }

export function setRouteMode(isRouteMode: boolean) {
    isRouteMode = isRouteMode;
    syncUIState();
}

export function setPlaying(next: boolean) {
    isPlaying = next;
    UI.buttons.play.textContent = isPlaying ? "⏸ Pause" : "▶ Play";
    syncUIState();
}

// A helper that iterates over any object of HTML elements
function setGroupDisabled(group: Record<string, HTMLElement | undefined>, disabled: boolean) {
    Object.values(group).forEach(el => {
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLButtonElement) {
            el.disabled = disabled;
        }
    });
}

export function syncUIState() {
    setGroupDisabled(UI.inputs.time, isPlaying);

    setGroupDisabled(UI.inputs.location, isPlaying || isRouteMode);

    UI.inputs.route.track.disabled = !isRouteMode;
    UI.inputs.route.track.disabled = !isRouteMode || !hasRouteData;
}

export function startRouteSimulation() {
    if (hasRouteData()) {
        // Parse the first timestamp from the CSV
        const startTimeMs = Date.parse(getRouteData()[0].timestampUtc);

        // Update your master simulation state (adjust variable name to match yours)
        setSimTime(startTimeMs)

        // Sync the UI clock inputs to this new date
        syncTimeControlsFromDate(new Date(startTimeMs));
    }
}
