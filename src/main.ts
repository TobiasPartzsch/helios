import { moonEquatorialCoordinates, moonPhase } from './core/bodies/moon';
import { sunEquatorialCoordinates } from './core/bodies/sun';
import { equatorialToHorizontal } from './core/coordinates'; // Your coordinate logic
import { dateToJulianDate } from './core/time/julian';
import { localSiderealTimeHours } from './core/time/sidereal';
import './style.css';

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

function radToDeg(rad: number): number {
    return rad * (180 / Math.PI);
}

function update() {
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

    // 1. Julian Date
    const jd = dateToJulianDate(date);

    // 2. Local Sidereal Time: Convert Hours to Radians
    // (LST Hours * 15) = Degrees -> Degrees * (PI/180) = Radians
    const lstHours = localSiderealTimeHours(jd, lonDeg);
    const lstRad = lstHours * 15 * (Math.PI / 180);

    // 3. Observer Latitude: Degrees to Radians
    const latRad = latDeg * (Math.PI / 180);

    // 4. Calculate Celestial Positions
    const sunEq = sunEquatorialCoordinates(jd);
    const sunHoriz = equatorialToHorizontal(sunEq, latRad, lstRad);
    const moonEq = moonEquatorialCoordinates(jd);
    const moonHoriz = equatorialToHorizontal(moonEq, latRad, lstRad);
    const phaseInfo = moonPhase(jd);

    // 5. Update Text I/O
    outJd.innerText = jd.toFixed(5);
    outSun.innerText = `Alt: ${radToDeg(sunHoriz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(sunHoriz.azimuthRad).toFixed(2)}°`;
    outMoon.innerText = `Alt: ${radToDeg(moonHoriz.altitudeRad).toFixed(2)}°, Az: ${radToDeg(moonHoriz.azimuthRad).toFixed(2)}°`;
    outPhase.innerText = `${phaseInfo.phaseName} (${(phaseInfo.illuminatedFraction * 100).toFixed(1)}%)`;
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
