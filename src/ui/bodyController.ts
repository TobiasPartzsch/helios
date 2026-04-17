import { engine } from "../core/simulation/instance";
import { BODY_NAMES, BodyDisplayMode, BodyName, UI, syncBodyControls } from "./elements";

export function initBodyController() {
    for (const name of BODY_NAMES) {
        // Handle Enabled/Disabled Toggle
        UI.bodies[name].enabled.addEventListener("change", (e) => {
            const isEnabled = (e.target as HTMLInputElement).checked;
            updateBodyConfig(name, { enabled: isEnabled });
        });

        // Handle Display Mode (Hidden, Shown, Path)
        UI.bodies[name].displayMode.addEventListener("change", (e) => {
            const mode = (e.target as HTMLSelectElement).value as BodyDisplayMode;
            updateBodyConfig(name, { displayMode: mode });
        });
    }

    // Astronomical Symbols Toggle
    UI.inputs.settings.useSymbols?.addEventListener("change", (e) => {
        const useSymbols = (e.target as HTMLInputElement).checked;
        engine.updateState({ useSymbols });
    });
}

/**
 * Helper to update a single body's config without losing others.
 * Note: Our engine's updateState handles the deep merge.
 */
function updateBodyConfig(name: BodyName, changes: { enabled?: boolean, displayMode?: BodyDisplayMode }) {
    const currentState = engine.getState();
    const updatedBody = {
        ...currentState.bodies[name],
        ...changes
    };

    engine.updateState({
        bodies: {
            [name]: updatedBody
        } as any
    });

    syncBodyControls(engine.getState());
}