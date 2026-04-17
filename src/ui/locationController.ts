import { asDeg } from "../core/angles";
import { engine } from "../core/simulation/instance";
import { RefractionModel } from "../core/types";
import { UI } from "./elements";

export function initLocationController() {
    const handleLocationChange = () => {
        const lat = asDeg(parseFloat(UI.inputs.location.lat.value) || 0);
        const lon = asDeg(parseFloat(UI.inputs.location.lon.value) || 0);
        const elev = parseFloat(UI.inputs.location.elev.value) || 0;

        engine.setObserver(lat, lon, elev);
    };

    // Use 'blur' or 'change' to prevent jumping while the user is typing
    [UI.inputs.location.lat, UI.inputs.location.lon, UI.inputs.location.elev].forEach(input => {
        input.addEventListener("change", handleLocationChange);
    });

    // Refraction Model selection
    UI.selects.refraction.addEventListener("change", (e) => {
        const model = (e.target as HTMLSelectElement).value as RefractionModel;
        engine.updateState({ refractionModel: model });
    });
}

/**
 * Syncs location fields from state.
 * Prevents overwriting if the user is currently focused on a field.
 */
export function syncLocationUI(state: any) {
    const active = document.activeElement;

    if (active !== UI.inputs.location.lat) {
        UI.inputs.location.lat.value = state.observer.latDeg.toFixed(6);
    }
    if (active !== UI.inputs.location.lon) {
        UI.inputs.location.lon.value = state.observer.lonDeg.toFixed(6);
    }
    if (active !== UI.inputs.location.elev) {
        UI.inputs.location.elev.value = state.observer.elevationAmsl.toString();
    }
}