import { moonEquatorialCoordinates, moonPhase } from './core/bodies/moon';
import { sunEquatorialCoordinates } from './core/bodies/sun';
import { equatorialToHorizontal } from './core/coordinates'; // Your coordinate logic
import { dateToJulianDate } from './core/time/julian';
import { localSiderealTimeHours } from './core/time/sidereal';
import { drawBody, drawBodyTrack, drawGrid, drawMoonFace, getEquirectangularXY, TrackConfig } from './render/skyCanvas';
import './style.css';

// Main Canvas
const canvas = document.getElementById('sky-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Selectors
const latInput = document.getElementById('lat') as HTMLInputElement;
const lonInput = document.getElementById('lon') as HTMLInputElement;
const yearInput = document.getElementById('year') as HTMLInputElement;
const monthInput = document.getElementById('month') as HTMLInputElement;
const dayInput = document.getElementById('day') as HTMLInputElement;
const clockTimeInput = document.getElementById('clock-time') as HTMLInputElement;

const outJd = document.getElementById('out-jd')!;
const outSun = document.getElementById('out-sun')!;
const outMoon = document.getElementById('out-moon')!;
const outPhase = document.getElementById('out-phase')!;

// Moon Canvas
const moonFaceCanvas = document.getElementById('moon-face-canvas') as HTMLCanvasElement;
const faceCtx = moonFaceCanvas.getContext('2d')!;


function radToDeg(rad: number): number {
    return rad * (180 / Math.PI);
}

function update() {
    // Sync internal resolution to the CSS display size
    // This prevents "blurry" pixels on high-DPI screens
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    // Clear the previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Build date from input
    const latDeg = parseFloat(latInput.value);
    const lonDeg = parseFloat(lonInput.value);
    const date = new Date(Date.UTC(
        parseInt(yearInput.value),
        parseInt(monthInput.value) - 1, // Months still 0-indexed
        parseInt(dayInput.value),
        ...clockTimeInput.value.split(':').map(Number)
    ));

    // Manual format: YYYY.MM.DD HH:mm:ss
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');

    const customFormat = `${y}.${m}.${d} ${hh}:${mm}:${ss}`;

    // Update the UI
    document.getElementById('out-iso')!.innerText = customFormat;

    // Julian Date
    const jd = dateToJulianDate(date);

    // Local Sidereal Time: Convert Hours to Radians
    // (LST Hours * 15) = Degrees -> Degrees * (PI/180) = Radians
    const lstHours = localSiderealTimeHours(jd, lonDeg);
    const lstRad = lstHours * 15 * (Math.PI / 180);

    // Observer Latitude: Degrees to Radians
    const latRad = latDeg * (Math.PI / 180);

    // Calculate Celestial Positions
    const sunEq = sunEquatorialCoordinates(jd);
    const sunHoriz = equatorialToHorizontal(sunEq, latRad, lstRad);
    const moonEq = moonEquatorialCoordinates(jd);
    const moonHoriz = equatorialToHorizontal(moonEq, latRad, lstRad);
    const phaseInfo = moonPhase(jd);

    // Update Text I/O
    outJd.innerText = jd.toFixed(5);
    outSun.innerText = `Alt: ${radToDeg(sunHoriz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(sunHoriz.azimuthRad).toFixed(2)}°`;
    outMoon.innerText = `Alt: ${radToDeg(moonHoriz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(moonHoriz.azimuthRad).toFixed(2)}°`;
    outPhase.innerText = `${phaseInfo.phaseName} (${(phaseInfo.illuminatedFraction * 100).toFixed(1)}%)`;

    // Basic Canvas Drawing
    const dims = { width: canvas.width, height: canvas.height };
    const isSouthern = latDeg < 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx, dims, isSouthern);

    // Draw Horizon
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    // In our mapping, altitude 0 is height * 0.5 (the middle)
    ctx.moveTo(0, dims.height / 2);
    ctx.lineTo(dims.width, dims.height / 2);
    ctx.stroke();

    // Draw Sun Track (Orange/Yellow)
    const sunTrack: TrackConfig = { windowDays: 1.0, steps: 144, color: '#ffa500' };
    drawBodyTrack(ctx, jd, latRad, lonDeg, dims, isSouthern, sunEquatorialCoordinates, sunTrack);

    // Draw Moon Track (Grey/White)
    const moonTrack: TrackConfig = { windowDays: 1.05, steps: 144, color: '#888' };
    drawBodyTrack(ctx, jd, latRad, lonDeg, dims, isSouthern, moonEquatorialCoordinates, moonTrack);

    // Draw the Sun
    const sunPos = getEquirectangularXY(sunHoriz.azimuthRad, sunHoriz.altitudeRad, dims, isSouthern);
    drawBody(ctx, sunPos.x, sunPos.y, 10, '#ffcc00'); // Yellow Sun

    // Draw the Moon
    const moonPos = getEquirectangularXY(moonHoriz.azimuthRad, moonHoriz.altitudeRad, dims, isSouthern);
    drawBody(ctx, moonPos.x, moonPos.y, 8, '#acaa93'); // White Moon}

    drawMoonFace(faceCtx, phaseInfo.illuminatedFraction, sunHoriz, moonHoriz);
}

