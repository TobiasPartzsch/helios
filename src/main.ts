import { moonEquatorialCoordinates, moonPhase } from './core/bodies/moon';
import { sunEquatorialCoordinates } from './core/bodies/sun';
import { equatorialToHorizontal } from './core/coordinates';
import { HorizonProfile } from './core/horizon';
import { degToRad, radToDeg, radToHours } from './core/math';
import { formatEoT, formatHours } from './core/time/format';
import { dateToJulianDate } from './core/time/julian';
import { localSiderealTimeHours } from './core/time/sidereal';
import { MoonFaceRenderer } from './render/moonFaceRenderer';
import { SkyRenderer } from './render/skyRenderer';
import './style.css';
import { getObserverState, UI } from './ui/elements';
import { initHorizonFetch } from './ui/horizonController';

// Renderers
const skyRenderer = new SkyRenderer(UI.canvas.main);
const moonFaceRenderer = new MoonFaceRenderer(UI.canvas.moonFace);

// Simulation state
let currentHorizonProfile: HorizonProfile | null = null;
let isPlaying = false;
let lastTimestamp = 0;
let simTime = new Date(Date.UTC(
    parseInt(UI.inputs.year.value),
    parseInt(UI.inputs.month.value) - 1,
    parseInt(UI.inputs.day.value),
    ...UI.inputs.clockTime.value.split(':').map(Number)
)).getTime();

function update(providedJd?: number) {
    const { outputs } = UI;
    const state = getObserverState();
    const jd = providedJd ?? dateToJulianDate(state.date);
    const latRad = degToRad(state.latDeg);

    // Celestial positions
    const sunEq = sunEquatorialCoordinates(jd);
    const lstHours = localSiderealTimeHours(jd, state.lonDeg);
    const lstRad = degToRad(lstHours * 15);
    const sunHoriz = equatorialToHorizontal(sunEq, latRad, lstRad, state.refractionModel);
    const moonEq = moonEquatorialCoordinates(jd);
    const moonHoriz = equatorialToHorizontal(moonEq, latRad, lstRad, state.refractionModel);
    const phaseInfo = moonPhase(jd);

    // Telemetry
    const utcHours = state.date.getUTCHours()
        + state.date.getUTCMinutes() / 60
        + state.date.getUTCSeconds() / 3600;
    let lmtHours = ((utcHours + state.lonDeg / 15.0) % 24 + 24) % 24;
    const sunRAHours = radToHours(sunEq.rightAscensionRad);
    const eotHours = (lmtHours - 12) - (lstHours - sunRAHours);

    // UI outputs
    outputs.lst.innerText = formatHours(lstHours);
    outputs.lmt.innerText = formatHours(lmtHours);
    outputs.eot.innerText = formatEoT(eotHours);
    outputs.jd.innerText = jd.toFixed(5);
    outputs.sun.innerText = `Alt: ${radToDeg(sunHoriz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(sunHoriz.azimuthRad).toFixed(2)}°`;
    outputs.moon.innerText = `Alt: ${radToDeg(moonHoriz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(moonHoriz.azimuthRad).toFixed(2)}°`;
    outputs.phase.innerText = `${phaseInfo.phaseName} (${(phaseInfo.illuminatedFraction * 100).toFixed(1)}%)`;

    // Render
    skyRenderer.render({
        jd,
        latRad,
        lonDeg: state.lonDeg,
        sunHoriz,
        moonHoriz,
        horizonProfile: currentHorizonProfile,
        refractionModel: state.refractionModel,
    });

    moonFaceRenderer.render({
        illuminatedFraction: phaseInfo.illuminatedFraction,
        sunHoriz,
        moonHoriz,
    });
}

function syncUiFromDate(date: Date) {
    UI.inputs.year.value = date.getUTCFullYear().toString();
    UI.inputs.month.value = (date.getUTCMonth() + 1).toString();
    UI.inputs.day.value = date.getUTCDate().toString();

    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    UI.inputs.clockTime.value = `${hh}:${mm}:${ss}`;
}

function animate(timestamp: number) {
    if (isPlaying) {
        const dt = timestamp - lastTimestamp;
        const unit = parseFloat((UI.select.timeUnit).value);
        const multiplier = parseFloat((UI.inputs.simSpeed).value);

        UI.slider.speedVal.innerText = multiplier.toString();

        // Total speed = Unit * Multiplier (in ms per real ms)
        const totalSpeedFactor = unit * multiplier;

        // Apply our speed factor.
        simTime += dt * totalSpeedFactor;

        const date = new Date(simTime);
        const jd = dateToJulianDate(date);

        // Update the UI purely for the human's benefit
        syncUiFromDate(date);

        // Pass the precise JD into the engine
        update(jd);
    }

    lastTimestamp = timestamp;
    requestAnimationFrame(animate);
}


// Start the loop (it will just wait if isPlaying is false)
requestAnimationFrame(animate);

// 1. Initialize UI values to UTC Now
const now = new Date();
UI.inputs.year.value = now.getUTCFullYear().toString();
UI.inputs.month.value = (now.getUTCMonth() + 1).toString();
UI.inputs.day.value = now.getUTCDate().toString();
UI.inputs.clockTime.value = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;

// 2. Set the Master State (simTime)
simTime = now.getTime();

// 3. Initial Render
update(dateToJulianDate(now));

// 4. Wire up listeners to handle the "State Update"
const handleManualInput = () => {
    const d = new Date(Date.UTC(
        parseInt(UI.inputs.year.value),
        parseInt(UI.inputs.month.value) - 1,
        parseInt(UI.inputs.day.value),
        ...UI.inputs.clockTime.value.split(':').map(Number)
    ));
    simTime = d.getTime();
    update(dateToJulianDate(d));
};

initHorizonFetch((profile) => {
    currentHorizonProfile = profile;
    update();
});

// Listeners
UI.buttons.play.onclick = () => isPlaying = true;
UI.buttons.pause.onclick = () => isPlaying = false;
UI.inputs.simSpeed.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    UI.slider.speedVal!.innerText = val;
});
UI.select.refraction.addEventListener('change', handleManualInput);
