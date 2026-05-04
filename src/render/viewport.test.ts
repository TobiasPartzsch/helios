import { describe, expect, it } from "vitest";
import { LensState } from "../ui/lensController";
import { VIRTUAL_WORLD_HEIGHT, VIRTUAL_WORLD_WIDTH, type ScreenHeight, type ScreenRect, type ScreenWidth, type ScreenX, type ScreenY, type WorldPoint, type WorldRect } from "./types";
import { computeViewport, pointInWorldRect, screenToWorld, worldToScreen } from "./viewport";

const worldRect: WorldRect = {
    left: 0 as any,
    top: 0 as any,
    right: 100 as any,
    bottom: 100 as any,
};

const screenRect: ScreenRect = {
    left: 0 as any,
    top: 0 as any,
    right: 200 as any,
    bottom: 200 as any,
};

const viewport = {
    world: worldRect,
    screen: screenRect,
    zoom: 2,
};

describe("viewport transforms", () => {
    it("maps world center to screen center", () => {
        const world: WorldPoint = { x: 50 as any, y: 50 as any };

        const screen = worldToScreen(world, viewport);

        expect(screen.x).toBe(100);
        expect(screen.y).toBe(100);
    });

    it("maps world corners to screen corners", () => {
        const topLeft: WorldPoint = { x: 0 as any, y: 0 as any };
        const bottomRight: WorldPoint = { x: 100 as any, y: 100 as any };

        expect(worldToScreen(topLeft, viewport)).toEqual({ x: 0, y: 0 });
        expect(worldToScreen(bottomRight, viewport)).toEqual({ x: 200, y: 200 });
    });

    it("round-trips world -> screen -> world", () => {
        const world: WorldPoint = { x: 25 as any, y: 75 as any };

        const screen = worldToScreen(world, viewport);
        const roundTrip = screenToWorld(screen, viewport);

        expect(roundTrip.x).toBeCloseTo(25);
        expect(roundTrip.y).toBeCloseTo(75);
    });

    it("detects whether a world point is inside the world rect", () => {
        expect(pointInWorldRect({ x: 50 as any, y: 50 as any }, worldRect)).toBe(true);
        expect(pointInWorldRect({ x: -1 as any, y: 50 as any }, worldRect)).toBe(false);
        expect(pointInWorldRect({ x: 50 as any, y: 101 as any }, worldRect)).toBe(false);
    });
});

it("spreads points farther apart when the world rect is smaller", () => {
    const wideViewport = {
        world: {
            left: 0 as any,
            top: 0 as any,
            right: 200 as any,
            bottom: 200 as any,
        },
        screen: screenRect,
        zoom: 1,
    };

    const tightViewport = {
        world: {
            left: 50 as any,
            top: 50 as any,
            right: 150 as any,
            bottom: 150 as any,
        },
        screen: screenRect,
        zoom: 2,
    };

    const pointA: WorldPoint = { x: 100 as any, y: 100 as any };
    const pointB: WorldPoint = { x: 120 as any, y: 120 as any };

    const wideA = worldToScreen(pointA, wideViewport);
    const wideB = worldToScreen(pointB, wideViewport);

    const tightA = worldToScreen(pointA, tightViewport);
    const tightB = worldToScreen(pointB, tightViewport);

    const wideDistance = Math.abs(Number(wideB.x) - Number(wideA.x));
    const tightDistance = Math.abs(Number(tightB.x) - Number(tightA.x));

    expect(tightDistance).toBeGreaterThan(wideDistance);
});

describe("computeViewportFromLensState", () => {
    it("centers the world rect on the cursor", () => {
        const state: LensState = {
            active: true,
            placed: false,
            cursorX: 100 as ScreenX,
            cursorY: 80 as ScreenY,
            displayW: 200 as ScreenWidth,
            displayH: 100 as ScreenHeight,
            baseWorldWidth: VIRTUAL_WORLD_WIDTH,
            baseWorldHeight: VIRTUAL_WORLD_HEIGHT,
            zoomFactor: 2,
        };

        const viewport = computeViewport(state);

        const centerX = (Number(viewport.world.left) + Number(viewport.world.right)) / 2;
        const centerY = (Number(viewport.world.top) + Number(viewport.world.bottom)) / 2;

        expect(centerX).toBeCloseTo(100);
        expect(centerY).toBeCloseTo(80);
    });

    it("shrinks the world rect when zoom increases", () => {
        const base: LensState = {
            active: true,
            placed: false,
            cursorX: 100 as ScreenX,
            cursorY: 80 as ScreenY,
            displayW: 200 as ScreenWidth,
            displayH: 100 as ScreenHeight,
            baseWorldWidth: VIRTUAL_WORLD_WIDTH,
            baseWorldHeight: VIRTUAL_WORLD_HEIGHT,
            zoomFactor: 1,
        };

        const zoomed: LensState = {
            active: true,
            placed: false,
            cursorX: 100 as ScreenX,
            cursorY: 80 as ScreenY,
            displayW: 200 as ScreenWidth,
            displayH: 100 as ScreenHeight,
            baseWorldWidth: VIRTUAL_WORLD_WIDTH,
            baseWorldHeight: VIRTUAL_WORLD_HEIGHT,
            zoomFactor: 2,
        };

        const viewportBase = computeViewport(base);
        const viewportZoomed = computeViewport(zoomed);

        const baseWidth = Number(viewportBase.world.right) - Number(viewportBase.world.left);
        const zoomWidth = Number(viewportZoomed.world.right) - Number(viewportZoomed.world.left);

        expect(zoomWidth).toBeCloseTo(baseWidth / 2);
        expect(Number(viewportZoomed.world.left)).toBeCloseTo(50);
        expect(Number(viewportZoomed.world.right)).toBeCloseTo(150);
    });
});