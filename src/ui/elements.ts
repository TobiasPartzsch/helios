import { RefractionModel } from "../core/coordinates/refraction";

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
        lat: document.getElementById("lat") as HTMLInputElement,
        lon: document.getElementById("lon") as HTMLInputElement,
        elev: document.getElementById("elevation") as HTMLInputElement,
        year: document.getElementById("year") as HTMLInputElement,
        month: document.getElementById("month") as HTMLInputElement,
        day: document.getElementById("day") as HTMLInputElement,
        clockTime: document.getElementById("clock-time") as HTMLInputElement,
        horizonId: document.getElementById("horizon-id") as HTMLInputElement,
        simSpeed: document.getElementById("sim-speed") as HTMLInputElement,
        useSymbols: document.getElementById("use-symbols") as HTMLInputElement,
    },
    buttons: {
        fetchHorizon: document.getElementById("btn-fetch-horizon") as HTMLButtonElement,
        play: document.getElementById("btn-play") as HTMLButtonElement,
        lens: document.getElementById("btn-lens") as HTMLButtonElement,
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
    select: {
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

export function getObserverState() {
    return {
        latDeg: parseFloat(UI.inputs.lat.value),
        lonDeg: parseFloat(UI.inputs.lon.value),
        elevM: parseFloat(UI.inputs.elev.value),
        refractionModel: UI.select.refraction.value as RefractionModel,
        date: new Date(
            Date.UTC(
                parseInt(UI.inputs.year.value),
                parseInt(UI.inputs.month.value) - 1,
                parseInt(UI.inputs.day.value),
                ...UI.inputs.clockTime.value.split(":").map(Number),
            ),
        ),
        bodies: Object.fromEntries(
            BODY_NAMES.map((name) => [
                name,
                {
                    enabled: UI.bodies[name].enabled?.checked ?? true,
                    displayMode: UI.bodies[name].displayMode?.value as BodyDisplayMode ?? true,
                } satisfies BodyConfig,
            ]),
        ) as Record<BodyName, BodyConfig>,
        useSymbols: UI.inputs.useSymbols?.checked ?? false,
    };
}

export function syncTimeControlsFromDate(date: Date): void {
    UI.inputs.year.value = date.getUTCFullYear().toString();
    UI.inputs.month.value = (date.getUTCMonth() + 1).toString();
    UI.inputs.day.value = date.getUTCDate().toString();
    UI.inputs.clockTime.value = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");
}

export function syncBodyControls() {
    for (const name of BODY_NAMES) {
        const enabled = UI.bodies[name].enabled.checked;
        UI.outputs[name].hidden = !enabled;
        UI.bodies[name].displayMode.hidden = !enabled;
        UI.bodies[name].label.hidden = !enabled;
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
