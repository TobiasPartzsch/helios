import { RefractionModel } from "../core/coordinates/refraction";

export const UI = {
    // Canvases
    canvas: {
        main: document.getElementById('sky-canvas') as HTMLCanvasElement,
        moonFace: document.getElementById('moon-face-canvas') as HTMLCanvasElement,
    },
    // Inputs
    inputs: {
        // location
        lat: document.getElementById('lat') as HTMLInputElement,
        lon: document.getElementById('lon') as HTMLInputElement,
        elev: document.getElementById('elevation') as HTMLInputElement,
        // time
        year: document.getElementById('year') as HTMLInputElement,
        month: document.getElementById('month') as HTMLInputElement,
        day: document.getElementById('day') as HTMLInputElement,
        clockTime: document.getElementById('clock-time') as HTMLInputElement,
        // horizon
        horizonId: document.getElementById('horizon-id') as HTMLInputElement,
        // simulation/animation
        simSpeed: document.getElementById('sim-speed') as HTMLInputElement,
    },
    // Buttons
    buttons: {
        fetchHorizon: document.getElementById('btn-fetch-horizon') as HTMLButtonElement,
        play: document.getElementById('btn-play') as HTMLButtonElement,
        pause: document.getElementById('btn-pause') as HTMLButtonElement,
    },
    // Outputs
    outputs: {
        // telemetry:
        jd: document.getElementById('out-jd') as HTMLElement,
        lst: document.getElementById('out-lst') as HTMLElement,
        lmt: document.getElementById('out-lmt') as HTMLElement,
        eot: document.getElementById('out-eot') as HTMLElement,
        sun: document.getElementById('out-sun') as HTMLElement,
        moon: document.getElementById('out-moon') as HTMLElement,
        phase: document.getElementById('out-phase') as HTMLElement,
        // horizon
        horizonStatus: document.getElementById('horizon-status') as HTMLElement,
    },
    // Selects
    select: {
        timeUnit: document.getElementById('time-unit') as HTMLSelectElement,
        refraction: document.getElementById('refraction') as HTMLSelectElement,
    },
    // Slider
    slider: {
        speedVal: document.getElementById('speed-val') as HTMLElement,
    }
};

export function getObserverState() {
    return {
        latDeg: parseFloat(UI.inputs.lat.value),
        lonDeg: parseFloat(UI.inputs.lon.value),
        elevM: parseFloat(UI.inputs.elev.value),
        refractionModel: (UI.select.refraction.value as RefractionModel),
        date: new Date(Date.UTC(
            parseInt(UI.inputs.year.value),
            parseInt(UI.inputs.month.value) - 1,
            parseInt(UI.inputs.day.value),
            ...UI.inputs.clockTime.value.split(':').map(Number)
        ))
    };
}

export function syncUiFromDate(date: Date): void {
    UI.inputs.year.value = date.getUTCFullYear().toString();
    UI.inputs.month.value = (date.getUTCMonth() + 1).toString();
    UI.inputs.day.value = date.getUTCDate().toString();
    UI.inputs.clockTime.value = [
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    ].map(n => String(n).padStart(2, '0')).join(':');
}

// startup check
Object.entries(UI).forEach(([group, elements]) => {
    Object.entries(elements).forEach(([name, el]) => {
        if (!el) console.error(`UI Error: Element ${group}.${name} not found in DOM!`);
    });
});