import { SkyRenderer } from "../render/skyRenderer";
import { ScreenHeight, ScreenWidth, ScreenX, ScreenY, SkyRenderState } from "../render/types";
import { computeViewport } from "../render/viewport";
import { UI } from "./elements";

export interface LensState {
    active: boolean;
    placed: boolean;
    cursorX: ScreenX;
    cursorY: ScreenY;
    // Display size of the lens rectangle in screen pixels
    displayW: ScreenWidth;
    displayH: ScreenHeight;
    baseWorldWidth: ScreenWidth;
    baseWorldHeight: ScreenHeight;
    // Zoom factor: how many times we magnify
    zoomFactor: number;
}

const LENS_DEFAULTS = {
    displayW: 320 as ScreenWidth,
    displayH: 200 as ScreenHeight,
    zoomFactor: 3,
    sizeStep: 20,       // px per +/- keypress
    zoomStep: 0.5,      // zoom per scroll tick
    minZoom: 0.5,
    maxZoom: 100,
    minSize: 100,
    maxSize: 800,
};

export class LensController {
    private state: LensState = {
        active: false,
        placed: false,
        cursorX: 0 as ScreenX,
        cursorY: 0 as ScreenY,
        displayW: LENS_DEFAULTS.displayW,
        displayH: LENS_DEFAULTS.displayH,
        baseWorldWidth: UI.canvas.main.width as ScreenWidth,
        baseWorldHeight: UI.canvas.main.height as ScreenHeight,
        zoomFactor: LENS_DEFAULTS.zoomFactor,
    };

    private lensCanvas: HTMLCanvasElement;
    private lensCtx: CanvasRenderingContext2D;
    private skyCanvas: HTMLCanvasElement;
    private skyRenderState: SkyRenderState | null = null;
    private lensRenderer: SkyRenderer;
    // private lastLensState: LensState;

    constructor() {
        this.lensCanvas = UI.canvas.lens;
        this.lensCtx = this.lensCanvas.getContext("2d")!;
        this.skyCanvas = UI.canvas.main;
        this.lensRenderer = new SkyRenderer(this.lensCanvas);

        UI.buttons.lens.addEventListener("click", () => this.activate());
        this.skyCanvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
        this.skyCanvas.addEventListener("click", (e) => this.onMouseClick(e));
        this.skyCanvas.addEventListener("contextmenu", (e) => this.onRightClick(e));
        this.skyCanvas.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
        window.addEventListener("keydown", (e) => this.onKeyDown(e));
    }

    setRenderState(state: SkyRenderState): void {
        this.skyRenderState = state;
        if (this.state.active) {
            this.renderLens();
            this.drawLens();
        }
    }
    private activate(): void {
        this.state.active = true;
        this.state.placed = false;
        this.skyCanvas.style.cursor = "none";
        this.lensCanvas.style.display = "block";
        this.renderLens();
    }

    private deactivate(): void {
        this.state.active = false;
        this.state.placed = false;
        this.skyCanvas.style.cursor = "";
        this.lensCanvas.style.display = "none";
        this.lensCtx.clearRect(0, 0, this.lensCanvas.width, this.lensCanvas.height);
    }

    private onMouseMove(e: MouseEvent): void {
        if (!this.state.active || this.state.placed) return;

        const rect = this.skyCanvas.getBoundingClientRect();
        const targetX = e.clientX - rect.left;
        const targetY = e.clientY - rect.top;

        // alpha = 1.0 at zoom 1 (instant)
        // alpha = 0.1 at zoom 10 (very smooth)
        const baseAlpha = 1.0;
        const alpha = Math.max(0.05, baseAlpha / this.state.zoomFactor);

        this.state.cursorX = this.state.cursorX + (targetX - this.state.cursorX) * alpha as ScreenX;
        this.state.cursorY = this.state.cursorY + (targetY - this.state.cursorY) * alpha as ScreenY;

        this.positionAndRender();
    }

    private onMouseClick(e: MouseEvent): void {
        if (!this.state.active) return;
        if (this.state.placed) {
            // Second click: deactivate
            this.deactivate();
        } else {
            // First click: place/anchor the lens
            this.state.placed = true;
        }
    }

