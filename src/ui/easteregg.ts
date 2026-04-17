import { BODY_NAMES, BodyName, UI } from "./elements";

let easterEggApplied = false;

const SAILOR_NAMES: Partial<Record<BodyName | "sun", { ja: string; tooltip: string }>> = {
    sun: { ja: "セレニティ女王", tooltip: "Queen Serenity" },
    moon: { ja: "月野うさぎ", tooltip: "Tsukino Usagi" },
    mercury: { ja: "水野亜美", tooltip: "Mizuno Ami" },
    venus: { ja: "愛野美奈子", tooltip: "Aino Minako" },
    mars: { ja: "火野レイ", tooltip: "Hino Rei" },
    jupiter: { ja: "木野まこと", tooltip: "Kino Makoto" },
    saturn: { ja: "土萠ほたる", tooltip: "Tomoe Hotaru" },
    uranus: { ja: "天王はるか", tooltip: "Tenoh Haruka" },
    neptune: { ja: "海王みちる", tooltip: "Kaioh Michiru" },
};
const ORIGINAL_NAMES: Partial<Record<BodyName, string>> = {};

export function isAprilFools(date: Date): boolean {
    return date.getUTCMonth() === 3 && date.getUTCDate() === 1;
}

export function applyEasterEgg(date: Date): void {
    const shouldApply = isAprilFools(date);
    if (shouldApply === easterEggApplied) return;
    easterEggApplied = shouldApply;

    for (const name of BODY_NAMES) {
        const bodyUI = UI.bodies[name];
        const label = bodyUI.label;
        if (!label) continue;

        const sailor = SAILOR_NAMES[name];

        if (shouldApply) {
            ORIGINAL_NAMES[name] = label.textContent ?? name;
            label.textContent = sailor!.ja;
            label.title = sailor!.tooltip;
        } else {
            label.textContent = ORIGINAL_NAMES[name] ?? name;
            label.title = "";
        }
    }
}