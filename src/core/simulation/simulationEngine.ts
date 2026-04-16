// src/core/simulation/engine.ts
import { Degrees } from "../angles";
import { interpolateRoute } from "../routes/interpolate";
import { RoutePoint } from "../routes/types";
import { asDaysSinceJ2000, DaysSinceJ2000 } from "../time/julian";
import { SimulationState } from "../types";

export class SimulationEngine {
    private state: SimulationState;
    private route: RoutePoint[] = [];

    constructor(initialState: SimulationState) {
        this.state = initialState;
    }

    public setRoute(points: RoutePoint[]) {
        this.route = points;
    }

    public tick(dtMs: number): SimulationState {
        if (this.state.isPaused) return this.state;

        // dtMs is real-world wall clock time
        // SimulationSpeedUnit is how many simulation-seconds pass per 1 real-second
        // Multiplier is the user's custom factor (e.g., 2.0x, -5.0x)

        const realSecondsPassed = dtMs / 1000;
        const simSecondsPassed = realSecondsPassed * this.state.timeUnit * this.state.timeMultiplier;
        const simDaysPassed = simSecondsPassed / 86400;

        this.state.time = asDaysSinceJ2000(this.state.time + simDaysPassed);

        // 2. Handle 4D Routing
        if (this.state.isRouteMode && this.route.length > 0) {
            // We need a way to convert DaysSinceJ2000 back to ms for your interpolator
            const currentMs = this.getUnixTimeMs();
            const pos = interpolateRoute(this.route, currentMs);

            this.state.observer.latDeg = pos.latDeg;
            this.state.observer.lonDeg = pos.lonDeg;
        }

        return this.getState();
    }


    private getUnixTimeMs(): number {
        // Reverse of dateToJulianDate
        const jd = this.state.time + 2451545.0;
        return (jd - 2440587.5) * 86400000;
    }

    public getState(): SimulationState {
        return { ...this.state }; // Return a copy to prevent accidental mutation
    }

    /**
     * Merges a partial state into the master state.
     * Use this for UI interactions (toggles, inputs, etc.)
     */
    public updateState(changes: Partial<SimulationState>): SimulationState {
        this.state = {
            ...this.state,
            ...changes,
            observer: {
                ...this.state.observer,
                ...(changes.observer || {})
            },
            bodies: {
                ...this.state.bodies,
                ...(changes.bodies || {})
            }
        };
        return this.getState();
    }

    public setTime(newTime: DaysSinceJ2000) {
        this.state.time = newTime;
        return this.syncRouteAndGetState();
    }

    public setObserver(lat: Degrees, lon: Degrees, elev?: number) {
        this.state.observer.latDeg = lat;
        this.state.observer.lonDeg = lon;
        if (elev !== undefined) this.state.observer.elevationAmsl = elev;
        return this.getState();
    }

    private syncRouteAndGetState(): SimulationState {
        // If in route mode, overwrite lat/lon from the interpolator
        // based on the current this.state.time
        return this.getState();
    }
}