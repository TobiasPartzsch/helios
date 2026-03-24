interface HorizonPoint {
    azimuth: number;
    altitude: number;
}

async function fetchHorizon(id: string): Promise<HorizonPoint[]> {
    const response = await fetch(`https://www.heywhatsthat.com/api/horizon.json?id=${id}`);
    if (!response.ok) throw new Error("Celestial signal lost");

    const data = await response.json();
    // Transform the raw JSON into your HorizonPoint internal model
    return data.map((pt: any) => ({
        azimuth: pt.bearing,
        altitude: pt.alt
    }));
}