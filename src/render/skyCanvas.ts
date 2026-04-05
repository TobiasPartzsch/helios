import { equatorialToHorizontal } from "../core/coordinates/horizontal";
import { RefractionModel } from "../core/coordinates/refraction";
import { HorizonProfile } from "../core/horizon";
import { degToRad, HALF_PI, hoursToRad, PI, TWO_PI } from "../core/math";
import { localSiderealTimeHours } from "../core/time/sidereal";

export interface CanvasDimensions {
    width: number;
    height: number;
}

export interface TrackConfig {
    windowDays: number; // e.g., 1.0 for Sun, 1.05 for Moon
    sampleIntervalDays: number;
    color: string;
    size: number;
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

    const centerOffset = isSouthern ? 0 : PI;
    let shiftedAz = azimuthRad - centerOffset;

    // Normalize to [-PI, PI]
    while (shiftedAz <= -PI) shiftedAz += TWO_PI;
    while (shiftedAz > PI) shiftedAz -= TWO_PI;

    // Map [-PI, PI] to [0, width]
    // (shiftedAz / 2PI) gives [-0.5, 0.5]. 
    // Adding 0.5 gives [0, 1].
    const x = (shiftedAz / (TWO_PI) + 0.5) * width;

    // Y-axis: Altitude PI/2 (top) to -PI/2 (bottom)
    const normalizedAlt = (altitudeRad + HALF_PI) / PI;
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
    ctx.arc(x, y, radius, 0, TWO_PI);
    ctx.fillStyle = color;
    ctx.fill();
}