    private onRightClick(e: MouseEvent): void {
        if (!this.state.active) return;
        e.preventDefault();
        this.deactivate();
    }

    private onWheel(e: WheelEvent): void {
        if (!this.state.active) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -LENS_DEFAULTS.zoomStep : LENS_DEFAULTS.zoomStep;
        this.state.zoomFactor = Math.min(
            LENS_DEFAULTS.maxZoom,
            Math.max(LENS_DEFAULTS.minZoom, this.state.zoomFactor + delta)
        );
        this.renderLens();  // zoom changed, must re-render
        this.positionAndRender();
    }

    private onKeyDown(e: KeyboardEvent): void {
        if (!this.state.active) return;

        if (e.key === "Escape") {
            this.deactivate();
            return;
        }

        const step = LENS_DEFAULTS.sizeStep;
        if (e.key === "+" || e.key === "=") {
            this.state.displayW = Math.min(
                LENS_DEFAULTS.maxSize, this.state.displayW + step
            ) as ScreenWidth;
            this.state.displayH = Math.min(
                LENS_DEFAULTS.maxSize, this.state.displayH + step * (2 / 3)
            ) as ScreenHeight;
        } else if (e.key === "-") {
            this.state.displayW = Math.max(
                LENS_DEFAULTS.minSize, this.state.displayW - step
            ) as ScreenWidth;
            this.state.displayH = Math.max(
                LENS_DEFAULTS.minSize, this.state.displayH - step * (2 / 3)
            ) as ScreenHeight;
        }

        this.positionAndRender();
    }

    private renderLens(): void {
        if (!this.skyRenderState) return;

        const { displayW, displayH } = this.state;
        const viewport = computeViewport(this.state);

        this.lensRenderer.render(
            this.skyRenderState,
            { width: displayW, height: displayH },
            viewport
        );
    }

    private positionAndRender(): void {
        this.state.baseWorldWidth = this.skyCanvas.width as ScreenWidth;
        this.state.baseWorldHeight = this.skyCanvas.height as ScreenHeight;

        const { cursorX, cursorY, displayW, displayH } = this.state;
        const skyRect = this.skyCanvas.getBoundingClientRect();

        // Center lens on cursor, clamped to viewport
        const left = Math.min(
            Math.max(0, cursorX - displayW / 2),
            skyRect.width - displayW
        );
        const top = Math.min(
            Math.max(0, cursorY - displayH / 2),
            skyRect.height - displayH
        );

        this.lensCanvas.style.left = `${left}px`;
        this.lensCanvas.style.top = `${top}px`;
        this.lensCanvas.width = displayW;
        this.lensCanvas.height = displayH;

        this.drawLens();
    }

    // Triggered by: everything, including mousemove
    private drawLens(): void {
        if (!this.skyRenderState) return;
        const { cursorX, cursorY, displayW, displayH, zoomFactor } = this.state;
        const viewport = computeViewport(this.state);

        this.lensCanvas.width = displayW;
        this.lensCanvas.height = displayH;

        this.lensRenderer.render(
            this.skyRenderState,
            { width: displayW, height: displayH },
            viewport,
        );
        const ctx = this.lensCtx;

        // Border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, displayW - 2, displayH - 2);

        // Crosshair at center
        const cx = displayW / 2;
        const cy = displayH / 2;
        const crossSize = 10;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - crossSize, cy);
        ctx.lineTo(cx + crossSize, cy);
        ctx.moveTo(cx, cy - crossSize);
        ctx.lineTo(cx, cy + crossSize);
        ctx.stroke();

        // Zoom label
        const label = `${this.state.zoomFactor.toFixed(1)}×`;
        ctx.font = "11px monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        const padding = 6;
        const metrics = ctx.measureText(label);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(
            displayW - metrics.width - padding * 2,
            displayH - 16 - padding,
            metrics.width + padding * 2,
            16
        );
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillText(label, displayW - padding, displayH - padding);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, displayW - 2, displayH - 2);
    }
}