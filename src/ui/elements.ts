import { SimulationState } from "../core/types";

export const BODY_NAMES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"] as const;
export type BodyName = typeof BODY_NAMES[number];
export type BodyDisplayMode = "hidden" | "shown" | "shownWithPath";
export interface BodyConfig {
    enabled: boolean;
    displayMode: BodyDisplayMode;
}

export const UI = {
    canvas: {
        main: document.getElementById("sky-canvas") as HTMLCanvasElement,
        moonFace: document.getElementById("moon-face-canvas") as HTMLCanvasElement,
        lens: document.getElementById("lens-canvas") as HTMLCanvasElement,
    },
    inputs: {
        location: {
            lat: document.getElementById("lat") as HTMLInputElement,
            lon: document.getElementById("lon") as HTMLInputElement,
            elev: document.getElementById("elevation") as HTMLInputElement,
        },
        time: {
            year: document.getElementById("year") as HTMLInputElement,
            month: document.getElementById("month") as HTMLInputElement,
            day: document.getElementById("day") as HTMLInputElement,
            clockTime: document.getElementById("clock-time") as HTMLInputElement,
        },
        settings: {
            useSymbols: document.getElementById("use-symbols") as HTMLInputElement,
            simSpeed: document.getElementById("sim-speed") as HTMLInputElement,
            timeUnit: document.getElementById("time-unit") as HTMLSelectElement,
            refraction: document.getElementById("refraction") as HTMLSelectElement,
            horizonId: document.getElementById("horizon-id") as HTMLInputElement,
        },
        route: {
            track: document.getElementById("route-track") as HTMLInputElement,
            file: document.getElementById("route-file") as HTMLInputElement,
            picker: document.getElementById("route-file-picker") as HTMLInputElement,
        },
    },
    groups: {
        observer: document.querySelector(".observer-controls") as HTMLElement,
        time: document.querySelector(".time-input-row") as HTMLElement,
        route: document.querySelector(".route-controls") as HTMLElement,
        sourceModes: document.querySelectorAll('input[name="source-mode"]') as NodeListOf<HTMLInputElement>,
    },
    buttons: {
        fetchHorizon: document.getElementById("btn-fetch-horizon") as HTMLButtonElement,
        play: document.getElementById("btn-play") as HTMLButtonElement,
        lens: document.getElementById("btn-lens") as HTMLButtonElement,
        browseRoute: document.getElementById("btn-browse-route") as HTMLButtonElement,
    },
    outputs: {
        jd: document.getElementById("out-jd") as HTMLElement,
        lst: document.getElementById("out-lst") as HTMLElement,
        lmt: document.getElementById("out-lmt") as HTMLElement,
        eot: document.getElementById("out-eot") as HTMLElement,
        sun: document.getElementById("out-sun") as HTMLElement,
        moon: document.getElementById("out-moon") as HTMLElement,
        phase: document.getElementById("out-phase") as HTMLElement,
        mercury: document.getElementById("out-mercury") as HTMLElement,
        venus: document.getElementById("out-venus") as HTMLElement,
        mars: document.getElementById("out-mars") as HTMLElement,
        jupiter: document.getElementById("out-jupiter") as HTMLElement,
        saturn: document.getElementById("out-saturn") as HTMLElement,
        uranus: document.getElementById("out-uranus") as HTMLElement,
        neptune: document.getElementById("out-neptune") as HTMLElement,
        horizonStatus: document.getElementById("horizon-status") as HTMLElement,
    },
    selects: {
        timeUnit: document.getElementById("time-unit") as HTMLSelectElement,
        refraction: document.getElementById("refraction") as HTMLSelectElement,
    },
    slider: {
        speedVal: document.getElementById("speed-val") as HTMLElement,
    },
    bodies: Object.fromEntries(
        BODY_NAMES.map((name) => [
            name,
            {
                enabled: document.getElementById(`body-${name}-enabled`) as HTMLInputElement,
                displayMode: document.getElementById(`body-${name}-display`) as HTMLSelectElement,
                label: document.getElementById(`body-${name}-label`) as HTMLElement,
            },
        ]),
    ) as Record<BodyName, { enabled: HTMLInputElement; displayMode: HTMLSelectElement, label: HTMLElement }>,
};

export function syncTimeControlsFromDate(date: Date): void {
    UI.inputs.time.year.value = date.getUTCFullYear().toString();
    UI.inputs.time.month.value = (date.getUTCMonth() + 1).toString();
    UI.inputs.time.day.value = date.getUTCDate().toString();
    UI.inputs.time.clockTime.value = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");
}

export function syncBodyControls(state: SimulationState) {
    for (const name of BODY_NAMES) {
        const config = state.bodies[name];
        const isEnabled = config.enabled;

        UI.bodies[name].enabled.checked = isEnabled;

        UI.outputs[name].hidden = !isEnabled;
        UI.bodies[name].displayMode.hidden = !isEnabled;
        UI.bodies[name].label.hidden = !isEnabled;
    }
}

// Startup check
Object.entries(UI).forEach(([group, elements]) => {
    if (typeof elements !== "object" || elements === null) return;
    Object.entries(elements).forEach(([name, el]) => {
        if (el instanceof HTMLElement || el instanceof HTMLInputElement) {
            if (!el) console.error(`UI Error: Element ${group}.${name} not found in DOM!`);
        }
    });
});
