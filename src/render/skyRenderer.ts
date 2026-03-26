import { moonEquatorialCoordinates } from "../core/bodies/moon";
import { sunEquatorialCoordinates } from "../core/bodies/sun";
import { HorizontalCoords } from "../core/coordinates";
import { HorizonProfile } from "../core/horizon";
import { drawBody, drawBodyTrack, drawGrid, drawHorizon, getEquirectangularXY, TrackConfig } from "./skyCanvas";

interface SkyRenderState {
    jd: number;
    latRad: number;
    lonDeg: number;
    sunHoriz: HorizontalCoords;
    moonHoriz: HorizontalCoords;
    horizonProfile: HorizonProfile | null;
}

export class SkyRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
    }

    private syncResolution(): { width: number, height: number } {
        const canvas = this.ctx.canvas;
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
        return { width: canvas.width, height: canvas.height };
    }

    render({ jd, latRad, lonDeg, sunHoriz, moonHoriz, horizonProfile }: SkyRenderState): void {
        const dims = this.syncResolution();
        const isSouthern = latRad < 0;
        const ctx = this.ctx;
        const canvas = ctx.canvas

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawGrid(ctx, dims, isSouthern);

        // Draw Horizon
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        // In our mapping, altitude 0 is height * 0.5 (the middle)
        ctx.moveTo(0, dims.height / 2);
        ctx.lineTo(dims.width, dims.height / 2);
        ctx.stroke();

        if (horizonProfile) {
            drawHorizon(this.ctx, horizonProfile, dims, isSouthern);
        }

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

    }
}