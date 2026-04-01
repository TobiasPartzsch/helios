type ReferenceRequest = {
    label: string;
    jd: number;
    startTime: string;
    stopTime: string;
};

const referenceRequests: ReferenceRequest[] = [
    {
        label: "1990-01-01",
        jd: 2447892.5,
        startTime: "'1990-01-01 00:00'",
        stopTime: "'1990-01-01 00:01'",
    },
    {
        label: "J2000.0",
        jd: 2451545.0,
        startTime: "'2000-01-01 12:00'",
        stopTime: "'2000-01-01 12:01'",
    },
    {
        label: "2010-01-01",
        jd: 2455197.5,
        startTime: "'2010-01-01 00:00'",
        stopTime: "'2010-01-01 00:01'",
    },
];

type BodyConfig = {
    bodyName: string;
    command: string;
};

const bodies: BodyConfig[] = [
    { bodyName: "mercury", command: "'199'" },
    { bodyName: "venus", command: "'299'" },
    { bodyName: "mars", command: "'499'" },
    { bodyName: "jupiter", command: "'599'" },
    { bodyName: "saturn", command: "'699'" },
    { bodyName: "uranus", command: "'799'" },
    { bodyName: "neptune", command: "'899'" },
];

async function fetchReferenceCase(
    body: BodyConfig,
    request: ReferenceRequest,
) {
    const params = new URLSearchParams({
        format: "text",
        COMMAND: body.command,
        EPHEM_TYPE: "OBSERVER",
        CENTER: "'500@399'",
        START_TIME: request.startTime,
        STOP_TIME: request.stopTime,
        STEP_SIZE: "'1 m'",
        QUANTITIES: "'1'",
        REF_SYSTEM: "'ICRF'",
        CAL_FORMAT: "'CAL'",
        ANG_FORMAT: "'DEG'",
        CSV_FORMAT: "'YES'",
    });

    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;
    const response = await fetch(url);
    const text = await response.text();

    const lines = text.split("\n");
    const start = lines.findIndex((line) => line.includes("$$SOE"));
    const end = lines.findIndex((line) => line.includes("$$EOE"));

    if (start === -1 || end === -1 || end <= start + 1) {
        throw new Error(`Could not find ephemeris data block for ${body.bodyName} ${request.label}`);
    }

    const firstRow = lines
        .slice(start + 1, end)
        .map((line) => line.trim())
        .filter(Boolean)[0];

    if (!firstRow) {
        throw new Error(`No ephemeris rows found for ${body.bodyName} ${request.label}`);
    }

    const values = firstRow
        .split(",")
        .map((field) => field.trim())
        .filter((field) => field.length > 0);

    const expectedRaDeg = Number(values[values.length - 2]);
    const expectedDecDeg = Number(values[values.length - 1]);

    if (!Number.isFinite(expectedRaDeg) || !Number.isFinite(expectedDecDeg)) {
        throw new Error(`Failed to parse RA/Dec for ${body.bodyName} ${request.label}`);
    }

    return {
        bodyName: body.bodyName,
        label: request.label,
        jd: request.jd,
        expectedRaDeg,
        expectedDecDeg,
        toleranceDeg: 0.1,
        source: "JPL Horizons geocentric ICRF",
    };
}

async function main() {
    const results = [];
    for (const body of bodies) {
        for (const request of referenceRequests) {
            results.push(await fetchReferenceCase(body, request));
        }
    }

    console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);