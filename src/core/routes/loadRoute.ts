import { parseRouteCsv } from "./parseCsv";
import type { RoutePoint } from "./types";

export async function loadRoute(path: string): Promise<RoutePoint[]> {
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`Failed to load route: ${path}`);
    }

    const csv = await res.text();
    return parseRouteCsv(csv);
}