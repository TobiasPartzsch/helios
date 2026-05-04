import { engine } from "../core/simulation/instance";
import { SimulationSpeedUnit } from "../core/types";
import { UI } from "./elements";

export function initSimulationController() {
    // Play / Pause
    UI.buttons.play.onclick = () => {
        const isPaused = engine.getState().isPaused;
        const nextPaused = !isPaused;

        engine.updateState({ isPaused: nextPaused });
        UI.buttons.play.textContent = nextPaused ? "▶ Play" : "⏸ Pause";
    };

    // Simulation Speed (Multiplier)
    UI.inputs.settings.simSpeed.addEventListener("input", (e) => {
        const value = Number((e.target as HTMLInputElement).value);
        UI.slider.speedVal.innerText = String(value);

        UI.slider.speedVal.classList.remove("speed-negative", "speed-zero", "speed-positive");
        if (value < 0) UI.slider.speedVal.classList.add("speed-negative");
        else if (value > 0) UI.slider.speedVal.classList.add("speed-positive");
        else UI.slider.speedVal.classList.add("speed-zero");

        engine.updateState({ timeMultiplier: value });
    });

    // Time Unit (RealTime, Minutes, Days, etc.)
    UI.selects.timeUnit?.addEventListener("change", (e) => {
        const unit = Number((e.target as HTMLSelectElement).value) as SimulationSpeedUnit;
        engine.updateState({ timeUnit: unit });
    });
}

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