// Event Listeners
[latInput, lonInput, yearInput, monthInput, dayInput, clockTimeInput].forEach(el => {
    el?.addEventListener('input', update);
});
// Set initial time and run
const now = new Date();
yearInput.value = now.getFullYear().toString();
monthInput.value = (now.getMonth() + 1).toString();
dayInput.value = now.getDate().toString();
clockTimeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

update();

function syncUiFromDate(date: Date) {
    yearInput.value = date.getUTCFullYear().toString();
    monthInput.value = (date.getUTCMonth() + 1).toString();
    dayInput.value = date.getUTCDate().toString();

    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    clockTimeInput.value = `${hh}:${mm}:${ss}`;
}

let isPlaying = false;
let lastTimestamp = 0;

// Initialize simTime from the current UI state
let simTime = new Date(Date.UTC(
    parseInt(yearInput.value),
    parseInt(monthInput.value) - 1,
    parseInt(dayInput.value),
    ...clockTimeInput.value.split(':').map(Number)
)).getTime();

function animate(timestamp: number) {
    if (isPlaying) {
        const dt = timestamp - lastTimestamp;
        const speed = parseFloat((document.getElementById('sim-speed') as HTMLInputElement).value);

        const unit = parseFloat((document.getElementById('time-unit') as HTMLSelectElement).value);
        const multiplier = parseFloat((document.getElementById('sim-speed') as HTMLInputElement).value);

        document.getElementById('speed-val')!.innerText = speed.toString();

        // Total speed = Unit * Multiplier (in ms per real ms)
        const totalSpeedFactor = unit * multiplier;

        // Since dt is in seconds, we multiply by 1000 to get ms, 
        // then apply our speed factor.
        simTime += (dt * 1000) * totalSpeedFactor;

        const date = new Date(simTime);
        syncUiFromDate(date);
        update();
    }

    lastTimestamp = timestamp;
    requestAnimationFrame(animate);
}

// Start the loop (it will just wait if isPlaying is false)
requestAnimationFrame(animate);

// Listeners
document.getElementById('btn-play')!.onclick = () => isPlaying = true;
document.getElementById('btn-pause')!.onclick = () => isPlaying = false;
document.getElementById('sim-speed')!.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    document.getElementById('speed-val')!.innerText = val;
});

// Ensure manual inputs still work and update our internal simTime
[latInput, lonInput, yearInput, monthInput, dayInput, clockTimeInput].forEach(el => {
    el?.addEventListener('input', () => {
        // If the user types, update the internal state
        const newDate = new Date(Date.UTC(
            parseInt(yearInput.value),
            parseInt(monthInput.value) - 1,
            parseInt(dayInput.value),
            ...clockTimeInput.value.split(':').map(Number)
        ));
        simTime = newDate.getTime();
        update();
    });
});