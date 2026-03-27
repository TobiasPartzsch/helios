import { moonEquatorialCoordinates } from "../core/bodies/moon";
import { sunEquatorialCoordinates } from "../core/bodies/sun";
import { HorizontalCoords } from "../core/coordinates";
import { RefractionModel } from "../core/coordinates/refraction";
import { HorizonProfile } from "../core/horizon";
import { BodyConfig, BodyName } from "../ui/elements";
import {
    drawBody,
    drawBodyTrack,
    drawGrid,
    drawHorizon,
    getEquirectangularXY,
    TrackConfig,
} from "./skyCanvas";

const PLANET_COLORS: Partial<Record<BodyName, string>> = {
    mercury: "#b5b5b5",
    venus: "#e8cda0",
    mars: "#c1440e",
    jupiter: "#c88b3a",
    saturn: "#e4d191",
};

interface SkyRenderState {
    jd: number;
    latRad: number;
    lonDeg: number;
    sunHoriz?: HorizontalCoords;
    moonHoriz?: HorizontalCoords;
    planetHorizMap: Partial<Record<BodyName, HorizontalCoords>>;
    bodies: Record<BodyName, BodyConfig>;
    horizonProfile: HorizonProfile | null;
    refractionModel: RefractionModel;
}

export class SkyRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d")!;
    }

    private syncResolution(): { width: number; height: number } {
        const canvas = this.ctx.canvas;
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
        return { width: canvas.width, height: canvas.height };
    }

    render({ jd, latRad, lonDeg, sunHoriz, moonHoriz, planetHorizMap, bodies, horizonProfile, refractionModel }: SkyRenderState): void {
        const dims = this.syncResolution();
        const isSouthern = latRad < 0;
        const ctx = this.ctx;
        const canvas = ctx.canvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx, dims, isSouthern);

        // Horizon line
        ctx.strokeStyle = "#333";
        ctx.beginPath();
        ctx.moveTo(0, dims.height / 2);
        ctx.lineTo(dims.width, dims.height / 2);
        ctx.stroke();

        if (horizonProfile) {
            drawHorizon(ctx, horizonProfile, dims, isSouthern);
        }

        // Tracks
        if (bodies.sun.enabled) {
            const sunTrack: TrackConfig = { windowDays: 1.0, steps: 144, color: "#ffa500" };
            drawBodyTrack(ctx, jd, latRad, lonDeg, dims, isSouthern, sunEquatorialCoordinates, sunTrack, refractionModel);
        }

        if (bodies.moon.enabled) {
            const moonTrack: TrackConfig = { windowDays: 1.05, steps: 144, color: "#888" };
            drawBodyTrack(ctx, jd, latRad, lonDeg, dims, isSouthern, moonEquatorialCoordinates, moonTrack, refractionModel);
        }

        // Sun
        if (sunHoriz && bodies.sun.visible) {
            const pos = getEquirectangularXY(sunHoriz.azimuthRad, sunHoriz.altitudeRad, dims, isSouthern);
            drawBody(ctx, pos.x, pos.y, 10, "#ffcc00");
        }

        // Moon
        if (moonHoriz && bodies.moon.visible) {
            const pos = getEquirectangularXY(moonHoriz.azimuthRad, moonHoriz.altitudeRad, dims, isSouthern);
            drawBody(ctx, pos.x, pos.y, 8, "#acaa93");
        }

        // Planets
        for (const [name, horiz] of Object.entries(planetHorizMap) as [BodyName, HorizontalCoords][]) {
            if (!bodies[name].visible) continue;
            const color = PLANET_COLORS[name] ?? "#ffffff";
            const pos = getEquirectangularXY(horiz.azimuthRad, horiz.altitudeRad, dims, isSouthern);
            drawBody(ctx, pos.x, pos.y, 4, color);
        }
    }
}