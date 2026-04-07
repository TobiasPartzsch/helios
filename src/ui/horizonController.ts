import { fetchHorizonById, HorizonProfile } from "../core/horizon";
import { UI } from "./elements";

export function initHorizonFetch(
    onProfileLoaded: (profile: HorizonProfile) => void
): void {
    UI.buttons.fetchHorizon.onclick = async () => {
        // Destructure the parts of the UI we need for this function
        const { inputs, outputs, buttons } = UI;

        const horizonId = inputs.horizonId.value.trim();
        if (!horizonId) return;

        // Lock UI and show status
        UI.buttons.fetchHorizon.disabled = true;
        UI.outputs.horizonStatus.innerText = "Connecting to Celestial Server...";

        try {
            // Now calling our clean fetch!
            const profile = await fetchHorizonById(horizonId);

            // 3. Update Inputs from the metadata (The "Workaround" now hidden in the profile)
            UI.inputs.lat.value = profile.observer.lat.toString();
            UI.inputs.lon.value = profile.observer.lon.toString();
            UI.inputs.elev.value = profile.observer.elev.toString();

            UI.outputs.horizonStatus.innerText = `ID: ${profile.id} (${profile.points.length} pts)`;
            onProfileLoaded(profile);
        } catch (err) {
            console.error("Horizon vanished:", err);
            outputs.horizonStatus.innerText = "Horizon Error";
            alert(err instanceof Error ? err.message : "Connection failed.");
        } finally {
            buttons.fetchHorizon.disabled = false;
        }
    };

}