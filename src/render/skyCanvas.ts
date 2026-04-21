import { Degrees, degToRad, Radians } from "../core/angles";
import { EquatorialCoords } from "../core/coordinates";
import { equatorialToHorizontal } from "../core/coordinates/transforms";
import { HorizonProfile } from "../core/horizon";
import { HALF_PI, PI, TWO_PI } from "../core/math";
import { DaysSinceJ2000, localSiderealTimeRad } from "../core/time";
import { RefractionModel } from "../core/types";
import { Viewport, WorldPoint, WorldX, WorldY } from "./types";
import { mapWorldPoint, pointInWorldRect, worldToScreen } from "./viewport";

export interface CanvasDimensions {
    width: number;
    height: number;
}

export interface TrackConfig {
    windowDays: number; // e.g., 1.0 for Sun, 1.05 for Moon
    sampleIntervalDays: number;
    color: string;
    size: number;
    symbol: string;
}

/**
 * Maps Azimuth/Altitude (radians) to Canvas X/Y coordinates
 * using an Equirectangular projection.
 */
export function getEquirectangularXY(
    azimuthRad: Radians,
    altitudeRad: Radians,
    dimensions: { width: number, height: number },
    isSouthern: boolean = false
): WorldPoint {
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
    const y = altToY(altitudeRad, height);

    return { x, y } as WorldPoint;
}

export function drawBody(
    ctx: CanvasRenderingContext2D,
    pos: WorldPoint,
    radius: number,
    color: string,
    symbol?: string,
    viewport?: Viewport,
) {
    if (viewport && !pointInWorldRect(pos, viewport.world)) return;
    const drawPos = viewport ? worldToScreen(pos, viewport) : pos;

    ctx.beginPath();
    ctx.arc(drawPos.x, drawPos.y, radius, 0, TWO_PI);
    ctx.fillStyle = color;
    ctx.fill();
}

export function drawBodySymbol(
    ctx: CanvasRenderingContext2D,
    pos: WorldPoint,
    size: number,
    color: string,
    symbol?: string,
    viewport?: Viewport,
): void {
    if (viewport && !pointInWorldRect(pos, viewport.world)) return;
    const drawPos = viewport ? worldToScreen(pos, viewport) : pos;

    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${size * 6}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol ?? "?", drawPos.x, drawPos.y);
    ctx.restore();
}

export function drawGrid(
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number, height: number },
    isSouthern: boolean,
    viewport?: Viewport,
) {
    const { width, height } = dimensions;

    ctx.strokeStyle = '#222'; // Subtle dark grey
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.fillStyle = '#444';

    // 1. Draw Altitude Lines (Parallels)
    // Every 30 degrees from -90 to 90
    ctx.beginPath();
    for (let altDeg = -90; altDeg <= 90; altDeg += 30) {
        const altRad = degToRad(altDeg);
        const worldY = altToY(altRad, height);

        const left = mapWorldPoint(0 as WorldX, worldY, viewport);
        const right = mapWorldPoint(width as WorldX, worldY, viewport);

        ctx.moveTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.fillText(`${altDeg}°`, 5, left.y - 2);
    }
    ctx.stroke();

    // 2. Draw Azimuth Lines (Meridians)
    ctx.beginPath();
    for (let azDeg = 0; azDeg < 360; azDeg += 45) {
        const azRad = degToRad(azDeg);
        const worldX = getEquirectangularXY(azRad, 0 as Radians, dimensions, isSouthern).x;

        const top = mapWorldPoint(worldX, 0 as WorldY, viewport);
        const bottom = mapWorldPoint(worldX, height as WorldY, viewport);

        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bottom.x, bottom.y);

        const label = getCardinalLabel(azDeg as Degrees);
        if (label) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.font = "bold 12px Arial";
            // Background pill for contrast
            const metrics = ctx.measureText(label);
            const pad = 0;
            // Clamp so label never bleeds off either edge
            const halfLabel = metrics.width / 2
            const lx = Math.max(halfLabel, Math.min(width - halfLabel, bottom.x));
            const ly = height - 18;
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(lx - halfLabel - pad, ly - pad, metrics.width + pad * 2, 16);
            // Label text
            ctx.fillStyle = "#aaaaaa";
            ctx.fillText(label, lx, ly);
            ctx.restore();
        }
    }
    ctx.stroke();

}

function getCardinalLabel(az: Degrees): string | null {
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
    daysSinceJ2000: DaysSinceJ2000,
    latRad: Radians,
    lonRad: Radians,
    dimensions: { width: number, height: number },
    isSouthern: boolean,
    getEqCoords: (daysSinceJ2000: DaysSinceJ2000) => EquatorialCoords,
    config: TrackConfig,
    refractionModel: RefractionModel = RefractionModel.None,
): Path2D {
    const { windowDays, sampleIntervalDays: stepInDays } = config;
    const steps = Math.floor(windowDays / stepInDays);

    const path = new Path2D();
    let lastShiftedAz: number | null = null;

    const startDays = daysSinceJ2000 - windowDays / 2;
    const fixedEq = getEqCoords(daysSinceJ2000);
    let firstPos: { x: number, y: number } | null = null;

    for (let i = 0; i <= steps; i++) {
        const isLast = i === steps;
        const sampleDays = isLast
            ? (daysSinceJ2000 + windowDays / 2) as DaysSinceJ2000
            : (startDays + (i * stepInDays)) as DaysSinceJ2000;

        const lstRad = localSiderealTimeRad(sampleDays, lonRad);
        const horiz = equatorialToHorizontal(fixedEq, latRad, lstRad, refractionModel);

        const centerOffset = isSouthern ? 0 : PI;
        let shiftedAz = horiz.azimuthRad - centerOffset;
        while (shiftedAz <= -PI) shiftedAz += TWO_PI;
        while (shiftedAz > PI) shiftedAz -= TWO_PI;

        const isWrap = lastShiftedAz !== null && Math.abs(shiftedAz - lastShiftedAz) > PI;

        lastShiftedAz = shiftedAz;

        const pos = getEquirectangularXY(horiz.azimuthRad, horiz.altitudeRad, dimensions, isSouthern);
        if (i === 0) {
            firstPos = pos;
            path.moveTo(pos.x, pos.y);
        } else if (isWrap) {
            path.moveTo(pos.x, pos.y);
        } else {
            path.lineTo(pos.x, pos.y);
        }
    }
    if (firstPos) {
        path.lineTo(firstPos.x, firstPos.y);
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
    sunHoriz: { azimuthRad: Radians, altitudeRad: Radians },
    moonHoriz: { azimuthRad: Radians, altitudeRad: Radians }
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
    isSouthern: boolean,
    viewport?: Viewport,
) {
    const { points } = profile;
    if (points.length === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";

    let lastPos: WorldPoint | null = null;

    for (const pt of points) {
        const worldPos = getEquirectangularXY(pt.azimuthRad, pt.altitudeRad, dimensions, isSouthern);
        const drawPos = viewport ? worldToScreen(worldPos, viewport) : worldPos;

        if (!lastPos) {
            ctx.moveTo(drawPos.x, drawPos.y);
        } else {
            // same wrap logic, but compare in world space
            if (Math.abs(worldPos.x - lastPos.x) > dimensions.width / 2) {
                ctx.moveTo(drawPos.x, drawPos.y);
            } else {
                ctx.lineTo(drawPos.x, drawPos.y);
            }
        }

        lastPos = worldPos;
    }

    ctx.stroke();
    ctx.restore();
}

function altToY(altRad: number, height: number): WorldY {
    return height * (1 - (altRad + HALF_PI) / PI) as WorldY;
}
