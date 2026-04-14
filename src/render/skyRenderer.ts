import { moonEquatorialCoordinates } from "../core/bodies/moon";
import { sunEquatorialCoordinates } from "../core/bodies/sun";
import { EquatorialCoords, HorizontalCoords } from "../core/coordinates";
import { RefractionModel } from "../core/coordinates/refraction";
import { HorizonProfile } from "../core/horizon";
import { planetGeocentricEquatorialCoordinates } from "../core/orbit/propagate";
import { DaysSinceJ2000 } from "../core/time";
import { BodyConfig, BodyDisplayMode, BodyName } from "../ui/elements";
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

type BodyRenderer = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, symbol?: string) => void;

const BODY_TRACKS: Partial<Record<BodyName, TrackConfig>> = {
    sun: { windowDays: 1.0, sampleIntervalDays: 1 / 144, color: "#ffa500", size: 10, symbol: "☉" },  // 10-minute steps
    moon: { windowDays: 1.0, sampleIntervalDays: 1 / 144, color: "#888", size: 8, symbol: "☽" },
    mercury: { windowDays: 1, sampleIntervalDays: 1 / 72, color: "#b5b5b5", size: 4, symbol: "☿" },  // orbit 88
    venus: { windowDays: 1, sampleIntervalDays: 1 / 72, color: "#e8cda0", size: 4, symbol: "♀" },  // orbit 225
    mars: { windowDays: 1, sampleIntervalDays: 1 / 72, color: "#c1440e", size: 4, symbol: "♂" },  // orbit 687
    jupiter: { windowDays: 1, sampleIntervalDays: 1 / 72, color: "#c88b3a", size: 4, symbol: "♃" },  // orbit 4333
    saturn: { windowDays: 1, sampleIntervalDays: 1 / 72, color: "#e4d191", size: 4, symbol: "♄" },  // orbit 10759
    uranus: { windowDays: 1, sampleIntervalDays: 1 / 72, color: "#7de8e8", size: 4, symbol: "⛢" },  // orbit 30687
    neptune: { windowDays: 1, sampleIntervalDays: 1 / 72, color: "#5b7fdb", size: 4, symbol: "♆" },  // orbit 60190
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
        if (bodies.sun.enabled && shouldDrawPath(bodies.sun.displayMode)) {
            this.drawTrack("sun", daysSinceJ2000, latRad, lonRad, dims, isSouthern, refractionModel, sunEquatorialCoordinates, ctx);
        }

        if (bodies.moon.enabled && shouldDrawPath(bodies.moon.displayMode)) {
            this.drawTrack("moon", daysSinceJ2000, latRad, lonRad, dims, isSouthern, refractionModel, moonEquatorialCoordinates, ctx);
        }

        for (const [name] of Object.entries(planetHorizMap) as [BodyName, HorizontalCoords][]) {
            if (!bodies[name].enabled || !shouldDrawPath(bodies[name].displayMode)) continue;
            this.drawTrack(
                name, daysSinceJ2000, latRad, lonRad, dims, isSouthern, refractionModel,
                (t) => planetGeocentricEquatorialCoordinates(name, daysSinceJ2000), ctx
            );
        }

        const bodyRenderer: BodyRenderer = useSymbols ? drawBodySymbol : drawBody;

        // Sun
        if (sunHoriz && shouldDrawBody(bodies.sun.displayMode)) {
            this.drawBody("sun", dims, sunHoriz, isSouthern, bodyRenderer, ctx)
        }

        // Moon
        if (moonHoriz && shouldDrawBody(bodies.moon.displayMode)) {
            this.drawBody("moon", dims, moonHoriz, isSouthern, bodyRenderer, ctx)
        }

        // Planets
        for (const [name, horiz] of Object.entries(planetHorizMap) as [BodyName, HorizontalCoords][]) {
            if (!bodies[name].enabled || !shouldDrawBody(bodies[name].displayMode)) continue;
            this.drawBody(name, dims, horiz, isSouthern, bodyRenderer, ctx)
        }
    }

    private drawTrack(
        name: BodyName,
        daysSinceJ2000: DaysSinceJ2000,
        latRad: number,
        lonRad: number,
        dims: { width: number; height: number },
        isSouthern: boolean,
        refractionModel: RefractionModel,
        coordFn: (daysSinceJ2000: DaysSinceJ2000) => EquatorialCoords,
        ctx: CanvasRenderingContext2D,
    ): void {
        const track = BODY_TRACKS[name];
        if (!track) return;

        if (!this.trackCache.has(name)) {
            this.trackCache.set(name, buildBodyTrackPath(
                daysSinceJ2000, latRad, lonRad, dims, isSouthern,
                coordFn, track, refractionModel
            ));
            console.log("built track", name, this.trackCache.get(name));
        }

        strokeBodyTrack(ctx, this.trackCache.get(name)!, track.color);
    }

    private drawBody(
        name: BodyName,
        dims: { width: number; height: number },
        horizontalCoords: HorizontalCoords,
        isSouthern: boolean,
        bodyRenderer: BodyRenderer,
        ctx: CanvasRenderingContext2D,
    ): void {
        const track = BODY_TRACKS[name];
        if (!track) return;

        const { color, size, symbol } = track;
        const pos = getEquirectangularXY(horizontalCoords.azimuthRad, horizontalCoords.altitudeRad, dims, isSouthern);
        bodyRenderer(ctx, pos.x, pos.y, size, color, symbol);
    }
}

const shouldDrawBody = (mode: BodyDisplayMode) => mode !== "hidden";
const shouldDrawPath = (mode: BodyDisplayMode) => mode === "shownWithPath";
