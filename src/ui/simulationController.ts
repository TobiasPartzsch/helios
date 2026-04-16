import { engine } from "../core/simulation/instance";
import { dateToJulianDate, getDaysSinceJ2000 } from "../core/time";
import { UI } from "./elements";
import { getRouteData } from "./routeController";

export function getPlaying() {
    return !engine.getState().isPaused;
}

export function getIsRouteMode() {
    return engine.getState().isRouteMode;
}
export function setRouteMode(isRouteMode: boolean) {
    engine.updateState({ isRouteMode });
}

export function setPlaying(next: boolean) {
    engine.updateState({ isPaused: !next });
    UI.buttons.play.textContent = next ? "⏸ Pause" : "▶ Play";
}

export function startRouteSimulation() {
    const routeData = getRouteData();
    if (routeData.length > 0) {
        const isoString = routeData[0].timestampUtc;
        const startDate = new Date(isoString);

        const jd = dateToJulianDate(startDate);
        const startDays = getDaysSinceJ2000(jd);

        engine.updateState({
            time: startDays,
            isPaused: true
        });

        UI.buttons.play.textContent = "⏸ Pause";
    }
}