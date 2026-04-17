import { loadRouteCsv, parseRouteCsv } from "../core/routes/parseCsv";
import { RoutePoint } from "../core/routes/types";
import { engine } from "../core/simulation/instance";
import { dateToJulianDate, DaysSinceJ2000, getDaysSinceJ2000 } from "../core/time";
import { UI } from "./elements";
import { setRouteMode } from "./simulationController";

let loadedRoute: RoutePoint[] = [];
let cachedRouteStartDays: number | null = null;
let cachedRouteEndDays: number | null = null;

export function hasRouteData() {
    return loadedRoute.length > 0
}

export function getRouteData() {
    return loadedRoute
}

export function initRouteController(
) {
    const processRoute = (csvText: string) => {
        try {
            const route = parseRouteCsv(csvText);
            engine.setRoute(route);
            handleLoadedRoute(route);
        } catch (e) {
            console.error("Failed to parse route:", e);
        }
    };

    const onPathLoad = async (path: string) => {
        const csv = await loadRouteCsv(path);
        processRoute(csv);
    };

    const onFileLoad = async (file: File) => {
        const csv = await file.text();
        processRoute(csv);
    };

    UI.buttons.browseRoute.onclick = () => UI.inputs.route.picker.click();

    UI.inputs.route.file.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            onPathLoad(UI.inputs.route.file.value.trim());
        }
    });

    UI.inputs.route.picker.addEventListener("change", () => {
        const file = UI.inputs.route.picker.files?.[0];
        if (!file) return;

        UI.inputs.route.file.value = file.name;
        if (UI.inputs.route.modeRoute) {
            setRouteMode(UI.inputs.route.modeRoute.checked);
        }

        onFileLoad(file);
    });

    UI.inputs.route.track.addEventListener("input", (e) => {
        const index = parseInt((e.target as HTMLInputElement).value);
        applyRoutePoint(index);
    });

    UI.inputs.route.modeRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            const isRoute = (radio.value === 'route');
            setRouteMode(isRoute);
        });
    });
}

function handleLoadedRoute(points: RoutePoint[]) {
    loadedRoute = points;
    if (points.length >= 2) {
        const startJD = dateToJulianDate(new Date(points[0].timestampUtc));
        const endJD = dateToJulianDate(new Date(points[points.length - 1].timestampUtc));
        cachedRouteStartDays = getDaysSinceJ2000(startJD);
        cachedRouteEndDays = getDaysSinceJ2000(endJD);
    } else {
        cachedRouteStartDays = null;
        cachedRouteEndDays = null;
    }

    const track = UI.inputs.route.track;
    track.disabled = false; // Force enable just in case
    track.min = "0";
    track.max = (points.length - 1).toString();
    track.value = "0";

    UI.outputs.routeProgress.textContent = "0%"

    applyRoutePoint(0);
}

function applyRoutePoint(index: number) {
    const point = loadedRoute[index];
    if (!point) return;

    UI.inputs.location.lat.value = point.latDeg.toFixed(6);
    UI.inputs.location.lon.value = point.lonDeg.toFixed(6);
    UI.inputs.location.elev.value = "0";

    const progress = Math.round((index / (loadedRoute.length - 1)) * 100);
    UI.outputs.routeProgress.textContent = `${progress}%`;

    console.log(`Moving to: ${point.latDeg}, ${point.lonDeg} at ${point.timestampUtc}`);

    const pointDate = new Date(point.timestampUtc);
    const jd = dateToJulianDate(pointDate);
    const daysSinceJ2000 = getDaysSinceJ2000(jd);

    engine.updateState({
        time: daysSinceJ2000,
        observer: {
            latDeg: point.latDeg,
            lonDeg: point.lonDeg,
            elevationAmsl: 0 // As discussed
        }
    });
}

/**
 * Synchronizes the Route Slider and Progress Label based on a timestamp.
 * This is the "single source of truth" for the voyage's visual progress.
 */
// src/ui/routeController.ts
export function syncRouteUI(currentTimeDays: DaysSinceJ2000) {
    if (!cachedRouteStartDays || !cachedRouteEndDays) return;

    // Convert route bounds to DaysSinceJ2000 (maybe cache these?)
    const totalDuration = cachedRouteEndDays - cachedRouteStartDays;
    const elapsed = currentTimeDays - cachedRouteStartDays;
    const ratio = Math.max(0, Math.min(1, elapsed / totalDuration));

    const track = UI.inputs.route.track;
    track.value = Math.floor(ratio * parseInt(track.max)).toString();

    // Update the % label
    UI.outputs.routeProgress.textContent = `${Math.round(ratio * 100)}%`;
}

UI.inputs.route.track.addEventListener("input", (e) => {
    const index = parseInt((e.target as HTMLInputElement).value);
    const point = loadedRoute[index];

    // Instead of messing with UI directly:
    const newJD = dateToJulianDate(new Date(point.timestampUtc));
    engine.setTime(getDaysSinceJ2000(newJD));
});