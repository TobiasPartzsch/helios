import { moonEquatorialCoordinates } from "../core/bodies/moon";
import { sunEquatorialCoordinates } from "../core/bodies/sun";
import { HorizontalCoords } from "../core/coordinates";
import { RefractionModel } from "../core/coordinates/refraction";
import { HorizonProfile } from "../core/horizon";
import { DaysSinceJ2000 } from "../core/time";
import { BodyConfig, BodyName } from "../ui/elements";
import {
    buildBodyTrackPath,
    drawBody,
    drawBodySymbol,
    drawGrid,
    drawHorizon,
    getEquirectangularXY,
    strokeBodyTrack,
    TrackConfig,
} from "./skyCanvas";

const BODY_TRACKS: Partial<Record<BodyName, TrackConfig>> = {
    sun: { windowDays: 1.0, sampleIntervalDays: 1 / 144, color: "#ffa500", size: 10, symbol: "☉" },  // 10-minute steps
    moon: { windowDays: 1.05, sampleIntervalDays: 1 / 144, color: "#888", size: 8, symbol: "☽" },
    // windowDays for the planets is their solar orbit duration in days but currently unused
    // their color and size is used though
    mercury: { windowDays: 88, sampleIntervalDays: 1 / 24, color: "#b5b5b5", size: 4, symbol: "☿" },  // hourly
    venus: { windowDays: 225, sampleIntervalDays: 1 / 24, color: "#e8cda0", size: 4, symbol: "♀" },
    mars: { windowDays: 687, sampleIntervalDays: 1, color: "#c1440e", size: 4, symbol: "♂" },  // daily
    jupiter: { windowDays: 4333, sampleIntervalDays: 1, color: "#c88b3a", size: 4, symbol: "♃" },
    saturn: { windowDays: 10759, sampleIntervalDays: 1, color: "#e4d191", size: 4, symbol: "♄" },
    uranus: { windowDays: 30687, sampleIntervalDays: 1, color: "#7de8e8", size: 4, symbol: "⛢" },
    neptune: { windowDays: 60190, sampleIntervalDays: 1, color: "#5b7fdb", size: 4, symbol: "♆" },
};



export interface SkyRenderState {
    daysSinceJ2000: DaysSinceJ2000;
    latRad: number;
    lonRad: number;
    sunHoriz?: HorizontalCoords;
    moonHoriz?: HorizontalCoords;
    planetHorizMap: Partial<Record<BodyName, HorizontalCoords>>;
    bodies: Record<BodyName, BodyConfig>;
    horizonProfile: HorizonProfile | null;
    refractionModel: RefractionModel;
    useSymbols: boolean;
}

export class SkyRenderer {
    private ctx: CanvasRenderingContext2D;
    private trackCache: Map<string, Path2D> = new Map();
    private lastTrackDays: number = NaN;
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

    static forOffscreen(width: number, height: number): { renderer: SkyRenderer; canvas: HTMLCanvasElement } {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return { renderer: new SkyRenderer(canvas), canvas };
    }

    render(
        {
            daysSinceJ2000,
            latRad, lonRad,
            sunHoriz, moonHoriz, planetHorizMap,
            bodies,
            horizonProfile,
            refractionModel,
            useSymbols }: SkyRenderState,
        explicitDims?: { width: number; height: number },
    ): void {
        const dims = explicitDims ?? this.syncResolution();
        const isSouthern = latRad < 0;
        const ctx = this.ctx;
        const canvas = ctx.canvas;

        const dimsChanged = dims.width !== this.lastDims.width || dims.height !== this.lastDims.height;
        const needsRecompute = dimsChanged || Math.abs(daysSinceJ2000 - this.lastTrackDays) > this.TRACK_RECOMPUTE_THRESHOLD;

        if (needsRecompute) {
            this.trackCache.clear();
            this.lastTrackDays = daysSinceJ2000;
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
        if (bodies.sun.enabled && bodies.sun.visible) {
            if (!this.trackCache.has("sun")) {
                this.trackCache.set("sun", buildBodyTrackPath(
                    daysSinceJ2000, latRad, lonRad, dims, isSouthern,
                    sunEquatorialCoordinates, BODY_TRACKS.sun!, refractionModel
                ));
            }
            strokeBodyTrack(ctx, this.trackCache.get("sun")!, BODY_TRACKS.sun!.color);
        }

        if (bodies.moon.enabled && bodies.moon.visible) {
            if (!this.trackCache.has("moon")) {
                this.trackCache.set("moon", buildBodyTrackPath(
                    daysSinceJ2000, latRad, lonRad, dims, isSouthern,
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

        type BodyRenderer = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, symbol?: string) => void;

        const bodyRenderer: BodyRenderer = useSymbols ? drawBodySymbol : drawBody;

        // Sun
        if (sunHoriz && bodies.sun.visible) {
            const { color, size, symbol } = BODY_TRACKS.sun!;
            const pos = getEquirectangularXY(sunHoriz.azimuthRad, sunHoriz.altitudeRad, dims, isSouthern);
            bodyRenderer(ctx, pos.x, pos.y, size, color, symbol);
        }

        // Moon
        if (moonHoriz && bodies.moon.visible) {
            const { color, size, symbol } = BODY_TRACKS.moon!;
            const pos = getEquirectangularXY(moonHoriz.azimuthRad, moonHoriz.altitudeRad, dims, isSouthern);
            bodyRenderer(ctx, pos.x, pos.y, size, color, symbol);
        }

        // Planets
        for (const [name, horiz] of Object.entries(planetHorizMap) as [BodyName, HorizontalCoords][]) {
            if (!bodies[name].visible) continue;
            const color = BODY_TRACKS[name]?.color ?? "#ffffff";
            const size = BODY_TRACKS[name]?.size ?? 4;
            const symbol = BODY_TRACKS[name]?.symbol ?? "?"
            const pos = getEquirectangularXY(horiz.azimuthRad, horiz.altitudeRad, dims, isSouthern);
            bodyRenderer(ctx, pos.x, pos.y, size, color, symbol);
        }
    }
}
