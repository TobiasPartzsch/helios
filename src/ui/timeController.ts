import { engine } from "../core/simulation/instance";
import { dateToJulianDate, getDaysSinceJ2000 } from "../core/time/julian";
import { UI } from "./elements";

export function initTimeController() {
    const handleManualTimeChange = () => {
        // Build the date from UTC components
        const year = parseInt(UI.inputs.time.year.value);
        const month = parseInt(UI.inputs.time.month.value) - 1;
        const day = parseInt(UI.inputs.time.day.value);
        const [hours, minutes, seconds] = UI.inputs.time.clockTime.value.split(":").map(Number);

        const date = new Date(Date.UTC(year, month, day, hours, minutes, seconds || 0));

        // Convert and push to engine
        const jd = dateToJulianDate(date);
        engine.updateState({ time: getDaysSinceJ2000(jd) });
    };

    const inputs = [
        UI.inputs.time.year,
        UI.inputs.time.month,
        UI.inputs.time.day,
        UI.inputs.time.clockTime
    ];

    inputs.forEach(input => {
        input.addEventListener("change", handleManualTimeChange);
    });
}

/**
 * Syncs the UTC input fields from a Date object.
 * This is called by the main loop's syncUIFromState.
 */
export function syncTimeUIFromDate(date: Date) {
    if (inputsContainFocus()) return;

    UI.inputs.time.year.value = date.getUTCFullYear().toString();
    UI.inputs.time.month.value = (date.getUTCMonth() + 1).toString();
    UI.inputs.time.day.value = date.getUTCDate().toString();

    // Format HH:mm:ss
    const h = String(date.getUTCHours()).padStart(2, "0");
    const m = String(date.getUTCMinutes()).padStart(2, "0");
    const s = String(date.getUTCSeconds()).padStart(2, "0");
    UI.inputs.time.clockTime.value = `${h}:${m}:${s}`;
}

function inputsContainFocus(): boolean {
    const active = document.activeElement;
    return (
        active === UI.inputs.time.year ||
        active === UI.inputs.time.month ||
        active === UI.inputs.time.day ||
        active === UI.inputs.time.clockTime
    );
}