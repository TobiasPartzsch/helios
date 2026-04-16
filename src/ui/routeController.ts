import { interpolateRoute } from "../core/routes/interpolate";
import { RoutePoint } from "../core/routes/types";
import { setSimTime } from "../main";
import { syncTimeControlsFromDate, UI } from "./elements";
import { setRouteMode } from "./simulationController";

let loadedRoute: RoutePoint[] = [];

export function hasRouteData() {
    return loadedRoute.length > 0
}

export function getRouteData() {
    return loadedRoute
}

export function initRouteController(
    onPathLoad: (path: string) => void,
    onFileLoad: (file: File) => void,
) {
    UI.buttons.browseRoute.onclick = () => UI.inputs.route.picker.click();

    UI.inputs.route.file.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            onPathLoad(UI.inputs.route.file.value.trim());
        }
    });
    UI.inputs.route.picker.addEventListener("change", () => {
        const file = UI.inputs.route.picker.files?.[0];
        if (file) {
            // 1. Sync the text display
            UI.inputs.route.file.value = file.name;

            // 2. Sync UI state if the radio is already checked
            const routeRadio = document.querySelector('input[name="source-mode"][value="route"]') as HTMLInputElement;
            if (routeRadio) {
                setRouteMode(routeRadio.checked);
            }

            // 3. Trigger the data load (Only once!)
            onFileLoad(file);
        }
    });
    UI.inputs.route.track.addEventListener("input", (e) => {
        const index = parseInt((e.target as HTMLInputElement).value);
        applyRoutePoint(index);
    });

    document.querySelectorAll('input[name="source-mode"]').forEach(radio => {
        radio.addEventListener("change", (e) => {
            const input = e.target as HTMLInputElement;
            const isRoute = (input.value === 'route');

            setRouteMode(isRoute);
        });
    });
}

export function handleLoadedRoute(points: RoutePoint[]) {
    loadedRoute = points;

    const track = UI.inputs.route.track;
    track.disabled = false; // Force enable just in case
    track.min = "0";
    track.max = (points.length - 1).toString();
    track.value = "0";

    const progressLabel = document.getElementById("route-progress");
    if (progressLabel) progressLabel.textContent = "0%";

    applyRoutePoint(0);
}

function applyRoutePoint(index: number) {
    const point = loadedRoute[index];
    if (!point) return;

    UI.inputs.location.lat.value = point.latDeg.toFixed(6);
    UI.inputs.location.lon.value = point.lonDeg.toFixed(6);
    UI.inputs.location.elev.value = "0";

    const progress = Math.round((index / (loadedRoute.length - 1)) * 100);
    const progressLabel = document.getElementById("route-progress");
    if (progressLabel) progressLabel.textContent = `${progress}%`;

    // 4. Update the engine (when you have it)
    // engine.setTime(date);
    // engine.setObserver(point.latDeg, point.lonDeg);
    console.log(`Moving to: ${point.latDeg}, ${point.lonDeg} at ${point.timestampUtc}`);

    const pointDate = new Date(point.timestampUtc);
    const ms = pointDate.getTime();

    setSimTime(ms); // Update master clock
    syncTimeControlsFromDate(pointDate); // Update UI clock

    // Sync the Time UI
    syncTimeControlsFromDate(pointDate);
}

/**
 * Called every frame by the main loop when in Route Mode.
 * Interpolates position and updates the UI fields + Slider.
 */
export function updateObserverFromRoute(currentTimeMs: number) {
    if (loadedRoute.length > 0) {
        const pos = interpolateRoute(loadedRoute, currentTimeMs);

        // Update Location UI
        UI.inputs.location.lat.value = pos.latDeg.toFixed(4);
        UI.inputs.location.lon.value = pos.lonDeg.toFixed(4);

        // Sync the slider and percentage label
        syncRouteUI(currentTimeMs);

        // Future: engine.setObserverLocation(pos.latDeg, pos.lonDeg, 0);
    }
}

/**
 * Synchronizes the Route Slider and Progress Label based on a timestamp.
 * This is the "single source of truth" for the voyage's visual progress.
 */
export function syncRouteUI(currentTimeMs: number) {
    if (loadedRoute.length < 2) return;

    const start = Date.parse(loadedRoute[0].timestampUtc);
    const end = Date.parse(loadedRoute[loadedRoute.length - 1].timestampUtc);

    // 1. Calculate Ratio (0.0 to 1.0)
    const totalDuration = end - start;
    const elapsed = currentTimeMs - start;
    // We clamp to 0-1 to handle sim times outside the route's bounds
    const ratio = Math.max(0, Math.min(1, elapsed / totalDuration));

    // 2. Update Slider Position
    const track = UI.inputs.route.track;
    const maxVal = parseInt(track.max) || 1000;
    track.value = Math.floor(ratio * maxVal).toString();

    // 3. Update Percentage Label
    const progressLabel = document.getElementById("route-progress");
    if (progressLabel) {
        progressLabel.textContent = `${Math.round(ratio * 100)}%`;
    }
    console.log("Syncing Slider:", ratio);

}