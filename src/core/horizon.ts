export interface HorizonPoint {
    azimuthRad: number;
    altitudeRad: number;
}

export interface HorizonProfile {
    id: string;
    name?: string;
    points: HorizonPoint[];
    observer: {
        lat: number;
        lon: number;
        elev: number;
    };
}

export async function fetchHorizonById(id: string): Promise<HorizonProfile> {
    const url = `https://www.heywhatsthat.com/api/horizon.json?id=${id}`;
    const response = await fetch(url);

    if (response.status === 504 || response.status === 408) {
        throw new Error("Server is still crunching the numbers. Try again in a minute!");
    }
    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    const rawPoints = data.horizon || [];

    // 1. Harvest Metadata (The "Workaround" sanitized into the Core)
    const firstPt = rawPoints[0] || {};
    const observer = {
        lat: parseFloat(data.lat || firstPt.lat || "0"),
        lon: parseFloat(data.lon || firstPt.lon || "0"),
        elev: parseFloat(data.elev || firstPt.elev || "0")
    };

    // 2. Filter for highest peaks per Azimuth
    const highestPoints = new Map<number, number>();
    rawPoints.forEach((pt: any) => {
        const az = parseFloat(pt.az || 0);
        const alt = parseFloat(pt.alt || 0);
        if (!highestPoints.has(az) || alt > (highestPoints.get(az) || -90)) {
            highestPoints.set(az, alt);
        }
    });

    // 3. Convert to Radians and Sort
    const points = Array.from(highestPoints.entries())
        .map(([az, alt]) => ({
            azimuthRad: az * (Math.PI / 180),
            altitudeRad: alt * (Math.PI / 180)
        }))
        .sort((a, b) => a.azimuthRad - b.azimuthRad);

    return { id, points, observer };
}