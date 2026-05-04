import { LensState } from "../ui/lensController";
import { ScreenPoint, ScreenX, ScreenY, Viewport, VIRTUAL_WORLD_HEIGHT, VIRTUAL_WORLD_WIDTH, WorldPoint, WorldRect, WorldX, WorldY } from "./types";

export function worldToScreen(
    point: WorldPoint,
    viewport: Viewport,
): ScreenPoint {
    const x = (
        (
            (point.x - viewport.world.left) / (viewport.world.right - viewport.world.left)
        )
        *
        (viewport.screen.right - viewport.screen.left) + viewport.screen.left
    );
    const y = (
        (
            (point.y - viewport.world.top) / (viewport.world.bottom - viewport.world.top)
        )
        *
        (viewport.screen.bottom - viewport.screen.top) + viewport.screen.top
    );

    return {
        x: x as ScreenX,
        y: y as ScreenY,
    };
}

export function screenToWorld(
    point: ScreenPoint,
    viewport: Viewport,
): WorldPoint {
    const x = (
        (
            (point.x - viewport.screen.left) / (viewport.screen.right - viewport.screen.left)
        )
        *
        (viewport.world.right - viewport.world.left) + viewport.world.left
    );
    const y = (
        (
            (point.y - viewport.screen.top) / (viewport.screen.bottom - viewport.screen.top)
        )
        *
        (viewport.world.bottom - viewport.world.top) + viewport.world.top
    );

    return {
        x: x as WorldX,
        y: y as WorldY,
    };
}

export function containsWorldRect(outer: WorldRect, inner: WorldRect): boolean {
    return (
        inner.left >= outer.left &&
        inner.top >= outer.top &&
        inner.right <= outer.right &&
        inner.bottom <= outer.bottom
    );
}

export function pointInWorldRect(point: WorldPoint, rect: WorldRect): boolean {
    return (
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom
    );
}

export function expandWorldRect(rect: WorldRect, factor: number): WorldRect {
    const centerX = (rect.left + rect.right) / 2;
    const centerY = (rect.top + rect.bottom) / 2;
    const halfW = (rect.right - rect.left) * factor / 2;
    const halfH = (rect.bottom - rect.top) * factor / 2;

    return {
        left: (centerX - halfW) as WorldX,
        top: (centerY - halfH) as WorldY,
        right: (centerX + halfW) as WorldX,
        bottom: (centerY + halfH) as WorldY,
    };
}

export function mapWorldPoint(
    x: WorldX,
    y: WorldY,
    viewport?: Viewport,
): WorldPoint | ScreenPoint {
    const point = { x, y };
    return viewport ? worldToScreen(point, viewport) : point;
}

export function computeViewport(state: LensState): Viewport {
    const { cursorX, cursorY, displayW, displayH, zoomFactor } = state;

    // Convert actual display pixel based data into virtual ones
    const virtualCursorX = (cursorX / state.baseWorldWidth) * VIRTUAL_WORLD_WIDTH;
    const virtualCursorY = (cursorY / state.baseWorldHeight) * VIRTUAL_WORLD_HEIGHT;
    const virtualLensWidth = (displayW / state.baseWorldWidth) * VIRTUAL_WORLD_WIDTH;
    const viewW = virtualLensWidth / zoomFactor;
    const virtualLensHeight = (displayH / state.baseWorldHeight) * VIRTUAL_WORLD_HEIGHT;
    const viewH = virtualLensHeight / zoomFactor;

    return {
        world: {
            // These are coordinates in the 'simulation space'
            left: (virtualCursorX - viewW / 2) as WorldX,
            top: (virtualCursorY - viewH / 2) as WorldY,
            right: (virtualCursorX + viewW / 2) as WorldX,
            bottom: (virtualCursorY + viewH / 2) as WorldY,
        },
        screen: {
            // These are the physical pixels on the lens canvas
            left: 0 as ScreenX,
            top: 0 as ScreenY,
            right: 0 + displayW as ScreenX,
            bottom: 0 + displayH as ScreenY,
        },
        zoom: zoomFactor,
    };
}