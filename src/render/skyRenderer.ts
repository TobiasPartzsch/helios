import { moonEquatorialCoordinates } from "../core/bodies/moon";
import { sunEquatorialCoordinates } from "../core/bodies/sun";
import { HorizontalCoords } from "../core/coordinates";
import { RefractionModel } from "../core/coordinates/refraction";
import { HorizonProfile } from "../core/horizon";
import { BodyConfig, BodyName } from "../ui/elements";
import {
    buildBodyTrackPath,
    drawBody,
    drawGrid,
    drawHorizon,
    getEquirectangularXY,
    strokeBodyTrack,
    TrackConfig,
} from "./skyCanvas";

const BODY_TRACKS: Partial<Record<BodyName, TrackConfig>> = {
    sun: { windowDays: 1.0, sampleIntervalDays: 1 / 144, color: "#ffa500", size: 10 },  // 10-minute steps
    moon: { windowDays: 1.05, sampleIntervalDays: 1 / 144, color: "#888", size: 8 },
    // windowDays for the planets is their solar orbit duration in days but currently unused
    // their color and size is used though
    mercury: { windowDays: 88, sampleIntervalDays: 1 / 24, color: "#b5b5b5", size: 4 },  // hourly
    venus: { windowDays: 225, sampleIntervalDays: 1 / 24, color: "#e8cda0", size: 4 },
    mars: { windowDays: 687, sampleIntervalDays: 1, color: "#c1440e", size: 4 },  // daily
    jupiter: { windowDays: 4333, sampleIntervalDays: 1, color: "#c88b3a", size: 4 },
    saturn: { windowDays: 10759, sampleIntervalDays: 1, color: "#e4d191", size: 4 },
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
    private trackCache: Map<string, Path2D> = new Map();
    private lastTrackJd: number = NaN;
    private readonly TRACK_RECOMPUTE_THRESHOLD = 1 / 24; // 1 hour
    private lastDims: { width: number; height: number } = { width: 0, height: 0 };

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

        const dimsChanged = dims.width !== this.lastDims.width || dims.height !== this.lastDims.height;
        const needsRecompute = dimsChanged || Math.abs(jd - this.lastTrackJd) > this.TRACK_RECOMPUTE_THRESHOLD;

        if (needsRecompute) {
            this.trackCache.clear();
            this.lastTrackJd = jd;
            this.lastDims = { ...dims };
        }

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
            if (!this.trackCache.has("sun")) {
                this.trackCache.set("sun", buildBodyTrackPath(
                    jd, latRad, lonDeg, dims, isSouthern,
                    sunEquatorialCoordinates, BODY_TRACKS.sun!, refractionModel
                ));
            }
            strokeBodyTrack(ctx, this.trackCache.get("sun")!, BODY_TRACKS.sun!.color);
        }

        if (bodies.moon.enabled) {
            if (!this.trackCache.has("moon")) {
                this.trackCache.set("moon", buildBodyTrackPath(
                    jd, latRad, lonDeg, dims, isSouthern,
                    moonEquatorialCoordinates, BODY_TRACKS.moon!, refractionModel
                ));
            }
            strokeBodyTrack(ctx, this.trackCache.get("moon")!, BODY_TRACKS.moon!.color);
        }

        // for (const [name] of Object.entries(planetHorizMap) as [BodyName, HorizontalCoords][]) {
        //     if (!bodies[name].enabled) continue;
        //     const track = BODY_TRACKS[name];
        //     if (!track) continue;

        //     if (!this.trackCache.has(name)) {
        //         this.trackCache.set(name, buildBodyTrackPath(
        //             jd, latRad, lonDeg, dims, isSouthern,
        //             (t) => planetEquatorialCoordinates(name, t),
        //             track, refractionModel, name
        //         ));
        //     }
        //     strokeBodyTrack(ctx, this.trackCache.get(name)!, track.color);
        // }

        // Sun
        if (sunHoriz && bodies.sun.visible) {
            const { color, size } = BODY_TRACKS.sun!;
            const pos = getEquirectangularXY(sunHoriz.azimuthRad, sunHoriz.altitudeRad, dims, isSouthern);
            drawBody(ctx, pos.x, pos.y, size, color);
        }

        // Moon
        if (moonHoriz && bodies.moon.visible) {
            const { color, size } = BODY_TRACKS.moon!;
            const pos = getEquirectangularXY(moonHoriz.azimuthRad, moonHoriz.altitudeRad, dims, isSouthern);
            drawBody(ctx, pos.x, pos.y, size, color);
        }

        // Planets
        for (const [name, horiz] of Object.entries(planetHorizMap) as [BodyName, HorizontalCoords][]) {
            if (!bodies[name].visible) continue;
            const color = BODY_TRACKS[name]?.color ?? "#ffffff";
            const size = BODY_TRACKS[name]?.size ?? 4;
            const pos = getEquirectangularXY(horiz.azimuthRad, horiz.altitudeRad, dims, isSouthern);
            drawBody(ctx, pos.x, pos.y, size, color);
        }
    }
}