export function drawGrid(
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number, height: number },
    isSouthern: boolean
) {
    const { width, height } = dimensions;

    ctx.strokeStyle = '#222'; // Subtle dark grey
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.fillStyle = '#444';

    // 1. Draw Altitude Lines (Parallels)
    // Every 30 degrees from -90 to 90
    for (let altDeg = -90; altDeg <= 90; altDeg += 30) {
        const altRad = degToRad(altDeg);
        // We can reuse the Y logic from our mapping
        const y = height * (1 - (altRad + HALF_PI) / PI);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.fillText(`${altDeg}°`, 5, y - 2);
    }

    // 2. Draw Azimuth Lines (Meridians)
    for (let azDeg = 0; azDeg < 360; azDeg += 45) {
        const azRad = degToRad(azDeg);

        // Pass 0 for altitude as we only need the horizontal (X) position
        const { x } = getEquirectangularXY(azRad, 0, dimensions, isSouthern);

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        const label = getCardinalLabel(azDeg);
        if (label) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.font = "bold 12px Arial";
            // Background pill for contrast
            const metrics = ctx.measureText(label);
            const pad = 0;
            // Clamp so label never bleeds off either edge
            const halfLabel = metrics.width / 2
            const lx = Math.max(halfLabel, Math.min(width - halfLabel, x));
            const ly = height - 18;
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(lx - halfLabel - pad, ly - pad, metrics.width + pad * 2, 16);
            // Label text
            ctx.fillStyle = "#aaaaaa";
            ctx.fillText(label, lx, ly);
            ctx.restore();
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
export function buildBodyTrackPath(
    jd: number,
    latRad: number,
    lonDeg: number,
    dimensions: { width: number, height: number },
    isSouthern: boolean,
    getEqCoords: (jd: number) => { rightAscensionRad: number, declinationRad: number },
    config: TrackConfig,
    refractionModel: RefractionModel = 'none',
): Path2D {
    const { windowDays } = config;
    const steps = Math.floor(windowDays / config.sampleIntervalDays);
    const stepInDays = config.sampleIntervalDays;

    const path = new Path2D();
    let lastShiftedAz: number | null = null;

    for (let i = 0; i <= steps; i++) {
        const sampleJd = (jd - windowDays / 2) + (i * stepInDays);
        try {
            const eq = getEqCoords(sampleJd);
            const lstRad = hoursToRad(localSiderealTimeHours(sampleJd, lonDeg));
            const horiz = equatorialToHorizontal(eq, latRad, lstRad, refractionModel);

            const centerOffset = isSouthern ? 0 : PI;
            let shiftedAz = horiz.azimuthRad - centerOffset;
            while (shiftedAz <= -PI) shiftedAz += TWO_PI;
            while (shiftedAz > PI) shiftedAz -= TWO_PI;

            const isWrap = lastShiftedAz !== null &&
                ((lastShiftedAz > HALF_PI && shiftedAz < -HALF_PI) ||
                    (lastShiftedAz < -HALF_PI && shiftedAz > HALF_PI));

            lastShiftedAz = shiftedAz;

            const pos = getEquirectangularXY(horiz.azimuthRad, horiz.altitudeRad, dimensions, isSouthern);

            if (i === 0 || isWrap) {
                path.moveTo(pos.x, pos.y);
            } else {
                path.lineTo(pos.x, pos.y);
            }
        } catch (error) {
            console.log(`error at i=${i}, jd=${sampleJd.toFixed(1)}:`, error);
        }
    }

    return path;
}

export function strokeBodyTrack(ctx: CanvasRenderingContext2D, path: Path2D, color: string): void {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.stroke(path);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
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
    ctx.arc(centerX, centerY, radius, 0, TWO_PI);
    ctx.fillStyle = "#1a1a1a"; // Earthshine/Shadow color
    ctx.fill();

    // 2. Calculate the "Position Angle" of the Sun relative to the Moon
    // This determines which way the crescent "points" in our local sky
    let dAz = sunHoriz.azimuthRad - moonHoriz.azimuthRad;
    // Normalize dAz to [-PI, PI]
    while (dAz <= -PI) dAz += TWO_PI;
    while (dAz > PI) dAz -= TWO_PI;

    const dy = sunHoriz.altitudeRad - moonHoriz.altitudeRad;
    const angle = Math.atan2(dy, dAz); // Use normalized dAz

    // 3. Draw the illuminated part
    // For a simple start, we can use an ellipse overlay or a clipping path.
    // But for a true dragon's precision, we rotate the context 
    // to match the Sun's direction!
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-angle); // Rotate to point toward the Sun

    // Draw the bright half-circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, -HALF_PI, HALF_PI);

    // The "Phase" effect: an inner ellipse that grows/shrinks
    // fraction 0.5 = straight line, 1.0 = full circle, 0.0 = empty
    const innerWidth = radius * (2 * fraction - 1);
    ctx.ellipse(0, 0, Math.abs(innerWidth), radius, 0, HALF_PI, -HALF_PI, innerWidth < 0);

    ctx.fillStyle = '#acaa93';
    ctx.fill();
    ctx.restore();
}

/**
 * Draws the terrain horizon profile onto the celestial canvas.
 */
export function drawHorizon(
    ctx: CanvasRenderingContext2D,
    profile: HorizonProfile,
    dimensions: { width: number, height: number },
    isSouthern: boolean
) {
    const { points } = profile;
    if (points.length === 0) return;

    ctx.save(); // Protect the global state
    ctx.beginPath();

    // Use our design tokens (or hardcoded for now until we refactor colors)
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";

    points.forEach((pt, index) => {
        const pos = getEquirectangularXY(pt.azimuthRad, pt.altitudeRad, dimensions, isSouthern);

        if (index === 0) {
            ctx.moveTo(pos.x, pos.y);
        } else {
            // Check for wrap-around jump at the canvas edges (width/2 threshold)
            const lastPoint = points[index - 1];
            const lastPos = getEquirectangularXY(lastPoint.azimuthRad, lastPoint.altitudeRad, dimensions, isSouthern);

            if (Math.abs(pos.x - lastPos.x) > dimensions.width / 2) {
                ctx.moveTo(pos.x, pos.y);
            } else {
                ctx.lineTo(pos.x, pos.y);
            }
        }
    });

    ctx.stroke();
    ctx.restore();
}