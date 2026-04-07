import { SkyRenderState, SkyRenderer } from "../render/skyRenderer";
import { UI } from "./elements";

interface LensState {
    active: boolean;
    placed: boolean;
    cursorX: number;
    cursorY: number;
    // Display size of the lens rectangle in screen pixels
    displayW: number;
    displayH: number;
    // Zoom factor: how many times we magnify
    zoomFactor: number;
}

const LENS_DEFAULTS = {
    displayW: 320,
    displayH: 200,
    zoomFactor: 3,
    sizeStep: 20,       // px per +/- keypress
    zoomStep: 0.5,      // zoom per scroll tick
    minZoom: 0.5,
    maxZoom: 10,
    minSize: 100,
    maxSize: 800,
};

export class LensController {
    private state: LensState = {
        active: false,
        placed: false,
        cursorX: 0,
        cursorY: 0,
        displayW: LENS_DEFAULTS.displayW,
        displayH: LENS_DEFAULTS.displayH,
        zoomFactor: LENS_DEFAULTS.zoomFactor,
    };

    private lensCanvas: HTMLCanvasElement;
    private lensCtx: CanvasRenderingContext2D;
    private skyCanvas: HTMLCanvasElement;
    private lastRenderState: SkyRenderState | null = null;
    private offscreenRenderer: SkyRenderer | null = null;
    private offscreenCanvas: HTMLCanvasElement | null = null;

    constructor() {
        this.lensCanvas = UI.canvas.lens;
        this.lensCtx = this.lensCanvas.getContext("2d")!;
        this.skyCanvas = UI.canvas.main;

        UI.buttons.lens.addEventListener("click", () => this.activate());
        this.skyCanvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
        this.skyCanvas.addEventListener("click", (e) => this.onMouseClick(e));
        this.skyCanvas.addEventListener("contextmenu", (e) => this.onRightClick(e));
        this.skyCanvas.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
        window.addEventListener("keydown", (e) => this.onKeyDown(e));
    }

    setRenderState(state: SkyRenderState): void {
        this.lastRenderState = state;
        if (this.state.active) {
            this.renderOffscreen();  // re-render offscreen
            this.drawLens();         // update display
        }
    }
    private activate(): void {
        this.state.active = true;
        this.state.placed = false;
        this.skyCanvas.style.cursor = "none";
        this.lensCanvas.style.display = "block";
        this.renderOffscreen();
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
        this.state.cursorX = e.clientX - rect.left;
        this.state.cursorY = e.clientY - rect.top;
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
        this.renderOffscreen();  // zoom changed, must re-render
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
            this.state.displayW = Math.min(LENS_DEFAULTS.maxSize, this.state.displayW + step);
            this.state.displayH = Math.min(LENS_DEFAULTS.maxSize, this.state.displayH + step * (2 / 3));
        } else if (e.key === "-") {
            this.state.displayW = Math.max(LENS_DEFAULTS.minSize, this.state.displayW - step);
            this.state.displayH = Math.max(LENS_DEFAULTS.minSize, this.state.displayH - step * (2 / 3));
        }

        this.positionAndRender();
    }

    private positionAndRender(): void {
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

    // Triggered by: state change or zoom change
    private renderOffscreen(): void {
        if (!this.lastRenderState) return;
        const realW = this.skyCanvas.width;
        const realH = this.skyCanvas.height;
        const offW = Math.round(realW * this.state.zoomFactor);
        const offH = Math.round(realH * this.state.zoomFactor);

        if (!this.offscreenCanvas || this.offscreenCanvas.width !== offW || this.offscreenCanvas.height !== offH) {
            const { renderer, canvas } = SkyRenderer.forOffscreen(offW, offH);
            this.offscreenRenderer = renderer;
            this.offscreenCanvas = canvas;
        }

        this.offscreenRenderer!.render(this.lastRenderState, { width: offW, height: offH });
    }

    // Triggered by: everything, including mousemove
    private drawLens(): void {
        if (!this.offscreenCanvas) return;
        const { cursorX, cursorY, displayW, displayH, zoomFactor } = this.state;

        const srcCenterX = cursorX * zoomFactor;
        const srcCenterY = cursorY * zoomFactor;
        const srcX = srcCenterX - displayW / 2;
        const srcY = srcCenterY - displayH / 2;

        const offW = this.offscreenCanvas.width;
        const offH = this.offscreenCanvas.height;
        const clampedSrcX = Math.max(0, srcX);
        const clampedSrcY = Math.max(0, srcY);
        const clampedW = Math.min(displayW, offW - clampedSrcX);
        const clampedH = Math.min(displayH, offH - clampedSrcY);
        const dstX = clampedSrcX - srcX;
        const dstY = clampedSrcY - srcY;

        const ctx = this.lensCtx;
        ctx.clearRect(0, 0, displayW, displayH);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, displayW, displayH);
        ctx.drawImage(
            this.offscreenCanvas,
            clampedSrcX, clampedSrcY, clampedW, clampedH,
            dstX, dstY, clampedW, clampedH
        );

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

        // FOV label
        const fovH = (displayW / (this.offscreenCanvas!.width)) * 360;
        const fovV = (displayH / (this.offscreenCanvas!.height)) * 180;
        const fovLabel = `${fovH.toFixed(1)}° × ${fovV.toFixed(1)}°`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        const fovMetrics = ctx.measureText(fovLabel);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(
            padding,
            displayH - 16 - padding,
            fovMetrics.width + padding * 2,
            16
        );
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillText(fovLabel, padding * 2, displayH - padding);
    }
}