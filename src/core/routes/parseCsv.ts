import { asDeg } from "../angles";
import type { RoutePoint } from "./types";

export function parseRouteCsv(csv: string): RoutePoint[] {
    const lines = csv
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const idx = {
        timestampUtc: headers.indexOf("timestamp_utc"),
        lat: headers.indexOf("lat"),
        lon: headers.indexOf("lon"),
        label: headers.indexOf("label"),
        note: headers.indexOf("note"),
    };

    if (idx.timestampUtc < 0 || idx.lat < 0 || idx.lon < 0 || idx.label < 0) {
        throw new Error("Missing required route CSV headers");
    }

    return lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim());

        return {
            timestampUtc: cols[idx.timestampUtc],
            latDeg: asDeg(Number(cols[idx.lat])),
            lonDeg: asDeg(Number(cols[idx.lon])),
            label: cols[idx.label],
            note: idx.note >= 0 ? cols[idx.note] || undefined : undefined,
        };
    });
}

export async function loadRouteCsv(path: string): Promise<string> {
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`Failed to load route: ${path}`);
    }
    return await res.text();
}