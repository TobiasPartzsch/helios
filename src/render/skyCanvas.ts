import { equatorialToHorizontal } from "../core/coordinates/horizontal";
import { localSiderealTimeHours } from "../core/time/sidereal";

export interface CanvasDimensions {
    width: number;
    height: number;
}

/**
 * Maps Azimuth/Altitude (radians) to Canvas X/Y coordinates
 * using an Equirectangular projection.
 */
export function getEquirectangularXY(
    azimuthRad: number,
    altitudeRad: number,
    dimensions: { width: number, height: number },
    isSouthern: boolean = false
): { x: number, y: number } {
    const { width, height } = dimensions;

    // To center South (180°), we shift the azimuth 
    // such that 180° becomes 0° (the new center).
    // Then we add half the width.

    const centerOffset = isSouthern ? 0 : Math.PI;
    let shiftedAz = azimuthRad - centerOffset;

    // Normalize to [-PI, PI]
    while (shiftedAz <= -Math.PI) shiftedAz += 2 * Math.PI;
    while (shiftedAz > Math.PI) shiftedAz -= 2 * Math.PI;

    // Map [-PI, PI] to [0, width]
    // (shiftedAz / 2PI) gives [-0.5, 0.5]. 
    // Adding 0.5 gives [0, 1].
    const x = (shiftedAz / (2 * Math.PI) + 0.5) * width;

    // Y-axis: Altitude PI/2 (top) to -PI/2 (bottom)
    const normalizedAlt = (altitudeRad + Math.PI / 2) / Math.PI;
    const y = height * (1 - normalizedAlt);

    return { x, y };
}

export function drawBody(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string
) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

export function drawGrid(
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number, height: number },
    isSouthern: boolean
) {
    const { width, height } = dimensions;
    const centerOffset = isSouthern ? 0 : 180; // 0 for North-center, 180 for South-center

    ctx.strokeStyle = '#222'; // Subtle dark grey
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.fillStyle = '#444';

    // 1. Draw Altitude Lines (Parallels)
    // Every 30 degrees from -90 to 90
    for (let altDeg = -90; altDeg <= 90; altDeg += 30) {
        const altRad = altDeg * (Math.PI / 180);
        // We can reuse the Y logic from our mapping
        const y = height * (1 - (altRad + Math.PI / 2) / Math.PI);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.fillText(`${altDeg}°`, 5, y - 2);
    }

    // 2. Draw Azimuth Lines (Meridians)
    for (let azDeg = 0; azDeg < 360; azDeg += 45) {
        const azRad = azDeg * (Math.PI / 180);

        // Pass 0 for altitude as we only need the horizontal (X) position
        const { x } = getEquirectangularXY(azRad, 0, dimensions, isSouthern);

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        const label = getCardinalLabel(azDeg);
        if (label) {
            // Using textAlign: 'center' prevents labels from "drifting" 
            // to the right of the line.
            ctx.textAlign = 'center';
            ctx.fillText(label, x, height - 5);
        }
    }
}

function getCardinalLabel(az: number): string | null {
    if (az === 0 || az === 360) return 'N';
    if (az === 90) return 'E';
    if (az === 180) return 'S';
    if (az === 270) return 'W';
    return null;
}

/**
 * Draws a path for a body across a 24-hour window centered on current JD.
 */
export function drawBodyTrack(
    ctx: CanvasRenderingContext2D,
    jd: number,
    latRad: number,
    lonDeg: number,
    dimensions: { width: number, height: number },
    isSouthern: boolean,
    getEqCoords: (jd: number) => { rightAscensionRad: number, declinationRad: number },
    config: TrackConfig
) {
    const { width, height } = dimensions;
    const { windowDays, steps, color } = config;

    ctx.setLineDash([4, 4]); // Dashed line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5; // Make the track slightly transparent

    ctx.beginPath();

    // Track the last point to prevent drawing lines across the screen during wrap-around
    let lastX: number | null = null;
    let lastY: number | null = null;

    // 24-hour window: -12h to +12h in 5-minute steps (288 samples)
    const stepInDays = windowDays / steps;

    for (let i = 0; i <= steps; i++) {
        const sampleJd = (jd - 0.5) + (i * stepInDays);
        const eq = getEqCoords(sampleJd);
        const lstRad = localSiderealTimeHours(sampleJd, lonDeg) * 15 * (Math.PI / 180);
        const horiz = equatorialToHorizontal(eq, latRad, lstRad);

        const pos = getEquirectangularXY(horiz.azimuthRad, horiz.altitudeRad, dimensions, isSouthern);

        // Logic for drawing or jumping
        if (lastX === null) {
            ctx.moveTo(pos.x, pos.y);
        } else {
            // If the jump in X is more than half the canvas width, it's a wrap-around!
            const dx = Math.abs(pos.x - lastX);
            if (dx > width / 2) {
                ctx.moveTo(pos.x, pos.y);
            } else {
                ctx.lineTo(pos.x, pos.y);
            }
        }

        lastX = pos.x;
        lastY = pos.y;
    }

    ctx.stroke();
    ctx.setLineDash([]); // Reset
    ctx.globalAlpha = 1.0; // Reset
}

/**
 * Draws the moon's phase on a dedicated square canvas.
 */
export function drawMoonFace(
    ctx: CanvasRenderingContext2D,
    fraction: number,
    sunHoriz: { azimuthRad: number, altitudeRad: number },
    moonHoriz: { azimuthRad: number, altitudeRad: number }
) {
    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width * 0.4;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw the "Dark Side" (Background of the disk)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a1a"; // Earthshine/Shadow color
    ctx.fill();

    // 2. Calculate the "Position Angle" of the Sun relative to the Moon
    // This determines which way the crescent "points" in our local sky
    let dAz = sunHoriz.azimuthRad - moonHoriz.azimuthRad;
    // Normalize dAz to [-PI, PI]
    while (dAz <= -Math.PI) dAz += 2 * Math.PI;
    while (dAz > Math.PI) dAz -= 2 * Math.PI;

    const dy = sunHoriz.altitudeRad - moonHoriz.altitudeRad;
    const angle = Math.atan2(dy, dAz); // Use normalized dAz
    const dx = sunHoriz.azimuthRad - moonHoriz.azimuthRad;

    // 3. Draw the illuminated part
    // For a simple start, we can use an ellipse overlay or a clipping path.
    // But for a true dragon's precision, we rotate the context 
    // to match the Sun's direction!
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-angle); // Rotate to point toward the Sun

    // Draw the bright half-circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2);

    // The "Phase" effect: an inner ellipse that grows/shrinks
    // fraction 0.5 = straight line, 1.0 = full circle, 0.0 = empty
    const innerWidth = radius * (2 * fraction - 1);
    ctx.ellipse(0, 0, Math.abs(innerWidth), radius, 0, Math.PI / 2, -Math.PI / 2, innerWidth < 0);

    ctx.fillStyle = '#acaa93';
    ctx.fill();
    ctx.restore();
}

export interface TrackConfig {
    windowDays: number; // e.g., 1.0 for Sun, 1.05 for Moon
    steps: number;      // Higher for faster bodies
    color: string;
}