import { moonEquatorialCoordinates, moonPhase } from './core/bodies/moon';
import { sunEquatorialCoordinates } from './core/bodies/sun';
import { equatorialToHorizontal } from './core/coordinates'; // Your coordinate logic
import { fetchHorizonById, HorizonProfile } from './core/horizon';
import { degToRad, radToDeg, radToHours } from './core/math';
import { formatEoT, formatHours } from './core/time/format';
import { dateToJulianDate } from './core/time/julian';
import { julianDateToGMSTHours, localSiderealTimeHours } from './core/time/sidereal';
import { drawBody, drawBodyTrack, drawGrid, drawHorizon, drawMoonFace, getEquirectangularXY, TrackConfig } from './render/skyCanvas';
import './style.css';
import { getObserverState, UI } from './ui/elements';

// Main Canvas
const ctx = UI.canvas.main.getContext('2d')!;

// Moon Canvas
const faceCtx = UI.canvas.moonFace.getContext('2d')!;

// State for the terrain profile
let currentHorizonProfile: HorizonProfile | null = null;

function update(providedJd?: number) {
    // Destructure the parts of the UI we need for this function
    const { inputs, outputs, canvas } = UI;

    // Sync internal resolution to the CSS display size
    // This prevents "blurry" pixels on high-DPI screens
    const mainCanvas = canvas.main
    if (mainCanvas.width !== mainCanvas.clientWidth || mainCanvas.height !== mainCanvas.clientHeight) {
        mainCanvas.width = mainCanvas.clientWidth;
        mainCanvas.height = mainCanvas.clientHeight;
    }

    // Clear the previous frame
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    // Build Julian Date from input if not provided
    const state = getObserverState();
    const jd = providedJd ?? dateToJulianDate(state.date);

    // Update the UI

    // Observer Latitude: Degrees to Radians
    const latRad = degToRad(state.latDeg)

    // Calculate Celestial Positions
    const sunEq = sunEquatorialCoordinates(jd);

    // Local Sidereal Time: Convert Hours to Radians
    // (LST Hours * 15) = Degrees -> Degrees * (PI/180) = Radians
    const lstHours = localSiderealTimeHours(jd, state.lonDeg);
    const lstRad = degToRad(lstHours * 15);

    const sunHoriz = equatorialToHorizontal(sunEq, latRad, lstRad);
    const moonEq = moonEquatorialCoordinates(jd);
    const moonHoriz = equatorialToHorizontal(moonEq, latRad, lstRad);
    const phaseInfo = moonPhase(jd);



    // 2. Local Mean Time (LMT)
    // LMT = UTC Hours + (Longitude / 15)
    const utcHours = state.date.getUTCHours() + state.date.getUTCMinutes() / 60 + state.date.getUTCSeconds() / 3600;
    let lmtHours = utcHours + (state.lonDeg / 15.0);
    lmtHours = ((lmtHours % 24) + 24) % 24; // Normalize to [0, 24]

    // LST is where the Stars are. Sun RA is where the Sun is.
    // The difference (LST - RA) is the Sun's Hour Angle.
    const sunRAHours = radToHours(sunEq.rightAscensionRad);
    let eotHours = (lmtHours - 12) - (lstHours - sunRAHours);

    // Update the UI Telemetry
    outputs.lst.innerText = formatHours(lstHours);
    outputs.lmt.innerText = formatHours(lmtHours);
    outputs.eot.innerText = formatEoT(eotHours);

    // Update Text I/O
    outputs.jd.innerText = jd.toFixed(5);
    outputs.sun.innerText = `Alt: ${radToDeg(sunHoriz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(sunHoriz.azimuthRad).toFixed(2)}°`;
    outputs.moon.innerText = `Alt: ${radToDeg(moonHoriz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(moonHoriz.azimuthRad).toFixed(2)}°`;
    outputs.phase.innerText = `${phaseInfo.phaseName} (${(phaseInfo.illuminatedFraction * 100).toFixed(1)}%)`;

    // Basic Canvas Drawing
    const dims = { width: mainCanvas.width, height: mainCanvas.height };
    const isSouthern = state.latDeg < 0;

    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    drawGrid(ctx, dims, isSouthern);

    // Draw Horizon
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    // In our mapping, altitude 0 is height * 0.5 (the middle)
    ctx.moveTo(0, dims.height / 2);
    ctx.lineTo(dims.width, dims.height / 2);
    ctx.stroke();

    if (currentHorizonProfile) {
        drawHorizon(ctx, currentHorizonProfile, dims, isSouthern);
    }

    // Draw Sun Track (Orange/Yellow)
    const sunTrack: TrackConfig = { windowDays: 1.0, steps: 144, color: '#ffa500' };
    drawBodyTrack(ctx, jd, latRad, state.lonDeg, dims, isSouthern, sunEquatorialCoordinates, sunTrack);

    // Draw Moon Track (Grey/White)
    const moonTrack: TrackConfig = { windowDays: 1.05, steps: 144, color: '#888' };
    drawBodyTrack(ctx, jd, latRad, state.lonDeg, dims, isSouthern, moonEquatorialCoordinates, moonTrack);

    // Draw the Sun
    const sunPos = getEquirectangularXY(sunHoriz.azimuthRad, sunHoriz.altitudeRad, dims, isSouthern);
    drawBody(ctx, sunPos.x, sunPos.y, 10, '#ffcc00'); // Yellow Sun

    // Draw the Moon
    const moonPos = getEquirectangularXY(moonHoriz.azimuthRad, moonHoriz.altitudeRad, dims, isSouthern);
    drawBody(ctx, moonPos.x, moonPos.y, 8, '#acaa93'); // White Moon}

    drawMoonFace(faceCtx, phaseInfo.illuminatedFraction, sunHoriz, moonHoriz);

    console.log("--- Celestial Debug ---");
    console.log("UTC Date:", state.date.toUTCString());
    console.log("Julian Date:", jd.toFixed(5));

    // 1. Check the Sidereal Time (The Earth's rotation)
    const gmst = julianDateToGMSTHours(jd);
    const lst = localSiderealTimeHours(jd, state.lonDeg);
    console.log("GMST (Hours):", gmst.toFixed(4));
    console.log("Local Sidereal Time:", lst.toFixed(4));

    // 2. Check the Sun's Position in the Stars
    // At Equinox, Dec should be ~0, RA should be ~0 or ~24
    console.log("Sun RA (Hours):", (sunEq.rightAscensionRad * 12 / Math.PI).toFixed(4));
    console.log("Sun Dec (Deg):", radToDeg(sunEq.declinationRad).toFixed(4));

    // 3. Check the Horizontal Transform
    console.log("Sun Altitude (Rad):", sunHoriz.altitudeRad.toFixed(2));
    console.log("Sun Azimuth (Rad):", sunHoriz.azimuthRad.toFixed(2));
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

let isPlaying = false;
let lastTimestamp = 0;

// Initialize simTime from the current UI state
let simTime = new Date(Date.UTC(
    parseInt(UI.inputs.year.value),
    parseInt(UI.inputs.month.value) - 1,
    parseInt(UI.inputs.day.value),
    ...UI.inputs.clockTime.value.split(':').map(Number)
)).getTime();


// Start the loop (it will just wait if isPlaying is false)
requestAnimationFrame(animate);

// Listeners
UI.buttons.play.onclick = () => isPlaying = true;
UI.buttons.pause.onclick = () => isPlaying = false;
UI.inputs.simSpeed.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    UI.slider.speedVal!.innerText = val;
});

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
        currentHorizonProfile = await fetchHorizonById(horizonId);

        // 3. Update Inputs from the metadata (The "Workaround" now hidden in the profile)
        UI.inputs.lat.value = currentHorizonProfile.observer.lat.toString();
        UI.inputs.lon.value = currentHorizonProfile.observer.lon.toString();
        UI.inputs.elev.value = currentHorizonProfile.observer.elev.toString();

        UI.outputs.horizonStatus.innerText = `ID: ${currentHorizonProfile.id} (${currentHorizonProfile.points.length} pts)`;
        update(); // Trigger your main loop update

    } catch (err) {
        console.error("Horizon vanished:", err);
        outputs.horizonStatus.innerText = "Horizon Error";
        alert(err instanceof Error ? err.message : "Connection failed.");
    } finally {
        buttons.fetchHorizon.disabled = false;
    }
};
