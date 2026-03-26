import { HorizontalCoords } from "../core/coordinates";
import { drawMoonFace } from "./skyCanvas";

interface MoonFaceRenderState {
    illuminatedFraction: number;
    sunHoriz: HorizontalCoords;
    moonHoriz: HorizontalCoords;
}

export class MoonFaceRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
    }

    render({ illuminatedFraction, sunHoriz, moonHoriz }: MoonFaceRenderState): void {
        drawMoonFace(this.ctx, illuminatedFraction, sunHoriz, moonHoriz);
    }
}