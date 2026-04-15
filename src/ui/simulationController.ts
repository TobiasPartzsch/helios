import { UI } from "./elements";

let isPlaying = false;

export function togglePlaying() {
    setPlaying(!isPlaying);
}

export function setPlaying(next: boolean) {
    isPlaying = next;
    syncPlayButtonLabel(isPlaying);
    setManualInputEnabled(!isPlaying);
}

export function getPlaying() {
    return isPlaying;
}

export function syncPlayButtonLabel(isPlaying: boolean) {
    UI.buttons.play.textContent = isPlaying ? "⏸ Pause" : "▶ Play";
}

export function setManualInputEnabled(enabled: boolean) {
    UI.inputs.year.disabled = !enabled;
    UI.inputs.month.disabled = !enabled;
    UI.inputs.day.disabled = !enabled;
    UI.inputs.clockTime.disabled = !enabled;
}
