import { Radians } from "../core/angles";
import { moonEquatorialCoordinates } from "../core/bodies/moon";
import { sunEquatorialCoordinates } from "../core/bodies/sun";
import { EquatorialCoords, HorizontalCoords } from "../core/coordinates";
import { planetGeocentricEquatorialCoordinates } from "../core/orbit/propagate";
import { DaysSinceJ2000 } from "../core/time/types";
import { RefractionModel } from "../core/types";
import { BodyDisplayMode, BodyName } from "../ui/elements";
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
import { ScreenHeight, ScreenRect, ScreenWidth, ScreenX, ScreenY, SkyRenderState, Viewport, WorldPoint, WorldRect } from "./types";
import { containsWorldRect, expandWorldRect } from "./viewport";

type BodyRenderer = (
    ctx: CanvasRenderingContext2D,
    pos: WorldPoint,
    size: number,
    color: string,
    symbol?: string,
    viewport?: Viewport,
) => void;

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


export class SkyRenderer {
    private ctx: CanvasRenderingContext2D;
    private trackCacheFull: Map<string, Path2D> = new Map();
    private trackCacheLens: Map<string, Path2D> = new Map();
    private readonly TRACK_RECOMPUTE_THRESHOLD = 1 / 24; // 1 hour
    private lastDims: ScreenRect = {
        left: 0 as ScreenX,
        top: 0 as ScreenY,
        right: 0 as ScreenX,
        bottom: 0 as ScreenY,
    };
    private lastFullBucket: DaysSinceJ2000 = 0 as DaysSinceJ2000;
    private lastLensBucket: DaysSinceJ2000 = 0 as DaysSinceJ2000;
    private lastCachedWorldRect: WorldRect | null = null;
    private LENS_CACHE_MARGIN = 0.5;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d")!;
    }

    private syncResolution(): { width: ScreenWidth; height: ScreenHeight } {
        const canvas = this.ctx.canvas;
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
        return { width: canvas.width as ScreenWidth, height: canvas.height as ScreenHeight };
    }

    // static forOffscreen(width: number, height: number): { renderer: SkyRenderer; canvas: HTMLCanvasElement } {
    //     const canvas = document.createElement("canvas");
    //     canvas.width = width;
    //     canvas.height = height;
    //     return { renderer: new SkyRenderer(canvas), canvas };
    // }

    render(
        state: SkyRenderState,
        explicitDims?: { width: ScreenWidth; height: ScreenHeight },
        viewport?: Viewport,
    ): void {
        const {
            daysSinceJ2000,
            latRad, lonRad,
            sunHoriz, moonHoriz, planetHorizMap,
            bodies,
            horizonProfile,
            refractionModel,
            useSymbols } = state;
        const dims = explicitDims ?? this.syncResolution();
        const isSouthern = latRad < 0;
        const ctx = this.ctx;
        const canvas = ctx.canvas;

        const currentRect: ScreenRect = {
            left: 0 as ScreenX,
            top: 0 as ScreenY,
            right: 0 + dims.width as ScreenX,
            bottom: 0 + dims.height as ScreenY,
        };

        if (this.shouldRefreshFullCache(daysSinceJ2000, currentRect)) {
            this.trackCacheFull.clear();
            this.lastFullBucket = daysSinceJ2000;
            this.lastDims = { ...currentRect };
        }

        if (viewport && this.shouldRefreshLensCache(viewport, daysSinceJ2000, currentRect)) {
            this.trackCacheLens.clear();
            this.lastLensBucket = daysSinceJ2000;
            this.lastDims = currentRect;
            // Update the "Sliding Window" buffer
            this.lastCachedWorldRect = expandWorldRect(viewport.world, 1 + this.LENS_CACHE_MARGIN * 2);
        }

        const currentWidth = dims.width;
        const currentHeight = dims.height;

        const lastWidth = this.lastDims.right - this.lastDims.left;
        const lastHeight = this.lastDims.bottom - this.lastDims.top;

        const dimsChanged = currentWidth !== lastWidth || currentHeight !== lastHeight;

        let fullNeedsRecompute = dimsChanged;
        let lensNeedsRecompute = dimsChanged;

        const fullBucket = (Math.floor(daysSinceJ2000 * 24) / 24) as DaysSinceJ2000;
        const lensBucket = (Math.floor((daysSinceJ2000 + (0.5 / 24)) * 24) / 24) as DaysSinceJ2000;

        fullNeedsRecompute = fullNeedsRecompute || fullBucket !== this.lastFullBucket;
        lensNeedsRecompute = lensNeedsRecompute || lensBucket !== this.lastLensBucket;

        if (fullNeedsRecompute) {
            this.trackCacheFull.clear();
            this.lastFullBucket = fullBucket;
        }

        if (lensNeedsRecompute) {
            this.trackCacheLens.clear();
            this.lastLensBucket = lensBucket;
        }

        if (dimsChanged) {
            this.lastDims = {
                left: 0 as ScreenX,
                top: 0 as ScreenY,
                right: 0 + dims.width as ScreenX,
                bottom: 0 + dims.height as ScreenY
            };
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx, dims, isSouthern, viewport);

        // Horizon line
        if (!viewport) {
            ctx.strokeStyle = "#333";
            ctx.beginPath();
            ctx.moveTo(0, dims.height / 2);
            ctx.lineTo(dims.width, dims.height / 2);
            ctx.stroke();
        }

        if (horizonProfile) {
            drawHorizon(ctx, horizonProfile, dims, isSouthern, viewport);
        }

        // Tracks
        if (bodies.sun.enabled && shouldDrawPath(bodies.sun.displayMode)) {
            this.drawTrack(
                "sun", daysSinceJ2000, latRad, lonRad, dims, isSouthern,
                refractionModel, sunEquatorialCoordinates,
                ctx, viewport,
            );
        }

        if (bodies.moon.enabled && shouldDrawPath(bodies.moon.displayMode)) {
            this.drawTrack(
                "moon", daysSinceJ2000, latRad, lonRad, dims, isSouthern,
                refractionModel, moonEquatorialCoordinates,
                ctx, viewport,
            );
        }

        for (const [name] of Object.entries(planetHorizMap) as [BodyName, HorizontalCoords][]) {
            if (!bodies[name].enabled || !shouldDrawPath(bodies[name].displayMode)) continue;
            this.drawTrack(
                name, daysSinceJ2000, latRad, lonRad, dims, isSouthern, refractionModel,
                (t) => planetGeocentricEquatorialCoordinates(name, t),
                ctx, viewport,
            );
        }

        const bodyRenderer: BodyRenderer = useSymbols ? drawBodySymbol : drawBody;

        // Sun
        if (bodies["sun"].enabled && shouldDrawBody(bodies.sun.displayMode)) {
            this.drawBody("sun", dims, sunHoriz!, isSouthern, bodyRenderer, ctx, viewport)
        }

        // Moon
        if (moonHoriz && shouldDrawBody(bodies.moon.displayMode)) {
            this.drawBody("moon", dims, moonHoriz, isSouthern, bodyRenderer, ctx, viewport)
        }

        // Planets
        for (const [name, horiz] of Object.entries(planetHorizMap) as [BodyName, HorizontalCoords][]) {
            if (!bodies[name].enabled || !shouldDrawBody(bodies[name].displayMode)) continue;
            this.drawBody(name, dims, horiz, isSouthern, bodyRenderer, ctx, viewport)
        }
    }

    private drawTrack(
        name: BodyName,
        daysSinceJ2000: DaysSinceJ2000,
        latRad: Radians,
        lonRad: Radians,
        dims: { width: ScreenWidth; height: ScreenHeight },
        isSouthern: boolean,
        refractionModel: RefractionModel,
        coordFn: (daysSinceJ2000: DaysSinceJ2000) => EquatorialCoords,
        ctx: CanvasRenderingContext2D,
        viewport?: Viewport,
    ): void {

        const track = BODY_TRACKS[name];
        if (!track) return;

        const cache = viewport ? this.trackCacheLens : this.trackCacheFull;

        let path = cache.get(name);
        if (!path) {
            path = buildBodyTrackPath(
                daysSinceJ2000, latRad, lonRad, dims, isSouthern,
                coordFn, track, refractionModel, viewport,
                viewport ? this.lastCachedWorldRect ?? undefined : undefined,
            )
            cache.set(name, path);
        }
        strokeBodyTrack(ctx, path, track.color, viewport);
    }

    private drawBody(
        name: BodyName,
        dims: { width: ScreenWidth; height: ScreenHeight },
        horizontalCoords: HorizontalCoords,
        isSouthern: boolean,
        bodyRenderer: BodyRenderer,
        ctx: CanvasRenderingContext2D,
        viewport?: Viewport,
    ): void {
        const track = BODY_TRACKS[name];
        if (!track) return;

        const { color, size, symbol } = track;
        const pos = getEquirectangularXY(
            horizontalCoords.azimuthRad,
            horizontalCoords.altitudeRad,
            dims,
            isSouthern,
            !!viewport
        );
        bodyRenderer(ctx, pos, size, color, symbol, viewport);
    }

    private shouldRefreshFullCache(days: DaysSinceJ2000, currentDims: ScreenRect): boolean {
        const currentWidth = currentDims.right - currentDims.left;
        const currentHeight = currentDims.bottom - currentDims.top;

        const lastWidth = this.lastDims.right - this.lastDims.left;
        const lastHeight = this.lastDims.bottom - this.lastDims.top;

        if (currentWidth !== lastWidth || currentHeight !== lastHeight) {
            return true;
        }

        const timeDelta = Math.abs(days - this.lastFullBucket);
        if (timeDelta > this.TRACK_RECOMPUTE_THRESHOLD) return true;

        return false;
    }

    private shouldRefreshLensCache(viewport: Viewport, days: DaysSinceJ2000, currentDims: ScreenRect): boolean {
        const currentW = currentDims.right - currentDims.left;
        const currentH = currentDims.bottom - currentDims.top;
        const lastW = this.lastDims.right - this.lastDims.left;
        const lastH = this.lastDims.bottom - this.lastDims.top;

        if (currentW !== lastW || currentH !== lastH) return true;

        const timeDelta = Math.abs(days - this.lastLensBucket);
        if (timeDelta > this.TRACK_RECOMPUTE_THRESHOLD) return true;

        if (!this.lastCachedWorldRect || !containsWorldRect(this.lastCachedWorldRect, viewport.world)) {
            return true;
        }
        return false;
    }
}

const shouldDrawBody = (mode: BodyDisplayMode) => mode !== "hidden";
const shouldDrawPath = (mode: BodyDisplayMode) => mode === "shownWithPath";
